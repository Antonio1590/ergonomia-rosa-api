// ============================================================
// ROSA Expert — Router principal + utilidades compartidas
// ============================================================
//
// SIN PANTALLA DE INGRESO. La app abre directo y reconoce a la persona
// con la cuenta de Google que ya tiene abierta en el navegador.
//
// IMPLEMENTACIÓN:
//   Implementar → Administrar implementaciones → Editar
//     Ejecutar como:        Yo (idealmente una cuenta @segurosbolivar.com)
//     Quién tiene acceso:   Cualquier usuario con cuenta de Google
//
// Cómo se decide quién es quién (en cada llamada, del lado del servidor):
//   1. Correo de Google reconocido → se busca en la métrica.
//      Si está en ADMIN_EMAILS → administrador. Si no → usuario.
//   2. Google no entrega el correo (cuenta de otro dominio, p. ej. @gmail.com
//      cuando el dueño es @segurosbolivar.com) → entra igual como usuario;
//      la cédula se pide una sola vez, al guardar su primera evaluación.
//      Los admins en esa situación usan el botón "Administrador" (código por correo).
// ============================================================

var SPREADSHEET_ID_POR_DEFECTO = "1dnzjJ9TlERmVhZvrmdQf2vXDXgIwwmoLdpX2JIZVLf0";
var ADMIN_EMAILS_POR_DEFECTO   = [
  "saludorganizacional.bolivar@gmail.com",
  "saludorganizacional.ergo@gmail.com",
  "maria.ceballos@segurosbolivar.com",
  "saludorganizacional@segurosbolivar.com"
];

var SESION_TTL_SEG = 21600; // 6 horas (máximo de CacheService)

function getSpreadsheetId() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('SPREADSHEET_ID') || SPREADSHEET_ID_POR_DEFECTO;
}

var VERSION_APP = '2026-09-16 · ruta de ingreso v8';

/**
 * Administradores: los de ADMIN_EMAILS_POR_DEFECTO SIEMPRE, más los que
 * se hayan agregado en las propiedades del proyecto (ADMIN_EMAILS).
 * Así una lista vieja guardada nunca le quita el acceso a nadie de esta lista.
 */
function getAdminEmails() {
  var raw = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || '';
  var extra = raw.split(',').map(function(e) { return e.trim().toLowerCase(); }).filter(Boolean);
  var todos = ADMIN_EMAILS_POR_DEFECTO.map(function(e) { return e.toLowerCase(); });
  extra.forEach(function(e) { if (todos.indexOf(e) === -1) todos.push(e); });
  return todos;
}

/** Ejecutar desde el editor para cambiar valores sin tocar el código. */
function configurarProyecto(spreadsheetId, admins) {
  var props = PropertiesService.getScriptProperties();
  if (spreadsheetId) props.setProperty('SPREADSHEET_ID', spreadsheetId);
  if (admins) {
    var lista = Array.isArray(admins) ? admins.join(',') : admins;
    props.setProperty('ADMIN_EMAILS', lista);
  }
  return 'Configuración guardada';
}

function _esAdmin_(email) {
  if (!email) return false;
  var e = String(email).trim().toLowerCase();

  var admins = getAdminEmails().map(function(x) { return x.toLowerCase(); });
  if (admins.indexOf(e) !== -1) return true;

  try {
    var rows = getSheet('Metrica').getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim().toLowerCase() === e) {
        return String(rows[i][3] || '').toLowerCase() === 'admin';
      }
    }
  } catch (err) {
    // La hoja "Metrica" antigua es opcional
  }
  return false;
}

// ── Identidad automática ────────────────────────────────────
function _emailGoogle_() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email ? String(email).trim().toLowerCase() : '';
  } catch (e) {
    return '';
  }
}

/**
 * Quién hace la llamada. Nunca confía en datos de identidad que mande
 * el navegador: el correo sale de Google y el rol de ADMIN_EMAILS.
 */
