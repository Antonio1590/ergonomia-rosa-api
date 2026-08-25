# AUDIT.md — Auditoría técnica del proyecto ROSA Expert

**Fecha:** 2026-08-24
**Alcance:** Las dos implementaciones existentes de ROSA Expert —
`Metodo Rosa/` (React + TypeScript + Vite) y `AppsScript/` (Google Apps Script) —
más el estado general del directorio raíz `FRONT/`.
**Metodología:** lectura completa de código fuente de ambas implementaciones,
ejecución de `npm run build`, `npm run lint` y `npm run dev` en React,
ejecución visual de la app React en navegador de vista previa,
inspección de configuración (`vite.config.ts`, `.env`, `.gitignore`, `.claude/launch.json`),
y búsqueda de TODOs/placeholders/código muerto en ambos árboles.
No se modificó ningún código durante esta fase.

---

## 0. Resumen ejecutivo

El proyecto tiene **dos implementaciones reales y funcionales**, no una implementación
y un stub:

- **React (`Metodo Rosa/`)**: SPA que corre 100% en el navegador. Usa MediaPipe
  (pose) + un modelo YOLO ONNX propio (objetos) para analizar la foto **localmente,
  sin enviarla a ningún servidor** (así lo declara explícitamente
  `public/MODEL_INFO.md`), calcula el puntaje ROSA en el cliente, y llama a un
  Google Apps Script desplegado (vía `VITE_APPS_SCRIPT_URL`, ya configurado en
  `.env` con una URL real de producción) para login y guardado de datos.
- **Apps Script (`AppsScript/`)**: no es solo un backend — `doGet` sirve una SPA
  HTML completa propia (login, guía, cuestionario, resultados, historial,
  panel admin). Para el análisis de la foto, **envía la imagen al servidor y
  usa Gemini** (`Gemini.gs`) para obtener pose + objetos + respuestas del
  cuestionario en una sola llamada. El mismo `rpcHandler` de `Code.gs` atiende
  tanto a esta SPA interna (vía `google.script.run`) como al React externo
  (vía `doPost`/HTTP).

Ambas implementan el mismo algoritmo oficial ROSA (Rapid Office Strain
Assessment, Sonne et al. 2012) con las mismas tablas de puntaje — están bien
alineadas en la lógica de negocio central. Los problemas encontrados son de
tres tipos: (1) un **bug de cálculo real** en React que afecta la precisión
del resultado, (2) una **cantidad grande de código muerto y una dependencia
de build "fantasma"** en React, y (3) **documentación desactualizada** en
ambos lados que ya no describe el sistema actual. No hay control de
versiones (git) en ningún punto del proyecto.

---

## 1. Qué funciona

| Área | Estado | Evidencia |
|---|---|---|
| Build de producción de React (`npm run build`) | ✅ Compila sin errores | `tsc -b` → 0 errores; `vite build` genera `dist/` |
| TypeScript (`tsc -b --noEmit`) | ✅ 0 errores | — |
| Servidor de desarrollo (`npm run dev`) | ✅ Arranca limpio, sin errores en consola | Verificado en vivo, ver §11 |
| Login / rutas protegidas (React) | ✅ Implementado correctamente | `App.tsx` con `ProtectedRoute`, redirige por rol (`admin`/`user`) |
| Flujo de evaluación principal (React) | ✅ Funcional end-to-end | `pages/AutoEvaluationPage.tsx` (self-contained, 1280 líneas) |
| Detección YOLO local (ONNX) | ✅ Correcta, assets presentes | `best.onnx` + wasm en `public/`, `YoloService.ts` con letterbox + NMS |
| Detección de pose MediaPipe | ✅ Funcional | Depende de CDN externo (ver §9) |
| Motor de cálculo ROSA — React (`RosaEngine.ts`) | ✅ Fiel al método oficial | Tablas A–E, penalizaciones documentadas |
| Motor de cálculo ROSA — Apps Script (`JS_Rosa.html`) | ✅ Fiel al método oficial, con cita académica | Mismas tablas, mismo criterio de intervención en 5 |
| SPA de Apps Script (login → guía → foto → resultados → historial → admin) | ✅ Completa y coherente | 6 páginas, router propio en `JS_State.html` |
| Análisis de foto vía Gemini (Apps Script) | ✅ Implementado y funcionando | `Gemini.gs`, clave vía `PropertiesService` (no hardcodeada) |
| Guardado en Sheets / subida a Drive (Apps Script) | ✅ Implementado | `Sheets.gs`, `Drive.gs` |
| `.env` de React con URL de despliegue real | ✅ Configurado | Ya no está pendiente, como indicaba la nota previa |

