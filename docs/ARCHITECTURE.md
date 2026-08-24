# ARCHITECTURE.md — Arquitectura técnica de ROSA Expert

Este documento describe la arquitectura **real** de cada implementación, tal
como quedó confirmada en `docs/AUDIT.md`, no la arquitectura aspiracional
descrita en los README existentes (que están desactualizados en varios
puntos — ver notas de discrepancia en cada sección).

---

## React (`Metodo Rosa/`)

### Estructura de carpetas (solo lo que es alcanzable/vivo — ver `docs/AUDIT.md` §3 para el árbol muerto completo)

```
Metodo Rosa/
├── src/
│   ├── ai/
│   │   ├── mediapipe/       # Pose (VIVO) — PoseService.ts, AngleCalculator.ts, PoseTypes.ts
│   │   │                    #   ImageProcessor.ts está vacío (0 bytes), sin usar
│   │   └── yolo/            # Objetos (VIVO) — YoloService.ts, YoloTypes.ts
│   ├── components/
│   │   ├── ai/rosa/         # RosaEngine.ts (VIVO), RosaAssessment.ts (tipos, VIVO)
│   │   │                    #   RosaCalculator.ts, ChairAssessment.tsx, WorkstationAssessment.tsx: MUERTOS
│   │   ├── ai/mediapipe/    # Copia MUERTA y divergente de src/ai/mediapipe — no eliminar sin decisión del usuario
│   │   ├── illustrations/   # ErgonomicArt.tsx (VIVO)
│   │   ├── common/          # ErrorBoundary.tsx (usado solo en árbol muerto)
│   │   └── steps/, dashboard/, evaluation/, score/, camera/, layout/, draft/  # MUERTOS (wizard por pasos no enrutado)
│   ├── context/
│   │   ├── AuthContext.tsx  # VIVO — única fuente de sesión
│   │   └── EvaluationContext.tsx, RosaResultContext.tsx, StepContext.tsx, SidebarContext.tsx  # montados en main.tsx pero sin consumidores vivos
│   ├── hooks/
│   │   └── useDraft.ts      # a medio conectar, solo dentro del árbol muerto
│   ├── pages/
│   │   ├── Login.tsx            # VIVO
│   │   ├── AutoEvaluationPage.tsx  # VIVO — flujo completo autocontenido (~1280 líneas)
│   │   ├── AdminDashboard.tsx   # VIVO — parcialmente decorativo, ver AUDIT.md §3
│   │   ├── Home.tsx, Dashboard.tsx  # vacíos (0 bytes), MUERTOS
│   │   └── Evaluation.tsx       # prototipo estático, MUERTO
│   ├── services/
│   │   └── SheetsService.ts # VIVO — único cliente HTTP hacia Apps Script
│   ├── App.tsx               # HashRouter: /login, /admin, /* → AutoEvaluationPage
│   └── main.tsx               # monta AuthProvider + los 4 contexts (uno de ellos, SidebarContext, ni siquiera eso)
├── public/                    # best.onnx, wasm de onnxruntime, fotos de guía
├── scripts/copy-wasm.cjs      # copia los .wasm de onnxruntime-web a public/ tras npm install
└── vite.config.ts
```

**Nota de discrepancia con `README.md` (raíz):** el README describe una
carpeta `src/store/` ("Estado global — Zustand u otro") que no existe en el
código actual; el manejo de estado real es Context API (`AuthContext`) más
`useState` local dentro de `AutoEvaluationPage.tsx`, no una librería de store
global.

### Componentes
Ver árbol arriba. El único flujo realmente en producción vive en 3
archivos: `Login.tsx`, `AutoEvaluationPage.tsx`, `AdminDashboard.tsx`, más
`AuthContext.tsx` y `SheetsService.ts` como columna vertebral.

### Servicios
- **`SheetsService.ts`**: cliente HTTP hacia el Apps Script desplegado
  (`VITE_APPS_SCRIPT_URL`). `POST` con `Content-Type: text/plain` y body
  `{action, ...payload}`; siempre espera `{ok, data?, error?}`. Implementa:
  `login`, `saveEvaluation`, `getEvaluations`, `getUsers`, `saveTraining`,
  `uploadPhoto`. **No implementa** `getUserHistory` ni `analyzePhoto`
  (existen en el backend, sin caller en React).
- **`YoloService.ts`**: carga `best.onnx` con `onnxruntime-web` (WASM),
  preprocesa con letterbox, corre inferencia, postprocesa con NMS. Se
  autodetecta el layout de tensor de salida (dos formatos soportados).
- **`PoseService.ts`**: wrapper de MediaPipe `PoseLandmarker`, carga wasm
  desde CDN (`cdn.jsdelivr.net`) y modelo desde
  `storage.googleapis.com/mediapipe-models/...pose_landmarker_lite...`.

