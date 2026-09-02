# CHANGELOG.md

Registro de cambios importantes. Formato: fecha, qué cambió, por qué.

## 2026-09-02 — Rediseño visual: ingreso y panel admin (paridad con React)

React ya tenía una pantalla de ingreso y un panel admin más elaborados
(`Login.tsx`, `AdminDashboard.tsx`) que la SPA de Apps Script, que se
quedó con las tarjetas simples de las primeras fases. Se llevó ese
mismo lenguaje visual a Apps Script, adaptado a su paleta verde propia
(no se copió el azul de React — se mantiene consistencia con el resto
de la SPA).

- **`Page_Login.html`** — tarjeta partida en dos columnas: panel
  izquierdo con degradado verde oscuro, formas difuminadas de fondo,
  una ilustración simple en SVG de un puesto de trabajo, titular
  "Bienvenido de nuevo" e íconos de confianza (análisis local, uso
  confidencial, acceso controlado); panel derecho con el formulario
  (inputs de solo subrayado, sin caja) y botón naranja "Ingresar". Los
  ids que usa `JS_Guide.handleLogin()` (`loginEmail`, `loginCedula`,
  `loginError`, `btnLogin`, `loginForm`) no cambiaron.
- **`Page_Dashboard.html` / `JS_Dashboard.html`** — el resumen superior
  pasa de 3 tarjetas sueltas a una cuadrícula tipo "bento": tarjeta de
  último puntaje, la gráfica de tendencia (reubicada, mismo `Charts.linea`),
  4 tiles de KPI con ícono (Usuarios, Evaluaciones totales, Puntaje
  promedio, Riesgo alto o mayor) y una tarjeta "Salud del sistema" con
  dos barras de progreso. `Dashboard.load()` ahora pide `Api.getUsers()`
  en paralelo con `Api.getEvaluations()` (antes no se usaba en el panel)
  para poder mostrar el total de usuarios y la cobertura.

Estilos nuevos (`.login-*`, `.bento-*`, `.health-*`) agregados a
`CSS_Components.html`, reutilizando los tokens de color/radio/sombra
existentes. Verificado visualmente armando una vista previa estática
local (`CSS_Base` + `CSS_Components` + la página) en escritorio y en
375px de ancho — ambas pantallas responsive sin overflow horizontal,
sin errores de consola. No se pudo verificar contra el despliegue real
de script.google.com por la misma razón de siempre (desactualizado
respecto al repo).

## 2026-09-01 — Paridad Apps Script: borrador, detalle admin y alerta de riesgo

Las tres mejoras del 2026-08-25 que solo se habían construido en React
(punto 1, historial, ya existía en ambos lados) ahora también existen en
la SPA de Apps Script, para que pueda funcionar de forma independiente
al 100 %.

- **Borrador reanudable** (`AppsScript/JS_Draft.html`, nuevo): al calcular
  el puntaje se guarda un snapshot (sin la foto) en `localStorage`. Si el
  usuario sale sin guardar, `Guide.initGuidePage()` muestra un aviso con
  "Descartar" / "Ver y guardar" — mismo comportamiento que
  `useDraft.ts` en React. Se descarta automáticamente tras guardar.
  `Analysis.mostrarResultados()` ahora tolera `analysis.img === null`
  (oculta la sección de foto en vez de fallar).
- **Detalle de evaluación en el panel admin** (`JS_Dashboard.html`,
  `Page_Dashboard.html`): clic en cualquier fila de la tabla abre un
  modal con puntaje, riesgo, desglose silla/pantalla/teclado, objetos
  detectados, recomendaciones y enlace a la foto en Drive.
- **Alerta de riesgo alto** (`JS_Dashboard.html`, `Page_Dashboard.html`):
  tarjeta roja "Casos que necesitan atención pronto" con los 5 casos
  Alto/Muy Alto más recientes, debajo de las estadísticas; cada fila abre
  el mismo modal de detalle.

Se agregó `riskCfg(nivel)` en `JS_Dashboard.html` para unificar el color
y la clase de badge por nivel de riesgo (antes duplicado en la tabla);
lo reutilizan la tabla, la alerta y el modal. Módulo `Draft` registrado
en `JS_Init.html` (chequeo de integridad) e incluido en `Index.html`.
Estilos nuevos en `CSS_Components.html` (`.draft-card`, `.urgent-cases`,
`.modal-*`), reutilizando los tokens de color/radio/sombra existentes —
sin paleta nueva.

