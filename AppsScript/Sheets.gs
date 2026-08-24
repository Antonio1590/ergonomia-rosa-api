// ============================================================
// ROSA Expert — Operaciones CRUD en Google Sheets
// Hoja "Registros": Fecha|Email|TotalROSA|Riesgo|Postura|
//                   URLImagen|Detalles|Recomendaciones|
//                   Neck|Trunk|Legs|Arms|Wrist
// ============================================================

function handleSaveEvaluation(record) {
  if (!record) return { ok: false, error: 'Sin datos de evaluación' };

  var sheet = getSheet('Registros');
  sheet.appendRow([
    record.fecha        || new Date().toISOString(),
    record.email        || '',
    record.puntajeFinal || 0,
    record.nivelRiesgo  || '',
    record.postura      || '',
    record.urlImagen    || '',
    JSON.stringify({
      silla:    record.puntajeSilla,
      pantalla: record.puntajePantalla,
      teclado:  record.puntajeTeclado,
      objetos:  record.objetosDetectados
    }),
    Array.isArray(record.recomendaciones)
      ? record.recomendaciones.join(' | ')
      : (record.recomendaciones || ''),
    record.neck  || '',
    record.trunk || '',
    record.legs  || '',
    record.arms  || '',
    record.wrist || ''
  ]);

  return { ok: true };
}

function handleGetEvaluations() {
  var sheet = getSheet('Registros');
  var rows  = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    result.push({
      fecha:           rows[i][0],
      email:           rows[i][1],
      puntajeFinal:    rows[i][2],
      nivelRiesgo:     rows[i][3],
      postura:         rows[i][4],
      urlImagen:       rows[i][5],
      detalles:        rows[i][6],
      recomendaciones: rows[i][7],
      neck:   rows[i][8],  trunk: rows[i][9],
      legs:   rows[i][10], arms:  rows[i][11], wrist: rows[i][12],
      nombre: rows[i][1] ? rows[i][1].split('@')[0] : ''
    });
  }

  return { ok: true, data: result };
}

/**
 * Historial de un solo colaborador, del más antiguo al más reciente,
 * para poder graficar su evolución.
 */
function handleGetUserHistory(email) {
  if (!email) return { ok: false, error: 'Correo requerido' };

  var objetivo = String(email).trim().toLowerCase();
  var sheet = getSheet('Registros');
  var rows  = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    if (String(rows[i][1]).trim().toLowerCase() !== objetivo) continue;

    var detalle = {};
    try { detalle = JSON.parse(rows[i][6] || '{}'); } catch (e) {}

    result.push({
      fecha:        rows[i][0],
      puntajeFinal: Number(rows[i][2]) || 0,
      nivelRiesgo:  rows[i][3],
      urlImagen:    rows[i][5],
      silla:        Number(detalle.silla)    || 0,
      pantalla:     Number(detalle.pantalla) || 0,
      teclado:      Number(detalle.teclado)  || 0,
      recomendaciones: rows[i][7]
    });
  }

  result.sort(function(a, b) { return new Date(a.fecha) - new Date(b.fecha); });
  return { ok: true, data: result };
}

function handleGetUsers() {
  var sheet = getSheet('Metrica');
  var rows  = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    result.push({
      cedula:        rows[i][0],
      email:         rows[i][1],
      nombre:        rows[i][2],
      rol:           rows[i][3],
      estado:        rows[i][4],
      fechaRegistro: rows[i][5]
    });
  }

  return { ok: true, data: result };
}