### Manejo de estado
Context API únicamente para lo que está vivo: `AuthContext` (sesión de
usuario, persistida en `localStorage` bajo `rosa_session`). El resto del
estado del flujo de evaluación vive como `useState` local dentro de
`AutoEvaluationPage.tsx`, no en contexts globales — los contexts
`EvaluationContext`/`RosaResultContext`/`StepContext` están montados en
`main.tsx` pero no tienen consumidores vivos.

### Modelos/tipos
Sin carpeta `src/types/` con contenido (existe vacía). Patrón: tipos
co-ubicados por dominio — `ai/mediapipe/PoseTypes.ts`, `ai/yolo/YoloTypes.ts`,
`components/ai/rosa/RosaAssessment.ts` (archivo dedicado solo a tipos), y
tipos inline en los propios archivos de servicio (`AppUser`,
`EvaluationRecord`, `TrainingRecord` en `SheetsService.ts`).

### Persistencia
- `localStorage`: sesión (`rosa_session`), borrador de evaluación
  (`rosa_draft`, vía `useDraft` — solo parcialmente conectado, sin ruta de
  restauración, ver AUDIT.md).
- Sin base de datos local ni IndexedDB.
- La persistencia real de negocio (evaluaciones, usuarios) vive en Google
  Sheets, accedida siempre a través de `SheetsService.ts` → Apps Script.

### Comunicación con servicios externos
- Apps Script (HTTP `POST`, ver `docs/API_CONTRACT.md`).
- CDN de MediaPipe (wasm + modelo, sin control de versión propio del
  proyecto — apunta a una versión fija `@mediapipe/tasks-vision@0.10.35`).
- Ningún otro servicio externo. **No hay llamada a Gemini ni a ningún otro
  LLM en el código React actual.**

### Punto de integración futura de Gemini
Aún no existe en el código. Cuando se implemente (Fase 9, explícitamente
pospuesta), el punto natural de integración es:
- Agregar `analyzePhoto` a `services/SheetsService.ts` (ya existe el patrón
  de `uploadPhoto` para seguir: convertir a base64, `POST` con `action:
  'analyzePhoto'`).
- Consumirlo desde `AutoEvaluationPage.tsx`, en el mismo punto donde hoy se
  invoca `YoloService`/`PoseService` — probablemente como alternativa
  opcional/fallback, dado que la posición de producto actual de React es
  "análisis 100% local, la foto nunca sale del dispositivo"
  (`public/MODEL_INFO.md`). **Esta es una decisión de producto pendiente,
  no solo técnica**: conectar Gemini en React contradice la promesa de
  privacidad actual, a menos que se ofrezca como opt-in explícito.
- Marcar con `TODO: GEMINI_INTEGRATION` según lo exige este proyecto.

---

## Apps Script (`AppsScript/`)

### Estructura de archivos

```
AppsScript/
├── Code.gs         # Router: doGet (sirve la SPA), doPost (API REST externa),
│                    #   rpcHandler (switch de acciones, compartido por SPA y REST)
├── Auth.gs          # handleLogin — valida contra hoja "Metrica"
├── Sheets.gs        # handleSaveEvaluation, handleGetEvaluations, handleGetUserHistory,
│                    #   handleGetUsers — hoja "Registros" / "Metrica"
├── Drive.gs         # handleUploadPhoto — sube a Drive, carpeta por usuario
├── Training.gs      # handleSaveTraining — autocrea hoja "Entrenamiento"
├── Gemini.gs        # handleAnalyzePhoto — llama a Gemini API, clave vía PropertiesService
├── Index.html       # Shell de la SPA: incluye CSS + todas las Page_*/JS_* en orden
├── CSS_Base.html, CSS_Components.html
├── Page_Login.html, Page_Guide.html, Page_Questions.html,
│   Page_Results.html, Page_History.html, Page_Dashboard.html
├── JS_State.html     # App: estado global, router SPA (client-side), sesión (sessionStorage), toasts
├── JS_Api.html        # Api: wrapper de google.script.run → rpcHandler
├── JS_Rosa.html        # Rosa: motor de cálculo (tablas oficiales)
├── JS_Analysis.html    # Analysis: orquesta foto → analyzePhoto → Rosa.calcular → resultados
├── JS_Quality.html     # Quality: traduce el diagnóstico de encuadre de Gemini a avisos accionables
├── JS_Questions.html   # Questions: cuestionario, pre-llenado y lectura de respuestas
├── JS_Guide.html        # Guide: login, captura/compresión de foto, drag&drop
├── JS_Charts.html       # Charts: gráficas de barras/línea/tabla (SVG manual, sin librería)
├── JS_History.html      # History: historial personal
├── JS_Dashboard.html    # Dashboard: panel admin (stats, gráficas, tabla, filtro, CSV)
├── JS_Init.html          # Init: arranque, verificación de integridad de instalación, sesión
└── Photos.html            # Fotos de guía embebidas en base64 (Photos.posturaLateral, Photos.puestoTrabajo)
```

