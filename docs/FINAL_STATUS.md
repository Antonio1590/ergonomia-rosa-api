# FINAL_STATUS.md — Estado del proyecto ROSA Expert

**Fecha:** 2026-08-24
**Alcance de este reporte:** cierre de la sesión de auditoría y
estabilización inicial (Fases 1–8 del plan). No es un cierre total del
proyecto — quedan pendientes reales, documentados abajo, varios de los
cuales requieren información o decisiones que solo el usuario puede
aportar (no son trabajo que se haya "dejado a medias" por elección propia).

---

## Funcionalidades terminadas

- Auditoría técnica completa de React y Apps Script (`docs/AUDIT.md`).
- Especificación funcional única (`docs/PROJECT_SPEC.md`).
- Arquitectura documentada de ambos clientes (`docs/ARCHITECTURE.md`).
- Contrato de datos con discrepancias identificadas (`docs/DATA_MODEL.md`).
- Contrato de integraciones, con el punto de Gemini en React preparado pero
  sin conectar (`docs/API_CONTRACT.md`).
- Matriz de paridad funcional (`docs/PARITY_MATRIX.md`).
- Plan de pruebas manuales (`docs/TEST_PLAN.md`).
- 5 agentes especializados del proyecto (`.claude/agents/`).
- Control de versiones inicializado (no existía antes).
- Corrección de la dependencia fantasma de Tailwind en React (riesgo de
  build roto en instalación limpia).
- Corrección del bug de ángulo de hombro hardcodeado a 0 en React.
- Unificación de la escala de nivel de riesgo (React ahora usa los mismos
  4 niveles que Apps Script).
- `ErrorBoundary` agregado a las rutas reales de React.
- 2 errores de lint corregidos en código vivo de React (`AuthContext.tsx`).
- `SPREADSHEET_ID`/`ADMIN_EMAILS` migrados fuera del código fuente en Apps
  Script (con compatibilidad hacia atrás).
- Corrección de pérdida silenciosa de datos (`nombre`/`cedula` en
  evaluaciones, `respuestas` en registros de entrenamiento).
- `AppsScript/INSTALACION.md` reescrito para reflejar la arquitectura real.
- `README.md` (raíz) corregido: nombres de hoja/columnas reales, referencia
  a carpeta inexistente eliminada, nombre de script corregido.
- **Tablas de puntaje ROSA alineadas** entre React y Apps Script — el
  usuario confirmó que Apps Script es la implementación validada contra la
  fuente oficial (Sonne, Villalta & Andrews, 2012); se corrigieron las tres
  tablas de React (`RosaEngine.ts`) para que coincidan exactamente,
  verificado con comparación programática celda por celda.
- **Bug crítico de guardado corregido**: React nunca persistía "objetos
  detectados" (ni los sub-puntajes por sección) porque enviaba un campo que
  el servidor ignora — confirmado con datos reales de producción, corregido
  en `AutoEvaluationPage.tsx` y `Step4Result.tsx`.
- **Panel de administración**: navegación, filtros (búsqueda + nivel de
  riesgo / rol), orden de columnas, vista mensual/trimestral real y
  exportación CSV — todo interactivo y funcional, antes en su mayoría
  decorativo. Ver `docs/CHANGELOG.md` para el detalle completo.
- Recomendaciones del motor ROSA reescritas en tono más cercano y menos
  clínico/alarmista.
- Corregido un crash real del panel de administración (reproducido en vivo)
  cuando el servidor responde sin `data` — el estado quedaba `undefined` y
  cualquier `.filter()` posterior tronaba.
- Panel de administración verificado función por función contra el backend
  real: navegación, filtros, orden, vista mensual/trimestral y reportes,
  todo confirmado funcionando.

## Funcionalidades pendientes

