# ROSA Expert — Instalación en Apps Script

## Paso 1 · Subir assets a Netlify (modelos de IA)

Apps Script no puede servir archivos binarios grandes, por eso el modelo YOLO
y las fotos de guía siguen en Netlify. Solo necesitas hacer esto UNA vez.

1. Abre **app.netlify.com** → tu sitio `famous-tartufo-04dba5`
2. Ve a la pestaña **Deploys**
3. Arrastra la **carpeta** `Metodo Rosa/dist/` al área "Drag and drop your site folder here"
   - Arrastra la CARPETA, no un .zip
   - Esto reemplaza el despliegue roto anterior

Los archivos que usa la app desde Netlify:
- `best.onnx` — modelo YOLO
- `postura-lateral.jpg` / `puesto-trabajo.jpg` — fotos de guía
- Archivos `.wasm` y `.mjs` — runtime de IA (si los CDN fallan)

---

## Paso 2 · Crear archivos en Apps Script

1. Abre tu proyecto Apps Script:
   `https://script.google.com`

2. Elimina o reemplaza el contenido del `Code.gs` existente con el nuevo.

3. Para cada archivo `.gs` adicional (Auth, Sheets, Drive, Training):
   - Clic en **+ Archivo → Script**
   - Nombre el archivo exactamente como se indica (sin extensión .gs)
   - Pega el contenido

4. Para cada archivo `.html` (Index, CSS_*, JS_*, Page_*):
   - Clic en **+ Archivo → HTML**
   - Nombre el archivo exactamente como se indica (sin extensión .html)
   - Pega el contenido

### Lista completa de archivos a crear:

**Scripts (.gs):**
- `Code` ← contiene Code.gs
- `Auth` ← contiene Auth.gs
- `Sheets` ← contiene Sheets.gs
- `Drive` ← contiene Drive.gs
- `Training` ← contiene Training.gs

**HTML (.html):**
- `Index`
- `CSS_Base`
- `CSS_Components`
- `Page_Login`
- `Page_Guide`
- `Page_Results`
- `Page_Dashboard`
- `JS_State`
- `JS_Api`
- `JS_Yolo`
- `JS_Pose`
- `JS_Rosa`
- `JS_Analysis`
- `JS_Guide`
- `JS_Dashboard`
- `JS_Init`

---

## Paso 3 · Autorizar Drive (solo si no lo hiciste antes)

1. En el editor, selecciona la función `autorizarDrive`
2. Clic en **Ejecutar**
3. Autoriza los permisos

---

## Paso 4 · Desplegar

1. Clic en **Implementar → Administrar implementaciones**
2. Clic en el ícono de **lápiz (editar)** de la implementación existente
3. En "Versión" selecciona **Nueva versión**
4. Clic en **Implementar**
5. Copia la URL — esa es la URL de producción para compartir con los usuarios

> ⚠️ Nunca uses "Nueva implementación" — eso genera una URL diferente.
> Siempre edita la implementación existente con "Nueva versión".

---

## Configuración en `JS_Yolo.html`

Si en algún momento cambias el sitio de Netlify, actualiza esta línea:
```javascript
var STATIC_BASE = 'https://famous-tartufo-04dba5.netlify.app';
```

Y en `JS_Guide.html`:
```javascript
var STATIC_BASE = 'https://famous-tartufo-04dba5.netlify.app';
```