**Pendiente:** no se pudo probar en vivo (el despliegue real de
script.google.com sigue desactualizado respecto al repo, ver entrada de
abajo) — verificado por lectura de código y por sintaxis de cada módulo.
Requiere que el usuario copie los archivos actualizados (ver
`AppsScript/INSTALACION.md` o el sincronizador) y vuelva a implementar.

## 2026-08-25 — Seis mejoras de experiencia (usuario + admin)

A raíz de la pregunta "¿qué más podemos mejorar para la experiencia del
usuario y el administrador?" se implementaron las 6 mejoras propuestas,
apoyadas directamente en brechas ya documentadas en `docs/AUDIT.md` y
`docs/PARITY_MATRIX.md`.

### 1. Historial personal (`src/pages/HistoryPage.tsx`, ruta `/historial`)
Apps Script ya tenía `handleGetUserHistory` pero React nunca lo llamaba —
un colaborador no tenía forma de ver su propia evolución. Se agregó
`getUserHistory(email)` a `SheetsService.ts` (mismo shape que el backend)
y una página nueva con score+tendencia, gráfico de barras y lista completa
de evaluaciones con enlace a Drive. Enlazada desde la barra de navegación
de `AutoEvaluationPage.tsx` ("Mi historial").
**Nota:** verificado en vivo que el despliegue de producción de Apps
Script está desactualizado respecto al repo (`"Acción desconocida:
getUserHistory"` en el backend real) — el código de React es correcto,
pero esta funcionalidad no operará hasta que se redespliegue manualmente
desde script.google.com.

### 2. Aviso de calidad de foto (`AutoEvaluationPage.tsx`)
Apps Script tenía verificación de calidad vía Gemini; React no tenía
ninguna. En vez de depender de Gemini (que la Fase 12 del plan original
dejó explícitamente sin conectar), se añadió `assessPhotoQuality()` que
usa únicamente las señales que MediaPipe ya calcula (`.visibility` de
rodillas/tobillos y promedio general) para avisar cuando la foto no
muestra el cuerpo completo o tiene mala nitidez/luz — mostrado como
tarjeta ámbar junto al puntaje en la fase de resultados.

### 3. Guardar borrador / reanudar (`src/hooks/useDraft.ts`, `AutoEvaluationPage.tsx`)
El hook `useDraft` existía pero estaba muerto — construido para el wizard
de pasos que ya no se usa. Se reescribió como hook genérico y se conectó
al flujo real de una sola pasada: al llegar a resultados se guarda el
`CombinedResult` calculado (no la foto, que no sobrevive un recargue) en
`localStorage`; si el usuario vuelve a entrar sin haber guardado, ve un
banner para retomar o descartar el borrador. Se descarta automáticamente
al guardar la evaluación con éxito.

### 4. Detalle de evaluación en el panel admin (`AdminDashboard.tsx`)
La tabla de evaluaciones solo mostraba filas agregadas, sin forma de ver
el detalle de una en particular. Se agregó un modal (click en cualquier
fila) con puntaje, riesgo, desglose silla/pantalla/teclado, objetos
detectados y recomendaciones — reutiliza `parseDetalles()` ya existente.

### 5. Alerta de riesgo alto (`AdminDashboard.tsx`)
Antes había que revisar la tabla completa para notar casos de riesgo
Alto/Muy Alto. Se agregó una tarjeta roja "Casos que necesitan atención
pronto" (hasta 5 más recientes) justo debajo de los KPIs, cuyas filas
abren el mismo modal de detalle del punto 4.

### 6. Migración de etiquetas de riesgo viejas (`AppsScript/Sheets.gs`)
Antes de unificar la escala de riesgo a 4 niveles, filas viejas de la
hoja real `Registros` quedaron con etiquetas de la escala vieja de React
de 5 niveles (p.ej. "Mejorable") que ya no existen en el sistema unificado
(Bajo/Medio/Alto/Muy Alto de `nivelRiesgo()` en `JS_Rosa.html`). Se agregó
`migrarNivelesRiesgoAntiguos(dryRun)`: recalcula la etiqueta desde el
puntaje ya guardado en cada fila. Disparo exclusivamente manual desde el
editor de Apps Script (mismo patrón que `configurarProyecto()`), con
`dryRun=true` por defecto — solo registra en el log qué cambiaría, sin
tocar la hoja, hasta correrla explícitamente con `false`. Idempotente:
nunca toca una fila que ya tiene una etiqueta válida. **Pendiente de
ejecución real** — no se corrió contra la hoja de producción; requiere
que el usuario la dispare manualmente cuando esté listo, revisando primero
el resultado del dry run.