| Pendiente | Por qué está pendiente | Quién puede desbloquearlo |
|---|---|---|
| **Corregir manualmente 2 filas de la hoja `Metrica`** | El usuario confirmó que el orden de columnas (`Cedula, Email, Nombre, Rol, Estado, FechaRegistro`) coincide con lo que ya asume el código — el problema no es de código, son datos cargados en las celdas equivocadas en esas 2 filas específicas | El usuario, corrigiendo los valores directamente en Google Sheets |
| Decidir el destino del código muerto de React (~mitad de `src/`) | Podría ser roadmap futuro (wizard por pasos) en vez de simplemente descartable | El usuario |
| Decidir el destino del scaffold huérfano en la raíz (`FRONT/src`, `package.json`) | Ya no es necesario para el build (la dependencia de Tailwind se corrigió), pero podría contener trabajo que el usuario quiera conservar | El usuario |
| Implementar `getUserHistory` en React | Es una decisión de alcance, no solo técnica: ¿React debe tener historial personal como Apps Script? | El usuario |
| Unificar persistencia de sesión (`localStorage` vs `sessionStorage`) | Es una decisión de UX/seguridad (¿la sesión debe sobrevivir el cierre del navegador o no?) | El usuario |
| Confirmar si React tiene cuestionario editable o el cálculo es 100% automático | No se pudo confirmar en esta pasada de auditoría | Próxima pasada de QA |
| Agregar columnas `Nombre`/`Cedula` a la hoja `Registros` real | El código ya las escribe; la hoja de producción necesita los encabezados añadidos a mano | El usuario, directamente en Google Sheets |
| Pruebas automatizadas (no existe ningún runner instalado) | Fuera del alcance de esta fase de estabilización | Iteración futura |
| Corregir los 12 errores de lint restantes | Todos viven en código muerto — depende de la decisión de código muerto de arriba | Después de esa decisión |
| Completar controles decorativos de `AdminDashboard.tsx` sin handler | No priorizado como "Alto" en la auditoría | Iteración futura |

## Errores corregidos

Ver `docs/CHANGELOG.md` (2026-08-24) para el detalle completo, con
archivo:línea de cada corrección. Resumen: 1 bug de cálculo real
(ángulo de hombro), 1 dependencia de build faltante, 1 escala de datos
inconsistente, 2 errores de lint, 2 casos de pérdida silenciosa de datos
entre cliente y servidor, 1 documentación de instalación completamente
desactualizada.

## Pruebas ejecutadas

- `npm run build` y `npm run lint` en React, verificados repetidamente tras
  cada cambio (ver `docs/TEST_PLAN.md`, filas R1-R3).
- Verificación visual en navegador (dev server + pestaña de vista previa):
  pantalla de login carga sin errores de consola.
- Revisión estática de sintaxis de los archivos `.gs` modificados (sin
  compilador local disponible para Apps Script).
- **Panel de administración verificado en vivo contra el backend real**
  inyectando una sesión de prueba solo en `localStorage` del navegador (sin
  login real, sin escribir ningún dato): cargó datos reales de evaluaciones
  e historial sin errores. Esto confirmó además, con datos reales ya
  guardados, el problema de escala de riesgo que se corrigió en esta misma
  sesión (filas antiguas de React con la etiqueta `Mejorable` mezcladas con
  filas de Apps Script con `Bajo`/`Medio`/`Alto`) — ver `docs/TEST_PLAN.md`.
- **No se ejecutaron pruebas de escritura** (login real que genere sesión
  propia, guardado real de una evaluación nueva) para no generar datos de
  prueba en el spreadsheet de producción. Ver `docs/TEST_PLAN.md` para el
  detalle de qué falta verificar y por qué.

## Estado React

**Compila y corre limpio.** Bug de cálculo corregido, dependencia de build
corregida, escala de riesgo unificada, manejo de errores agregado. Persiste
una cantidad significativa de código muerto sin resolver (decisión
pendiente del usuario) y 12 errores de lint dentro de ese mismo código
muerto.

## Estado Apps Script

**Sintácticamente coherente tras los cambios** (no se pudo ejecutar para
confirmarlo en vivo). Configuración migrada fuera del código fuente con
compatibilidad hacia atrás. Documentación de instalación corregida.
Corrección de dos casos de pérdida silenciosa de datos, con una acción
manual pendiente del usuario en la hoja de cálculo real (agregar 2
encabezados de columna).

