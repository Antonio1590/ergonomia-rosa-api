/**
 * ============================================================
 * CORREOS_ROSA.GS — Plantillas HTML (marca Seguros Bolívar)
 * Salud Organizacional · Evaluación ergonómica ROSA
 * ------------------------------------------------------------
 * Construido sobre la plantilla institucional: contenedor de
 * 600 px, banner superior e inferior, verde #008044, texto
 * #3c3c3b, acento amarillo #ffdc5d y márgenes laterales de 41 px.
 *
 * Funciones públicas (no cambian, Envio_ROSA sigue igual):
 *   htmlCorreoRosaUsuario(d)  -> al funcionario
 *   htmlCorreoRosaAdmin(d)    -> alerta a la administradora
 * ============================================================
 */

const MARCA_ROSA = {
  VERDE:      '#008044',
  VERDE_OSC:  '#006634',
  VERDE_BG:   '#EDF6F1',
  AMARILLO:   '#FFDC5D',
  AMARILLO_BG:'#FFF7DF',
  AMARILLO_OSC:'#8A6100',
  TEXTO:      '#3c3c3b',
  GRIS:       '#6B675C',
  BORDE:      '#DDDDDD',
  ROJO:       '#C1272D',
  ROJO_BG:    '#FBEAEA',

  // Banners institucionales (los de la plantilla que te pasaron)
  IMG_ENCABEZADO: 'https://image.ci.segurosbolivar.com/lib/fe3411747364047b741071/m/1/1868003e-3241-42b8-967f-cfceafa62872.jpg',
  IMG_PIE:        'https://image.ci.segurosbolivar.com/lib/fe3411747364047b741071/m/1/57eb12d2-bb79-4e44-9c0a-9ab5fd9e5e4c.jpg',

  CORREO_SOPORTE: 'saludorganizacional@segurosbolivar.com'
};

/* Color según el nivel de riesgo o el estado de una sección. */
function _estiloNivelRosa(texto) {
  const t = String(texto || '').toLowerCase();
  if (t.indexOf('alto') >= 0 || t.indexOf('interven') >= 0 || t.indexOf('crítico') >= 0 || t.indexOf('critico') >= 0)
    return { color: MARCA_ROSA.ROJO, fondo: MARCA_ROSA.ROJO_BG };
  if (t.indexOf('medio') >= 0 || t.indexOf('moderado') >= 0 || t.indexOf('revisar') >= 0)
    return { color: MARCA_ROSA.AMARILLO_OSC, fondo: MARCA_ROSA.AMARILLO_BG };
  return { color: MARCA_ROSA.VERDE, fondo: MARCA_ROSA.VERDE_BG };
}

/* ------------------------------------------------------------
   Bloques de la plantilla institucional
   ------------------------------------------------------------ */

/** Banda de contenido con los márgenes laterales de 41 px de la marca. */
function _bandaRosa(contenido, fondo, arriba, abajo) {
  const bg = fondo || '#FFFFFF';
  return '<table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color:' + bg +
    ';min-width:100%;border-top:' + (arriba == null ? 15 : arriba) + 'px solid ' + bg +
    ';border-right:41px solid ' + bg + ';border-bottom:' + (abajo == null ? 15 : abajo) + 'px solid ' + bg +
    ';border-left:41px solid ' + bg + ';">' +
    '<tr><td style="padding:0;">' + contenido + '</td></tr></table>';
}

/** Imagen de ancho completo (banners). */
function _imagenRosa(url) {
  return '<table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width:100%;">' +
    '<tr><td align="center"><img src="' + url + '" alt="" width="800" ' +
    'style="display:block;padding:0;text-align:center;height:auto;width:100%;border:0;"></td></tr></table>';
}

/** Texto corriente de la marca (19 px, gris). */
function _txtRosa(html, alineacion) {
  return '<div style="text-align:' + (alineacion || 'justify') + ';">' +
    '<span style="font-size:19px;font-family:arial,helvetica,sans-serif;color:' + MARCA_ROSA.TEXTO + ';line-height:1.5;">' +
    html + '</span></div>';
}

/** Resalta un valor en verde institucional, como en la plantilla. */
function _resaltaRosa(t) {
  return '<span style="color:' + MARCA_ROSA.VERDE + ';"><b>' + t + '</b></span>';
}

