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
npm run copy-wasm
cp .env.example .env
# Editar .env con la URL del Apps Script (ver sección siguiente)
npm run dev
```

La app estará disponible en `http://localhost:5173`.

---

## Configurar Google Sheets

1. Ir a [drive.google.com](https://drive.google.com) y crear una nueva **Hoja de cálculo**.
2. Renombrar la hoja por defecto (pestaña inferior) a **`Metrica`**.
3. Crear una segunda hoja y nombrarla **`Registros`**.
4. En la hoja **`Metrica`**, escribir en la fila 1 los siguientes encabezados (una columna por celda):

   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | Cedula | Email | Nombre | Rol | Estado | FechaRegistro |

   `Rol` es `user` o `admin`. `Estado` es `activo` o `inactivo` (vacío se
   trata como activo).

5. En la hoja **`Registros`**, escribir en la fila 1:

   | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Fecha | Email | TotalROSA | Riesgo | Postura | URLImagen | Detalles | Recomendaciones | Neck | Trunk | Legs | Arms | Wrist | Nombre | Cedula |

   Una tercera hoja, **`Entrenamiento`**, se crea automáticamente la primera
   vez que se guarda una evaluación — no hace falta crearla a mano.

6. Copiar el **ID del spreadsheet** desde la URL del navegador: es la cadena larga que aparece entre `/d/` y `/edit`.

   Ejemplo: en `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit` el ID es `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`.

---

## Desplegar Apps Script

1. Ir a [script.google.com](https://script.google.com) y hacer clic en **Nuevo proyecto**.
2. Crear todos los archivos `.gs`/`.html` de `AppsScript/` (ver
   `AppsScript/INSTALACION.md` para la lista completa y el detalle paso a
   paso — no te saltes `Gemini.gs`, sin él el análisis de foto falla).
3. Guardar el proyecto con **Ctrl + S**.
4. Ejecutar una vez desde el editor, para dejar `SPREADSHEET_ID` y
   `ADMIN_EMAILS` fuera del código fuente (en `PropertiesService`):
   ```javascript
   configurarProyecto(
     "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
     ["tu.correo@segurosbolivar.com"]
   );
   ```
   (Si se omite este paso, el proyecto sigue funcionando con los valores
   por defecto ya presentes en `Code.gs`.)
5. Ejecutar `guardarClaveGemini("TU_CLAVE_DE_GEMINI")` una vez, y
   `autorizarDrive` una vez (ver `AppsScript/INSTALACION.md`).
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
├── AppsScript/                  # SPA + backend Google Apps Script (login, evaluaciones,
│                                 #   usuarios, análisis de foto con Gemini)
├── Metodo Rosa/                 # Cliente React — la app real que usan los empleados
│   ├── public/                  # Assets estáticos y modelos WASM/ONNX
│   ├── scripts/
│   │   └── copy-wasm.cjs        # Script de setup: copia archivos WASM al directorio public
│   ├── src/
│   │   ├── ai/
│   │   │   ├── mediapipe/       # Servicio de detección de pose con MediaPipe (cliente)
│   │   │   └── yolo/            # Servicio de detección de objetos con YOLO (ONNX, cliente)
│   │   ├── components/ai/rosa/  # Motor de cálculo ROSA (silla, pantalla, teclado)
│   │   ├── context/             # AuthContext (sesión) es el único contexto en uso hoy
│   │   ├── pages/                # Login, AutoEvaluationPage (flujo completo), AdminDashboard
│   │   ├── services/
│   │   │   └── SheetsService.ts # Cliente HTTP hacia el Apps Script (login, guardar, listar)
│   │   └── App.tsx              # Raíz de la aplicación React (rutas)
│   ├── .env.example             # Plantilla de variables de entorno
│   ├── package.json
│   └── vite.config.ts
├── docs/                        # Especificación, arquitectura, auditoría, contratos (ver abajo)
└── README.md                    # Este archivo
```

> Nota: `src/` no coincide exactamente con el árbol de arriba en su
> totalidad — existe una cantidad importante de componentes/páginas/contexts
> sin usar, heredados de un diseño anterior por pasos. El árbol de arriba
> muestra solo lo que está realmente en uso hoy. Ver `docs/ARCHITECTURE.md`
> y `docs/AUDIT.md` para el detalle completo, incluyendo qué es código vivo
> y qué es código muerto pendiente de una decisión de limpieza.

## Documentación adicional

Este proyecto mantiene documentación funcional/técnica centralizada en
`docs/` — es la fuente de verdad de cómo debe comportarse el sistema y en
qué estado está realmente, no solo este README:

- [`docs/AUDIT.md`](docs/AUDIT.md) — auditoría técnica completa
- [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) — especificación funcional única (React + Apps Script)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitectura de ambos clientes
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — contrato de datos y discrepancias conocidas
- [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) — contrato de integraciones (incluye el punto de integración futura de Gemini en React)
- [`docs/PARITY_MATRIX.md`](docs/PARITY_MATRIX.md) — paridad funcional React ↔ Apps Script
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — historial de cambios importantes

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
