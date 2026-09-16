// ============================================================
// ROSA Expert — Ruta de ingreso (filtros 1, 2 y 3)
// Salud Organizacional · Seguros Bolívar
// ------------------------------------------------------------
// Cómo funciona:
//   1. Lee la métrica (FECHA_INICIO en DD/MM/AAAA).
//   2. A los DIAS_FILTRO_1 días de ingreso → Filtro 1 (Auto reporte).
//   3. Si el auto reporte tiene hallazgos → Filtro 2 (Seguimiento uno a uno).
//   4. Si el seguimiento tiene hallazgos → Filtro 3 (IPT visita virtual).
//   5. Cuando existe respuesta del formulario 3, el caso se cierra.
//
// Primer uso (desde el editor, en este orden):
//   a) Ejecuta probarRutaIngreso()   → revisa el registro de ejecución.
//   b) Ejecuta instalarRutaIngreso() → crea la hoja de seguimiento,
//      guarda los admins y programa el proceso diario.
// ============================================================

var CONFIG_RUTA = {
  // ── Métrica de colaboradores ──
  METRICA_ID:  '1C4FKoZogeSUqvgLyJE3E8KSMEktZPIlpBBs3uO1rlxQ',
  METRICA_GID: 741413293,

  // Posibles nombres de encabezado (sin importar tildes, mayúsculas ni espacios).
  // Si tu columna se llama distinto, agrega el nombre a la lista.
  COLUMNAS_METRICA: {
    fechaInicio: ['FECHA_INICIO'],
    cedula:   ['CEDULA', 'NUMERO_CEDULA', 'NUMERO_DE_CEDULA', 'IDENTIFICACION', 'NUMERO_IDENTIFICACION',
               'NUMERO_DE_IDENTIFICACION', 'DOCUMENTO', 'NUMERO_DOCUMENTO', 'NRO_DOCUMENTO', 'NO_DOCUMENTO'],
    nombre:   ['NOMBRE_COMPLETO', 'NOMBRES_Y_APELLIDOS', 'NOMBRE_EMPLEADO', 'NOMBRE', 'NOMBRES', 'EMPLEADO', 'COLABORADOR'],
    apellido: ['APELLIDOS', 'APELLIDO'],
    correo:   ['CORREO_CORPORATIVO', 'CORREO', 'EMAIL', 'CORREO_ELECTRONICO', 'MAIL', 'E_MAIL'],
    ciudad:   ['CIUDAD'],
    cargo:    ['CARGO'],
    estado:   ['ESTADO']
  },
  ESTADOS_INACTIVOS: ['inactivo', 'retirado', 'terminado', 'desvinculado'],

  // ── Administradores que NO están en la métrica ──
  // También usan la app como colaboradores: ven su evaluación y sus formularios.
  //   fechaInicio:   DD/MM/AAAA
  //   filtrosHechos: filtros que ya se les hicieron por fuera de la app
  //   cedula:        opcional. Con la cédula real (la misma que escriben en los
  //                  formularios) la ventana del formulario se cierra sola al enviarlo.
  PERFILES_ADMIN: [
    { correo: 'maria.ceballos@segurosbolivar.com', nombre: 'María Ceballos',
      cedula: '', fechaInicio: '21/07/2026', filtrosHechos: [] },
    { correo: 'saludorganizacional.bolivar@gmail.com', nombre: 'Antonio Bocanegra Hernández',
      cedula: '', fechaInicio: '21/07/2023', filtrosHechos: [1] },
    { correo: 'saludorganizacional.ergo@gmail.com', nombre: 'Salud Organizacional Ergo',
      cedula: '', fechaInicio: '21/07/2026', filtrosHechos: [] },
    { correo: 'saludorganizacional@segurosbolivar.com', nombre: 'Salud Organizacional',
      cedula: '', fechaInicio: '21/07/2026', filtrosHechos: [] }
  ],

  // ── Tiempos ──
  DIAS_FILTRO_1: 15,               // días desde FECHA_INICIO para habilitar el filtro 1
  VENTANA_NUEVOS_DIAS: 120,        // solo entran a la ruta quienes ingresaron hace ≤ este número de días
  DIAS_ALERTA: 8,                  // días esperando respuesta para marcar "vencido"
  DIAS_MAX_ENVIO_AUTOMATICO_F1: 7, // evita enviar el filtro 1 a toda la gente antigua el primer día

  ESCALAR_POR_ROSA_ALTO: true,     // una evaluación ROSA Alto/Muy Alto cuenta como hallazgo del filtro 2
  ENVIAR_CORREOS: true,            // usa CONFIG_ROSA.MODO_PRUEBA para redirigir en pruebas
  HOJA_SEGUIMIENTO: 'Ruta_Ingreso',
  ZONA: 'America/Bogota',

  // ── Formularios ──
  // Se diligencian dentro de la app (preguntas en Formularios.gs) y las
  // respuestas quedan en estas hojas del archivo de ROSA. No usan Google Forms.
  FORMULARIOS: {
    1: { titulo: 'Auto reporte de condiciones de puesto de trabajo',
         HOJA: 'Formulario_1_AutoReporte',
         COL_CEDULA: 'numero de identificacion',
         ENVIAR_A_COLABORADOR: true },
    2: { titulo: 'Seguimiento uno a uno',
         HOJA: 'Formulario_2_Seguimiento',
         COL_CEDULA: 'cedula',
         ENVIAR_A_COLABORADOR: true },
    3: { titulo: 'Inspección de puesto de trabajo en casa (IPT virtual)',
         HOJA: 'Formulario_3_IPT',
         COL_CEDULA: 'identificacion del teletrabajador',
         // Lo diligencia el profesional durante la visita: se avisa a los admins
         ENVIAR_A_COLABORADOR: false }
  },

  // ── Qué cuenta como hallazgo ──
  // pregunta: fragmento del encabezado · malo: respuesta que es hallazgo
  // activa: true = hace pasar al siguiente filtro · false = solo se informa
  REGLAS_F1: [
    { pregunta: 'ha presentado sintomatologia', malo: 'si', texto: 'Reporta síntomas en los últimos 6 meses', activa: true },
    { pregunta: 'area del suelo para ubicar la silla', malo: 'no', texto: 'Área del puesto menor a 1.75 m²', activa: true },
    { pregunta: 'escritorio que utilizas cuenta con una dimension minima', malo: 'no', texto: 'Escritorio menor a 90 × 60 cm', activa: true },
    { pregunta: 'que silla de trabajo utilizas', contiene: ['comedor', 'plastica', 'rimax', 'sofa', 'cama', 'banco', 'butaco', 'no tengo', 'no cuento'],
      texto: 'Silla no apta para trabajar varias horas', activa: true, mostrarValor: true },
    { pregunta: 'menos de 25 cm de distancia', malo: 'no', texto: 'Elementos de uso frecuente fuera de alcance', activa: true },
    { pregunta: 'te permite movilidad de la silla', malo: 'no', texto: 'Sin espacio para mover la silla', activa: true },
    { pregunta: 'ubicar el teclado manteniendo', malo: 'no', texto: 'Teclado sin mano, muñeca y brazo rectos', activa: true },
    { pregunta: 'el mouse lo ubicas al lado del teclado', malo: 'no', texto: 'Mouse separado del teclado', activa: true },
    { pregunta: 'como minimo 60cm para mover las piernas', malo: 'no', texto: 'Menos de 60 cm para las piernas', activa: true },
    { pregunta: 'ruidos continuos', malo: 'si', texto: 'Ruido continuo que impide concentrarse', activa: true },
    { pregunta: 'cantidad de luz es suficiente', malo: 'no', texto: 'Luz insuficiente', activa: true },
    { pregunta: 'leer sin ninguna dificultad', malo: 'no', texto: 'Dificultad para leer por la iluminación', activa: true },
    { pregunta: 'reflejos en la pantalla', malo: 'si', texto: 'Reflejos en la pantalla', activa: true },
    { pregunta: 'pasamanos y piso', malo: 'no', texto: 'Escaleras sin pasamanos o antideslizante', activa: true },
    { pregunta: 'escaleras estan libres de obstaculos', malo: 'no', texto: 'Escaleras con obstáculos', activa: true },
    { pregunta: 'piso, techo, paredes y puertas', malo: 'no', texto: 'Piso, techo, paredes o puertas en mal estado', activa: true },
    { pregunta: 'extensiones y enchufes se encuentran protegidos', malo: 'no', texto: 'Tomas o extensiones sin protección', activa: true },
    { pregunta: 'enmendaduras', malo: 'si', texto: 'Cables con enmendaduras', activa: true },
    { pregunta: 'sobrecargados con varias conexiones', malo: 'si', texto: 'Enchufes sobrecargados', activa: true },
    { pregunta: 'cajas de interruptores', malo: 'no', texto: 'Cajas de interruptores descubiertas', activa: true },

    { pregunta: 'ventilacion natural', malo: 'no', texto: 'Sin ventilación natural', activa: false },
    { pregunta: 'se encuentra en orden y limpio', malo: 'no', texto: 'Área de trabajo desordenada', activa: false },
    { pregunta: 'mitigue los reflejos', malo: 'no', texto: 'Ventana sin persiana o cortina', activa: false },
    { pregunta: 'profundidad del escalon', malo: 'no', texto: 'Escalón de menos de 30 cm', activa: false },
    { pregunta: 'suministro de agua potable', malo: 'no', texto: 'Sin agua potable', activa: false },
    { pregunta: 'procedimientos para actuar en caso de una emergencia', malo: 'no', texto: 'No conoce el procedimiento de emergencias', activa: false },
    { pregunta: 'acceso a puntos de encuentro', malo: 'no', texto: 'Sin punto de encuentro cercano', activa: false },
    { pregunta: 'medios de extincion o extintor', malo: 'no', texto: 'Sin extintor', activa: false },
    { pregunta: 'uso y manejo de extintores', malo: 'no', texto: 'No conoce el uso del extintor', activa: false },
    { pregunta: 'botiquin', malo: 'no', texto: 'Sin botiquín', activa: false },
    { pregunta: 'lineas y ubicacion de los centros de atencion', malo: 'no', texto: 'No conoce las líneas de emergencia', activa: false },
    { pregunta: 'hurtos, vandalismo', malo: 'si', texto: 'Exposición a hurtos o vandalismo', activa: false },
    { pregunta: 'derrumbe, incendio o inundacion', malo: 'si', texto: 'Zona con riesgo de derrumbe, incendio o inundación', activa: false },
    { pregunta: 'emisiones de humos', malo: 'si', texto: 'Cerca de emisiones de humo o gases', activa: false }
  ],

  REGLAS_F2: [
    { pregunta: 'elementos se encuentran en adecuado estado', malo: 'no', texto: 'Elementos en mal estado', activa: true },
    { pregunta: 'que elementos tienes en mal estado', noVacio: true, texto: 'Elementos reportados en mal estado', activa: true, mostrarValor: true },
    { pregunta: 'duda u observacion', noVacio: true, texto: 'Dejó una observación', activa: false, mostrarValor: true }
  ],

  COL_CONCEPTO_F3: 'concepto de la visita'
};

