/**
 * ============================================================
 * ENVIO_ROSA.GS — Envío de correos al guardar la evaluación
 * Salud Organizacional · Seguros Bolívar
 * ------------------------------------------------------------
 * NO usa triggers. Se llama desde tu función de guardado,
 * justo después de escribir la fila en la hoja "Registros":
 *
 *     const fila = hoja.getLastRow();           // la que acabas de escribir
 *     enviarCorreosRosa(datos, fila);           // <-- una sola línea
 *
 * Si el envío falla, NO rompe el guardado (queda en el registro).
 * ============================================================
 */

const CONFIG_ROSA = {
  ID_HOJA: '1dnzjJ9TlERmVhZvrmdQf2vXDXgIwwmoLdpX2JIZVLf0',
  GID_REGISTROS: 1043608489,
  NOMBRE_HOJA: 'Registros',

  // --- Destinatarios ---
  CORREO_ADMIN: 'maria.ceballos@segurosbolivar.com',        // <-- correo real de Jane
  COPIA_ADMIN: '',                                 // opcional, separa con comas
  CORREO_PRUEBA: 'maria.ceballos@segurosbolivar.com',
  MODO_PRUEBA: true,        // true = TODO se redirige a CORREO_PRUEBA

  // Solo alertar a Jane cuando el riesgo es alto.
  // false = le llega alerta de TODAS las evaluaciones.
  ALERTAR_ADMIN_SOLO_RIESGO_ALTO: false,

  // Columna de la hoja donde se marca "correo enviado" (evita duplicados
  // si dan click dos veces en Guardar). Déjala en '' para no escribir nada.
  COL_CORREO_ENVIADO: 'Correo enviado',

  PUNTAJE_MAX: 10,
  UMBRAL_INTERVENCION: 5,

  // Botón del correo al funcionario (opcional). Vacío = sin botón.
  LINK_PORTAL: '',

  // Botón del correo a Jane -> panel administrador.
  // Si lo dejas vacío usa la URL de la app publicada (pantalla de inicio).
  // Ejemplo: 'https://script.google.com/macros/s/AKfy.../exec?page=admin'
  LINK_ADMIN: ''
};

/* ============================================================
   FUNCIÓN PÚBLICA — llámala desde tu botón Guardar
   ------------------------------------------------------------
   datos: el mismo objeto de resultados que ya usas para pintar
          la pantalla y para escribir la fila.
   fila:  número de fila recién escrita (opcional).
   ============================================================ */
function enviarCorreosRosa(datos, fila) {
  try {
    const d = _normalizarRosa(datos, fila);

    if (_yaNotificadoRosa(fila)) {
      Logger.log('Fila ' + fila + ': ya se habían enviado los correos, se omite.');
      return { ok: true, omitido: true };
    }

    // 1) Al funcionario
    if (d.correo) {
      _enviarRosa(d.correo,
        'Resultados de tu evaluación ergonómica · ' + d.nivel,
        htmlCorreoRosaUsuario(d));
    } else {
      Logger.log('Sin correo del funcionario: solo se notifica a Salud Organizacional.');
    }

    // 2) A Jane
    const esAlto = _estiloNivelRosa(d.nivel).color === MARCA_ROSA.ROJO;
    if (!CONFIG_ROSA.ALERTAR_ADMIN_SOLO_RIESGO_ALTO || esAlto) {
      _enviarRosa(CONFIG_ROSA.CORREO_ADMIN,
        (esAlto ? '⚠ Riesgo alto · ' : 'Nueva evaluación ergonómica · ') + (d.nombre || d.correo),
        htmlCorreoRosaAdmin(d),
        CONFIG_ROSA.COPIA_ADMIN);
    }

    _marcarNotificadoRosa(fila);
    return { ok: true };

  } catch (err) {
    // El guardado ya ocurrió: el correo nunca debe tumbar el flujo.
    Logger.log('enviarCorreosRosa falló: ' + err + ' | ' + (err.stack || ''));
    return { ok: false, error: String(err) };
  }
}

/* ============================================================
   NORMALIZACIÓN
   ------------------------------------------------------------
   Acepta varias formas de los mismos datos, para que no tengas
   que renombrar nada en tu app. Ajusta los alias si tus campos
   se llaman distinto.
   ============================================================ */
