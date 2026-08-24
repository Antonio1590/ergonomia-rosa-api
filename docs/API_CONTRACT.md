# API_CONTRACT.md — Contrato de integraciones de ROSA Expert

Este documento define las interfaces entre los componentes del sistema.
**Gemini NO está conectado en React todavía y no debe conectarse en este
documento ni en código como parte de esta fase** — se deja únicamente el
contrato preparado, marcado `TODO: GEMINI_INTEGRATION`, tal como exige este
proyecto. En Apps Script, Gemini **ya estaba conectado antes de esta
auditoría** (no es trabajo nuevo) y se documenta aquí solo para que ambos
lados compartan un contrato conceptual coherente.

---

## 1. Contrato de transporte: React ↔ Apps Script

**Endpoint:** `VITE_APPS_SCRIPT_URL` (Apps Script Web App desplegado),
método `doPost`.

**Request:**
```
POST {VITE_APPS_SCRIPT_URL}
Content-Type: text/plain
Body: JSON.stringify({ action: string, ...payload })
```
(`Content-Type: text/plain` es intencional — evita el preflight CORS que
`application/json` dispararía contra Apps Script, que no responde
preflights OPTIONS. No cambiar sin verificar CORS.)

**Response (siempre, para toda acción):**
```ts
interface RpcResponse<T> {
  ok: boolean;
  data?: T;
  error?: string; // mensaje en español, listo para mostrar al usuario
}
```

La SPA interna de Apps Script usa el mismo `rpcHandler`, pero por
`google.script.run` en vez de HTTP:
```js
google.script.run
  .withSuccessHandler(resolve)
  .withFailureHandler(reject)
  .rpcHandler(params);
```

---

## 2. Acciones soportadas (`rpcHandler`)

| Acción | Payload | `data` de respuesta | Implementado en React | Implementado en SPA Apps Script |
|---|---|---|---|---|
| `login` | `{email, cedula}` | `AppUser` (§ DATA_MODEL) | ✅ | ✅ |
| `saveEvaluation` | `{record: EvaluationRecord}` | `{}` (solo `ok`) | ✅ | ✅ |
| `getEvaluations` | — | `EvaluationRecord[]` | ✅ (panel admin) | ✅ (panel admin) |
| `getUserHistory` | `{email}` | `EvaluationRecord[]` filtrado y ordenado por fecha | ❌ **no implementado** | ✅ |
| `getUsers` | — | `Usuario[]` | ✅ | — (no visto en SPA) |
| `saveTraining` | `{record: TrainingRecord}` | `{}` | ✅ | ✅ |
| `uploadPhoto` | `{email, nombreArchivo, mimeType, base64}` | `{fileId, url, nombre}` | ✅ | ✅ |
| `analyzePhoto` | `{mimeType, base64}` | `AIResult` (ver §4) | ❌ **no implementado (a propósito, Fase 9)** | ✅ |

Todas las acciones son síncronas desde la perspectiva del cliente (una
petición, una respuesta) — no hay webhooks ni callbacks asíncronos.

---

## 3. Errores

No hay un código de error estructurado — `error` es siempre un string en
español ya listo para mostrarse al usuario (ej. `"Cédula inválida (debe
tener entre 6 y 12 dígitos)"`, `"No autorizado..."`, `"Hoja 'Registros' no
encontrada"`). Los clientes no deben intentar parsear el string para
lógica de negocio; deben tratarlo como texto de presentación. Si en el
futuro se necesita lógica condicional sobre el tipo de error, este contrato
tendría que extenderse con un campo `code` — no existe hoy.

---

## 4. Interfaz conceptual: servicio de IA (`AIService`)

Esta es la interfaz **objetivo compartida** que ambas implementaciones
deberían exponer conceptualmente para "analizar una foto de puesto de
trabajo", independientemente de qué motor la resuelva por debajo (Gemini,
o YOLO+MediaPipe local). Sirve como contrato de referencia para que, si en
el futuro se decide unificar el enfoque, el punto de entrada ya esté
diseñado de forma compatible con ambos.

```ts
// Contrato conceptual — no es un archivo real todavía.
// React: se implementaría en src/services/ (ej. AIService.ts)
// Apps Script: ya implementado de forma equivalente en Gemini.gs (handleAnalyzePhoto)

interface AIAnalysisInput {
  mimeType: string;   // "image/jpeg" | "image/png"
  base64: string;      // imagen codificada en base64, sin el prefijo data:
}

interface AIAnalysisResult {
  personaDetectada: boolean;
  encuadre: {
    esPerfil: boolean;
    cuerpoCompleto: boolean;
    iluminacionSuficiente: boolean;
    observacion?: string;
  };
  respuestas: Partial<RosaQuestionnaireAnswers>; // ver PROJECT_SPEC §8.3 / JS_Rosa POR_DEFECTO
  angulos?: { cuello?: number; tronco?: number; rodilla?: number; codo?: number };
  objetos: Array<{ clase: string; x: number; y: number; w: number; h: number }>; // escala 0-1000
  puntos: Array<{ nombre: string; x: number; y: number }>; // escala 0-1000
}

interface AIService {
  analyze(input: AIAnalysisInput): Promise<AIAnalysisResult>;
}
```