/** Franja verde con el dato destacado (equivale al "estado" del ticket). */
function _franjaRosa(etiqueta, valor) {
  return _bandaRosa(
    '<span style="color:#ffffff;font-size:19px;font-family:arial,helvetica,sans-serif;">' + etiqueta + ' </span>' +
    '<span style="color:' + MARCA_ROSA.AMARILLO + ';font-size:19px;font-family:arial,helvetica,sans-serif;"><b>' + valor + '</b></span>',
    MARCA_ROSA.VERDE, 20, 20);
}

/** Título de sección: verde, mayúsculas, subrayado amarillo. */
function _tituloRosa(t) {
  return '<p style="margin:0 0 14px;font-family:arial,helvetica,sans-serif;font-size:15px;font-weight:bold;' +
    'color:' + MARCA_ROSA.VERDE + ';letter-spacing:.05em;border-bottom:3px solid ' + MARCA_ROSA.AMARILLO +
    ';display:inline-block;padding-bottom:5px;">' + t + '</p>';
}

/* ------------------------------------------------------------
   Piezas de contenido
   ------------------------------------------------------------ */

/** Puntaje grande con barra proporcional. */
function _puntajeRosa(d) {
  const e = _estiloNivelRosa(d.nivel);
  const max = d.puntajeMax || 10;
  const pct = Math.max(4, Math.min(100, Math.round((Number(d.puntaje) / max) * 100)));

  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ' + MARCA_ROSA.BORDE + ';border-radius:6px;margin:0 0 18px;">' +
    '<tr><td style="padding:18px 20px;">' +
      '<table role="presentation" width="100%"><tr>' +
        '<td style="vertical-align:middle;width:110px;font-family:arial,helvetica,sans-serif;">' +
          '<span style="font-size:46px;font-weight:bold;color:' + e.color + ';line-height:1;">' + d.puntaje + '</span>' +
          '<div style="font-size:13px;color:' + MARCA_ROSA.GRIS + ';margin-top:4px;">de ' + max + '</div>' +
        '</td>' +
        '<td style="vertical-align:middle;font-family:arial,helvetica,sans-serif;">' +
          '<div style="font-size:12px;font-weight:bold;color:' + MARCA_ROSA.GRIS + ';letter-spacing:.08em;margin-bottom:8px;">PUNTAJE ROSA</div>' +
          '<span style="font-size:14px;font-weight:bold;color:' + e.color + ';background:' + e.fondo + ';border-radius:20px;padding:6px 14px;">' + (d.nivel || '') + '</span>' +
          (d.mensajeNivel ? '<div style="font-size:15px;color:' + MARCA_ROSA.TEXTO + ';margin-top:10px;line-height:1.5;">' + d.mensajeNivel + '</div>' : '') +
        '</td>' +
      '</tr></table>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background:#EEEEEE;border-radius:20px;">' +
        '<tr><td style="width:' + pct + '%;background:' + e.color + ';border-radius:20px;font-size:0;line-height:0;height:8px;">&nbsp;</td>' +
        '<td style="font-size:0;line-height:0;height:8px;">&nbsp;</td></tr>' +
      '</table>' +
      (d.umbral ? '<div style="margin-top:14px;padding:12px 14px;background:' + MARCA_ROSA.AMARILLO_BG + ';border-radius:6px;font-family:arial,helvetica,sans-serif;font-size:14px;line-height:1.5;color:' + MARCA_ROSA.TEXTO + ';">' + d.umbral + '</div>' : '') +
    '</td></tr></table>';
}

/** Aviso de calidad de la foto. */
function _avisoRosa(aviso) {
  if (!aviso || !aviso.titulo) return '';
  return '<table role="presentation" width="100%" style="background:' + MARCA_ROSA.AMARILLO_BG + ';border-left:5px solid ' + MARCA_ROSA.AMARILLO + ';border-radius:6px;margin:0 0 18px;">' +
    '<tr><td style="padding:14px 18px;font-family:arial,helvetica,sans-serif;">' +
      '<div style="font-size:15px;font-weight:bold;color:' + MARCA_ROSA.AMARILLO_OSC + ';">' + aviso.titulo + '</div>' +
      (aviso.texto ? '<div style="font-size:14px;line-height:1.5;color:' + MARCA_ROSA.TEXTO + ';margin-top:6px;">' + aviso.texto + '</div>' : '') +
    '</td></tr></table>';
}

