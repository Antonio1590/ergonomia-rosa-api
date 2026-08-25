// ============================================================
// ROSA Expert — Operaciones CRUD en Google Sheets
// Hoja "Registros": Fecha|Email|TotalROSA|Riesgo|Postura|
//                   URLImagen|Detalles|Recomendaciones|
//                   Neck|Trunk|Legs|Arms|Wrist|Nombre|Cedula
//
// Nombre y Cedula (columnas N y O) se agregaron después de que se detectó
// que el cliente ya los enviaba pero el servidor los descartaba en
// silencio (ver docs/DATA_MODEL.md). Si la hoja real todavía no tiene esas
// dos columnas de encabezado, agrégalas manualmente en N1="Nombre" y
// O1="Cedula" — las filas ya guardadas simplemente quedarán vacías ahí.
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
    record.neck   || '',
    record.trunk  || '',
    record.legs   || '',
    record.arms   || '',
    record.wrist  || '',
    record.nombre || '',
    record.cedula || ''
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
      // Filas guardadas antes de que existieran las columnas N/O no tienen
      // nombre propio: se aproxima con la parte local del correo.
      nombre: rows[i][13] || (rows[i][1] ? rows[i][1].split('@')[0] : ''),
      cedula: rows[i][14] || ''
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

// ============================================================
// MIGRACIÓN — normaliza etiquetas viejas de "Riesgo" (columna D)
// ============================================================
//
// Antes de unificar la escala de riesgo, el front de React usaba 5
// niveles propios (p.ej. "Mejorable", "Inapreciable", "Extremo") que ya
// no existen en el sistema — la escala vigente es la de JS_Rosa.html:
// nivelRiesgo(), con 4 niveles (Bajo/Medio/Alto/Muy Alto). Las filas
// guardadas antes de la unificación quedaron con esas etiquetas viejas
// en la hoja "Registros" y esto las recalcula a partir del puntaje que
// cada fila ya tiene guardado en la columna C.
//
// No se ejecuta sola ni se llama desde rpcHandler — es exclusivamente
// de disparo manual desde el editor de Apps Script, igual que
// configurarProyecto() en Code.gs.
//
// CÓMO USARLA (en este orden, desde el editor → seleccionar función →
// Ejecutar):
//   1. migrarNivelesRiesgoAntiguos()        // dry run: no escribe nada
//      → revisa el resultado en Ver → Registros de ejecución
//   2. migrarNivelesRiesgoAntiguos(false)   // aplica los cambios listados
//
// Es idempotente: una fila que ya tiene una etiqueta válida (Bajo/Medio/
// Alto/Muy Alto) nunca se toca, así que correrla varias veces es seguro.

/** Misma tabla de umbrales que nivelRiesgo() en JS_Rosa.html — no se
 *  puede reusar esa función directamente porque vive en un <script>
 *  del lado cliente (HTML), fuera del alcance de los archivos .gs. */
function nivelRiesgoDesdeScore_(p) {
  if (p <= 2) return 'Bajo';
  if (p <= 4) return 'Medio';
  if (p <= 7) return 'Alto';
  return 'Muy Alto';
}

function migrarNivelesRiesgoAntiguos(dryRun) {
  if (dryRun === undefined) dryRun = true;

  var ETIQUETAS_VALIDAS = ['Bajo', 'Medio', 'Alto', 'Muy Alto'];
  var sheet = getSheet('Registros');
  var rows  = sheet.getDataRange().getValues();
  var cambios = [];
  var omitidas = [];

  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;

    var etiquetaActual = String(rows[i][3] || '').trim();
    if (!etiquetaActual || ETIQUETAS_VALIDAS.indexOf(etiquetaActual) !== -1) continue;

    var puntaje = Number(rows[i][2]);
    if (isNaN(puntaje)) {
      omitidas.push({ fila: i + 1, fecha: rows[i][0], etiqueta: etiquetaActual });
      continue;
    }

    var nueva = nivelRiesgoDesdeScore_(puntaje);
    cambios.push({ fila: i + 1, fecha: rows[i][0], puntaje: puntaje, antes: etiquetaActual, despues: nueva });

    if (!dryRun) {
      sheet.getRange(i + 1, 4).setValue(nueva);
    }
  }

  Logger.log(
    (dryRun ? 'SIMULACIÓN — nada se guardó todavía. ' : 'APLICADO — hoja actualizada. ') +
    cambios.length + ' fila(s) ' + (dryRun ? 'cambiarían' : 'actualizadas') + '.'
  );
  cambios.forEach(function (c) {
    Logger.log('Fila ' + c.fila + ' (' + c.fecha + '): "' + c.antes + '" -> "' + c.despues + '" (puntaje ' + c.puntaje + ')');
  });

  if (omitidas.length) {
    Logger.log(omitidas.length + ' fila(s) con etiqueta desconocida pero SIN puntaje numérico válido — no se pudieron recalcular, requieren revisión manual:');
    omitidas.forEach(function (o) {
      Logger.log('Fila ' + o.fila + ' (' + o.fecha + '): etiqueta "' + o.etiqueta + '", puntaje ilegible');
    });
  }

  return (dryRun ? '[DRY RUN] ' : '[APLICADO] ') + cambios.length + ' fila(s), ' + omitidas.length + ' omitida(s) por revisar. Ver Registros de ejecución para el detalle.';
}