Esta forma **ya coincide** con lo que devuelve `Gemini.gs` en Apps Script
hoy (mismo `esquemaRosa_()`), así que si React llega a consumir
`analyzePhoto` no necesitaría transformar la forma de los datos — solo
llamar la acción y adaptar el resultado al mismo pipeline que hoy alimentan
`YoloService`/`PoseService` combinados.

### 4.1 Dónde queda el punto de integración

- **React**: `TODO: GEMINI_INTEGRATION` en `src/services/SheetsService.ts`
  (agregar el método `analyzePhoto`, siguiendo el patrón exacto de
  `uploadPhoto`) y en `src/pages/AutoEvaluationPage.tsx` (punto donde hoy se
  invoca el análisis local, como alternativa u opción futura — ver nota de
  producto en `docs/ARCHITECTURE.md`).
- **Apps Script**: ya resuelto en `AppsScript/Gemini.gs`. Si se necesitara
  un segundo proveedor de IA en el futuro, el patrón a replicar es el mismo
  `obtenerClaveGemini_()` + `PropertiesService` que ya usa.

### 4.2 Estructura de input / output (recordatorio)
Ver interfaces arriba — `AIAnalysisInput` / `AIAnalysisResult`. Idénticas
conceptualmente a las que ya usa `Gemini.gs` vía `esquemaRosa_()`.

### 4.3 Manejo de errores
Debe seguir el mismo patrón `{ok, error}` del resto del contrato RPC (§1).
Apps Script ya clasifica errores por código HTTP de la API de Gemini
(400/403/404/429, ver `Gemini.gs:266-287`) — cualquier implementación futura
en React debería replicar categorías de error equivalentes si llama
directamente a un proveedor de IA (poco probable — lo más consistente con
la arquitectura actual es que React siga llamando `analyzePhoto` a través
de Apps Script, nunca directo al proveedor, para no exponer la clave en el
navegador — mismo principio que ya sigue Apps Script hoy).

### 4.4 Timeout
No hay timeout explícito configurado en el código actual de `Gemini.gs`
(`UrlFetchApp.fetch` sin `deadline` — Apps Script impone un límite duro de
ejecución de 6 minutos por invocación, que actúa como timeout implícito).
Si se implementa un timeout explícito, debe ser razonable para una llamada
de análisis de imagen (recomendado: 20–30s con reintento único), y debe
devolver un error `{ok:false, error:"..."}` consistente con el resto del
contrato, no dejar la promesa colgada indefinidamente.

### 4.5 Validación
- `base64` no vacío (ya validado en `handleAnalyzePhoto`).
- `mimeType` debe ser un tipo de imagen soportado por el proveedor.
- La clave del proveedor debe existir antes de intentar la llamada
  (`obtenerClaveGemini_()` ya lanza un error claro si falta).

### 4.6 Mecanismo de almacenamiento del secreto
- **Apps Script (ya implementado)**: `PropertiesService.getScriptProperties()`,
  propiedad `GEMINI_API_KEY`. Nunca en código fuente. Correcto, no cambiar.
- **React (si algún día necesitara una clave propia — hoy no la necesita
  porque no debe llamar a Gemini directo desde el navegador)**: variable de
  entorno de build (`VITE_*`) **nunca es apropiado para un secreto real**,
  porque queda embebida en el bundle público. Si React necesitara mediar
  una llamada a un proveedor de IA, el patrón correcto es siempre a través
  de un backend (Apps Script) que guarde la clave server-side, exactamente
  como ya lo hace hoy — no se propone ningún cambio a este patrón.

### 4.7 Servicio mock/stub para poder ejecutar y probar sin Gemini
El sistema ya puede ejecutarse por completo sin Gemini: React nunca lo
llama (usa YOLO+MediaPipe local), y Apps Script solo lo invoca cuando el
usuario usa la SPA interna con `analyzePhoto` — si `GEMINI_API_KEY` no está
configurada, `obtenerClaveGemini_()` lanza un error claro y controlado en
vez de fallar de forma opaca. No se requiere ningún mock adicional hoy. Si
en el futuro se agrega `analyzePhoto` a React y se quiere probar sin
consumir cuota real de Gemini, el mock recomendado es un servicio con la
misma forma de `AIService` (§4) que devuelva un `AIAnalysisResult` fijo de
prueba — no se implementa en esta fase.

---

## 5. Reglas explícitas de esta fase (no negociables)

- **NO conectar Gemini en React todavía.**
- **NO agregar una API key real a ningún archivo, ni siquiera de ejemplo.**
- **NO hardcodear secretos ni "secretos falsos que parezcan reales".**
- El sistema debe poder instalarse y ejecutarse completo sin ninguna clave
  de Gemini configurada (ya es el caso hoy, ver §4.7).
