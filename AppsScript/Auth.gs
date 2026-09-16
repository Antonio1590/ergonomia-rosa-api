// ============================================================
// ROSA Expert — Identificación sin pantalla de ingreso
//   · La identidad normal sale de Google (ver _identidad_ en Code.gs).
//   · Cédula: solo para quien Google no identifica, al guardar.
//   · Código por correo: solo para admins que Google no identifica.
// ============================================================

/**
 * Para quien Google no identifica: valida la cédula contra la métrica
 * (se pide una sola vez, al guardar la primera evaluación).
 */
function handleIdentificarCedula(cedula) {
  var ced = String(cedula || '').replace(/\D/g, '');
  if (!/^\d{4,12}$/.test(ced)) {
    return { ok: false, error: 'Escribe tu número de cédula sin puntos ni espacios.' };
  }

  // Freno simple contra quien pruebe cédulas al azar
  var cache = CacheService.getScriptCache();
  var claveFallos = 'ced_fallos_' + Utilities.formatDate(new Date(), 'GMT', 'yyyyMMddHHmm');
  var fallos = Number(cache.get(claveFallos) || 0);
  if (fallos > 60) {
    return { ok: false, error: 'Hay demasiados intentos en este momento. Espera un minuto e intenta de nuevo.' };
  }

  var persona = _personaPorCedula_(ced);
  if (!persona) {
    cache.put(claveFallos, String(fallos + 1), 120);
    return { ok: false, error: 'No encontramos esa cédula en la base de colaboradores. Revisa el número o escribe a Salud Organizacional.' };
  }

  if (persona.inactivo) {
    return { ok: false, error: 'Esa cédula aparece inactiva en la base de colaboradores. Escribe a Salud Organizacional.' };
  }

  return {
    ok: true,
    data: {
      cedula: persona.cedula,
      nombre: persona.nombre || '',
      email:  String(persona.correo || '').toLowerCase()
    }
  };
}

/** Hoja "Metrica" del proyecto ROSA: A=Cédula B=Email C=Nombre D=Rol E=Estado */
function _buscarEnMetricaAntigua_(ced, correo) {
  try {
    var e = String(correo || '').trim().toLowerCase();
    var rows = getSheet('Metrica').getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var coincide = (ced && String(rows[i][0]).replace(/\D/g, '') === ced) ||
                     (e && String(rows[i][1]).trim().toLowerCase() === e);
      if (!coincide) continue;
      return {
        cedula: String(rows[i][0]).replace(/\D/g, ''),
        correo: String(rows[i][1] || ''),
        nombre: String(rows[i][2] || '')
      };
    }
  } catch (err) {
    // La hoja antigua es opcional
  }
  return null;
}

// ── Administradores: código por correo ──────────────────────
function handleAdminPedirCodigo(email) {
  var e = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return { ok: false, error: 'Escribe un correo válido.' };
  }

  // Misma respuesta exista o no el admin: no revela quién tiene permisos
  var respuesta = {
    ok: true,
    data: { mensaje: 'Si el correo tiene permisos de administrador, te llegará un código en menos de un minuto.' }
  };
  if (!_esAdmin_(e)) return respuesta;

  var cache = CacheService.getScriptCache();
  if (cache.get('otp_espera_' + e)) return respuesta; // 1 código por minuto

  var codigo = String(Math.floor(100000 + Math.random() * 900000));
  cache.put('otp_' + e, JSON.stringify({ codigo: codigo, intentos: 0 }), 600);
  cache.put('otp_espera_' + e, '1', 60);

  // El código SIEMPRE va al correo real (ignora MODO_PRUEBA a propósito)
  GmailApp.sendEmail(e, 'Tu código de acceso: ' + codigo,
    'Tu código para entrar como administrador es ' + codigo + '. Vence en 10 minutos.',
    { htmlBody: htmlCorreoCodigoAdmin_(codigo), name: 'Salud Organizacional' });

  return respuesta;
}

function handleAdminVerificarCodigo(email, codigo) {
  var e = String(email || '').trim().toLowerCase();
  var cache = CacheService.getScriptCache();
  var raw = cache.get('otp_' + e);
  if (!raw) return { ok: false, error: 'El código venció o no existe. Pide uno nuevo.' };

  var otp = JSON.parse(raw);
  if (String(codigo || '').replace(/\D/g, '') !== otp.codigo) {
    otp.intentos++;
    if (otp.intentos >= 5) {
      cache.remove('otp_' + e);
      return { ok: false, error: 'Demasiados intentos. Pide un código nuevo.' };
    }
    cache.put('otp_' + e, JSON.stringify(otp), 600);
    return { ok: false, error: 'Código incorrecto. Te quedan ' + (5 - otp.intentos) + ' intentos.' };
  }
  cache.remove('otp_' + e);

  var datos = _datosAdmin_(e);
  var token = _crearSesion_(datos);

  return {
    ok: true,
    data: {
      cedula: datos.cedula, email: e, nombre: datos.nombre,
      rol: 'admin', esAdmin: true, fechaRegistro: '', token: token,
      // Llave para que este navegador entre directo las próximas veces
      dispositivo: _crearDispositivo_(e)
    }
  };
}

/** Datos de un administrador. Si también es colaborador, se liga a su registro. */
function _datosAdmin_(email) {
  var persona = null;
  try { persona = buscarPersonaMetricaRuta_('', email); } catch (err) {}
  if (!persona) persona = _buscarEnMetricaAntigua_('', email);
  return {
    cedula:  (persona && persona.cedula) || '',
    email:   email,
    nombre:  (persona && persona.nombre) || email.split('@')[0],
    rol:     'admin',
    esAdmin: true
  };
}

function htmlCorreoCodigoAdmin_(codigo) {
  var cuerpo =
    _tituloRosa('CÓDIGO DE ACCESO') +
    '<div style="font-family:arial,helvetica,sans-serif;font-size:40px;font-weight:bold;letter-spacing:10px;' +
      'color:' + MARCA_ROSA.VERDE + ';text-align:center;padding:18px 0;background:' + MARCA_ROSA.VERDE_BG +
      ';border-radius:8px;margin:0 0 18px;">' + codigo + '</div>' +
    _txtRosa('Escríbelo en ROSA Expert, en el botón Administrador, para abrir el panel. Vence en 10 minutos.<br><br>' +
      'Si no pediste este código, ignora este correo.', 'left');
  return _plantillaBaseRosa(_bandaRosa(cuerpo, '#FFFFFF', 25, 25));
}
