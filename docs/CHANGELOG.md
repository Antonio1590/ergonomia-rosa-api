# CHANGELOG.md

Registro de cambios importantes. Formato: fecha, qué cambió, por qué.

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