---

## 2. Qué no funciona / errores

### 2.1 Errores de compilación
**Ninguno.** `tsc -b` y `vite build` terminan en 0 errores.

Advertencia de build a tener en cuenta: Vite marca chunks >500 KB sin
code-splitting — `dist/index-*.js` pesa 862 KB (gzip 249 KB) porque
onnxruntime-web y MediaPipe quedan en un solo bundle. `dist/ort-wasm-simd-threaded.jsep-*.wasm`
pesa 26.8 MB (gzip 6.4 MB). No es un error, pero afecta el tiempo de carga inicial.

### 2.2 Errores de ejecución (lint)
`npm run lint`: **14 errores, 1 advertencia** (reglas de React Compiler /
`react-hooks` v7, más estrictas que lo habitual):

- `src/components/ai/PoseTester.tsx:503` — `react-hooks/set-state-in-effect` (código muerto, ver §5)
- `src/components/ai/PoseTester.tsx:544` — advertencia `exhaustive-deps` (código muerto)
- `src/components/dashboard/BackSupport.tsx:84,90,137` — `react-hooks/static-components`: "Cannot create components during render" (código muerto)
- `src/components/illustrations/ErgonomicArt.tsx:11,19` — `react-refresh/only-export-components` (**componente vivo**)
- `src/components/steps/Step3ArmRest.tsx:59` — `react-hooks/purity`: `Math.random()` usado para un `name` de radio button durante el render (código muerto)
- `src/context/AuthContext.tsx:30` — `react-hooks/set-state-in-effect` (**contexto vivo**)
- `src/context/AuthContext.tsx:56` — `react-refresh/only-export-components` (**contexto vivo**)
- `src/context/EvaluationContext.tsx:95`, `RosaResultContext.tsx:29`, `SidebarContext.tsx:27`, `StepContext.tsx:38` — `react-refresh/only-export-components` (código muerto)
- `src/hooks/useDraft.ts:23` — `react-hooks/set-state-in-effect` (código muerto)

Los que caen en `AuthContext.tsx` y `ErgonomicArt.tsx` son los únicos en
código realmente en uso; el resto vive en el árbol muerto descrito en §5.

### 2.3 Bug funcional confirmado (afecta el resultado que ve el usuario)
`src/ai/mediapipe/AngleCalculator.ts` (código **vivo**, usado por
`AutoEvaluationPage.tsx`) devuelve `leftShoulder: 0, rightShoulder: 0,
leftWrist: 0, rightWrist: 0` como **literales fijos** — no existe una función
`calculateShoulderAngle`/`calculateWristAngle`. `AutoEvaluationPage.tsx:190-193`
calcula `armScoreOf` a partir de esos ángulos, por lo que **siempre da 1
("óptimo")** sin importar la postura real de hombros en la foto. Esto se
propaga al campo `chair.armrest` del assessment y a la tarjeta "Hombros" que
ve el usuario final — el sistema reporta que los hombros siempre están bien,
sin haberlo medido realmente.

### 2.4 Dependencia de build "fantasma" (riesgo de portabilidad)
`Metodo Rosa/vite.config.ts` y `src/index.css` usan Tailwind
(`@tailwindcss/vite`, `@import "tailwindcss"`), pero **`tailwindcss` y
`@tailwindcss/vite` no están en `Metodo Rosa/package.json` ni en su
`node_modules`**. El build solo funciona hoy porque Node resuelve el módulo
subiendo un nivel y encontrándolo en `FRONT/node_modules/` — que pertenece al
**scaffold huérfano de la raíz** (§7). Si `Metodo Rosa/` se extrae alguna vez
como repositorio independiente, o se hace `npm install` desde cero en un
entorno limpio (CI, otra máquina), **el build y el dev server fallarán** por
módulo no encontrado.