### Verificación
`npm run build` y `npm run lint` limpios (11 errores + 1 advertencia,
mismos preexistentes de código muerto documentados en la limpieza del
2026-08-24). Puntos 1, 4 y 5 verificados en vivo contra datos reales de
producción (sin escribir nada). El punto 6 no se puede verificar en vivo
sin mutar datos reales — revisado por lectura de código únicamente.

## 2026-08-24 (continuación 3) — Limpieza de archivos vacíos

Eliminados los 5 archivos que estaban en 0 bytes desde su creación
(`src/pages/Home.tsx`, `src/pages/Dashboard.tsx`,
`src/components/layout/MainLayout.tsx`, `src/components/layout/Footer.tsx`,
`src/ai/mediapipe/ImageProcessor.ts`) — confirmado sin contenido y sin
ninguna referencia en el resto de `src/` antes de borrar. `npm run build`
sigue transformando los mismos 46 módulos que antes (nunca formaron parte
del grafo de la app) y `npm run lint` sigue en los mismos 12 errores
preexistentes. Alcance acotado a propósito: el resto del árbol de código
muerto identificado en `docs/AUDIT.md` (el wizard por pasos completo y
sus contexts, la copia divergente de mediapipe, etc.) sigue sin tocarse —
es un cambio mucho más grande que requiere su propia decisión.

## 2026-08-24 (continuación 2) — Verificación exhaustiva del panel + fix de crash

### Bug corregido: el panel podía crashear si el servidor devolvía datos inesperados
Al probar el panel en vivo repetidamente contra el backend real se reprodujo
un crash real (capturado correctamente por el `ErrorBoundary`, pero antes
lo dejaba en pantalla de error en vez de mostrar el panel):
`TypeError: Cannot read properties of undefined (reading 'filter')`. Causa:
si `getAllEvaluations()`/`getAllUsers()` alguna vez resuelven a algo que no
es un array (respuesta del servidor sin `data`, por ejemplo durante uno de
los 404 intermitentes observados en las pruebas), el estado quedaba
`undefined` y cualquier `.filter()`/`.map()` posterior tronaba. Corregido en
`AdminDashboard.tsx` con una guarda `Array.isArray(...) ? ... : []` al
recibir la respuesta.

### Verificación en vivo, funcionalidad por funcionalidad (contra datos reales de producción, sin escribir nada)
- Navegación (nav superior, sidebar, selector de pestañas) — OK.
- Filtro de búsqueda (evaluaciones y usuarios) — OK, probado con varios
  términos.
- Filtro por nivel de riesgo y por rol — OK, incluso combinado con búsqueda.
- Orden por columna (Fecha) — OK, alterna asc/desc correctamente (un primer
  intento de prueba pareció mostrar que no cambiaba, pero era un artefacto
  de disparar dos clics en el mismo tick de JavaScript sin esperar al
  re-render de React — con eventos reales, y confirmado con una espera
  entre clics, sí alterna).
- Vista mensual/trimestral — OK, la trimestral agrega promedios reales por
  mes.
- Pestaña Reportes — OK, muestra conteos reales y el botón de exportar CSV.
- Los "404" intermitentes vistos en varias pruebas son fallas de red
  pasajeras al llamar al Apps Script (confirmado: recargar la página
  resuelve el problema y trae los mismos datos reales) — no es un bug de
  código, aunque el panel no reintenta automáticamente hoy.

### Columnas de la hoja `Metrica` — confirmado con el usuario
El usuario confirmó que el orden real de columnas es exactamente
`Cedula, Email, Nombre, Rol, Estado, FechaRegistro` — **igual** al que ya
asumían `Auth.gs`/`Sheets.gs`. Esto descarta un bug de mapeo de columnas en
el código. La anomalía vista en los 2 registros reales (un correo en la
celda de cédula, un número en la celda de correo, "admin"/"Usuario" en la
celda de nombre, una fecha en la celda de rol) es, por descarte, un
problema de los **datos** de esas 2 filas específicas en la hoja real, no
del código — requiere corrección manual directa en Google Sheets, no un
cambio de código.