function _identidad_(params) {
  var email = _emailGoogle_();

  if (email) {
    var cache = CacheService.getScriptCache();
    var enCache = cache.get('id4_' + email);
    if (enCache) return JSON.parse(enCache);

    var persona = null;
    try { persona = buscarPersonaMetricaRuta_('', email); } catch (e) {}
    if (!persona) persona = _buscarEnMetricaAntigua_('', email);

    var id = {
      fuente:  'google',
      email:   email,
      nombre:  (persona && persona.nombre) || email.split('@')[0],
      cedula:  (persona && persona.cedula) || '',
      esAdmin: _esAdmin_(email)
    };
    cache.put('id4_' + email, JSON.stringify(id), 1800);
    return id;
  }

  // Admin que entró con código (cuando Google no entrega el correo)
  var ses = _sesion_(params && params.token);
  if (ses) { ses.fuente = 'codigo'; return ses; }

  // Admin en un navegador que ya verificó su código antes: entra directo
  var disp = _dispositivo_(params && params.dispositivo);
  if (disp) return disp;

  return { fuente: 'anonimo', email: '', nombre: '', cedula: '', esAdmin: false };
}

// ── Sesiones (solo para admins con código) ──────────────────
function _crearSesion_(datos) {
  var token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  CacheService.getScriptCache().put('ses_' + token, JSON.stringify(datos), SESION_TTL_SEG);
  return token;
}

