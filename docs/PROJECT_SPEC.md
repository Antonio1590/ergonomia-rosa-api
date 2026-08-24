# PROJECT_SPEC.md — Especificación funcional única de ROSA Expert

Esta es la **fuente única de verdad funcional** del sistema. React
(`Metodo Rosa/`) y Apps Script (`AppsScript/`) son dos clientes/implementaciones
del mismo sistema y deben implementar lo descrito aquí de forma equivalente,
salvo en los puntos marcados explícitamente como **"divergencia justificada"**.
Basado en el estado real del código auditado en `docs/AUDIT.md` (2026-08-24),
no en aspiraciones no implementadas.

---

## 1. Objetivo del sistema

Digitalizar la evaluación ergonómica del puesto de trabajo de oficina para
empleados de **Seguros Bolívar**, usando el método **ROSA** (Rapid Office
Strain Assessment, Sonne, Villalta & Andrews, 2012). El empleado sube una
foto de sí mismo en su puesto de trabajo; el sistema detecta objetos del
escritorio y estima la postura corporal, calcula un puntaje ROSA de 1 a 10
según las tablas oficiales del método, y entrega recomendaciones concretas
de ajuste. Los resultados se guardan centralizadamente para que un
administrador pueda dar seguimiento al riesgo ergonómico de la población de
empleados evaluados. Reemplaza un proceso que antes se hacía en papel
(contexto: proyecto de Seguridad y Salud en el Trabajo, IPT).

## 2. Usuarios

| Rol | Identificación | Permisos |
|---|---|---|
| **Colaborador (`user`)** | Cédula + correo `@segurosbolivar.com` registrado previamente en la hoja de usuarios | Iniciar sesión, tomar/subir una foto, ver su propio resultado y recomendaciones, ver su historial personal de evaluaciones |
| **Administrador (`admin`)** | Igual que colaborador, pero su correo está en la lista de administradores o su campo `rol` es `admin` | Todo lo anterior + ver el panel de administración: listado de todas las evaluaciones, estadísticas agregadas, gráficas, exportar CSV |

No hay registro de autoservicio: un usuario debe existir previamente en la
hoja de usuarios (columna cédula + email) para poder iniciar sesión. No hay
contraseña — la autenticación es por posesión del correo corporativo +
conocimiento de la cédula registrada.

## 3. Módulos

1. **Autenticación** — login por cédula + correo, sin contraseña.
2. **Captura de foto** — cámara o galería, con compresión cliente antes de
   enviar/procesar (máx. lado 1600px, calidad 0.85 en Apps Script; ver
   `docs/ARCHITECTURE.md` para el detalle de cada cliente).
3. **Análisis de IA** — detección de objetos del puesto (silla, escritorio,
   monitor, laptop, mouse, teléfono, atril, persona) + estimación de pose
   corporal (cuello, tronco, hombros, codos, muñecas, rodillas, tobillos).
   **Divergencia justificada**: React ejecuta este módulo 100% en el
   navegador (YOLO ONNX + MediaPipe, la foto nunca sale del dispositivo);
   Apps Script lo ejecuta enviando la foto a Gemini en el servidor. Ver
   §12 y `docs/API_CONTRACT.md`.
4. **Cuestionario de ajuste** — preguntas ROSA que el análisis de IA
   pre-llena cuando puede inferirlas de la foto (altura de silla, altura de
   monitor, soporte de espalda, superficie de trabajo alta); el usuario
   puede revisar/corregir antes de calcular el puntaje final.
5. **Motor de cálculo ROSA** — aplica las tablas oficiales del método sobre
   las respuestas (de IA + cuestionario) y produce puntaje, nivel de riesgo
   y recomendaciones priorizadas. Debe dar el mismo resultado
   matemático en ambas implementaciones para las mismas respuestas de
   entrada (ver §7 — es la regla de negocio más crítica a mantener en
   paridad exacta).
6. **Resultados** — puntaje total (1–10), nivel de riesgo, badge de color,
   desglose por sección (silla / monitor+teléfono / mouse+teclado),
   recomendaciones ordenadas por severidad, foto anotada con los puntos y
   objetos detectados.