var DIA_MS_RUTA = 86400000;
var ENC_SEGUIMIENTO_RUTA = [
  'Cédula', 'Nombre', 'Correo', 'Fecha inicio', 'Días desde ingreso',
  'Etapa', 'Estado', 'Pendiente desde', 'Hallazgos',
  'Aviso filtro 1', 'Aviso filtro 2', 'Aviso filtro 3',
  'Decisión', 'Nota', 'Decidido por', 'Fecha decisión', 'Actualizado'
];
var VACIOS_RUTA = ['', 'no', 'ninguno', 'ninguna', 'n/a', 'na', 'no aplica', 'nada', '-', '.', 'ok', 'todo bien', 'sin observaciones'];

// ============================================================
// INSTALACIÓN Y PRUEBA
// ============================================================

/** Ejecutar UNA vez desde el editor. */
function instalarRutaIngreso() {
  configurarProyecto(null, ADMIN_EMAILS_POR_DEFECTO);
  _hojaSeguimientoRuta_();

  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'procesarRutaIngreso') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('procesarRutaIngreso')
    .timeBased().everyDays(1).atHour(7).inTimezone(CONFIG_RUTA.ZONA).create();

  Logger.log('Listo: admins guardados, hoja "' + CONFIG_RUTA.HOJA_SEGUIMIENTO +
             '" creada y proceso diario programado a las 7:00 a. m.');
}

