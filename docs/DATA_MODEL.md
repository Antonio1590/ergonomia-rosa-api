# DATA_MODEL.md — Contrato de datos único de ROSA Expert

Nombres de campo y tipos tal como existen **hoy** en el código real (no
aspiracionales). Cuando React y Apps Script representan el mismo concepto,
deben usar exactamente estos mismos nombres. Las discrepancias ya
encontradas están marcadas explícitamente como tal — no se "corrigen" en
este documento, se documentan para resolverlas en Fase 7/8.

---

## Entidad: Usuario

**Almacenamiento:** hoja de cálculo `Metrica`.
**Identificador:** `cedula` (también funciona como parte de la clave de
login junto con `email`).

| Campo | Tipo | Obligatorio | Valores permitidos | Columna en `Metrica` |
|---|---|---|---|---|
| `cedula` | string numérico | sí | `^\d{6,12}$` | A |
| `email` | string | sí | formato email, dominio de facto `@segurosbolivar.com` (por convención de registro, no forzado por regex en el código auditado) | B |
| `nombre` | string | no (fallback: parte local del email) | libre | C |
| `rol` | enum | no (default `user`) | `user` \| `admin` | D |
| `estado` | enum | no (default `activo`) | `activo` \| `inactivo` (cualquier otro valor se trata como inactivo) | E |
| `fechaRegistro` | string/fecha | no | libre | F |

`esAdmin` **no es un campo persistido** — se calcula en tiempo de login
(`Auth.gs`) como `email ∈ ADMIN_EMAILS ∨ rol === 'admin'`, y se devuelve como
parte de la respuesta de login, no se guarda en la hoja.

---

## Entidad: Evaluación

**Almacenamiento:** hoja de cálculo `Registros`.
**Identificador:** ninguno explícito — cada fila es un evento inmutable,
identificado implícitamente por `(email, fecha)`.

| Campo | Tipo | Columna en `Registros` | Notas |
|---|---|---|---|
| `fecha` | string ISO 8601 | A | default: `new Date().toISOString()` si no se envía |
| `email` | string | B | — |
| `puntajeFinal` | number (1–10) | C | — |
| `nivelRiesgo` | string | D | **Divergencia confirmada de escala** — ver abajo |
| `postura` | string | E | opcional, poco usado en el código auditado |
| `urlImagen` | string (URL de Drive) | F | vacío si no se pudo subir la foto |
| *(derivado)* `detalles` | JSON string | G | `{silla, pantalla, teclado, objetos}` — construido por el servidor a partir de `puntajeSilla`/`puntajePantalla`/`puntajeTeclado`/`objetosDetectados` que envía el cliente (ver abajo) |
| `recomendaciones` | string | H | el servidor acepta array (lo une con `' \| '`) o string ya unido |
| `neck` | number (grados) | I | — |
| `trunk` | number (grados) | J | — |
| `legs` | number (grados) | K | — |
| `arms` | number (grados) | L | — |
| `wrist` | number (grados) | M | **En ambos clientes actuales se envía siempre `0`** — ningún cliente calcula el ángulo de muñeca todavía |

**Campos que el cliente envía pero el servidor descarta silenciosamente:**
`record.nombre` y `record.cedula` — el tipo `EvaluationRecord` de React
(`services/SheetsService.ts`) y el `record` que arma `JS_Analysis.save()` en
Apps Script incluyen ambos campos, pero `handleSaveEvaluation`
(`Sheets.gs`) **no tiene columnas para ellos** en su `appendRow(...)` — se
pierden. `handleGetEvaluations` reconstruye un `nombre` aproximado
haciendo `email.split('@')[0]`, nunca lee el nombre real guardado (porque
nunca se guardó). Esto es una inconsistencia real a resolver: o se agregan
columnas `Nombre`/`Cedula` a la hoja `Registros` y se actualiza
`handleSaveEvaluation`, o se elimina el envío de esos campos desde ambos
clientes para no sugerir que se persisten.

**Campos de entrada al guardar (no columnas propias — se combinan en
`detalles`):** `puntajeSilla`, `puntajePantalla`, `puntajeTeclado`,
`objetosDetectados` (array de labels de objetos detectados). Confirmado con
el mismo nombre en `RosaEngine.ts`/`SheetsService.ts` (React) y
`JS_Analysis.html` (Apps Script) — **esta parte sí tiene paridad exacta de
nombres**.

**⚠️ Discrepancia confirmada — escala de `nivelRiesgo`:**

| Puntaje | Apps Script (`JS_Rosa.html`) | React (`RosaEngine.ts`) |
|---|---|---|
| 1 | Bajo | Inapreciable |
| 2 | Bajo | Mejorable |
| 3–4 | Medio | Mejorable |
| 5 | Alto | Alto |
| 6–7 | Alto | Muy Alto |
| 8 | Muy Alto | Muy Alto |
| 9–10 | Muy Alto | Extremo |