7. **Guardado** — sube la foto (si existe) a Drive, guarda el registro de
   evaluación y un registro de entrenamiento (para reentrenamiento futuro de
   modelos) en Sheets.
8. **Historial personal** — evolución del puntaje del propio usuario en el
   tiempo, con comparación contra la evaluación anterior.
9. **Panel de administración** — listado completo de evaluaciones de todos
   los usuarios, estadísticas agregadas (total, % de riesgo alto, promedio),
   gráficas (distribución por riesgo, promedio por sección, tendencia
   mensual), filtro por nombre/correo/nivel de riesgo, exportación CSV.

## 4. Flujo principal

1. El usuario abre la app → pantalla de login.
2. Ingresa cédula + correo corporativo → el sistema valida contra la hoja de
   usuarios (formato de cédula: 6–12 dígitos numéricos; correo debe tener
   formato válido — la restricción de dominio `@segurosbolivar.com` se
   valida en el backend).
3. Si es válido y el usuario está `activo`, inicia sesión → pantalla de
   guía/captura de foto.
4. El usuario toma o sube una foto de sí mismo sentado, de perfil, cuerpo
   completo visible.
5. El sistema comprime la imagen si es necesario y ejecuta el análisis de
   IA (ver §12 sobre la divergencia de dónde ocurre este paso).
6. Si no se detecta una persona en la foto → se pide repetir la foto (no se
   avanza con datos incompletos rellenados a mano).
7. Si se detecta una persona → se muestra el cuestionario pre-llenado con lo
   que la IA pudo inferir; el usuario revisa y confirma.
8. El sistema calcula el puntaje ROSA con el motor de tablas oficiales.
9. Se muestran los resultados: puntaje, nivel de riesgo, recomendaciones,
   foto anotada.
10. El usuario guarda la evaluación → se sube la foto (si aplica) y se
    escriben los registros de evaluación y entrenamiento.
11. El usuario puede consultar su historial personal en cualquier momento.

## 5. Flujo alternativo

- **Login inválido** (cédula/correo no coincide, o usuario `inactivo`): se
  muestra un error específico y no se permite continuar.
- **Foto de baja calidad** (mala luz, no de perfil, cuerpo incompleto): el
  sistema puede seguir calculando un resultado, pero muestra avisos de
  calidad ("Quality" en Apps Script) indicando qué campos revisar
  manualmente con más cuidado — no bloquea el flujo salvo cuando no se
  detecta ninguna persona.
- **Ajuste manual post-resultado**: el usuario puede reabrir el cuestionario
  desde la pantalla de resultados para corregir una respuesta y recalcular
  (soportado en Apps Script vía `Questions.abrirAjuste()`; confirmar
  paridad en React durante Fase 7).
- **Fallo de red al guardar**: el guardado de evaluación es la operación
  crítica (debe reportarse error al usuario); el guardado del registro de
  entrenamiento es "best effort" — su fallo se ignora silenciosamente en
  ambas implementaciones y no bloquea la confirmación al usuario.
- **Fallo al subir la foto**: no bloquea el guardado de la evaluación; el
  registro se guarda sin `urlImagen`.

## 6. Entradas

- Foto del puesto de trabajo (JPEG/PNG desde cámara o galería).
- Cédula (texto, 6–12 dígitos) y correo (texto, formato email) en login.
- Respuestas del cuestionario ROSA (ver enum de valores en §8), ya sea
  autocompletadas por IA o editadas manualmente por el usuario.

## 7. Salidas

- Puntaje ROSA final: entero 1–10.
- Nivel de riesgo derivado del puntaje (umbral de intervención en 5):
  - React usa 5 niveles: Inapreciable / Mejorable / Alto / Muy Alto / Extremo
    (`RosaEngine.ts`).
  - Apps Script usa 4 niveles: Bajo (≤2) / Medio (≤4) / Alto (≤7) / Muy Alto
    (>7) (`JS_Rosa.html`).
  - **Esto es una discrepancia real, no solo de nombres — el número de
    niveles y sus cortes no coinciden entre ambas implementaciones.** Debe
    resolverse en Fase 7/8: definir una única escala de niveles de riesgo y
    aplicarla en ambos lados. No se resuelve en este documento porque
    requiere una decisión de negocio (¿cuál escala es la correcta?), no solo
    técnica.