/** Lista numerada "Qué corregir primero". */
function _recomendacionesRosa(recos) {
  if (!recos || !recos.length) {
    return '<table role="presentation" width="100%" style="background:' + MARCA_ROSA.VERDE_BG + ';border-radius:6px;margin:0 0 18px;">' +
      '<tr><td style="padding:16px 18px;font-family:arial,helvetica,sans-serif;font-size:15px;line-height:1.6;color:' + MARCA_ROSA.TEXTO + ';">' +
      'Tu puesto de trabajo no generó ajustes prioritarios. Mantén la postura y realiza pausas activas durante la jornada.' +
      '</td></tr></table>';
  }

  return recos.map(function (r, i) {
    return '<table role="presentation" width="100%" style="border:1px solid ' + MARCA_ROSA.BORDE + ';border-left:5px solid ' + MARCA_ROSA.VERDE + ';border-radius:6px;margin:0 0 10px;">' +
      '<tr>' +
        '<td style="padding:14px 0 14px 16px;width:36px;vertical-align:top;font-family:arial,helvetica,sans-serif;">' +
          '<span style="display:inline-block;width:24px;height:24px;background:' + MARCA_ROSA.VERDE + ';border-radius:20px;text-align:center;font-size:13px;font-weight:bold;line-height:24px;color:#ffffff;">' + (i + 1) + '</span>' +
        '</td>' +
        '<td style="padding:14px 16px 14px 10px;font-family:arial,helvetica,sans-serif;font-size:15px;line-height:1.6;color:' + MARCA_ROSA.TEXTO + ';">' +
          r.texto +
          (r.etiqueta ? ' <span style="font-size:11px;font-weight:bold;color:' + MARCA_ROSA.VERDE + ';background:' + MARCA_ROSA.VERDE_BG + ';border-radius:20px;padding:3px 9px;white-space:nowrap;">' + String(r.etiqueta).toUpperCase() + '</span>' : '') +
        '</td>' +
      '</tr></table>';
  }).join('');
}

/** Puntaje por sección. */
function _seccionesRosa(secciones) {
  if (!secciones || !secciones.length) return '';
  const filas = secciones.map(function (s) {
    const e = _estiloNivelRosa(s.estado);
    return '<tr>' +
      '<td style="padding:12px 0;border-top:1px solid ' + MARCA_ROSA.BORDE + ';font-family:arial,helvetica,sans-serif;font-size:15px;font-weight:bold;color:' + MARCA_ROSA.TEXTO + ';">' + s.nombre + '</td>' +
      '<td align="right" style="padding:12px 0;border-top:1px solid ' + MARCA_ROSA.BORDE + ';font-family:arial,helvetica,sans-serif;font-size:15px;color:' + MARCA_ROSA.GRIS + ';white-space:nowrap;">' + s.puntaje + '/' + (s.max || 10) + '</td>' +
      '<td align="right" style="padding:12px 0 12px 12px;border-top:1px solid ' + MARCA_ROSA.BORDE + ';">' +
        '<span style="font-family:arial,helvetica,sans-serif;font-size:12px;font-weight:bold;color:' + e.color + ';background:' + e.fondo + ';border-radius:20px;padding:5px 11px;white-space:nowrap;">' + s.estado + '</span>' +
      '</td></tr>';
  }).join('');

  return _tituloRosa('PUNTAJE POR SECCIÓN') +
    '<table role="presentation" width="100%" style="margin:0 0 20px;border-collapse:collapse;">' + filas + '</table>';
}

/** Objetos detectados en la foto. */
function _objetosRosa(objetos) {
  if (!objetos || !objetos.length) return '';
  const chips = objetos.map(function (o) {
    return '<span style="display:inline-block;font-family:arial,helvetica,sans-serif;font-size:13px;font-weight:bold;color:' + MARCA_ROSA.VERDE +
      ';background:' + MARCA_ROSA.VERDE_BG + ';border-radius:20px;padding:6px 14px;margin:0 6px 6px 0;">' + o + '</span>';
  }).join('');
  return _tituloRosa('OBJETOS DETECTADOS EN TU FOTO') + '<div style="margin:0 0 18px;">' + chips + '</div>';
}

