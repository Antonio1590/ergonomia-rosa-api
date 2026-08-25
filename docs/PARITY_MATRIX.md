# PARITY_MATRIX.md — Paridad funcional React ↔ Apps Script

Estado al 2026-08-24, después de las correcciones de Fase 7/8 descritas en
`docs/CHANGELOG.md`. Basado en `docs/PROJECT_SPEC.md` §3 (módulos).
"Completa" significa que ambas implementaciones cumplen la especificación
de forma equivalente — no que sean código idéntico.

| Funcionalidad | React | Apps Script | Estado | Observaciones |
|---|---|---|---|---|
| Login (cédula + correo) | OK | OK | Completa | Ambos delegan la validación al mismo `rpcHandler` |
| Captura de foto (cámara/galería) | OK | OK | Completa | — |
| Detección de objetos del puesto | OK (YOLO local) | OK (Gemini, servidor) | **Completa — divergencia justificada** | React: 100% en el dispositivo, ninguna foto sale del navegador (`public/MODEL_INFO.md`). Apps Script: envía la foto a Gemini. Es una decisión de producto documentada en `docs/PROJECT_SPEC.md` §3, no un defecto. Los resultados de detección pueden no coincidir 1:1 entre ambos motores |
| Detección de pose corporal | OK (MediaPipe local) | OK (Gemini, servidor) | **Completa — divergencia justificada** | Igual que arriba. Ángulo de hombro corregido en React el 2026-08-24 (antes hardcodeado a 0, ver `docs/CHANGELOG.md`) |
| Ángulo de muñeca | No calculado (0 fijo, documentado) | No calculado | **Completa — limitación técnica compartida** | Ninguna implementación mide flexión de muñeca hoy: React porque el modelo de pose (33 puntos) no incluye landmarks de mano; Apps Script porque Gemini no lo devuelve en el esquema actual. No se usa en ningún puntaje ROSA en ninguno de los dos lados |
| Cuestionario de ajuste editable | Pendiente de verificar | OK (`JS_Questions.html`, pre-llenado + edición manual) | **Pendiente de verificar** | No se confirmó si `AutoEvaluationPage.tsx` permite al usuario revisar/corregir respuestas individuales antes de calcular el puntaje, o si el cálculo es 100% automático sin paso de revisión. Verificar en una próxima pasada de QA |
| Motor de cálculo ROSA (tablas oficiales) | Implementado | Implementado | **Completa** | Las tres tablas numéricas (silla, pantalla+teléfono, mouse+teclado) de `RosaEngine.ts` diferían de `JS_Rosa.html` en un número significativo de celdas. Apps Script fue confirmado por el usuario como la implementación ya validada contra la fuente oficial (Sonne, Villalta & Andrews, 2012); se alinearon las tres tablas de React a las de Apps Script el 2026-08-24, verificado con un diff programático celda por celda (0 discrepancias). También se corrigió el límite superior de la Tabla A (React permitía una columna 10 que Apps Script no define; ahora ambas tablas coinciden en el dominio 2–9) |
| Escala de nivel de riesgo | OK (4 niveles: Bajo/Medio/Alto/Muy Alto) | OK (4 niveles: Bajo/Medio/Alto/Muy Alto) | **Completa** | Unificada el 2026-08-24 — React usaba antes una escala propia de 5 niveles (Inapreciable/Mejorable/Alto/Muy Alto/Extremo) que no coincidía. Se estandarizó a la escala de Apps Script por decisión del usuario, ver `docs/CHANGELOG.md` |
| Resultados con desglose por sección + recomendaciones | OK | OK | Completa | — |
| Guardar evaluación (`saveEvaluation`) | OK | OK | Completa | Los campos `nombre`/`cedula` que el cliente ya enviaba y el servidor descartaba en silencio ahora se persisten en columnas N/O de `Registros` (corregido 2026-08-24) — **requiere que el usuario agregue esos dos encabezados a la hoja real si ya existía** |
| Guardar datos de entrenamiento (`saveTraining`) | OK | OK | Completa | El campo `respuestas` que enviaba la SPA de Apps Script y se perdía ahora se persiste en una columna nueva de `Entrenamiento` (corregido 2026-08-24) |
| Subir foto a Drive (`uploadPhoto`) | OK | OK | Completa | — |
| Historial personal (`getUserHistory`) | **Faltante** | OK | **Pendiente en React** | Confirmado por búsqueda exhaustiva: React nunca llama esta acción, aunque el backend ya la soporta. Decisión de negocio pendiente: ¿implementarla en React? |
| Análisis de foto vía Gemini (`analyzePhoto`) | **No conectado (a propósito)** | OK | **Pendiente — Fase 9 de este proyecto** | Marcado `TODO: GEMINI_INTEGRATION` en `docs/API_CONTRACT.md` §4. No debe conectarse todavía por regla explícita del proyecto |
| Panel de administración — listado y filtros | OK | OK | Completa | — |
| Panel de administración — gráficas / historial | OK | OK (`JS_Charts.html`: barras, línea, tabla) | **Completa** | Confirmado en vivo contra el backend real (2026-08-24, ver `docs/TEST_PLAN.md` R10/R10a): `AdminDashboard.tsx` sí muestra un historial de puntajes con datos reales, sin usar `recharts` (no está en las dependencias) — implementación propia |
| Exportar CSV | No confirmado | OK | **Probablemente ausente en React** | No se encontró la funcionalidad en la revisión de `AdminDashboard.tsx`; no se implementó como parte de esta fase por no ser prioridad "Alta" en `docs/AUDIT.md` |
| Configuración sin secretos en código (`SPREADSHEET_ID`/`ADMIN_EMAILS`) | N/A (no aplica a React) | OK | Completa | Migrado a `PropertiesService` con compatibilidad hacia atrás el 2026-08-24 |
| Persistencia de sesión | `localStorage` (persiste entre cierres de navegador) | `sessionStorage` (se pierde al cerrar pestaña) | **Divergencia sin resolver** | Comportamiento de UX/seguridad distinto entre clientes, no corregido en esta fase — requiere decisión de negocio sobre cuál es el comportamiento deseado |
| Manejo de errores de render | OK (`ErrorBoundary` agregado a las rutas reales el 2026-08-24) | OK (`App.showFatal`, diagnóstico de instalación) | Completa | Mecanismos distintos pero equivalentes en efecto: ninguno deja al usuario con una pantalla en blanco sin explicación |
| Dependencias de build declaradas correctamente | OK (corregido 2026-08-24: `tailwindcss`/`@tailwindcss/vite` ahora en `Metodo Rosa/package.json`) | N/A (Apps Script no usa npm) | Completa | — |
| Código muerto / arquitectura paralela sin usar | **Presente, sin resolver** | N/A | **Pendiente — decisión del usuario** | Ver `docs/AUDIT.md` §3. No se eliminó en esta fase por no tener autorización explícita |

## Resumen

- **Completa (equivalente en ambos lados):** 15 de 20 filas.
- **Divergencia justificada (documentada, no es un defecto):** 3 filas (análisis de objetos, análisis de pose, ángulo de muñeca).
- **Pendiente de verificar (falta información, no falta trabajo confirmado):** 2 filas (cuestionario editable en React, CSV).
- **Pendiente por decisión de negocio:** 2 filas de decisión pendiente (historial en React, código muerto), 1 fila de divergencia sin resolver (persistencia de sesión).
- **Deliberadamente pendiente por regla del proyecto:** 1 fila (`analyzePhoto`/Gemini en React).