## 2026-08-24 (continuación) — Panel de administración: interactividad, filtros reales y bug de guardado

### Bug crítico corregido: "objetos detectados" nunca se guardaba
`AutoEvaluationPage.tsx` (`handleSave`) armaba su propio campo `detalles`
(JSON ya construido) y lo enviaba a `saveEvaluation` — pero
`Sheets.gs → handleSaveEvaluation` **ignora ese campo** y reconstruye
`Detalles` a partir de `record.puntajeSilla`, `record.puntajePantalla`,
`record.puntajeTeclado` y `record.objetosDetectados`, que React nunca
enviaba. Resultado: todas las evaluaciones guardadas desde React tenían la
columna `Detalles` vacía (`{}`), y por eso "Objetos detectados" siempre
aparecía en blanco en el panel de administración — confirmado con datos
reales de producción. Corregido enviando los campos correctos (mismo
nombre que ya usa Apps Script, ver `docs/DATA_MODEL.md`). También se
empezó a enviar `nombre`/`cedula` en el guardado (ver corrección de Apps
Script del commit anterior). Aplicado tanto en `AutoEvaluationPage.tsx`
(vivo) como en `Step4Result.tsx` (código muerto, corregido por
consistencia).

### `AdminDashboard.tsx` — interactividad y filtros reales
- Navegación (nav superior + sidebar) ahora cambia de sección de verdad —
  antes eran `<span>`/`<div>` decorativos sin `onClick`.
- Sidebar simplificado: ya no repite "Resumen general"/"Evaluaciones"/
  "Usuarios", que ya viven en el nav superior y en pantallas ≥1024px se
  veían duplicados en dos lugares a la vez llamando a lo mismo. El sidebar
  ahora solo tiene "Reportes" (única opción que no está en el nav superior)
  y "Nueva evaluación".
- Filtros reales y funcionando: búsqueda por nombre/correo/cédula y filtro
  por nivel de riesgo (construido dinámicamente desde los valores que
  realmente existen en los datos, incluyendo etiquetas antiguas como
  "Mejorable" — no se ocultan datos históricos) en la tabla de
  evaluaciones; búsqueda y filtro por rol en la de usuarios.
- Orden real por columna (Fecha/Puntaje, clic para invertir) en la tabla
  de evaluaciones.
- "Vista mensual/trimestral" ahora cambia de verdad los datos del
  historial (mensual = últimas evaluaciones individuales; trimestral =
  promedio agregado por mes, igual que `Dashboard.promedioMensual()` en
  Apps Script) — antes era decorativo.
- Nueva pestaña "Reportes" con exportación CSV real (evaluaciones y
  usuarios, respetando los filtros activos) — cubre el pendiente de CSV
  identificado en `docs/PARITY_MATRIX.md`. Se agregó también como opción
  siempre visible en el selector de pestañas, porque el sidebar (`lg:`) y
  el nav superior (`md:`) se ocultan en pantallas más chicas y "Reportes"
  quedaría inalcanzable si solo viviera ahí.
- Consistencia de color de riesgo: el número grande de puntaje usaba
  umbrales propios (`≤4`/`≤5`/`>5`) que no coincidían con las 4 etiquetas
  reales de riesgo: ahora ambos usan la misma paleta (`RISK_CONFIG`, los
  mismos hex que Apps Script) para que el color y la etiqueta nunca se
  contradigan.
- "Objetos detectados" ahora se lee de verdad (parseando `detalles`,
  función `parseDetalles` nueva en `SheetsService.ts`) en vez de un campo
  que el servidor nunca devuelve.
- Botones "Nueva evaluación" conectados a la navegación real
  (`useNavigate`); reemplazado el botón "Documentación" (sin destino real)
  por "Ver evaluaciones"; quitados los enlaces de footer que apuntaban a
  `href="#"` sin ninguna función; quitada la imagen de héroe externa
  (`lh3.googleusercontent.com`, dependencia de terceros no versionada,
  señalada en `docs/AUDIT.md`) por un ícono propio del sistema.
- Recomendaciones (`RosaEngine.ts → generateRecommendations`) reescritas
  en tono cercano y accionable (segunda persona, sin fraseo clínico ni
  alarmista), alineadas con el tono que ya usaba `AppsScript/JS_Rosa.html`.