/** Botón institucional. */
function _botonRosa(url, texto, nota) {
  if (!url) return '';
  return '<div style="text-align:center;margin:6px 0 4px;">' +
    '<a href="' + url + '" style="display:inline-block;background:' + MARCA_ROSA.VERDE + ';color:#ffffff;text-decoration:none;' +
    'padding:15px 34px;border-radius:6px;font-family:arial,helvetica,sans-serif;font-size:16px;font-weight:bold;">' + texto + '</a>' +
    (nota ? '<div style="margin-top:10px;font-family:arial,helvetica,sans-serif;font-size:13px;color:' + MARCA_ROSA.GRIS + ';">' + nota + '</div>' : '') +
    '</div>';
}

/* ------------------------------------------------------------
   Envoltura: banner + contenido + cierre + banner
   ------------------------------------------------------------ */
function _plantillaBaseRosa(bandas) {
  return '' +
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">' +
  '<html><head>' +
  '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
  '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />' +
  '<style type="text/css">' +
  'body{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;margin:0 !important;}' +
  'table td{border-collapse:collapse;} img{outline:0;} a img{border:none;}' +
  '@media only screen and (max-width:480px){' +
  '.container{width:100% !important;} img{max-width:100% !important;height:auto !important;}' +
  'body{padding:0 !important;font-size:16px !important;line-height:150% !important;}}' +
  '</style></head>' +
  '<body bgcolor="#ffffff" text="#000000" style="background-color:#ffffff;color:#000000;padding:0;' +
  '-webkit-text-size-adjust:none;font-size:16px;font-family:arial,helvetica,sans-serif;">' +
  '<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center"><tr><td align="center">' +
  '<table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">' +
  '<tr><td>' +
  '<table cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%" style="background-color:#FFFFFF;">' +
  '<tr><td align="center" valign="top">' +
    _imagenRosa(MARCA_ROSA.IMG_ENCABEZADO) +
    bandas +
    _imagenRosa(MARCA_ROSA.IMG_PIE) +
  '</td></tr></table>' +
  '</td></tr></table></td></tr></table></body></html>';
}

/** Cierre institucional, igual al de la plantilla. */
function _cierreRosa(linkApp) {
  const enlace = linkApp
    ? '<a href="' + linkApp + '" rel="noreferrer noopener" target="_blank" style="color:' + MARCA_ROSA.VERDE + ';">la aplicación de Evaluación Ergonómica</a>'
    : 'la aplicación de Evaluación Ergonómica';

  return _bandaRosa(
    '<div style="text-align:center;font-family:arial,helvetica,sans-serif;">' +
      '<span style="color:' + MARCA_ROSA.VERDE + ';font-size:19px;"><b>Gracias por cuidar tu bienestar</b></span><br>' +
      '<span style="color:' + MARCA_ROSA.VERDE + ';font-size:19px;"><b>¡Te deseamos un día lleno de éxitos y alegría!</b></span><br>' +
      '<span style="color:' + MARCA_ROSA.TEXTO + ';font-size:19px;line-height:1.5;">Si tienes alguna pregunta adicional escríbenos a ' +
      '<a href="mailto:' + MARCA_ROSA.CORREO_SOPORTE + '" style="color:' + MARCA_ROSA.VERDE + ';">' + MARCA_ROSA.CORREO_SOPORTE + '</a> ' +
      'o vuelve a ' + enlace + '. Estamos aquí para ayudarte en todo momento.</span>' +
    '</div>', '#FFFFFF', 15, 15);
}

/* ============================================================
   1) CORREO AL FUNCIONARIO
   ============================================================ */