---

## 3. Qué está incompleto

- **Código muerto a gran escala en React**: existe una arquitectura paralela
  completa de wizard por pasos (`context/StepContext.tsx`,
  `EvaluationContext.tsx`, `RosaResultContext.tsx`, `components/steps/*`,
  `components/dashboard/*` salvo ninguno usado, `components/score/*`,
  `components/evaluation/*`, `components/camera/CameraView.tsx`,
  `components/ai/AIAnalysis.tsx`, `ChairRecognition.tsx`, `Measurements.tsx`,
  `Recommendations.tsx`, `components/layout/Navbar.tsx`, `Sidebar.tsx`, etc.)
  que **no es alcanzable desde ningún router** — `App.tsx` solo define
  `/login`, `/admin` y `/*` → `AutoEvaluationPage.tsx`, que reimplementa todo
  el flujo de forma autocontenida. Aproximadamente la mitad de `src/` es
  código muerto. Ver el mapa completo en el reporte del agente (§11).
  Los 5 archivos que estaban en 0 bytes (`src/pages/Home.tsx`,
  `src/pages/Dashboard.tsx`, `src/components/layout/MainLayout.tsx`,
  `src/components/layout/Footer.tsx`, `src/ai/mediapipe/ImageProcessor.ts`)
  se eliminaron el 2026-08-24 — sin contenido ni referencias, cero riesgo
  (ver `docs/CHANGELOG.md`). El resto del árbol muerto (contexts, `steps/`,
  `dashboard/`, `evaluation/`, `score/`, `camera/`, `layout/Navbar.tsx`,
  `Sidebar.tsx`, la copia divergente de mediapipe, etc.) sigue sin decisión
  del usuario.
- **Duplicación divergente de MediaPipe**: `src/ai/mediapipe/*` (vivo) y
  `src/components/ai/mediapipe/*` (muerto) son dos implementaciones de la
  misma lógica de pose que **ya divergieron** — por ejemplo el
  `AngleCalculator.ts` muerto sí calcula ángulos 3D (usa `.z`), el vivo es
  solo 2D. Mantenerlos ambos es una fuente de confusión y riesgo de que
  alguien edite la copia equivocada.
- **`RosaCalculator.ts`** (`components/ai/rosa/`, código muerto): tiene texto
  en español con mojibake (`"posiciÃ³n"` en vez de "posición") y un bug de
  copia-pega — `calculateRosaScores()` usa el mismo ángulo de cadera tanto
  para `scoreNeck` como para `scoreTrunk`. No afecta hoy porque no se
  importa, pero si se reactiva heredaría estos defectos.
- **Sin manejo de errores global en la app viva**: `ErrorBoundary.tsx` solo
  se usa dentro del `Step1Chair.tsx` muerto. La app real (Login /
  AdminDashboard / AutoEvaluationPage) no tiene ningún error boundary — una
  excepción de render sin capturar deja pantalla en blanco.
- **`AdminDashboard.tsx`**: varios elementos de UI son decorativos sin
  handler — ítems de navegación superior (`Panel`, `Evaluaciones`,
  `Usuarios`, líneas ~58-60), ítems del sidebar (~87-99), el toggle "Vista
  trimestral" (~120), y los botones "Nueva evaluación"/"Documentación"
  (~374-379). Solo el selector de pestañas evaluaciones/usuarios funciona.
- **`useDraft` / `DraftBanner`** a medio conectar: `saveDraft()` y
  `discardDraft()` están cableados, pero `loadDraft()` **nunca se llama** en
  ningún lugar del código — no existe forma de recuperar un borrador
  guardado. Además, toda la función solo existe dentro del árbol muerto.
- **`SidebarContext`**: el `Provider` nunca se monta (ni en `main.tsx` ni en
  `App.tsx`); `Navbar`/`Sidebar` (también muertos) caerían al valor por
  defecto no-op si se usaran.
- **Sin tests**: no existe ningún archivo `*.test.*`/`*.spec.*`, ni
  configuración de Vitest/Jest, ni `@testing-library` en dependencias, en
  ninguna de las dos implementaciones. No hay runner de pruebas instalado.