/** No envía correos ni escribe nada: solo muestra qué entiende el sistema. */
function probarRutaIngreso() {
  var m = _leerMetricaRuta_();
  Logger.log('MÉTRICA — hoja "' + m.nombreHoja + '", ' + m.lista.length + ' personas leídas');
  Object.keys(m.columnas).forEach(function(k) {
    Logger.log('  ' + k + ' → ' + (m.columnas[k] >= 0 ? '"' + m.encabezados[m.columnas[k]] + '"' : 'NO ENCONTRADA'));
  });
  if (m.sinFecha) Logger.log('  ' + m.sinFecha + ' persona(s) sin FECHA_INICIO legible');

  var r = calcularRuta_();
  r.formularios.forEach(function(f) {
    Logger.log('FORMULARIO ' + f.n + ' — ' + f.respuestas + ' respuesta(s)' +
               (f.error ? ' · ERROR: ' + f.error : ''));
  });

  var conteo = {};
  r.casos.forEach(function(c) {
    var k = c.estado + (c.estado === 'pendiente' ? ' filtro ' + c.etapa : '');
    conteo[k] = (conteo[k] || 0) + 1;
  });
  Logger.log('CASOS EN RUTA: ' + r.casos.length + ' → ' + JSON.stringify(conteo));
  r.casos.slice(0, 5).forEach(function(c) {
    Logger.log('  ' + c.cedula + ' · ' + c.nombre + ' · ingreso ' + c.fechaInicio + ' (' + c.dias + ' días) · ' +
               c.estado + ' etapa ' + c.etapa);
  });
}

// ============================================================
// PROCESO DIARIO (activador)
// ============================================================
function procesarRutaIngreso() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    var r = calcularRuta_();
    var enviados = 0;

    if (CONFIG_RUTA.ENVIAR_CORREOS) {
      r.casos.forEach(function(c) {
        if (c.estado !== 'pendiente' || c.enviados[c.etapa]) return;
        if (c.etapa === 1 && c.diasEspera > CONFIG_RUTA.DIAS_MAX_ENVIO_AUTOMATICO_F1) return;
        var res = _enviarAvisoEtapaRuta_(c, c.etapa);
        if (res.ok) { c.enviados[c.etapa] = res.fecha; enviados++; }
        else Logger.log('No se envió aviso a ' + c.cedula + ': ' + res.error);
      });
    }

    _escribirSeguimientoRuta_(r.casos);
    Logger.log('Ruta de ingreso: ' + r.casos.length + ' casos, ' + enviados + ' aviso(s) enviados.');
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// HANDLERS (llamados desde rpcHandler)
// ============================================================
function handleRutaListar() {
  var r = calcularRuta_();
  return {
    ok: true,
    data: {
      casos: r.casos,
      formularios: r.formularios,
      metricaError: r.metricaError,
      sinFecha: r.sinFecha,
      generado: r.generado,
      config: {
        diasFiltro1: CONFIG_RUTA.DIAS_FILTRO_1,
        diasAlerta: CONFIG_RUTA.DIAS_ALERTA,
        ventana: CONFIG_RUTA.VENTANA_NUEVOS_DIAS
      }
    }
  };
}