- Puntaje por sección: silla, monitor+teléfono, mouse+teclado.
- Lista de recomendaciones, cada una con texto, severidad y sección.
- Foto anotada con los puntos de pose y las cajas de objetos detectados.

## 8. Reglas de negocio

### 8.1 Motor de cálculo ROSA
Implementado en `Metodo Rosa/src/components/ai/rosa/RosaEngine.ts` (React) y
`AppsScript/JS_Rosa.html` (Apps Script). Ambos usan las tablas oficiales del
método (Sección A: silla, por altura+profundidad+apoyabrazos+respaldo;
Sección B: monitor+teléfono; Sección C: mouse+teclado; combinación final
tomando el máximo). Modificador de duración: -1 si <1h seguida/día, 0 si
1-4h, +1 si >4h. **Esta lógica debe mantenerse matemáticamente idéntica
entre ambas implementaciones** — es la regla de negocio central del sistema
y cualquier cambio a las tablas debe aplicarse en ambos archivos a la vez.

### 8.2 Validación de login
- Cédula: solo dígitos, entre 6 y 12 caracteres.
- Correo: formato de email válido; el dominio `@segurosbolivar.com` se
  exige en Apps Script vía coincidencia exacta contra la hoja `Metrica`
  (no hay una validación de dominio explícita adicional en el código
  auditado — la restricción de dominio es de facto porque solo se registran
  usuarios con ese dominio en la hoja, no una regex que la fuerce).
- Usuario debe existir en la hoja de usuarios y tener `estado = activo`
  (o vacío, que se trata como activo por defecto).
- Administrador: correo en la lista `ADMIN_EMAILS` del servidor, **o**
  columna `rol = admin` en la hoja de usuarios.

### 8.3 Normalización de respuestas del cuestionario
Un campo ausente en las respuestas se interpreta como "sin novedad" (valor
por defecto "ok"/"floor"/etc.), nunca como "incorrecto". Ver tabla de
valores por defecto en `JS_Rosa.html` (`POR_DEFECTO`).

### 8.4 Guardado
El guardado de evaluación (`saveEvaluation`) es la operación autoritativa;
el guardado de entrenamiento (`saveTraining`) es secundario/best-effort y su
fallo no debe impedir confirmar el guardado al usuario.

## 9. Estructura de datos

Ver `docs/DATA_MODEL.md` (Fase 4) para el detalle campo por campo. Entidades
principales: `Usuario`, `Evaluación`, `RegistroEntrenamiento`.

## 10. Estados

- **Usuario**: `activo` / `inactivo` (columna `estado` en hoja `Metrica`).
- **Rol de usuario**: `user` / `admin`.
- **Sesión**: autenticado / no autenticado. **Divergencia no justificada**
  (a resolver): React persiste en `localStorage` (sobrevive cierre de
  navegador); Apps Script persiste en `sessionStorage` (se pierde al cerrar
  la pestaña). Debe decidirse un comportamiento único.
- **Evaluación**: no tiene un campo de estado propio — cada fila guardada en
  `Registros` es un evento inmutable (no hay edición ni borrado de
  evaluaciones ya guardadas en el código auditado).
- **Análisis en curso**: `sin foto` → `foto cargada` → `analizando` →
  `analizado` (con o sin persona detectada) → `respuestas confirmadas` →
  `resultado calculado` → `guardado`.

## 11. Validaciones

- Cédula: regex `^\d{6,12}$` (idéntica en ambos backends de validación de
  login del lado servidor; React también valida esto client-side antes de
  enviar).
- Imagen: debe ser de tipo `image/*`; se rechaza cualquier otro tipo en el
  drop/selector de archivo (Apps Script) — confirmar que React tenga la
  misma validación explícita durante Fase 7.