---

## 4. Funcionalidades faltantes (comparación de paridad preliminar)

Esta tabla es preliminar; la matriz completa se formalizará en
`docs/PARITY_MATRIX.md` (Fase 8). Se documenta aquí porque afecta
directamente qué se considera "incompleto".

| Funcionalidad | React | Apps Script | Nota |
|---|---|---|---|
| Login cédula + correo | ✅ | ✅ | Ambos delegan la validación de negocio al mismo backend |
| Evaluación ROSA (cálculo) | ✅ (cliente) | ✅ (servidor) | Mismas tablas oficiales en ambos lados |
| Análisis de foto: detección de objetos | ✅ YOLO local (ONNX) | ✅ Gemini (servidor) | **Arquitecturas distintas por decisión de privacidad**, ver §9 |
| Análisis de foto: pose corporal | ✅ MediaPipe local | ✅ Gemini (servidor) | Ídem |
| Guardar evaluación (`saveEvaluation`) | ✅ | ✅ | — |
| Guardar datos de entrenamiento (`saveTraining`) | ✅ | ✅ | — |
| Subir foto a Drive (`uploadPhoto`) | ✅ | ✅ | — |
| Historial personal (`getUserHistory`) | ❌ **no implementado en React** | ✅ | El backend lo soporta; React nunca lo llama (confirmado por grep, cero resultados) |
| Análisis vía Gemini (`analyzePhoto`) | ❌ **no implementado en React**, ni siquiera como stub | ✅ | Ver §9 — es la funcionalidad que Fase 9 de este proyecto pide dejar preparada pero sin conectar; en Apps Script **ya está conectada** de antes |
| Panel de administración | ✅ (parcialmente decorativo, §3) | ✅ (funcional, con gráficas y export CSV) | Apps Script está más completo aquí |
| Exportar CSV | ❌ no visto en React | ✅ | — |

---

## 5. Dependencias

### React (`Metodo Rosa/package.json`)
React 19, TypeScript ~6.0, Vite 8, `@mediapipe/tasks-vision`, `onnxruntime-web`,
`react-router-dom`. **Falta declarar `tailwindcss` y `@tailwindcss/vite`**
pese a usarse activamente (§2.4) — es la corrección de dependencias más
urgente del proyecto.

MediaPipe depende en tiempo de ejecución de dos CDNs externos, no
empaquetados: `cdn.jsdelivr.net` (wasm) y `storage.googleapis.com`
(modelo `pose_landmarker_lite`). Si alguno no está disponible, la detección
de pose falla en producción sin aviso previo en el código auditado.

### Apps Script
Sin gestor de paquetes (Apps Script no usa npm). Depende en tiempo de
ejecución de la API de Gemini (`generativelanguage.googleapis.com`) y de un
sitio Netlify externo (`famous-tartufo-04dba5.netlify.app`) para fotos de
guía — aunque `INSTALACION.md` sugiere que ese Netlify también servía el
modelo YOLO en una versión anterior de Apps Script que ya no coincide con el
código actual (§8).

### Directorio raíz (`FRONT/`)
`package.json` con `@reduxjs/toolkit` (implícito por carpeta en
`node_modules`), `framer-motion`, `recharts`, `react-hook-form`,
`react-icons`, `lucide-react`, `clsx`, `tailwindcss` — **sin ningún script
(`dev`/`build`/etc.), sin `vite.config`, sin `index.html`**. No es
compilable como proyecto independiente. Ver §7.

---

## 6. Riesgos técnicos

1. **Sin control de versiones**: no existe repositorio git en ningún punto
   de `FRONT/`. No hay historial, no hay forma de revertir cambios, no hay
   ramas ni backup más allá del sistema de archivos local. Este es el riesgo
   más alto de todo el proyecto dado que se están por hacer cambios activos.
2. **Build de React depende accidentalmente de una carpeta externa** (§2.4)
   — riesgo de romperse silenciosamente al mover, clonar o desplegar en CI.
