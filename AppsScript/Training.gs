// ============================================================
// ROSA Expert — Datos de entrenamiento para mejora de modelos
// Hoja "Entrenamiento": acumula ángulos y detecciones de cada
// análisis para reentrenamiento futuro en Google Colab.
// ============================================================

function handleSaveTraining(record) {
  if (!record) return { ok: false, error: 'Sin datos de entrenamiento' };

  var ss    = SpreadsheetApp.openById(getSpreadsheetId());
  var sheet = ss.getSheetByName('Entrenamiento');

  if (!sheet) {
    sheet = ss.insertSheet('Entrenamiento');
    var headers = [
      'Fecha', 'Email',
      'Cuello_deg', 'Tronco_deg', 'RodillaIzq_deg', 'RodillaDer_deg',
      'CodoIzq_deg', 'CodoDer_deg', 'HombroIzq_deg', 'HombroDer_deg',
      'PuntajeFinal', 'NivelRiesgo', 'Detecciones_JSON', 'NumFotos',
      'MonitorScore', 'EscritorioAlto', 'TelefonoEntreHombro',
      'RevisadoPorExperto', 'Correcciones', 'Respuestas_JSON'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#005224')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    record.fecha         || new Date().toISOString(),
    record.email         || '',
    record.neck          || 0,
    record.trunk         || 0,
    record.leftKnee      || 0,
    record.rightKnee     || 0,
    record.leftElbow     || 0,
    record.rightElbow    || 0,
    record.leftShoulder  || 0,
    record.rightShoulder || 0,
    record.puntajeFinal  || 0,
    record.nivelRiesgo   || '',
    record.detecciones   || '[]',
    record.numFotos      || 1,
    record.monitorScore  || 0,
    record.deskHighStatus   || 'unknown',
    record.phoneNearNeck    ? 'SI' : 'NO',
    '',  // RevisadoPorExperto — lo completa el experto
    '',  // Correcciones — lo completa el experto
    // Antes se perdía en silencio: JS_Analysis.html (Apps Script) ya
    // enviaba record.respuestas pero no había columna para guardarlo.
    record.respuestas || '{}'
  ]);

  return { ok: true };
}