function handleRutaDecidir(ses, params) {
  var ced = String(params.cedula || '').replace(/\D/g, '');
  var decision = String(params.decision || '');
  var permitidas = ['', 'escalar:1', 'escalar:2', 'cerrar:1', 'cerrar:2', 'cerrar:3'];
  if (!ced) return { ok: false, error: 'Falta la cédula' };
  if (permitidas.indexOf(decision) === -1) return { ok: false, error: 'Decisión no válida' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    _upsertSeguimientoRuta_(ced, {
      'Decisión': decision,
      'Nota': String(params.nota || '').slice(0, 500),
      'Decidido por': decision ? (ses.email || 'administrador') : '',
      'Fecha decisión': decision ? _ahoraTextoRuta_() : ''
    });
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function handleRutaEnviar(ses, params) {
  var ced = String(params.cedula || '').replace(/\D/g, '');
  var r = calcularRuta_();
  var c = r.casos.filter(function(x) { return x.cedula === ced; })[0];
  if (!c) return { ok: false, error: 'No encontré ese caso en la ruta' };
  if (c.estado !== 'pendiente') return { ok: false, error: 'El caso no tiene un filtro pendiente' };

  var res = _enviarAvisoEtapaRuta_(c, c.etapa);
  if (!res.ok) return res;

  var cambios = {};
  cambios['Aviso filtro ' + c.etapa] = res.fecha;
  _upsertSeguimientoRuta_(ced, cambios);
  return { ok: true, data: { fecha: res.fecha, etapa: c.etapa } };
}

/**
 * Lo que ve la persona en la app (usuario o admin): el formulario que le
 * toca, si tiene uno pendiente. Se busca por cédula y, si no hay, por correo.
 * Cuando no hay formulario, "motivo" explica por qué (los admins lo ven en
 * pantalla para poder revisar la configuración).
 */
function handleRutaMiEstado(cedula, correo) {
  var ced = String(cedula || '').replace(/\D/g, '');
  var mail = String(correo || '').trim().toLowerCase();
  var sinFormulario = function(motivo) { return { ok: true, data: null, motivo: motivo }; };
  if (!ced && !mail) return sinFormulario('La app no tiene tu cédula ni tu correo.');

  var r = calcularRuta_();
  if (r.metricaError) return sinFormulario('No se pudo leer la métrica: ' + r.metricaError);

  var c = r.casos.filter(function(x) {
    return (ced && x.cedula === ced) || (mail && x.correo === mail);
  })[0];

  if (!c) {
    var p = null;
    try { p = buscarPersonaMetricaRuta_(ced, mail); } catch (e) {}
    if (!p) {
      return sinFormulario('No encontramos ' + (mail ? 'el correo ' + mail : 'la cédula ' + ced) +
        ' en la métrica. Revisa que esté escrito igual en la columna de correo o de cédula.');
    }
    if (p.inactivo) return sinFormulario('Tu registro aparece inactivo en la métrica.');
    if (p.inicioUtc == null) return sinFormulario('Tu registro en la métrica no tiene FECHA_INICIO en formato DD/MM/AAAA.');
    return sinFormulario('Tu FECHA_INICIO es ' + p.fechaInicio + ': ingresaste hace más de ' +
      CONFIG_RUTA.VENTANA_NUEVOS_DIAS + ' días, así que no estás en la ruta de ingreso.');
  }

  if (c.estado === 'programado') return sinFormulario('Tu filtro 1 se habilita el ' + c.pendienteDesde + '.');
  if (c.estado === 'cerrado') return sinFormulario('Tu ruta de ingreso está cerrada: ' + c.motivo + '.');
  if (c.estado !== 'pendiente') return sinFormulario('Tu registro no tiene FECHA_INICIO legible.');

  var f = CONFIG_RUTA.FORMULARIOS[c.etapa];
  if (!f.ENVIAR_A_COLABORADOR) {
    return sinFormulario('Estás en el filtro ' + c.etapa + ': este lo diligencia Salud Organizacional durante la visita.');
  }
  return { ok: true, data: { etapa: c.etapa, titulo: f.titulo } };
}

/** Busca a una persona en la métrica por cédula o por correo. */
function buscarPersonaMetricaRuta_(ced, correo) {
  var e = String(correo || '').trim().toLowerCase();
  var m = _leerMetricaRuta_();
  for (var i = 0; i < m.lista.length; i++) {
    var p = m.lista[i];
    if ((ced && p.cedula === ced && !p.sinCedulaReal) || (e && p.correo === e)) return p;
  }
  return null;
}

// ============================================================
// CÁLCULO DE LA RUTA
// ============================================================
function calcularRuta_() {
  var hoy = _hoyUtcRuta_();
  var metrica = { lista: [], sinFecha: 0 };
  var metricaError = '';
  try { metrica = _leerMetricaRuta_(); } catch (e) { metricaError = e.message; }

  var forms = { 1: _leerFormularioRuta_(1), 2: _leerFormularioRuta_(2), 3: _leerFormularioRuta_(3) };
  var rosa = _leerRosaRuta_();
  var seg = _leerSeguimientoRuta_();

  var casos = [];
  metrica.lista.forEach(function(p) {
    var r1 = forms[1].porCedula[p.cedula];
    var r2 = forms[2].porCedula[p.cedula];
    var r3 = forms[3].porCedula[p.cedula];
    var s  = seg[p.cedula] || null;
    var dias = p.inicioUtc != null ? Math.floor((hoy - p.inicioUtc) / DIA_MS_RUTA) : null;

    var yaEnRuta = r1 || r2 || r3 || s || p.perfilAdmin;
    if (!yaEnRuta && (p.inactivo || dias === null || dias < 0 || dias > CONFIG_RUTA.VENTANA_NUEVOS_DIAS)) return;

    var ros = rosa.porCedula[p.cedula] || (p.correo ? rosa.porCorreo[p.correo.toLowerCase()] : null) || null;
    casos.push(_estadoCasoRuta_(p, dias, { 1: r1, 2: r2, 3: r3 }, forms, ros, s || {}, hoy));
  });

  casos.sort(_ordenCasosRuta_);

  return {
    casos: casos,
    metricaError: metricaError,
    sinFecha: metrica.sinFecha || 0,
    generado: _ahoraTextoRuta_(),
    formularios: [1, 2, 3].map(function(n) {
      var f = forms[n], cfg = CONFIG_RUTA.FORMULARIOS[n];
      return { n: n, titulo: cfg.titulo, conectado: f.conectado, error: f.error,
               respuestas: Object.keys(f.porCedula).length };
    })
  };
}

function _estadoCasoRuta_(p, dias, resp, forms, rosa, s, hoy) {
  var dec = String(s.decision || '');
  var decUtc = s.fechaDecisionUtc || hoy;
  var hechos = p.filtrosHechos || [];

  // Filtros que Salud Organizacional ya hizo por fuera: la persona sigue al próximo
  if (!dec && hechos.length) {
    var ultimo = Math.max.apply(null, hechos);
    dec = ultimo >= 3 ? 'cerrar:3' : 'escalar:' + ultimo;
    decUtc = p.inicioUtc != null ? Math.max(p.inicioUtc, hoy) : hoy;
  }

  var c = {
    cedula: p.cedula, nombre: p.nombre, correo: p.correo, ciudad: p.ciudad, cargo: p.cargo,
    fechaInicio: p.fechaInicio, dias: dias,
    etapa: 1, estado: '', motivo: '',
    pendienteDesde: '', diasEspera: null, vencido: false,
    filtros: {},
    rosa: rosa ? { fecha: rosa.fecha, puntaje: rosa.puntaje, nivel: rosa.nivel } : null,
    decision: String(s.decision || ''), nota: s.nota || '', decididoPor: s.decididoPor || '', fechaDecision: s.fechaDecision || '',
    enviados: s.enviados || {},
    perfilAdmin: !!p.perfilAdmin,
    sinCedulaReal: !!p.sinCedulaReal
  };

  // Hallazgos de cada formulario respondido
  var h = { 1: [], 2: [] };
  if (resp[1]) h[1] = _hallazgosRuta_(resp[1], forms[1], CONFIG_RUTA.REGLAS_F1);
  if (resp[2]) {
    h[2] = _hallazgosRuta_(resp[2], forms[2], CONFIG_RUTA.REGLAS_F2);
    if (CONFIG_RUTA.ESCALAR_POR_ROSA_ALTO && rosa && /alto/i.test(rosa.nivel || '')) {
      h[2].push({ texto: 'Evaluación ROSA con riesgo ' + rosa.nivel, detalle: '', activa: true });
    }
  }
  var activa = function(lista) { return lista.some(function(x) { return x.activa; }); };

  var pendiente = function(etapa, desdeUtc) {
    c.etapa = etapa; c.estado = 'pendiente';
    var d = desdeUtc != null ? desdeUtc : hoy;
    c.pendienteDesde = _fechaTextoUtcRuta_(d);
    c.diasEspera = Math.max(0, Math.floor((hoy - d) / DIA_MS_RUTA));
    c.vencido = c.diasEspera > CONFIG_RUTA.DIAS_ALERTA;
  };
  var cerrar = function(etapa, motivo) { c.etapa = etapa; c.estado = 'cerrado'; c.motivo = motivo; };

  if (resp[3]) {
    cerrar(3, 'Visita virtual realizada');
  } else if (dec.indexOf('cerrar:') === 0) {
    cerrar(Number(dec.split(':')[1]) || 1, 'Cerrado por Salud Organizacional');
  } else if (resp[2] || dec === 'escalar:2') {
    if (!resp[2]) pendiente(3, decUtc);
    else if (activa(h[2])) pendiente(3, resp[2].fechaUtc);
    else if (dec === 'escalar:2') pendiente(3, decUtc);
    else cerrar(2, 'Sin hallazgos en el seguimiento');
  } else if (resp[1] || dec === 'escalar:1') {
    if (!resp[1]) pendiente(2, decUtc);
    else if (activa(h[1])) pendiente(2, resp[1].fechaUtc);
    else if (dec === 'escalar:1') pendiente(2, decUtc);
    else cerrar(1, 'Sin hallazgos en el auto reporte');
  } else if (p.inicioUtc == null) {
    c.estado = 'sin_fecha';
  } else {
    var fechaF1 = p.inicioUtc + CONFIG_RUTA.DIAS_FILTRO_1 * DIA_MS_RUTA;
    if (hoy < fechaF1) {
      c.estado = 'programado';
      c.pendienteDesde = _fechaTextoUtcRuta_(fechaF1);
    } else {
      pendiente(1, fechaF1);
    }
  }

  // Detalle por filtro
  [1, 2, 3].forEach(function(n) {
    var r = resp[n];
    var estado;
    if (r || hechos.indexOf(n) !== -1) estado = 'completado';
    else if (n < c.etapa) estado = 'omitido';
    else if (n === c.etapa && c.estado === 'pendiente') estado = 'pendiente';
    else if (n === 1 && c.estado === 'programado') estado = 'programado';
    else estado = c.estado === 'cerrado' ? 'no_aplica' : 'en_espera';

    c.filtros[n] = {
      estado: estado,
      fecha: r ? r.fecha : (hechos.indexOf(n) !== -1 ? 'realizado por fuera de la app' : ''),
      hallazgos: n < 3 ? h[n] : [],
      concepto: (n === 3 && r) ? _valorColumnaRuta_(r, forms[3], CONFIG_RUTA.COL_CONCEPTO_F3) : '',
      aviso: c.enviados[n] || ''
    };
  });

  return c;
}

function _ordenCasosRuta_(a, b) {
  var peso = function(c) {
    if (c.estado === 'pendiente' && c.vencido) return 0;
    if (c.estado === 'pendiente') return 1;
    if (c.estado === 'programado') return 2;
    if (c.estado === 'sin_fecha') return 3;
    return 4;
  };
  var d = peso(a) - peso(b);
  if (d) return d;
  if (a.estado === 'pendiente') return (b.diasEspera || 0) - (a.diasEspera || 0);
  return (a.dias == null ? 99999 : a.dias) - (b.dias == null ? 99999 : b.dias);
}

function _hallazgosRuta_(resp, form, reglas) {
  var res = [];
  reglas.forEach(function(regla) {
    var col = _columnaPorFragmentoRuta_(form.encNorm, regla.pregunta);
    if (col === -1) return;
    var valor = String(resp.valores[col] || '').trim();
    var v = _normRuta_(valor);
    if (!v) return;

    var hit = false;
    if (regla.malo) {
      // "No aplica" nunca cuenta como "No"
      hit = v.indexOf('no aplica') !== 0 && v !== 'n/a' &&
            (v === regla.malo || v.indexOf(regla.malo + ' ') === 0 || v.indexOf(regla.malo + ',') === 0);
    } else if (regla.contiene) {
      hit = regla.contiene.some(function(k) { return v.indexOf(_normRuta_(k)) !== -1; });
    } else if (regla.noVacio) {
      hit = VACIOS_RUTA.indexOf(v) === -1;
    }
    if (hit) res.push({ texto: regla.texto, detalle: regla.mostrarValor ? valor : '', activa: !!regla.activa });
  });
  return res;
}

// ============================================================
// LECTURA DE HOJAS
// ============================================================
function _leerMetricaRuta_() {
  var hoja = _hojaPorGidRuta_(CONFIG_RUTA.METRICA_ID, CONFIG_RUTA.METRICA_GID, '');
  var rango = hoja.getDataRange();
  var raw = rango.getValues();
  var disp = rango.getDisplayValues();
  var enc = disp[0] || [];
  var claves = enc.map(_claveEncabezadoRuta_);

  var cols = {};
  Object.keys(CONFIG_RUTA.COLUMNAS_METRICA).forEach(function(k) {
    cols[k] = _columnaPorClaveRuta_(claves, CONFIG_RUTA.COLUMNAS_METRICA[k]);
  });
  if (cols.fechaInicio === -1) throw new Error('La métrica no tiene la columna FECHA_INICIO');
  if (cols.cedula === -1) throw new Error('No encontré la columna de cédula en la métrica. Agrega su nombre en COLUMNAS_METRICA.cedula');
  // Si "nombre" y "apellido" apuntan a la misma columna, no se duplica
  if (cols.apellido === cols.nombre) cols.apellido = -1;

  var celda = function(fila, k) { return cols[k] >= 0 ? String(disp[fila][cols[k]] || '').trim() : ''; };
  var lista = [], sinFecha = 0;

  for (var i = 1; i < raw.length; i++) {
    var ced = _cedulaRuta_(raw[i][cols.cedula], disp[i][cols.cedula]);
    if (!ced) continue;

    var f = _parseFechaRuta_(raw[i][cols.fechaInicio], disp[i][cols.fechaInicio]);
    if (!f) sinFecha++;

    var nombre = [celda(i, 'nombre'), celda(i, 'apellido')].filter(Boolean).join(' ');
    var estado = _normRuta_(celda(i, 'estado'));

    lista.push({
      cedula: ced,
      nombre: _tituloNombreRuta_(nombre),
      correo: celda(i, 'correo').toLowerCase(),
      ciudad: celda(i, 'ciudad'),
      cargo: celda(i, 'cargo'),
      fechaInicio: f ? f.texto : celda(i, 'fechaInicio'),
      inicioUtc: f ? f.utc : null,
      inactivo: CONFIG_RUTA.ESTADOS_INACTIVOS.indexOf(estado) !== -1
    });
  }

  _agregarPerfilesAdminRuta_(lista);

  return { lista: lista, sinFecha: sinFecha, columnas: cols, encabezados: enc, nombreHoja: hoja.getName() };
}

/**
 * Suma a la lista los administradores de PERFILES_ADMIN que no estén ya en
 * la métrica. Sin cédula real se les asigna una interna (99000000NN) que
 * nunca coincide con una persona real.
 */
function _agregarPerfilesAdminRuta_(lista) {
  (CONFIG_RUTA.PERFILES_ADMIN || []).forEach(function(perfil, i) {
    var correo = String(perfil.correo || '').trim().toLowerCase();
    var ced = String(perfil.cedula || '').replace(/\D/g, '');
    var yaEsta = lista.some(function(p) {
      return (correo && p.correo === correo) || (ced && p.cedula === ced);
    });
    if (yaEsta || (!correo && !ced)) return;

    var f = _parseFechaRuta_(null, perfil.fechaInicio);
    lista.push({
      cedula: ced || String(9900000000 + i + 1),
      nombre: perfil.nombre || correo.split('@')[0],
      correo: correo,
      ciudad: '',
      cargo: 'Administrador',
      fechaInicio: f ? f.texto : String(perfil.fechaInicio || ''),
      inicioUtc: f ? f.utc : null,
      inactivo: false,
      perfilAdmin: true,
      sinCedulaReal: !ced,
      filtrosHechos: (perfil.filtrosHechos || []).map(Number).filter(function(n) { return n >= 1 && n <= 3; })
    });
  });
}

function _leerFormularioRuta_(n) {
  var cfg = CONFIG_RUTA.FORMULARIOS[n];
  var out = { conectado: true, porCedula: {}, encNorm: [], error: '' };

  try {
    var hoja = SpreadsheetApp.openById(getSpreadsheetId()).getSheetByName(cfg.HOJA);
    if (!hoja || hoja.getLastRow() < 2) return out;   // aún nadie ha respondido
    var rango = hoja.getDataRange();
    var raw = rango.getValues();
    var disp = rango.getDisplayValues();
    out.encNorm = (disp[0] || []).map(_normRuta_);

    var colCed = _columnaPorFragmentoRuta_(out.encNorm, cfg.COL_CEDULA);
    if (colCed === -1) throw new Error('No encontré la columna de cédula ("' + cfg.COL_CEDULA + '")');
    var colFecha = out.encNorm.indexOf('marca temporal');

    for (var i = 1; i < raw.length; i++) {
      var ced = _cedulaRuta_(raw[i][colCed], disp[i][colCed]);
      if (!ced) continue;

      var f = colFecha >= 0 ? _parseFechaRuta_(raw[i][colFecha], disp[i][colFecha]) : null;
      var orden = (colFecha >= 0 && raw[i][colFecha] instanceof Date) ? raw[i][colFecha].getTime() : i;
      var previa = out.porCedula[ced];
      if (previa && previa.orden > orden) continue;

      out.porCedula[ced] = {
        orden: orden, fila: i + 1, valores: disp[i],
        fecha: f ? f.texto : '', fechaUtc: f ? f.utc : null
      };
    }
    out.conectado = true;
  } catch (e) {
    out.error = e.message;
  }
  return out;
}

/** Última evaluación ROSA por cédula y por correo (hoja "Registros"). */
function _leerRosaRuta_() {
  var out = { porCedula: {}, porCorreo: {} };
  try {
    var rows = getSheet('Registros').getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (!rows[i][0]) continue;
      var fecha = rows[i][0] instanceof Date ? rows[i][0] : new Date(rows[i][0]);
      var t = isNaN(fecha.getTime()) ? 0 : fecha.getTime();
      var item = {
        t: t,
        fecha: t ? Utilities.formatDate(fecha, CONFIG_RUTA.ZONA, 'dd/MM/yyyy') : '',
        puntaje: Number(rows[i][2]) || 0,
        nivel: String(rows[i][3] || '')
      };
      var ced = String(rows[i][14] || '').replace(/\D/g, '');
      var correo = String(rows[i][1] || '').trim().toLowerCase();
      if (ced && (!out.porCedula[ced] || out.porCedula[ced].t <= t)) out.porCedula[ced] = item;
      if (correo && (!out.porCorreo[correo] || out.porCorreo[correo].t <= t)) out.porCorreo[correo] = item;
    }
  } catch (e) {
    Logger.log('Ruta: no se pudo leer "Registros" — ' + e.message);
  }
  return out;
}

// ── Hoja de seguimiento (en el spreadsheet de ROSA) ──
function _hojaSeguimientoRuta_() {
  var ss = SpreadsheetApp.openById(getSpreadsheetId());
  var hoja = ss.getSheetByName(CONFIG_RUTA.HOJA_SEGUIMIENTO);
  if (!hoja) {
    hoja = ss.insertSheet(CONFIG_RUTA.HOJA_SEGUIMIENTO);
    hoja.getRange(1, 1, 1, ENC_SEGUIMIENTO_RUTA.length).setValues([ENC_SEGUIMIENTO_RUTA])
      .setFontWeight('bold').setBackground('#005224').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.getRange('A:A').setNumberFormat('@');
  }
  return hoja;
}

function _leerSeguimientoRuta_() {
  var mapa = {};
  var hoja;
  try { hoja = _hojaSeguimientoRuta_(); } catch (e) { return mapa; }
  var datos = hoja.getDataRange().getDisplayValues();
  var idx = function(nombre) { return ENC_SEGUIMIENTO_RUTA.indexOf(nombre); };

  for (var i = 1; i < datos.length; i++) {
    var ced = String(datos[i][0] || '').replace(/\D/g, '');
    if (!ced) continue;
    var fd = _parseFechaRuta_(null, datos[i][idx('Fecha decisión')]);
    var enviados = {};
    [1, 2, 3].forEach(function(n) {
      var v = datos[i][idx('Aviso filtro ' + n)];
      if (v) enviados[n] = v;
    });
    mapa[ced] = {
      fila: i + 1,
      decision: datos[i][idx('Decisión')] || '',
      nota: datos[i][idx('Nota')] || '',
      decididoPor: datos[i][idx('Decidido por')] || '',
      fechaDecision: datos[i][idx('Fecha decisión')] || '',
      fechaDecisionUtc: fd ? fd.utc : null,
      enviados: enviados
    };
  }
  return mapa;
}

/** Reescribe la hoja completa con el estado del día, conservando filas que ya no salen en la ruta. */
function _escribirSeguimientoRuta_(casos) {
  var hoja = _hojaSeguimientoRuta_();
  var datos = hoja.getDataRange().getDisplayValues();
  var filas = {}, orden = [];

  for (var i = 1; i < datos.length; i++) {
    var ced = String(datos[i][0] || '').replace(/\D/g, '');
    if (!ced) continue;
    filas[ced] = datos[i].slice(0, ENC_SEGUIMIENTO_RUTA.length);
    orden.push(ced);
  }

  var ahora = _ahoraTextoRuta_();
  casos.forEach(function(c) {
    var hallazgos = []
      .concat(c.filtros[1].hallazgos, c.filtros[2].hallazgos)
      .filter(function(x) { return x.activa; })
      .map(function(x) { return x.texto; }).join(' | ');

    var fila = [
      c.cedula, c.nombre, c.correo, c.fechaInicio, c.dias == null ? '' : c.dias,
      c.etapa, _estadoLegibleRuta_(c), c.pendienteDesde, hallazgos,
      c.enviados[1] || '', c.enviados[2] || '', c.enviados[3] || '',
      c.decision, c.nota, c.decididoPor, c.fechaDecision, ahora
    ];
    if (!filas[c.cedula]) orden.push(c.cedula);
    filas[c.cedula] = fila;
  });

  if (!orden.length) return;
  var valores = orden.map(function(ced) { return filas[ced]; });
  hoja.getRange(2, 1, Math.max(hoja.getLastRow() - 1, 1), ENC_SEGUIMIENTO_RUTA.length).clearContent();
  hoja.getRange(2, 1, valores.length, 1).setNumberFormat('@');
  hoja.getRange(2, 1, valores.length, ENC_SEGUIMIENTO_RUTA.length).setValues(valores);
}

function _upsertSeguimientoRuta_(ced, cambios) {
  var hoja = _hojaSeguimientoRuta_();
  var datos = hoja.getRange(1, 1, Math.max(hoja.getLastRow(), 1), 1).getDisplayValues();
  var fila = -1;
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]).replace(/\D/g, '') === ced) { fila = i + 1; break; }
  }
  if (fila === -1) {
    fila = hoja.getLastRow() + 1;
    hoja.getRange(fila, 1).setNumberFormat('@').setValue(ced);
  }
  Object.keys(cambios).forEach(function(k) {
    var col = ENC_SEGUIMIENTO_RUTA.indexOf(k) + 1;
    if (col > 0) hoja.getRange(fila, col).setValue(cambios[k]);
  });
}

