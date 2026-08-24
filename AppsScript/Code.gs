// ============================================================
// ROSA Expert — Router principal + utilidades compartidas
// ============================================================
var SPREADSHEET_ID = "17vDjLtj6PN-MrYwYVP07XwyFEpemWkY-MhxhPdl6PHE";
var ADMIN_EMAILS   = ["bbocanegrah@gmail.com"];

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
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error("Hoja '" + name + "' no encontrada");
  return sh;
}