function _sesion_(token) {
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return null;
  var raw = CacheService.getScriptCache().get('ses_' + token);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

// ── Navegadores recordados (admins que Google no identifica) ──
// Tras verificar el código una vez, el navegador guarda una llave. Aquí se
// guarda solo su huella (SHA-256), nunca la llave, con fecha de vencimiento.
var DISPOSITIVO_DIAS = 180;

function _huellaToken_(t) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(t))
    .map(function(b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

function _crearDispositivo_(email) {
  var token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('disp_' + _huellaToken_(token),
    JSON.stringify({ email: email, expira: Date.now() + DISPOSITIVO_DIAS * 86400000 }));
  return token;
}

function _dispositivo_(token) {
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return null;
  var huella = _huellaToken_(token);
  var cache = CacheService.getScriptCache();
  var enCache = cache.get('dispid2_' + huella);
  if (enCache) return JSON.parse(enCache);

  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('disp_' + huella);
  if (!raw) return null;
  var d = JSON.parse(raw);
  if (d.expira < Date.now() || !_esAdmin_(d.email)) {
    props.deleteProperty('disp_' + huella);
    return null;
  }

  var id = _datosAdmin_(d.email);
  id.fuente = 'codigo';
  cache.put('dispid2_' + huella, JSON.stringify(id), 1800);
  return id;
}

function _olvidarDispositivo_(token) {
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return;
  var huella = _huellaToken_(token);
  PropertiesService.getScriptProperties().deleteProperty('disp_' + huella);
  CacheService.getScriptCache().remove('dispid2_' + huella);
}

// Sirve la SPA completa como HTML
function doGet(e) {
  var plantilla = HtmlService.createTemplateFromFile('Index');
  plantilla.diag = !!(e && e.parameter && e.parameter.diag === '1');
  return plantilla
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
    params = params || {};
    var id = _identidad_(params);

    var soloAdmin = function(fn) {
      if (id.esAdmin) return fn();
      if (params.token) return { ok: false, codigo: 'SESION', error: 'Tu acceso de administrador venció. Vuelve a pedir el código.' };
      return { ok: false, error: 'No autorizado' };
    };

    switch (params.action) {
      // ── Entrada ──
      case 'iniciar':
        return { ok: true, data: {
          fuente: id.fuente, email: id.email, nombre: id.nombre,
          cedula: id.cedula, esAdmin: !!id.esAdmin, rol: id.esAdmin ? 'admin' : 'user',
          // El navegador tenía una llave vencida o revocada: que la borre
          dispositivoInvalido: !!params.dispositivo && id.fuente === 'anonimo'
        } };
      case 'diagnostico':
        var correoGoogle = _emailGoogle_();
        return { ok: true, data: {
          version: VERSION_APP,
          correoQueEntregaGoogle: correoGoogle || '(Google no entregó el correo)',
          reconocidoComo: id.fuente,
          nombre: id.nombre || '',
          esAdmin: !!id.esAdmin,
          correoEnListaDeAdmins: correoGoogle ? getAdminEmails().indexOf(correoGoogle) !== -1 : false,
          tieneFormularioPendiente: id.cedula || id.email ? !!handleRutaMiEstado(id.cedula, id.email).data : false
        } };
      case 'olvidarDispositivo':
        _olvidarDispositivo_(params.dispositivo);
        return { ok: true };
      case 'identificarCedula':    return handleIdentificarCedula(params.cedula);
      case 'adminPedirCodigo':     return handleAdminPedirCodigo(params.email);
      case 'adminVerificarCodigo': return handleAdminVerificarCodigo(params.email, params.codigo);

      // ── Evaluación ROSA ──
      case 'saveEvaluation':
        var record = params.record || {};
        if (id.fuente !== 'anonimo') {
          record.email  = id.email;
          record.cedula = id.cedula || record.cedula || '';
          record.nombre = id.nombre;
        } else {
          var p = _personaPorCedula_(record.cedula);
          if (!p) return { ok: false, error: 'No encontramos esa cédula en la base de colaboradores.' };
          record.cedula = p.cedula;
          record.nombre = p.nombre;
          record.email  = p.correo || '';
        }
        return handleSaveEvaluation(record);

      case 'saveTraining':
        var rec = params.record || {};
        if (id.email) rec.email = id.email;
        return handleSaveTraining(rec);

      case 'uploadPhoto':
        params.email = id.email || String(params.email || '').replace(/[^\w@.\-]/g, '') || 'sin-identificar';
        return handleUploadPhoto(params);

      case 'analyzePhoto':
        return handleAnalyzePhoto(params);

      case 'getUserHistory':
        if (id.esAdmin && params.email) return handleGetUserHistory(params.email);
        if (id.email) return handleGetUserHistory(id.email);
        return _historialPorCedula_(params.cedula);

      case 'formularioEsquema': return handleFormularioEsquema(id, params);
      case 'guardarFormulario': return handleGuardarFormulario(id, params);

      case 'rutaMiEstado':
        return handleRutaMiEstado(id.cedula || params.cedula, id.email || params.email);

      // ── Solo administradores ──
      case 'getEvaluations': return soloAdmin(handleGetEvaluations);
      case 'getUsers':       return soloAdmin(handleGetUsers);
      case 'rutaListar':     return soloAdmin(handleRutaListar);
      case 'rutaDecidir':    return soloAdmin(function() { return handleRutaDecidir(id, params); });
      case 'rutaEnviar':     return soloAdmin(function() { return handleRutaEnviar(id, params); });

      default: return { ok: false, error: 'Acción desconocida: ' + params.action };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function _personaPorCedula_(cedula) {
  var ced = String(cedula || '').replace(/\D/g, '');
  if (!ced) return null;
  var p = null;
  try { p = buscarPersonaMetricaRuta_(ced, ''); } catch (e) {}
  return p || _buscarEnMetricaAntigua_(ced, '');
}

/** Historial por cédula (columna O de "Registros"), para quien Google no identifica. */
function _historialPorCedula_(cedula) {
  var ced = String(cedula || '').replace(/\D/g, '');
  if (!ced) return { ok: true, data: [] };

  var rows = getSheet('Registros').getDataRange().getValues();
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0] || String(rows[i][14] || '').replace(/\D/g, '') !== ced) continue;
    var detalle = {};
    try { detalle = JSON.parse(rows[i][6] || '{}'); } catch (e) {}
    result.push({
      fecha:        rows[i][0] instanceof Date ? rows[i][0].toISOString() : rows[i][0],
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
