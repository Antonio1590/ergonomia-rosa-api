# ROSA Expert — Evaluación Ergonómica con IA

Aplicación web desarrollada para **Seguros Bolívar** que permite evaluar la ergonomía del puesto de trabajo de cada empleado mediante inteligencia artificial. El usuario sube una foto de su estación de trabajo; la app detecta objetos (silla, pantalla, teclado) con **YOLO** y analiza la postura corporal con **MediaPipe**, calcula un puntaje según el método **ROSA** (Rapid Office Strain Assessment) y guarda los resultados en **Google Sheets** a través de un **Google Apps Script** desplegado como Web App.

---

## Requisitos previos

- **Node.js 18+** — [descargar](https://nodejs.org/)
- Cuenta Google con acceso a **Google Drive**, **Google Sheets** y **Google Apps Script**
- Correo institucional `@segurosbolivar.com` para poder iniciar sesión en la app

---

## Setup local

```bash
cd "Metodo Rosa"
npm install
node scripts/copy-wasm.js
cp .env.example .env
# Editar .env con la URL del Apps Script (ver sección siguiente)
npm run dev
```

La app estará disponible en `http://localhost:5173`.

---

## Configurar Google Sheets

1. Ir a [drive.google.com](https://drive.google.com) y crear una nueva **Hoja de cálculo**.
2. Renombrar la hoja por defecto (pestaña inferior) a **`Usuarios`**.
3. Crear una segunda hoja y nombrarla **`Evaluaciones`**.
4. En la hoja **`Usuarios`**, escribir en la fila 1 los siguientes encabezados (una columna por celda):

   | A | B | C | D | E |
   |---|---|---|---|---|
   | cedula | email | nombre | rol | fechaRegistro |

5. En la hoja **`Evaluaciones`**, escribir en la fila 1:

   | A | B | C | D | E | F | G | H | I | J | K |
   |---|---|---|---|---|---|---|---|---|---|---|
   | cedula | nombre | email | fecha | puntajeFinal | nivelRiesgo | puntajeSilla | puntajePantalla | puntajeTeclado | objetosDetectados | recomendaciones |

6. Copiar el **ID del spreadsheet** desde la URL del navegador: es la cadena larga que aparece entre `/d/` y `/edit`.

   Ejemplo: en `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit` el ID es `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`.

---

## Desplegar Apps Script

1. Ir a [script.google.com](https://script.google.com) y hacer clic en **Nuevo proyecto**.
2. Borrar el contenido por defecto y pegar el contenido completo de `AppsScript/Code.gs`.
3. Reemplazar el valor de `SPREADSHEET_ID` con el ID copiado en el paso anterior:
   ```javascript
   var SPREADSHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms";
   ```
4. Agregar tu correo (y el de otros admins) en `ADMIN_EMAILS`:
   ```javascript
   var ADMIN_EMAILS = ["tu.correo@segurosbolivar.com"];
   ```
5. Guardar el proyecto con **Ctrl + S**.
6. Ir a **Implementar → Nueva implementación**.
7. Configurar:
   - **Tipo:** Aplicación web
   - **Ejecutar como:** Yo (tu cuenta Google)
   - **Quién accede:** Cualquier usuario (Anyone)
8. Hacer clic en **Implementar** y luego **Autorizar** (aparecerá una ventana de permisos de Google).
9. Copiar la **URL de la aplicación web** que aparece al finalizar. Tiene la forma:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## Configurar .env

Abrir el archivo `Metodo Rosa/.env` (creado a partir de `.env.example`) y pegar la URL copiada:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_ID_REAL/exec
```

---

## Verificar que funciona

Abrir la URL del Apps Script directamente en el navegador (petición GET). Si el script está activo, responderá:

```json
{"ok":true,"message":"ROSA Expert API activa"}
```

Si aparece un error de permisos, volver a **Implementar → Administrar implementaciones** y verificar que "Quién accede" sea **Cualquier usuario**.

---

## Desplegar en producción (Vercel)

1. Ejecutar el build local para verificar que no haya errores:
   ```bash
   npm run build
   ```
2. En el panel de Vercel, ir a **Settings → Environment Variables** del proyecto y agregar:
   - Clave: `VITE_APPS_SCRIPT_URL`
   - Valor: la URL completa del Apps Script
3. Hacer un nuevo deploy (o redeploy) para que la variable quede activa.

---

## Estructura del proyecto

```
FOTOS METODO ROSA/FRONT/
├── AppsScript/
│   └── Code.gs                  # Backend Google Apps Script (login, evaluaciones, usuarios)
├── Metodo Rosa/
│   ├── public/                  # Assets estáticos y modelos WASM/ONNX
│   ├── scripts/
│   │   └── copy-wasm.js         # Script de setup: copia archivos WASM al directorio public
│   ├── src/
│   │   ├── ai/
│   │   │   ├── mediapipe/       # Servicio de detección de pose con MediaPipe
│   │   │   └── yolo/            # Servicio de detección de objetos con YOLO (ONNX)
│   │   ├── components/
│   │   │   ├── ai/              # Componentes de análisis IA: postura, reconocimiento, ROSA
│   │   │   │   ├── mediapipe/   # Overlay de esqueleto y cálculo de ángulos
│   │   │   │   ├── rosa/        # Motor de cálculo ROSA (silla, pantalla, teclado)
│   │   │   │   └── yolo/        # Visualización de resultados YOLO
│   │   │   ├── camera/          # Componentes de captura/subida de imagen
│   │   │   ├── dashboard/       # Componentes de la pantalla principal y resultados
│   │   │   └── ui/              # Componentes UI reutilizables
│   │   ├── pages/               # Páginas de la aplicación (rutas)
│   │   ├── services/
│   │   │   └── SheetsService.ts # Cliente HTTP hacia el Apps Script (login, guardar, listar)
│   │   ├── store/               # Estado global (Zustand u otro)
│   │   └── App.tsx              # Raíz de la aplicación React
│   ├── .env.example             # Plantilla de variables de entorno
│   ├── package.json
│   └── vite.config.ts
└── README.md                    # Este archivo
```

---

## Troubleshooting

| Error | Causa probable | Solución |
|---|---|---|
| `La URL del Apps Script no está configurada` | Falta `VITE_APPS_SCRIPT_URL` en `.env` | Copiar `.env.example` a `.env` y completar la URL |
| `Error HTTP 401` o pantalla de login de Google | El script requiere autenticación | En la implementación, cambiar "Quién accede" a **Cualquier usuario** |
| `Hoja 'Usuarios' no encontrada` | La hoja no existe o tiene otro nombre | Verificar que las pestañas del spreadsheet se llamen exactamente `Usuarios` y `Evaluaciones` |
| `Correo debe ser del dominio @segurosbolivar.com` | Correo de otra cuenta | Iniciar sesión con correo institucional |
| `Cédula inválida` | La cédula tiene letras o menos de 6 dígitos | Ingresar solo números, entre 6 y 12 dígitos |
| El build falla con errores de WASM | Archivos WASM no copiados | Ejecutar `node scripts/copy-wasm.js` antes de `npm run build` |
| La pose no se detecta | Imagen oscura o persona fuera de cuadro | Usar imagen con buena iluminación y persona visible de cuerpo completo |
| YOLO no detecta silla/pantalla | Modelo no cargado o imagen de baja resolución | Esperar a que el modelo termine de cargar (barra de progreso) y usar foto nítida |