// ============================================================
// CORREOS DE LA RUTA
// ============================================================
function _enviarAvisoEtapaRuta_(c, etapa) {
  var cfg = CONFIG_RUTA.FORMULARIOS[etapa];
  try {
    if (cfg.ENVIAR_A_COLABORADOR) {
      if (!c.correo) return { ok: false, error: 'El colaborador no tiene correo en la métrica' };
      _enviarRosa(c.correo, 'Tienes un formulario de Salud Organizacional: ' + cfg.titulo, htmlCorreoRutaColaborador_(c, etapa));
    }
    if (etapa === 3) {
      _enviarRosa(getAdminEmails().join(','), 'Caso para visita virtual · ' + (c.nombre || c.cedula), htmlCorreoRutaAdmin_(c));
    }
    return { ok: true, fecha: _ahoraTextoRuta_() };
  } catch (e) {
    return { ok: false, error: 'No se pudo enviar el correo: ' + e.message };
  }
}

function htmlCorreoRutaColaborador_(c, etapa) {
  var cfg = CONFIG_RUTA.FORMULARIOS[etapa];
  var nombre = _escHtmlRuta_((c.nombre || '').split(' ')[0]);
  var intro = {
    1: 'Te damos la bienvenida. Para cuidar tu salud desde tus primeras semanas, queremos conocer cómo es tu puesto de trabajo. ' +
       'Cuéntanos sus condiciones en el ' + _resaltaRosa('auto reporte') + '.',
    2: 'Revisamos tu auto reporte y queremos hacer un ' + _resaltaRosa('seguimiento uno a uno') + ' de tu puesto de trabajo. ' +
       'Te pediremos una foto actual y el estado de tus elementos.',
    3: 'Según tu seguimiento, vamos a realizar una ' + _resaltaRosa('inspección virtual') + ' de tu puesto de trabajo. ' +
       'Salud Organizacional te contactará para acordar la visita.'
  }[etapa];

  return _plantillaBaseRosa(
    _bandaRosa(_txtRosa('Hola ' + _resaltaRosa(nombre) + ',<br><br>' + intro), '#FFFFFF', 20, 14) +
    _franjaRosa('Formulario pendiente:', cfg.titulo) +
    _bandaRosa(_botonRosa(_urlAppRosa(), 'DILIGENCIAR EN ROSA EXPERT', 'Al abrir la app, el formulario aparece de una vez. Te toma unos minutos.'), '#FFFFFF', 24, 12) +
    _cierreRosa(_urlAppRosa())
  );
}