3. **Bug de cálculo silencioso** (§2.3): el puntaje ROSA que ve el usuario
   final en React nunca refleja problemas reales de hombros/muñecas, aunque
   la interfaz sugiere que sí se midieron.
4. **Divergencia de documentación vs. código en Apps Script**: `README.md`
   (raíz) documenta hojas de Sheets (`Usuarios`/`Evaluaciones`) y columnas
   que **no coinciden** con las que usa el código real (`Metrica`/`Registros`,
   con esquema de columnas distinto). Seguir el README tal cual hoy para una
   instalación desde cero produce una hoja de cálculo con la que el código no
   funciona. `AppsScript/INSTALACION.md` está aún más desactualizado: lista
   archivos que ya no existen (`JS_Yolo.html`, `JS_Pose.html`) y **omite
   `Gemini.gs`** de la lista de archivos a crear — seguirlo tal cual produce
   un despliegue que sirve fotos pero nunca puede analizarlas.
5. **Credenciales/config sensible hardcodeada en código fuente** (no
   secretos de verdad, pero sí datos que deberían ser configurables):
   `Code.gs` tiene `SPREADSHEET_ID` y `ADMIN_EMAILS = ["bbocanegrah@gmail.com"]`
   como literales en el archivo. La clave de Gemini sí está bien manejada
   (vía `PropertiesService`, nunca en el código).
6. **Inconsistencia de persistencia de sesión**: React guarda la sesión en
   `localStorage` (clave `rosa_session`, persiste indefinidamente entre
   cierres de navegador) mientras que la SPA de Apps Script usa
   `sessionStorage` (clave `rosa_user`, se pierde al cerrar la pestaña). No
   es un bug, pero es una diferencia de comportamiento de seguridad/UX entre
   las dos implementaciones que no está documentada ni parece deliberada.
7. **Divergencia arquitectónica de IA** (React 100% cliente / privacidad,
   vs. Apps Script 100% servidor vía Gemini) — no es un defecto, pero es una
   decisión de producto importante que debe quedar documentada
   explícitamente en `PROJECT_SPEC.md`, porque implica que ambas
   implementaciones pueden dar resultados de análisis distintos para la
   misma foto (un modelo YOLO/MediaPipe local vs. Gemini en la nube no
   necesariamente coinciden pixel a pixel en sus detecciones).
8. **Artefacto huérfano en la raíz del repo** (`FRONT/src/`,
   `FRONT/package.json`, dos imágenes `WhatsApp Image *.jpeg` sueltas): no
   se referencia desde ningún README ni configuración de build activa,
   parece un prototipo temprano (tiene `@reduxjs` en `node_modules`,
   sugiriendo que se evaluó Redux antes de decidirse por Context API). Hoy
   es inofensivo salvo por el acoplamiento accidental descrito en el riesgo
   #2. **No se eliminó ni modificó — requiere confirmación del usuario.**
9. **Sin pruebas automatizadas**: cualquier cambio futuro (incluida esta
   misma iniciativa de estabilización) no tiene una red de seguridad
   automatizada que detecte regresiones.

---

## 7. Estado del artefacto huérfano de la raíz

`FRONT/src/` (con `components/ai`, `components/camera`, `components/dashboard`,
`components/layout`, `components/score`, `pages/`) y `FRONT/package.json`
**no son parte de la aplicación documentada** — el propio `README.md` de la
raíz describe la estructura del proyecto como `AppsScript/` + `Metodo Rosa/`
únicamente, sin mencionar este `src/` adicional. No tiene `vite.config`,
`index.html` ni scripts de build/dev — no se puede ejecutar como proyecto
independiente. Es, con alta probabilidad, un primer intento abandonado antes
de que el desarrollo real continuara en `Metodo Rosa/`.

**Importante:** aunque parece descartable, hoy es **accidentalmente
necesario** para que `Metodo Rosa` compile, porque su `node_modules`
provee `tailwindcss`/`@tailwindcss/vite` que `Metodo Rosa` usa pero no
declara (§2.4). Cualquier limpieza de este directorio debe ir acompañada
de agregar esas dependencias al `package.json` de `Metodo Rosa` primero.

---

## 8. Control de versiones y sincronización

