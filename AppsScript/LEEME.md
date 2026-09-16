# ROSA Expert · Ruta de ingreso — Instalación

## 1. Archivos en Apps Script

Crea cada archivo con el **tipo** indicado y el **nombre exacto** (sin extensión, respetando mayúsculas y guion bajo).

### Nuevos (hay que crearlos)
| Nombre | Tipo |
|---|---|
| Ruta_Ingreso | Secuencia de comandos (.gs) |
| Formularios | Secuencia de comandos (.gs) |
| Page_Ruta | HTML |
| JS_Ruta | HTML |
| JS_Entrada | HTML |
| JS_Formularios | HTML |

### Modificados (reemplazar todo el contenido)
| Nombre | Tipo |
|---|---|
| Code | Secuencia de comandos (.gs) |
| Auth | Secuencia de comandos (.gs) |
| Index | HTML |
| Page_Login | HTML |
| JS_Api | HTML |
| JS_Guide | HTML |
| JS_Init | HTML |

### Sin cambios
Adaptador_rosa, Correos_ROSA, Drive, Envio_ROSA, Gemini, Sheets, Training (.gs) y
CSS_Base, CSS_Components, JS_Analysis, JS_Charts, JS_Dashboard, JS_Draft, JS_History,
JS_Pose, JS_Quality, JS_Questions, JS_Rosa, JS_Yolo, Page_Dashboard, Page_Guide,
Page_History, Page_Questions, Page_Results, Photos (HTML).
Van en esta carpeta solo como respaldo. **JS_State no venía en el zip original: déjalo como está.**

Regla rápida: si el archivo empieza con `<script>` o `<div`, es HTML; si empieza con `//` o `var`, es .gs.

## 2. Ejecutar una vez (en el editor)
1. `probarRutaIngreso` → revisa el Registro de ejecución: columnas encontradas en la métrica y casos por filtro.
2. `instalarRutaIngreso` → guarda los 3 administradores, crea la hoja Ruta_Ingreso y programa el proceso diario (7:00 a. m.).

## 3. Publicar
Implementar → Administrar implementaciones → Editar:
- Ejecutar como: **Yo**
- Quién tiene acceso: **Cualquier usuario con cuenta de Google**
- Versión: **Nueva versión** → Implementar

Para probar antes de publicar: Implementar → Implementaciones de prueba (enlace /dev).

## 4. Cómo entra cada quien
- **Correos @segurosbolivar.com:** directo, Google los reconoce.
- **saludorganizacional.bolivar@gmail.com y saludorganizacional.ergo@gmail.com:** la primera vez en cada navegador, botón *Administrador* → código por correo. Después entran directo por 6 meses (hasta que toquen *Salir*).
- **Colaboradores no reconocidos por Google:** entran directo; la cédula se pide una sola vez, al guardar su primera evaluación.

## 5. Dónde se ajusta
- `Code.gs` → `ADMIN_EMAILS_POR_DEFECTO` (administradores).
- `Ruta_Ingreso.gs` → `CONFIG_RUTA`: columnas de la métrica, días (15 / 120 / 8), perfiles de administradores fuera de la métrica (`PERFILES_ADMIN`) y reglas de hallazgos.
- `Formularios.gs` → preguntas y opciones de los 3 formularios.
- `Envio_ROSA.gs` → `MODO_PRUEBA` (en `true` todos los correos van a la cuenta de prueba).

## 6. Hojas que se crean solas en el archivo de ROSA
Ruta_Ingreso (seguimiento), Formulario_1_AutoReporte, Formulario_2_Seguimiento, Formulario_3_IPT.