function htmlCorreoRutaAdmin_(c) {
  var hallazgos = [].concat(c.filtros[1].hallazgos, c.filtros[2].hallazgos)
    .filter(function(x) { return x.activa; });

  var datos = [
    ['Colaborador', c.nombre], ['Cédula', c.cedula], ['Correo', c.correo],
    ['Fecha de ingreso', c.fechaInicio], ['Ciudad', c.ciudad]
  ].filter(function(p) { return p[1]; }).map(function(p) {
    return '<tr><td style="padding:5px 0;font-family:arial,helvetica,sans-serif;font-size:15px;color:' + MARCA_ROSA.GRIS + ';width:40%;">' +
      p[0] + ':</td><td style="padding:5px 0;font-family:arial,helvetica,sans-serif;font-size:15px;font-weight:bold;color:' +
      MARCA_ROSA.TEXTO + ';">' + _escHtmlRuta_(p[1]) + '</td></tr>';
  }).join('');

  var lista = hallazgos.length
    ? '<ul style="margin:0 0 18px;padding-left:20px;font-family:arial,helvetica,sans-serif;font-size:15px;line-height:1.6;color:' + MARCA_ROSA.TEXTO + ';">' +
      hallazgos.map(function(x) {
        return '<li>' + _escHtmlRuta_(x.texto) + (x.detalle ? ': <i>' + _escHtmlRuta_(x.detalle) + '</i>' : '') + '</li>';
      }).join('') + '</ul>'
    : _txtRosa('Pasó al filtro 3 por decisión manual.', 'left');

  return _plantillaBaseRosa(
    _bandaRosa(_txtRosa('Hola,<br><br>' + _resaltaRosa(_escHtmlRuta_(c.nombre || c.cedula)) +
      ' completó el seguimiento uno a uno y tiene hallazgos. Hay que programar la ' + _resaltaRosa('inspección virtual (filtro 3)') + '.'),
      '#FFFFFF', 20, 14) +
    _franjaRosa('Ruta de ingreso:', 'Filtro 3 pendiente') +
    _bandaRosa(
      _tituloRosa('DATOS DEL COLABORADOR') +
      '<table role="presentation" width="100%" style="margin:0 0 18px;">' + datos + '</table>' +
      _tituloRosa('HALLAZGOS') + lista +
      _botonRosa(_urlAppRosa(), 'ABRIR RUTA DE INGRESO', 'En el caso del colaborador encuentras el formulario de la visita.'),
      '#FFFFFF', 18, 18) +
    _cierreRosa(_urlAppRosa())
  );
}