### Hallazgo nuevo, reportado pero NO corregido — requiere revisión directa del usuario
Al verificar el panel de "Usuarios" contra los 2 registros reales de la
hoja `Metrica`, los valores aparecen sistemáticamente desalineados: lo que
el sistema etiqueta "cédula" contiene un correo, lo que etiqueta "correo"
contiene un número de cédula, lo que etiqueta "nombre" contiene un valor
tipo rol ("admin"/"Usuario"), y lo que etiqueta "rol" contiene una fecha.
Esto podría significar que el orden real de columnas en la hoja `Metrica`
de producción no coincide con el que asumen `Auth.gs`/`Sheets.gs`
(`A=Cédula B=Email C=Nombre D=Rol E=Estado F=FechaRegistro`, ver
`Auth.gs:3`) — o que estas 2 filas específicas son datos de prueba
cargados manualmente en el orden equivocado. **No se modificó ningún
código de login/lectura de usuarios a partir de esta observación**: hacerlo
sin confirmar la estructura real de la hoja arriesgaba romper el login de
usuarios que hoy sí funciona. Requiere que el usuario abra la hoja
`Metrica` real y confirme el orden real de las columnas A–F.

## 2026-08-24 — Auditoría inicial y estabilización (Fases 1–8)

### Documentación (nueva)
- `docs/AUDIT.md` — auditoría técnica completa de React y Apps Script.
- `docs/PROJECT_SPEC.md` — especificación funcional única para ambas implementaciones.
- `docs/ARCHITECTURE.md` — arquitectura real de cada cliente.
- `docs/DATA_MODEL.md` — contrato de datos, con discrepancias documentadas.
- `docs/API_CONTRACT.md` — contrato de integraciones, incluido el punto de integración futura de Gemini en React (`TODO: GEMINI_INTEGRATION`, sin conectar).
- `docs/PARITY_MATRIX.md` — paridad funcional React ↔ Apps Script.
- `.claude/agents/{auditor,react-dev,apps-script-dev,qa,documentation}.md` — agentes especializados del proyecto.

### Control de versiones
- Se inicializó git en la raíz del proyecto (no existía ningún repositorio antes). Commit inicial con el estado exacto previo a cualquier corrección, como punto de retorno seguro.

### React (`Metodo Rosa/`)
- **Corrección de dependencia**: `tailwindcss` y `@tailwindcss/vite` se declaran ahora en `Metodo Rosa/package.json` (antes se resolvían "prestadas" del `node_modules` de un scaffold huérfano en la raíz del repo — el build se rompía en una instalación limpia). `npm audit fix` aplicado (0 vulnerabilidades).
- **Corrección de bug de cálculo**: `src/ai/mediapipe/AngleCalculator.ts` ahora calcula el ángulo real de hombro (cadera-hombro-codo), que antes estaba hardcodeado a `0` — esto hacía que el sub-puntaje de brazos (`armScoreOf` en `AutoEvaluationPage.tsx`) siempre saliera "óptimo" sin importar la postura real. El ángulo de muñeca sigue en `0`, documentado en el código: el modelo de pose no incluye landmarks de mano y no se usa en ningún puntaje ROSA hoy.
- **Unificación de escala de riesgo**: React usaba una escala propia de 5 niveles (Inapreciable/Mejorable/Alto/Muy Alto/Extremo); se cambió a los 4 niveles de Apps Script (Bajo/Medio/Alto/Muy Alto), con los mismos cortes de puntaje (≤2/≤4/≤7/>7) y los mismos textos de acción recomendada. Decisión tomada por el usuario. Archivos: `src/components/ai/rosa/RosaAssessment.ts` (tipo `RosaRisk`), `RosaEngine.ts` (`calculateAction`), `src/pages/AdminDashboard.tsx`, `src/pages/AutoEvaluationPage.tsx`, `src/components/steps/Step4Result.tsx` (mapas de color).
- **Error boundary**: se envolvieron las rutas reales de la app (`App.tsx`) con el `ErrorBoundary` existente, que antes solo se usaba en el árbol de código muerto — antes una excepción de render dejaba la app en blanco sin ningún mensaje.
- **Lint**: se corrigieron los 2 errores de lint en código vivo (`AuthContext.tsx`): estado inicial de sesión ahora se deriva con lazy `useState` en vez de `setState` dentro de un `useEffect`; el hook `useAuth` se movió a `src/context/useAuth.ts` (archivo separado) para no violar la regla de Fast Refresh que exige que un archivo con un componente exportado (`AuthProvider`) no exporte también valores no-componente. Quedan 12 errores + 1 advertencia de lint, todos dentro del árbol de código muerto (ver `docs/AUDIT.md` §2.2) — no se tocaron porque su destino (eliminar vs. conservar) es una decisión pendiente del usuario.

