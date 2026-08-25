# TEST_PLAN.md — Plan de pruebas manuales

No existe ningún runner de pruebas automatizadas instalado en el proyecto
(ver `docs/AUDIT.md` §3) — este plan es 100% manual. Basado en el flujo
principal y alternativo de `docs/PROJECT_SPEC.md` §4-5.

Leyenda de estado: ✅ Pasa · ❌ Falla · ⏳ No verificable en este entorno
(y por qué) · 🆕 Verificado en esta sesión.

## React (`Metodo Rosa/`)

| # | Caso de prueba | Estado | Notas |
|---|---|---|---|
| R1 | `npm run build` termina sin errores | 🆕 ✅ | Verificado repetidamente tras cada cambio de esta fase |
| R2 | `npm run lint` no tiene errores nuevos respecto a `docs/AUDIT.md` | 🆕 ✅ | 12 errores + 1 advertencia, todos preexistentes en código muerto (antes 14+1); los 2 de `AuthContext.tsx` se corrigieron |
| R3 | `npm run dev` arranca sin errores en consola | 🆕 ✅ | Vite listo en ~1.5s, sin errores |
| R4 | La pantalla de login carga con los campos correctos | 🆕 ✅ | Verificado visualmente en navegador — cédula, correo, aviso de privacidad de fotos |
| R5 | Login con cédula/correo válidos entra a la app | ⏳ | Requeriría credenciales reales registradas en la hoja `Metrica` de producción — no se probó para no generar ruido en datos reales. **Pendiente de que el usuario lo confirme con su propio usuario** |
| R6 | Login con cédula/correo inválidos muestra error | ⏳ | Mismo motivo que R5 |
| R7 | Captura/subida de foto y análisis (YOLO + MediaPipe) | ⏳ | Requiere una foto real de una persona sentada; no se ejecutó en este entorno |
| R8 | Cálculo de puntaje ROSA se muestra con la etiqueta de riesgo correcta (Bajo/Medio/Alto/Muy Alto) | 🆕 ✅ (parcial) | Verificado por lectura de código tras el cambio de escala — no se ejecutó el flujo completo con una foto real |
| R9 | Guardado de evaluación llega a Apps Script | ⏳ | Requiere sesión real + backend en producción; no ejecutado para no escribir datos de prueba en la hoja real |
| R10 | Panel de administración carga el listado | ⏳ | Requiere sesión de un usuario `admin` real |
| R11 | Ruta `/admin` redirige a un usuario no-admin | No verificado | Revisar en una próxima pasada — lógica presente en `App.tsx`, no ejecutada end-to-end |
| R12 | Una excepción de render no deja pantalla en blanco | No verificado | `ErrorBoundary` agregado a las rutas (`App.tsx`), no se forzó una excepción real para confirmar la UI de fallback |

## Apps Script (`AppsScript/`)

No hay forma de ejecutar Apps Script localmente — solo se pudo hacer
revisión estática de sintaxis y consistencia (ver `docs/AUDIT.md`
metodología). Ninguna fila de esta tabla se pudo verificar en ejecución
real en esta sesión.

| # | Caso de prueba | Estado | Notas |
|---|---|---|---|
| A1 | Sintaxis de `Code.gs`, `Sheets.gs`, `Training.gs`, `Auth.gs` tras los cambios | 🆕 ✅ (revisión manual) | Releídos completos tras cada edición — llaves/paréntesis balanceados, estilo consistente con el resto del archivo. No hay compilador local para Apps Script que lo confirme de forma automática |
| A2 | `configurarProyecto()` guarda `SPREADSHEET_ID`/`ADMIN_EMAILS` en `PropertiesService` | ⏳ | Requiere ejecutarse desde el editor de script.google.com — no accesible desde este entorno |
| A3 | `handleLogin` sigue funcionando igual que antes (con `getAdminEmails()` en vez del array global) | ⏳ | Mismo motivo — el cambio es funcionalmente equivalente al original cuando no hay propiedad configurada (fallback), pero no se ejecutó |
| A4 | `handleSaveEvaluation` guarda `nombre`/`cedula` en las columnas N/O | ⏳ | Requiere una hoja de cálculo real con esas columnas de encabezado agregadas manualmente |
| A5 | `handleSaveTraining` guarda `respuestas` en la columna nueva | ⏳ | Mismo motivo, y solo aplica a una hoja `Entrenamiento` creada desde cero |
| A6 | `JS_Init.html`'s `revisarInstalacion()` sigue encontrando todas las pantallas/módulos | No afectado | No se agregaron ni renombraron archivos `Page_*`/`JS_*`, solo se quitó una variable sin uso en `JS_Guide.html` |
| A7 | El endpoint `doPost` sigue respondiendo `{ok,data,error}` para cada acción | ⏳ | Requiere una implementación desplegada real |

## Regresiones detectadas en esta sesión (y corregidas antes de continuar)

- Al mover `useAuth` a un archivo separado, el dev server de Vite quedó con
  el grafo de módulos en caché y la app crasheó con
  `does not provide an export named 'useAuth'` — se resolvió con una
  recarga forzada del navegador; **no era un problema del código**, sino
  del caché de HMR del propio Vite durante la sesión de edición en vivo.
  Confirmado limpio en una pestaña nueva sin historial de consola.

## Pendiente para la próxima pasada de QA

- Ejecutar R5–R11 con credenciales reales (idealmente en un entorno de
  prueba separado del spreadsheet de producción, para no ensuciar datos
  reales).
- Verificar si `AutoEvaluationPage.tsx` tiene un paso de cuestionario
  editable o si el cálculo es 100% automático (pendiente en
  `docs/PARITY_MATRIX.md`).
- Confirmar si el panel de administración de React tiene gráficas o esa
  parte quedó incompleta.