// ============================================================
// UTILIDADES
// ============================================================
function _hojaPorGidRuta_(id, gid, nombre) {
  var ss = SpreadsheetApp.openById(id);
  if (nombre) {
    var porNombre = ss.getSheetByName(nombre);
    if (porNombre) return porNombre;
  }
  if (gid !== null && gid !== undefined && gid !== '') {
    var hojas = ss.getSheets();
    for (var i = 0; i < hojas.length; i++) {
      if (hojas[i].getSheetId() === Number(gid)) return hojas[i];
    }
    throw new Error('No encontré la pestaña con gid ' + gid);
  }
  return ss.getSheets()[0];
}

function _normRuta_(s) {
  return String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!"“”()\[\]]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function _claveEncabezadoRuta_(s) {
  return String(s == null ? '' : s).toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function _columnaPorClaveRuta_(claves, candidatos) {
  var cands = candidatos.map(_claveEncabezadoRuta_);
  for (var i = 0; i < cands.length; i++) {
    var exacta = claves.indexOf(cands[i]);
    if (exacta !== -1) return exacta;
  }
  // "FECHA_INICIO_DD_MM_AAAA" también sirve para "FECHA_INICIO"
  for (var j = 0; j < cands.length; j++) {
    if (cands[j].length < 6) continue;
    for (var k = 0; k < claves.length; k++) {
      if (claves[k].indexOf(cands[j]) === 0) return k;
    }
  }
  return -1;
}

function _columnaPorFragmentoRuta_(encNorm, fragmento) {
  var f = _normRuta_(fragmento);
  for (var i = 0; i < encNorm.length; i++) {
    if (encNorm[i].indexOf(f) !== -1) return i;
  }
  return -1;
}

function _valorColumnaRuta_(resp, form, fragmento) {
  var col = _columnaPorFragmentoRuta_(form.encNorm, fragmento);
  return col === -1 ? '' : String(resp.valores[col] || '').trim();
}

function _cedulaRuta_(raw, disp) {
  if (typeof raw === 'number') return String(Math.round(raw));
  return String(disp != null && disp !== '' ? disp : (raw || '')).replace(/\D/g, '');
}

/**
 * Fecha → { utc, texto }. Si la celda ya es fecha se usa tal cual;
 * si es texto se lee como DD/MM/AAAA.
 */
function _parseFechaRuta_(raw, disp) {
  var y, m, d;
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    var p = Utilities.formatDate(raw, CONFIG_RUTA.ZONA, 'yyyy-MM-dd').split('-');
    y = +p[0]; m = +p[1]; d = +p[2];
  } else {
    var s = String(disp != null && disp !== '' ? disp : (raw || '')).trim();
    var a = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    var b = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (a) { d = +a[1]; m = +a[2]; y = +a[3]; if (y < 100) y += 2000; }
    else if (b) { y = +b[1]; m = +b[2]; d = +b[3]; }
    else return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  var utc = Date.UTC(y, m - 1, d);
  return { utc: utc, texto: _fechaTextoUtcRuta_(utc) };
}

function _hoyUtcRuta_() {
  var p = Utilities.formatDate(new Date(), CONFIG_RUTA.ZONA, 'yyyy-MM-dd').split('-');
  return Date.UTC(+p[0], +p[1] - 1, +p[2]);
}

function _fechaTextoUtcRuta_(utc) {
  return Utilities.formatDate(new Date(utc), 'UTC', 'dd/MM/yyyy');
}

function _ahoraTextoRuta_() {
  return Utilities.formatDate(new Date(), CONFIG_RUTA.ZONA, 'dd/MM/yyyy HH:mm');
}

function _estadoLegibleRuta_(c) {
  if (c.estado === 'pendiente') return (c.vencido ? 'Vencido' : 'Pendiente') + ' filtro ' + c.etapa;
  if (c.estado === 'programado') return 'Programado';
  if (c.estado === 'sin_fecha') return 'Sin fecha de inicio';
  return 'Cerrado · ' + c.motivo;
}

function _tituloNombreRuta_(s) {
  return String(s || '').toLowerCase().replace(/(^|\s)\S/g, function(l) { return l.toUpperCase(); });
}

function _escHtmlRuta_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