function htmlCorreoRosaUsuario(d) {
  const nombre = (d.nombre || '').split(' ')[0];

  const intro = _bandaRosa(
    _txtRosa('Hola ' + _resaltaRosa(nombre) + ', esperamos que estés teniendo un día maravilloso.<br><br>' +
      'Queremos contarte que ya tenemos el resultado de tu ' + _resaltaRosa('evaluación ergonómica de puesto de trabajo') +
      ', realizada el ' + _resaltaRosa(d.fecha || '') + '. A continuación encuentras tu puntaje y los ajustes que te recomendamos hacer.'),
    '#FFFFFF', 10, 12);

  const franja = _franjaRosa('Tu resultado ROSA es:',
    d.puntaje + '/' + (d.puntajeMax || 10) + ' · ' + (d.nivel || ''));

  const detalle = _bandaRosa(
    _puntajeRosa(d) +
    _avisoRosa(d.aviso) +
    _tituloRosa('QUÉ CORREGIR PRIMERO') +
    _recomendacionesRosa(d.recomendaciones) +
    '<div style="height:18px;"></div>' +
    _seccionesRosa(d.secciones) +
    _objetosRosa(d.objetos) +
    _botonRosa(d.linkPortal, 'VOLVER A EVALUAR MI PUESTO', 'Cuando apliques los ajustes, repite la foto y compara tu progreso.') +
    '<div style="height:8px;"></div>' +
    '<table role="presentation" width="100%" style="background:' + MARCA_ROSA.VERDE_BG + ';border-radius:6px;">' +
      '<tr><td style="padding:14px 18px;font-family:arial,helvetica,sans-serif;font-size:14px;line-height:1.6;color:' + MARCA_ROSA.TEXTO + ';">' +
        '<b style="color:' + MARCA_ROSA.VERDE + ';">Ten en cuenta:</b> el método ROSA es una herramienta de tamizaje y no reemplaza una valoración presencial. ' +
        'Si después de aplicar los ajustes sigues con molestias, escríbenos y agendamos una evaluación con el equipo.' +
      '</td></tr></table>',
    '#FFFFFF', 18, 18);

  return _plantillaBaseRosa(intro + franja + detalle + _cierreRosa(d.linkPortal));
}

/* ============================================================
   2) CORREO A LA ADMINISTRADORA (Jane)
   ============================================================ */
function htmlCorreoRosaAdmin(d) {
  const alto = _estiloNivelRosa(d.nivel).color === MARCA_ROSA.ROJO;

  const datos = [
    ['Funcionario', d.nombre],
    ['Correo', d.correo],
    ['Cédula', d.cedula],
    ['Fecha de evaluación', d.fecha],
    ['Registro', d.fila ? 'Fila ' + d.fila + ' de "Registros"' : '']
  ].filter(function (p) { return p[1]; }).map(function (p) {
    return '<tr>' +
      '<td style="padding:5px 0;font-family:arial,helvetica,sans-serif;font-size:15px;color:' + MARCA_ROSA.GRIS + ';width:42%;">' + p[0] + ':</td>' +
      '<td style="padding:5px 0;font-family:arial,helvetica,sans-serif;font-size:15px;font-weight:bold;color:' + MARCA_ROSA.TEXTO + ';">' + p[1] + '</td>' +
    '</tr>';
  }).join('');

  const intro = _bandaRosa(
    _txtRosa('Hola, esperamos que estés teniendo un día maravilloso.<br><br>' +
      'Te informamos que ' + _resaltaRosa(d.nombre || d.correo || 'un funcionario') +
      ' acaba de completar la evaluación ergonómica de su puesto de trabajo y el registro ya quedó guardado.' +
      (alto ? ' El resultado ' + _resaltaRosa('requiere seguimiento del área') + '.' : '')),
    '#FFFFFF', 10, 12);

  const franja = _franjaRosa(alto ? 'Resultado que requiere seguimiento:' : 'Resultado de la evaluación:',
    d.puntaje + '/' + (d.puntajeMax || 10) + ' · ' + (d.nivel || ''));

  const detalle = _bandaRosa(
    _tituloRosa('DATOS DEL FUNCIONARIO') +
    '<table role="presentation" width="100%" style="background:' + MARCA_ROSA.VERDE_BG + ';border-radius:6px;margin:0 0 18px;">' +
      '<tr><td style="padding:16px 18px;"><table role="presentation" width="100%">' + datos + '</table></td></tr></table>' +
    _puntajeRosa(d) +
    _seccionesRosa(d.secciones) +
    _tituloRosa('RECOMENDACIONES ENVIADAS AL FUNCIONARIO') +
    _recomendacionesRosa(d.recomendaciones) +
    _avisoRosa(d.aviso) +
    _objetosRosa(d.objetos) +
    _botonRosa(d.linkAdmin || d.linkHoja,
      d.linkAdmin ? 'ABRIR EL PANEL ADMINISTRADOR' : 'ABRIR LA HOJA DE REGISTROS',
      d.linkAdmin ? 'Allí ves todas las evaluaciones y su seguimiento.' : 'Allí ves el histórico completo de evaluaciones.'),
    '#FFFFFF', 18, 18);

  return _plantillaBaseRosa(intro + franja + detalle + _cierreRosa(d.linkAdmin));
}