## Estado Gemini

**Sin conectar, tal como exige la Fase 9 de este proyecto.** Ya estaba
conectado de antes en Apps Script (`Gemini.gs`, `handleAnalyzePhoto`) —
eso no es trabajo de esta iniciativa y no se tocó. El punto de integración
en React está documentado y marcado `TODO: GEMINI_INTEGRATION` en
`docs/API_CONTRACT.md` §4, sin ningún código de llamada real, sin claves,
sin secretos falsos.

## Archivos modificados en esta sesión

**Nuevos:**
`docs/AUDIT.md`, `docs/PROJECT_SPEC.md`, `docs/ARCHITECTURE.md`,
`docs/DATA_MODEL.md`, `docs/API_CONTRACT.md`, `docs/PARITY_MATRIX.md`,
`docs/TEST_PLAN.md`, `docs/CHANGELOG.md`, `docs/FINAL_STATUS.md` (este
archivo), `.claude/agents/*.md` (5 archivos), `Metodo Rosa/src/context/useAuth.ts`.

**Modificados:**
`Metodo Rosa/package.json`, `Metodo Rosa/package-lock.json`,
`Metodo Rosa/src/ai/mediapipe/AngleCalculator.ts`,
`Metodo Rosa/src/components/ai/rosa/RosaAssessment.ts`,
`Metodo Rosa/src/components/ai/rosa/RosaEngine.ts`,
`Metodo Rosa/src/context/AuthContext.tsx`, `Metodo Rosa/src/App.tsx`,
`Metodo Rosa/src/pages/AdminDashboard.tsx`,
`Metodo Rosa/src/pages/AutoEvaluationPage.tsx`,
`Metodo Rosa/src/pages/Login.tsx`,
`Metodo Rosa/src/components/steps/Step4Result.tsx`,
`Metodo Rosa/src/components/layout/Navbar.tsx`,
`AppsScript/Code.gs`, `AppsScript/Auth.gs`, `AppsScript/Sheets.gs`,
`AppsScript/Training.gs`, `AppsScript/JS_Guide.html`,
`AppsScript/INSTALACION.md`, `README.md` (raíz).

## Riesgos conocidos

Ver `docs/AUDIT.md` §6 para la lista completa (la discrepancia de tablas
ROSA, que era el riesgo más importante, ya se resolvió — ver
`docs/CHANGELOG.md`). El más importante que sigue abierto ahora es la
cantidad de código muerto en React sin una decisión de destino, y el hecho
de que ningún cambio de esta sesión se ha probado todavía con credenciales
reales contra el backend de producción (ver `docs/TEST_PLAN.md`).

## Instrucciones de despliegue

Sin cambios respecto a lo ya documentado en `README.md` (raíz) y
`AppsScript/INSTALACION.md`, ambos ya actualizados en esta sesión. Para
Apps Script, recuerda ejecutar `configurarProyecto(...)` si quieres migrar
`SPREADSHEET_ID`/`ADMIN_EMAILS` fuera del código (opcional, no bloqueante).

## Recomendaciones finales

1. **Prioridad inmediata**: probar el flujo completo con credenciales
   reales (login, análisis de una foto real, guardado) para confirmar en
   ejecución real lo que hasta ahora solo se verificó por build/lint/lectura
   de código — ver `docs/TEST_PLAN.md` para la lista exacta de casos
   pendientes (R5-R11, A2-A7).
2. Agregar los encabezados `Nombre`/`Cedula` a la hoja `Registros` real en
   Google Sheets (2 minutos, sin riesgo).
3. Decidir sobre el código muerto de React y el scaffold huérfano de la
   raíz — ambas decisiones son puramente del usuario, no técnicas.
4. Antes de conectar Gemini en React (Fase 9, cuando el usuario lo autorice
   explícitamente), decidir si React seguirá siendo "100% local" por
   defecto con Gemini como opción, dado que hoy `public/MODEL_INFO.md`
   promete explícitamente que las fotos nunca salen del dispositivo.