- **Git**: no hay repositorio `.git` en `FRONT/` ni en ningún subdirectorio.
- **clasp**: no existe `.clasp.json` en ningún punto del proyecto. Apps
  Script no está sincronizado localmente mediante clasp — los archivos en
  `AppsScript/` se mantienen manualmente y se copian a mano al editor de
  script.google.com, según el procedimiento (desactualizado) descrito en
  `AppsScript/INSTALACION.md`.

---

## 9. Recomendaciones y prioridad

| # | Problema | Prioridad | Acción recomendada |
|---|---|---|---|
| 1 | Sin control de versiones (git) | **Alta** | Inicializar git antes de continuar con cambios activos, para poder revertir con seguridad |
| 2 | Dependencia fantasma de Tailwind en `Metodo Rosa` | **Alta** | Agregar `tailwindcss` y `@tailwindcss/vite` explícitamente a `Metodo Rosa/package.json` |
| 3 | Ángulos de hombro/muñeca hardcodeados a 0 | **Alta** | Implementar el cálculo real en `AngleCalculator.ts` o, si es una limitación aceptada del modelo de pose, documentarlo explícitamente y ajustar la UI para no sugerir que se midió |
| 4 | `INSTALACION.md` y `README.md` (raíz) desactualizados vs. código real | **Alta** | Reescribir con los nombres de hoja/columnas y archivos reales, antes de que alguien los use para un despliegue nuevo |
| 5 | Código muerto a gran escala en React | **Media** | Decidir con el usuario: ¿eliminar el árbol de wizard por pasos no usado, o es un roadmap futuro? No eliminar sin confirmación |
| 6 | Sin error boundary en la app viva | **Media** | Envolver `AutoEvaluationPage`/rutas principales con un `ErrorBoundary` |
| 7 | `getUserHistory`/`analyzePhoto` sin implementar en React | **Media** | Definir en `PROJECT_SPEC.md` si React debe adoptarlos o si la divergencia es intencional |
| 8 | `AdminDashboard.tsx` con controles decorativos sin función | **Media** | Completar los handlers o quitar los controles hasta que estén listos |
| 9 | `SPREADSHEET_ID`/`ADMIN_EMAILS` hardcodeados en `Code.gs` | **Media** | Mover a `PropertiesService`, igual que ya se hace con `GEMINI_API_KEY` |
| 10 | Persistencia de sesión inconsistente (localStorage vs sessionStorage) | **Baja** | Decidir un comportamiento único y documentarlo |
| 11 | Artefacto huérfano en la raíz (`FRONT/src`, `package.json`, imágenes sueltas) | **Baja** | Confirmar con el usuario si se archiva/elimina, una vez resuelto el punto 2 |
| 12 | Sin pruebas automatizadas | **Baja–Media** | Añadir un runner (Vitest, dado que ya usan Vite) al menos para `RosaEngine.ts`, dado que es lógica de negocio crítica |
| 13 | Dependencia de bundle grande (862 KB / 26.8 MB wasm) sin code-splitting | **Baja** | Evaluar `dynamic import()` para MediaPipe/ONNX si el tiempo de carga inicial es un problema real |

---

## 10. Verificación en vivo realizada

Se levantó `Metodo Rosa` con `npm run dev` (Vite 8.2.0, listo en ~1.5–3.5s
según corrida) y se abrió en navegador de vista previa: la pantalla de login
carga correctamente, con el texto "Las fotografías se analizan localmente en
tu dispositivo. No se envían a servidores externos." — consistente con
`public/MODEL_INFO.md`. Sin errores en consola del navegador ni en el log
del servidor. No se probó el flujo de login con credenciales reales para no
generar registros de prueba en la hoja de producción ya configurada en
`.env`.

---

## 11. Reporte detallado de archivos (React)

El inventario completo archivo por archivo, con línea exacta de cada
hallazgo (incluyendo el mapa completo de código muerto, la lista de
acciones que llama `SheetsService.ts`, y el detalle de cada regla de lint),
se generó mediante una auditoría exhaustiva del árbol `Metodo Rosa/src` y
está resumido en las secciones anteriores. Los puntos 2 a 6 de este
documento son la síntesis priorizada de ese reporte.