### Apps Script (`AppsScript/`)
- **Configuración fuera del código fuente**: `SPREADSHEET_ID` y `ADMIN_EMAILS` ahora se leen de `PropertiesService` (con fallback a los valores anteriores, así el despliegue actual sigue funcionando sin cambios). Nueva función `configurarProyecto(spreadsheetId, admins)` para migrar en un solo paso, ejecutable una vez desde el editor. Archivos: `Code.gs`, `Auth.gs`, `Training.gs`.
- **Corrección de pérdida silenciosa de datos**:
  - `Sheets.gs` (`handleSaveEvaluation`): los campos `nombre` y `cedula`, que el cliente ya enviaba pero el servidor descartaba, ahora se guardan en columnas nuevas N/O de la hoja `Registros`. **Acción manual pendiente**: si la hoja de cálculo real ya existía, agregar los encabezados `Nombre` (N1) y `Cedula` (O1) a mano.
  - `Training.gs` (`handleSaveTraining`): el campo `respuestas` que ya enviaba la SPA interna de Apps Script (`JS_Analysis.html`) y se perdía, ahora se guarda en una columna nueva `Respuestas_JSON` de la hoja `Entrenamiento`. Solo aplica a hojas `Entrenamiento` creadas desde ahora — una hoja ya existente no recibe el encabezado nuevo automáticamente.
- **Limpieza**: se eliminó la variable `STATIC_BASE` en `JS_Guide.html` (URL de Netlify sin usar en ningún lado — residuo de una arquitectura anterior en la que Apps Script también corría YOLO client-side).
- **`AppsScript/INSTALACION.md` reescrito por completo**: la versión anterior listaba archivos que ya no existen (`JS_Yolo.html`, `JS_Pose.html`), omitía `Gemini.gs` de la lista de archivos a crear, y describía un paso de subida a Netlify que ya no aplica a la arquitectura actual (Apps Script usa Gemini server-side, no YOLO). La nueva versión refleja el archivo real de 27 archivos (6 `.gs` + 21 `.html`) y el nuevo paso de `configurarProyecto`.

### Documentación general
- `README.md` (raíz): corregidos los nombres de hoja/columnas (`Metrica`/`Registros`, no `Usuarios`/`Evaluaciones`, que nunca coincidieron con el código real); corregido el nombre del script `copy-wasm.cjs` (el README decía `.js`); eliminada la mención a una carpeta `src/store/` que no existe; agregada sección de enlaces a `docs/`.

### Hallazgo crítico, corregido
- **Las tablas numéricas de puntaje ROSA diferían entre React (`RosaEngine.ts`) y Apps Script (`JS_Rosa.html`)** en un número significativo de celdas — no eran transcripciones equivalentes de la misma tabla oficial (Sonne, Villalta & Andrews, 2012). El usuario confirmó que Apps Script es la implementación ya validada contra la fuente oficial. Se alinearon las tres tablas de React (`TABLE_A`, `TABLE_B`, `TABLE_C`) a las de Apps Script (`T_SILLA`, `T_MONITOR_TEL`, `T_MOUSE_TECLADO`), incluyendo el límite superior de la Tabla A (React tenía una columna 10 extra que Apps Script no define — se quitó). Verificado con un diff programático celda por celda: 0 discrepancias tras el cambio. Ver `docs/PARITY_MATRIX.md`.

### Explícitamente no hecho en esta fase (por regla del proyecto o por decisión pendiente)
- No se conectó Gemini en React (Fase 9, deliberadamente pospuesta).
- No se eliminó el código muerto de React ni el scaffold huérfano de la raíz del repo (decisión pendiente del usuario).
- No se implementó `getUserHistory` en React (decisión pendiente).
- No se resolvió la inconsistencia de persistencia de sesión (`localStorage` vs `sessionStorage`).