**Nota de discrepancia con `AppsScript/INSTALACION.md`**: ese documento
lista `JS_Yolo.html`, `JS_Pose.html`, `Page_Results` (sin más) y **omite
`Gemini.gs`**, `CSS_Components`, `Page_Questions`, `JS_Quality`, `Photos`,
`JS_State`↔`JS_Api`↔orden real. Refleja una versión anterior de la
arquitectura (cuando Apps Script también usaba YOLO client-side vía Netlify)
que ya no existe en el código actual — está desactualizado y debe
reescribirse antes de usarse para una instalación nueva (ver
`docs/AUDIT.md` §9, ítem 4).

### Funciones principales
- **`doGet()`**: sirve `Index.html` como plantilla evaluada — es la SPA
  completa.
- **`doPost(e)`**: parsea el body JSON, delega a `rpcHandler`, responde JSON
  — este es el endpoint que consume React.
- **`rpcHandler(params)`**: switch central de acciones (`login`,
  `saveEvaluation`, `getEvaluations`, `getUserHistory`, `getUsers`,
  `saveTraining`, `uploadPhoto`, `analyzePhoto`) — punto de entrada único
  tanto para `google.script.run` (SPA interna) como para `doPost` (React).

### Comunicación con Sheets
`SpreadsheetApp.openById(SPREADSHEET_ID)` (ID hardcodeado en `Code.gs`).
`getSheet(name)` centraliza el acceso y lanza si la hoja no existe. Hojas:
`Metrica` (usuarios), `Registros` (evaluaciones), `Entrenamiento`
(autocreada).

### Comunicación con Drive
`DriveApp` — crea/reutiliza carpeta raíz `ROSA Expert - Fotos` y una
subcarpeta por email de usuario; intenta compartir "cualquiera con el
enlace puede ver" (con manejo de excepción para cuentas corporativas que lo
restringen).

### HTML/UI
SPA de una sola página (`Index.html`) con navegación por
mostrar/ocultar `.page` vía `App.goTo()` (no hay routing por URL/hash real,
salvo el caso especial `#dashboard` que se lee una vez en `JS_Init.html`
para saltar directo al panel si el usuario es admin). Todas las pantallas
(Login/Guide/Questions/Results/History/Dashboard) están en el DOM desde el
inicio, solo una visible a la vez.

### Funciones del servidor
Ver tabla de acciones en `docs/API_CONTRACT.md`. Todas devuelven
`{ok: boolean, data?, error?}` de forma consistente.

### Punto de integración futura de Gemini
**Ya conectado** — no es un punto pendiente en Apps Script. `Gemini.gs`
implementa `handleAnalyzePhoto`, con:
- Clave en `PropertiesService.getScriptProperties()` (`GEMINI_API_KEY`),
  nunca en código fuente — patrón correcto a replicar si React necesitara
  algo similar del lado servidor.
- Esquema de respuesta forzado (`responseSchema` de Gemini) para evitar
  texto libre — devuelve exactamente los campos que el motor ROSA necesita.
- Manejo de errores por código HTTP (400/403/404/429) con mensajes
  accionables en español.

---

## Diagrama de flujo de datos (alto nivel)

```
┌─────────────┐        HTTP POST (doPost)        ┌──────────────────┐
│   React     │ ───────────────────────────────► │                  │
│ (Metodo     │ ◄─────────────────────────────── │   Code.gs        │
│  Rosa)      │        JSON {ok,data,error}       │  rpcHandler()    │
└─────────────┘                                   │                  │
                                                   │  ┌────────────┐  │
┌─────────────┐    google.script.run (RPC)        │  │ Auth.gs    │  │
│  SPA propia │ ───────────────────────────────►  │  │ Sheets.gs  │  │
│ (Index.html │ ◄───────────────────────────────  │  │ Drive.gs   │  │
│  + JS_*)    │                                   │  │ Training.gs│  │
└─────────────┘                                   │  │ Gemini.gs  │  │
                                                   │  └─────┬──────┘  │
                                                   └────────┼─────────┘
                                                            │
                                        ┌───────────────────┼───────────────────┐
                                        ▼                   ▼                   ▼
                                  Google Sheets        Google Drive        Gemini API
                                (Metrica/Registros/    (fotos por        (análisis de
                                  Entrenamiento)         usuario)          foto)
```
