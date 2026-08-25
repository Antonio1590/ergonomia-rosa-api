# ROSA Expert — Instalación en Apps Script

Esta guía refleja la arquitectura **actual**: Apps Script analiza la foto
con **Gemini** en el servidor (no usa YOLO ni MediaPipe del lado Apps
Script — eso es exclusivo del cliente React). No se necesita ningún
hosting externo (Netlify u otro) para desplegar Apps Script: los modelos
YOLO/wasm del proyecto pertenecen únicamente a `Metodo Rosa/` (React) y se
sirven desde donde se despliegue esa app (ver `README.md` raíz, sección
"Desplegar en producción").

## Paso 1 · Crear el proyecto de Apps Script

1. Abre [script.google.com](https://script.google.com) → **Nuevo proyecto**.
2. Borra el contenido por defecto de `Code.gs`.

## Paso 2 · Crear los archivos

Para cada archivo `.gs`: clic en **+ Archivo → Script**, nombra el archivo
exactamente igual (sin la extensión `.gs`), pega el contenido.
Para cada archivo `.html`: clic en **+ Archivo → HTML**, mismo criterio
(sin la extensión `.html`).

**Scripts (.gs) — 6 archivos:**
- `Code` ← `Code.gs` (router, `doGet`/`doPost`/`rpcHandler`, config de
  `SPREADSHEET_ID`/`ADMIN_EMAILS`)
- `Auth` ← `Auth.gs` (login)
- `Sheets` ← `Sheets.gs` (CRUD de evaluaciones y usuarios)
- `Drive` ← `Drive.gs` (subida de fotos)
- `Training` ← `Training.gs` (datos para reentrenamiento de modelos)
- `Gemini` ← `Gemini.gs` (análisis de foto con IA — **no lo omitas**, sin
  este archivo `analyzePhoto` falla)

**HTML — 21 archivos:**
- `Index` (shell de la SPA)
- `CSS_Base`, `CSS_Components`
- `Page_Login`, `Page_Guide`, `Page_Questions`, `Page_Results`,
  `Page_History`, `Page_Dashboard`
- `JS_State`, `JS_Api`, `JS_Rosa`, `JS_Analysis`, `JS_Quality`,
  `JS_Questions`, `JS_Guide`, `JS_Charts`, `JS_History`, `JS_Dashboard`,
  `JS_Init`
- `Photos` (fotos de guía embebidas en base64)

Confirma la lista completa contra lo que exista realmente en la carpeta
`AppsScript/` en el momento de instalar — este documento puede quedar
desactualizado si se agregan o renombran archivos después (ya ocurrió una
vez: esta misma guía listaba `JS_Yolo.html`/`JS_Pose.html`, de una versión
anterior de la arquitectura que ya no existe).

## Paso 3 · Configurar la hoja de cálculo

Ver `README.md` (raíz), sección "Configurar Google Sheets", para los
nombres de hoja y columnas reales (`Metrica` y `Registros` — **no**
`Usuarios`/`Evaluaciones`).

## Paso 4 · Configurar el proyecto (Spreadsheet ID, administradores, Gemini)

Todo se guarda en **Propiedades de la secuencia de comandos**
(`PropertiesService`), nunca en el código fuente:

1. En el editor, selecciona la función `configurarProyecto` (en `Code.gs`)
   y ejecútala una vez pasando tu spreadsheet ID y la lista de correos
   admin, por ejemplo desde la consola de ejecución:
   ```javascript
   configurarProyecto(
     "TU_SPREADSHEET_ID",
     ["tu.correo@segurosbolivar.com", "otro.admin@segurosbolivar.com"]
   );
   ```
   Si no ejecutas este paso, el proyecto sigue funcionando con los valores
   por defecto hardcodeados en `Code.gs` (compatibilidad con despliegues
   existentes) — pero se recomienda migrar.
2. Selecciona la función `guardarClaveGemini` (en `Gemini.gs`) y ejecútala
   una vez con tu clave de la API de Gemini:
   ```javascript
   guardarClaveGemini("TU_CLAVE_DE_GEMINI");
   ```
3. Autoriza los permisos que se pidan la primera vez que ejecutes cualquiera
   de estas dos funciones.

## Paso 5 · Autorizar Drive

1. En el editor, selecciona la función `autorizarDrive` (en `Drive.gs`).
2. Clic en **Ejecutar** y autoriza los permisos.

## Paso 6 · Desplegar

1. **Implementar → Nueva implementación**.
2. Configurar:
   - **Tipo:** Aplicación web
   - **Ejecutar como:** Yo (tu cuenta Google)
   - **Quién accede:** Cualquier usuario (Anyone)
3. Clic en **Implementar**, autoriza si se solicita.
4. Copia la **URL de la aplicación web** (`.../exec`) — esa es la URL que
   va en `VITE_APPS_SCRIPT_URL` para el cliente React (ver `Metodo
   Rosa/.env.example`).

Para desplegar cambios posteriores sin cambiar la URL:
**Implementar → Administrar implementaciones → editar (lápiz) → Versión:
Nueva versión → Implementar.** Nunca uses "Nueva implementación" para una
actualización — eso genera una URL distinta y deja la anterior fuera de
servicio.

## Verificar que funciona

Abre la URL de despliegue directamente en el navegador — debe cargar la
SPA completa (pantalla de login). Para probar el endpoint REST que usa
React, un `POST` a esa misma URL con
`{"action":"login","email":"...","cedula":"..."}` debe responder
`{"ok":true,"data":{...}}` o `{"ok":false,"error":"..."}`.