- `personaDetectada`: si el análisis de IA no detecta una persona sentada,
  el flujo obliga a repetir la foto en vez de continuar con datos
  incompletos.

## 12. Almacenamiento

- **Google Sheets** (spreadsheet único, ID en `Code.gs`): hoja `Metrica`
  (usuarios) y hoja `Registros` (evaluaciones). Hoja `Entrenamiento` se
  autocrea la primera vez que se guarda un registro de entrenamiento.
- **Google Drive**: fotos subidas, organizadas en
  `ROSA Expert - Fotos/<email>/<timestamp>__<nombre-original>`, con enlace
  compartido "cualquiera con el link puede ver" (cuando la cuenta lo
  permite).
- **localStorage (React)**: sesión del usuario (`rosa_session`), borrador de
  evaluación en curso (`rosa_draft` — nota: función `useDraft` solo
  parcialmente conectada, ver `docs/AUDIT.md` §3).
- **sessionStorage (Apps Script SPA)**: sesión del usuario (`rosa_user`).

## 13. Integraciones externas

- **Google Apps Script Web App** (backend compartido) — ver
  `docs/API_CONTRACT.md`.
- **Google Sheets API** (vía `SpreadsheetApp`, solo desde Apps Script).
- **Google Drive API** (vía `DriveApp`, solo desde Apps Script).
- **Gemini API** (`generativelanguage.googleapis.com`) — solo desde Apps
  Script, para el análisis de foto server-side. **No conectado en React**
  (ver Fase 9 de este proyecto — la integración de Gemini en React
  específicamente queda pendiente a propósito, marcada con
  `TODO: GEMINI_INTEGRATION`; en Apps Script YA estaba conectada antes de
  esta auditoría y no se debe desconectar).
- **MediaPipe Tasks Vision** (CDN `cdn.jsdelivr.net` + modelo en
  `storage.googleapis.com`) — solo desde React, dependencia externa en
  tiempo de ejecución.
- **ONNX Runtime Web** (local, sin red) — solo desde React, corre el modelo
  YOLO propio (`best.onnx`) enteramente en el navegador.
- **Netlify** (`famous-tartufo-04dba5.netlify.app`) — hosting estático usado
  por Apps Script para servir fotos de guía y, según documentación
  desactualizada, anteriormente también el modelo YOLO (ya no aplica, ver
  `docs/AUDIT.md` §6.4).

## 14. Comportamiento esperado (resumen de UX)

- La app debe funcionar completa en móvil (es el dispositivo principal para
  tomar la foto) y escritorio (más común para el panel de administración).
- Ningún dato personal debe viajar en query strings ni loguearse en texto
  plano más allá de lo estrictamente necesario para el análisis.
- El usuario siempre debe poder entender por qué obtuvo un puntaje
  (desglose por sección + recomendaciones accionables), no solo un número.
- Un administrador debe poder identificar rápidamente empleados con riesgo
  alto/muy alto y su tendencia en el tiempo.

## 15. Funcionalidades pendientes

Ver `docs/AUDIT.md` §9 (tabla de prioridades) para el detalle técnico. Desde
el punto de vista funcional, queda pendiente:

- Unificar la escala de niveles de riesgo (§7) entre React (5 niveles) y
  Apps Script (4 niveles) — **requiere decisión de negocio del usuario**.
- Decidir si React debe implementar `getUserHistory` (historial personal)
  ya que hoy solo existe consumido desde Apps Script.
- Conectar Gemini en React (deliberadamente pendiente, Fase 9 de este
  proyecto — no antes).
- Completar los controles decorativos sin función en `AdminDashboard.tsx`
  de React (navegación superior, sidebar, toggles) o retirarlos.
- Decidir el destino del árbol de código muerto en React (§5 de
  `docs/AUDIT.md`) — eliminar, o es funcionalidad planeada a futuro
  (wizard por pasos como alternativa al flujo de una sola pantalla).
- Exportación CSV en React (existe en Apps Script, no confirmado en React).