function _normalizarRosa(x, fila) {
  x = x || {};
  const max = Number(x.puntajeMax || x.maxPuntaje || CONFIG_ROSA.PUNTAJE_MAX);
  const puntaje = Number(x.puntaje != null ? x.puntaje : (x.puntajeTotal != null ? x.puntajeTotal : x.score));

  let nivel = x.nivel || x.nivelRiesgo || x.riesgo || '';
  let mensajeNivel = x.mensajeNivel || x.mensaje || '';
  if (!nivel) {
    nivel = puntaje >= CONFIG_ROSA.UMBRAL_INTERVENCION ? 'Riesgo alto' :
            puntaje >= 3 ? 'Riesgo medio' : 'Riesgo bajo';
  }
  if (!mensajeNivel) {
    mensajeNivel = puntaje >= CONFIG_ROSA.UMBRAL_INTERVENCION ?
      'Requiere intervención ergonómica.' :
      'Tu puesto está dentro de los parámetros aceptables.';
  }

  // Recomendaciones: acepta strings o {texto, etiqueta}
  const recos = (x.recomendaciones || x.acciones || x.correcciones || []).map(function (r) {
    if (typeof r === 'string') return { texto: r, etiqueta: '' };
    return { texto: r.texto || r.mensaje || r.descripcion || '', etiqueta: r.etiqueta || r.objeto || r.tag || '' };
  }).filter(function (r) { return r.texto; });

  // Secciones: acepta [{nombre,puntaje,estado}] o {Silla:{...}}
  let secciones = x.secciones || x.puntajePorSeccion || [];
  if (!Array.isArray(secciones)) {
    secciones = Object.keys(secciones).map(function (k) {
      const s = secciones[k] || {};
      return { nombre: k, puntaje: s.puntaje != null ? s.puntaje : s, estado: s.estado || '', max: s.max || max };
    });
  }
  secciones = secciones.map(function (s) {
    return { nombre: s.nombre || s.seccion || '', puntaje: s.puntaje, max: s.max || max,
             estado: s.estado || _estadoSeccionRosa(s.puntaje, s.max || max) };
  }).filter(function (s) { return s.nombre; });

  // Aviso (ej: foto no tomada de perfil)
  let aviso = x.aviso || x.advertencia || null;
  if (typeof aviso === 'string') aviso = { titulo: aviso, texto: '' };

  return {
    id: x.id || x.idRegistro || '',
    fila: fila || x.fila || '',
    nombre:   x.nombre || x.nombreCompleto || '',
    correo:   String(x.correo || x.email || '').trim(),
    cedula:   x.cedula || x.documento || '',
    cargo:    x.cargo || '',
    gerencia: x.gerencia || x.area || '',
    ciudad:   x.ciudad || '',
    sede:     x.sede || '',
    fecha:    _fechaRosa(x.fecha || new Date()),
    puntaje: puntaje,
    puntajeMax: max,
    nivel: nivel,
    mensajeNivel: mensajeNivel,
    umbral: x.umbral || ('El método ROSA fija en ' + CONFIG_ROSA.UMBRAL_INTERVENCION +
            ' el umbral a partir del cual se recomienda intervención ergonómica.'),
    objetos: x.objetos || x.objetosDetectados || [],
    secciones: secciones,
    recomendaciones: recos,
    aviso: aviso,
    linkHoja: 'https://docs.google.com/spreadsheets/d/' + CONFIG_ROSA.ID_HOJA + '/edit#gid=' + CONFIG_ROSA.GID_REGISTROS,
    linkPortal: CONFIG_ROSA.LINK_PORTAL,
    linkAdmin: CONFIG_ROSA.LINK_ADMIN || _urlAppRosa()
  };
}

function _estadoSeccionRosa(p, max) {
  const v = Number(p) / Number(max || 10);
  if (v >= 0.5) return 'Intervenir';
  if (v >= 0.3) return 'Revisar';
  return 'Aceptable';
}

/* ============================================================
   UTILIDADES
   ============================================================ */
function _hojaRosa() {
  const ss = SpreadsheetApp.openById(CONFIG_ROSA.ID_HOJA);
  const h = CONFIG_ROSA.NOMBRE_HOJA ? ss.getSheetByName(CONFIG_ROSA.NOMBRE_HOJA) : null;
  if (h) return h;
  return ss.getSheets().filter(function (s) { return s.getSheetId() === CONFIG_ROSA.GID_REGISTROS; })[0];
}

