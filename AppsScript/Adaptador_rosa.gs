/**
 * ============================================================
 * ADAPTADOR_ROSA.GS — Puente entre handleSaveEvaluation y los correos
 * Salud Organizacional · Seguros Bolívar
 * ------------------------------------------------------------
 * Traduce el "record" que ya recibe handleSaveEvaluation al
 * formato que esperan htmlCorreoRosaUsuario / htmlCorreoRosaAdmin.
 * No toca nada del guardado.
 * ============================================================
 */

function _recordARosa(record, fila) {
  var r = record || {};
  var puntaje = Number(r.puntajeFinal) || 0;
  var nivel = r.nivelRiesgo || nivelRiesgoDesdeScore_(puntaje);

  // Recomendaciones: llegan como arreglo de textos o como "a | b | c"
  var lista = Array.isArray(r.recomendaciones)
    ? r.recomendaciones
    : String(r.recomendaciones || '').split('|');

  var recos = lista.map(function (t) { return String(t).trim(); })
                   .filter(function (t) { return t; })
                   .map(function (t) { return { texto: t, etiqueta: _etiquetaRecoRosa(t) }; });

  // Puntaje por sección (mismos nombres que ves en pantalla)
  var secciones = [];
  if (r.puntajeSilla != null)    secciones.push({ nombre: 'Silla',              puntaje: Number(r.puntajeSilla)    || 0, max: 10 });
  if (r.puntajePantalla != null) secciones.push({ nombre: 'Monitor y teléfono', puntaje: Number(r.puntajePantalla) || 0, max: 10 });
  if (r.puntajeTeclado != null)  secciones.push({ nombre: 'Mouse y teclado',    puntaje: Number(r.puntajeTeclado)  || 0, max: 10 });

  return {
    fila: fila || '',
    nombre: r.nombre || (r.email ? String(r.email).split('@')[0] : ''),
    correo: r.email || '',
    cedula: r.cedula || '',
    fecha: r.fecha || new Date(),
    puntaje: puntaje,
    puntajeMax: 10,
    nivel: nivel,
    mensajeNivel: _mensajeNivelRosa(nivel),
    objetos: _objetosLegiblesRosa(r.objetosDetectados),
    secciones: secciones,
    recomendaciones: recos,
    aviso: _avisoEncuadreRosa(r.encuadre)
  };
}

/** Deduce la pastilla (SILLA / MOUSE / TECLADO...) desde el texto. */
function _etiquetaRecoRosa(texto) {
  var t = String(texto).toLowerCase();
  if (t.indexOf('silla') >= 0 || t.indexOf('asiento') >= 0 || t.indexOf('respaldo') >= 0 ||
      t.indexOf('apoyabrazo') >= 0 || t.indexOf('reposapi') >= 0) return 'Silla';
  if (t.indexOf('mouse') >= 0 || t.indexOf('ratón') >= 0) return 'Mouse';
  if (t.indexOf('teclado') >= 0 || t.indexOf('muñeca') >= 0) return 'Teclado';
  if (t.indexOf('monitor') >= 0 || t.indexOf('pantalla') >= 0 || t.indexOf('cuello') >= 0) return 'Monitor';
  if (t.indexOf('teléfono') >= 0 || t.indexOf('telefono') >= 0 || t.indexOf('diadema') >= 0) return 'Teléfono';
  if (t.indexOf('escritorio') >= 0 || t.indexOf('superficie') >= 0) return 'Escritorio';
  return '';
}

function _mensajeNivelRosa(nivel) {
  var n = String(nivel).toLowerCase();
  if (n.indexOf('muy alto') >= 0) return 'Requiere intervención ergonómica prioritaria.';
  if (n.indexOf('alto') >= 0)     return 'Requiere intervención ergonómica.';
  if (n.indexOf('medio') >= 0)    return 'Se recomienda ajustar los puntos señalados y volver a evaluar.';
  return 'Tu puesto está dentro de los parámetros aceptables.';
}

/** objetosDetectados puede venir como ['silla'] o [{clase:'silla',...}]. */
function _objetosLegiblesRosa(objetos) {
  if (!objetos) return [];
  var vistos = {};
  return (Array.isArray(objetos) ? objetos : [objetos])
    .map(function (o) { return String(o && o.clase ? o.clase : o).trim(); })
    .filter(function (c) {
      if (!c || vistos[c.toLowerCase()]) return false;
      vistos[c.toLowerCase()] = true;
      return true;
    })
    .map(function (c) { return c.charAt(0).toUpperCase() + c.slice(1); });
}

/** Convierte el encuadre de Gemini en el aviso amarillo del correo. */
function _avisoEncuadreRosa(encuadre) {
  var e = encuadre || {};
  if (e.esPerfil === false) {
    return { titulo: 'La foto no está tomada de perfil',
             texto: 'Los ángulos de cuello y espalda se miden mejor desde un costado. Repetir la foto de lado hará el resultado más preciso.' };
  }
  if (e.cuerpoCompleto === false) {
    return { titulo: 'La foto no muestra el cuerpo completo',
             texto: 'Para medir bien es necesario ver cabeza, tronco y piernas en la misma toma.' };
  }
  if (e.iluminacionSuficiente === false) {
    return { titulo: 'La foto tiene poca luz',
             texto: 'Con mejor iluminación el análisis identifica más elementos del puesto de trabajo.' };
  }
  return null;
}