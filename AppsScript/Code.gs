// ============================================================
// ROSA Expert — Router principal + utilidades compartidas
// ============================================================
//
// SPREADSHEET_ID y ADMIN_EMAILS se leen de PropertiesService cuando están
// configurados ahí (Configuración del proyecto → Propiedades de la
// secuencia de comandos), igual que ya se hace con GEMINI_API_KEY en
// Gemini.gs. Si no se configuran, se usa el valor por defecto de abajo —
// así el despliegue actual sigue funcionando sin cambios. Para migrar,
// ejecuta UNA vez desde el editor: configurarProyecto('TU_SPREADSHEET_ID',
// ['correo1@segurosbolivar.com','correo2@segurosbolivar.com']).
var SPREADSHEET_ID_POR_DEFECTO = "17vDjLtj6PN-MrYwYVP07XwyFEpemWkY-MhxhPdl6PHE";
var ADMIN_EMAILS_POR_DEFECTO   = ["bbocanegrah@gmail.com"];

function getSpreadsheetId() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('SPREADSHEET_ID') || SPREADSHEET_ID_POR_DEFECTO;
}

function getAdminEmails() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('ADMIN_EMAILS');
  if (!raw) return ADMIN_EMAILS_POR_DEFECTO;
  return raw.split(',').map(function(e) { return e.trim(); }).filter(Boolean);
}

/**
 * Ejecutar UNA vez desde el editor para mover estos valores fuera del
 * código fuente. admins puede ser un array o un string separado por comas.
 */
function configurarProyecto(spreadsheetId, admins) {
  var props = PropertiesService.getScriptProperties();
  if (spreadsheetId) props.setProperty('SPREADSHEET_ID', spreadsheetId);
  if (admins) {
    var lista = Array.isArray(admins) ? admins.join(',') : admins;
    props.setProperty('ADMIN_EMAILS', lista);
  }
  return 'Configuración guardada';
}

// Sirve la SPA completa como HTML
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ROSA Expert — Seguros Bolívar')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Endpoint REST para integraciones externas (opcional)
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    return json(rpcHandler(body));
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

// Punto de entrada único para google.script.run desde el cliente
function rpcHandler(params) {
  try {
    switch (params.action) {
      case 'login':          return handleLogin(params.email, params.cedula);
      case 'saveEvaluation': return handleSaveEvaluation(params.record);
      case 'getEvaluations': return handleGetEvaluations();
      case 'getUserHistory': return handleGetUserHistory(params.email);
      case 'getUsers':       return handleGetUsers();
      case 'saveTraining':   return handleSaveTraining(params.record);
      case 'uploadPhoto':    return handleUploadPhoto(params);
      case 'analyzePhoto':   return handleAnalyzePhoto(params);
      default: return { ok: false, error: 'Acción desconocida: ' + params.action };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Incluir archivos HTML en plantillas
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Respuesta JSON para doPost
function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Obtiene una hoja por nombre; lanza si no existe
function getSheet(name) {
  var ss = SpreadsheetApp.openById(getSpreadsheetId());
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error("Hoja '" + name + "' no encontrada");
  return sh;
}