function _colPorEncabezadoRosa(nombre) {
  const hoja = _hojaRosa();
  if (!hoja || !nombre) return 0;
  const enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
                  .map(function (h) { return String(h).trim(); });
  return enc.indexOf(nombre) + 1;
}

function _yaNotificadoRosa(fila) {
  if (!fila || !CONFIG_ROSA.COL_CORREO_ENVIADO) return false;
  const col = _colPorEncabezadoRosa(CONFIG_ROSA.COL_CORREO_ENVIADO);
  if (!col) return false;
  return String(_hojaRosa().getRange(fila, col).getValue()).trim() !== '';
}

function _marcarNotificadoRosa(fila) {
  if (!fila || !CONFIG_ROSA.COL_CORREO_ENVIADO) return;
  const col = _colPorEncabezadoRosa(CONFIG_ROSA.COL_CORREO_ENVIADO);
  if (col) _hojaRosa().getRange(fila, col).setValue(new Date());
}

/** URL de la app publicada (/exec). Vacía si el proyecto no está implementado. */
function _urlAppRosa() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function _fechaRosa(v) {
  const d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v || '');
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy 'a las' HH:mm");
}

function _enviarRosa(destino, asunto, html, copia) {
  const real = CONFIG_ROSA.MODO_PRUEBA ? CONFIG_ROSA.CORREO_PRUEBA : destino;
  const pre  = CONFIG_ROSA.MODO_PRUEBA ? '[PRUEBA → ' + destino + '] ' : '';
  const opciones = { htmlBody: html, name: 'Salud Organizacional' };
  if (copia && !CONFIG_ROSA.MODO_PRUEBA) opciones.cc = copia;
  GmailApp.sendEmail(real, pre + asunto, '', opciones);
}

/* ============================================================
   PRUEBA — ejecútala y revisa tu buzón (usa datos de ejemplo,
   no toca la hoja).
   ============================================================ */
function probarCorreosRosa() {
  const ejemplo = {
    nombre: 'María Fernanda Ceballos Otero',
    correo: CONFIG_ROSA.CORREO_PRUEBA,
    cedula: '1000240911',
    cargo: 'Profesional Salud Organizacional',
    gerencia: 'Gerencia de Talento Humano',
    ciudad: 'Bogotá',
    fecha: new Date(),
    puntaje: 5,
    puntajeMax: 10,
    nivel: 'Riesgo alto',
    mensajeNivel: 'Requiere intervención ergonómica.',
    objetos: ['Silla'],
    aviso: { titulo: 'La foto no está tomada de perfil',
             texto: 'Los ángulos de cuello y espalda se miden mejor desde un costado. Repetir la foto de lado hará el resultado más preciso.' },
    secciones: [
      { nombre: 'Silla', puntaje: 3, max: 10, estado: 'Revisar' },
      { nombre: 'Monitor y teléfono', puntaje: 1, max: 10, estado: 'Aceptable' },
      { nombre: 'Mouse y teclado', puntaje: 5, max: 10, estado: 'Intervenir' }
    ],
    recomendaciones: [
      { texto: 'Baja la silla hasta que tus rodillas queden a 90°.', etiqueta: 'Silla' },
      { texto: 'Ajusta la profundidad del asiento: deja unos 8 cm entre el borde y tus rodillas.', etiqueta: 'Silla' },
      { texto: 'Acerca el mouse: debe quedar alineado con tu hombro, sin estirar el brazo.', etiqueta: 'Mouse' },
      { texto: 'Coloca mouse y teclado en la misma superficie y a la misma altura.', etiqueta: 'Mouse' },
      { texto: 'Mantén las muñecas rectas: más de 15° de extensión aumenta el riesgo.', etiqueta: 'Teclado' }
    ]
  };

  const d = _normalizarRosa(ejemplo, '');
  _enviarRosa(CONFIG_ROSA.CORREO_PRUEBA, '[PRUEBA 1/2] Resultados de tu evaluación ergonómica', htmlCorreoRosaUsuario(d));
  _enviarRosa(CONFIG_ROSA.CORREO_PRUEBA, '[PRUEBA 2/2] Alerta a la administradora', htmlCorreoRosaAdmin(d));
  Logger.log('Enviados 2 correos de prueba a ' + CONFIG_ROSA.CORREO_PRUEBA);
}