Ambas coinciden en que **5 es el umbral oficial de intervención** del
método ROSA (`requiereIntervencion` / acción "es necesaria la actuación"),
pero usan **4 vs. 5 etiquetas distintas con cortes distintos**. Un mismo
puntaje guardado por un cliente puede mostrarse con una etiqueta de riesgo
diferente si se lee desde el otro. Esto afecta directamente al panel de
administración de Apps Script (`Dashboard.filter`,
`Charts.ORDEN_RIESGO`), que asume las 4 etiquetas propias — si alguna vez
llegara una fila guardada con una etiqueta de las 5 de React (hoy no ocurre,
porque React guarda `rosa.riskLevel` con sus propias 5 etiquetas y Apps
Script lee `nivelRiesgo` tal cual, sin normalizar), el filtro/gráfica de
Apps Script no reconocería el valor. **Se debe unificar la escala como
parte de la Fase 7/8** — es una decisión de negocio (¿cuál de las dos, o
una tercera?), no solo técnica.

---

## Entidad: RegistroEntrenamiento

**Almacenamiento:** hoja `Entrenamiento` (autocreada por `Training.gs` en el
primer guardado).

| Campo | Tipo | Columna | Notas |
|---|---|---|---|
| `fecha` | string ISO | Fecha | — |
| `email` | string | Email | — |
| `neck` | number | Cuello_deg | — |
| `trunk` | number | Tronco_deg | — |
| `leftKnee` | number | RodillaIzq_deg | — |
| `rightKnee` | number | RodillaDer_deg | Ambos clientes auditados envían `0` — no se distingue rodilla izq/der en el análisis actual, solo un valor genérico de "rodilla" |
| `leftElbow` | number | CodoIzq_deg | — |
| `rightElbow` | number | CodoDer_deg | Igual que rodilla: sin distinción izq/der hoy |
| `leftShoulder` | number | HombroIzq_deg | Apps Script (`JS_Analysis.save()`) envía `0` explícitamente; en React, `AngleCalculator.ts` nunca calcula este valor (bug confirmado, ver `docs/AUDIT.md` §2.3) |
| `rightShoulder` | number | HombroDer_deg | Igual que `leftShoulder` |
| `puntajeFinal` | number | PuntajeFinal | — |
| `nivelRiesgo` | string | NivelRiesgo | Mismo problema de escala que en Evaluación |
| `detecciones` | JSON string | Detecciones_JSON | Lista de objetos detectados |
| `numFotos` | number | NumFotos | Siempre `1` en el código auditado (no hay flujo de múltiples fotos por evaluación) |
| `monitorScore` | number | MonitorScore | **Apps Script (`JS_Analysis.save()`) no lo envía nunca** (queda en su default `0` del lado servidor); el tipo `TrainingRecord` de React sí lo contempla — confirmar en Fase 7 si React realmente lo puebla con un valor útil |
| `deskHighStatus` | string | EscritorioAlto | Mismo caso: Apps Script no lo envía (default `'unknown'`) |
| `phoneNearNeck` | boolean → `'SI'`/`'NO'` | TelefonoEntreHombro | Mismo caso: Apps Script no lo envía (default `false` → `'NO'`) |
| `revisadoPorExperto` | string | RevisadoPorExperto | Siempre vacío al guardar — se completa manualmente por un experto directamente en la hoja, fuera de la app |
| `correcciones` | string | Correcciones | Igual que `revisadoPorExperto` |

Nota: Apps Script's propio cliente interno (`JS_Analysis.html`) envía
además un campo `respuestas` (JSON de las respuestas del cuestionario) que
`handleSaveTraining` **no tiene columna para y por tanto ignora** — no es un
error (el guardado de entrenamiento es best-effort, ver
`docs/PROJECT_SPEC.md` §5), pero es una pérdida de información silenciosa
que podría ser valiosa para el reentrenamiento de modelos.

---

## Estados

- `Usuario.estado`: `activo` | `inactivo` (cualquier otro valor no vacío se
  trata como inactivo por el `!== 'activo'` de `Auth.gs`).
- `Usuario.rol`: `user` | `admin`.
- `Evaluación.nivelRiesgo`: ver discrepancia de escala arriba — **pendiente
  de unificación**, no se define aquí como enum cerrado hasta que se decida.
- Sesión de cliente: autenticado / no autenticado (sin estados intermedios
  como "expirado" — ni `localStorage` en React ni `sessionStorage` en Apps
  Script implementan expiración explícita, solo se borra al hacer logout
  manual o al cerrarse el navegador en el caso de `sessionStorage`).

## Validaciones (resumen, detalle en `PROJECT_SPEC.md` §11)

- `cedula`: `^\d{6,12}$`.
- `email`: debe existir tal cual (case-insensitive, se compara en
  minúsculas) en la hoja `Metrica` junto con la cédula.
- Imagen: tipo MIME `image/*`.
- `personaDetectada` (solo aplica al flujo con Gemini de Apps Script): si es
  `false`, no se completa el análisis — se exige repetir la foto.

## Relaciones

- `Evaluación.email` → `Usuario.email` (relación lógica, no hay integridad
  referencial real: Sheets no impide guardar una evaluación con un email
  que no exista en `Metrica`).
- `RegistroEntrenamiento.email` → `Usuario.email` (misma relación lógica,
  mismo sin-integridad-referencial).
- No existe relación explícita entre `Evaluación` y `RegistroEntrenamiento`
  más allá de compartir `email` + `fecha` aproximada — no hay un ID común
  que las vincule formalmente.
