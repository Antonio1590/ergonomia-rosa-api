// ============================================================
// ROSA Expert — Formularios propios de la ruta de ingreso
// ------------------------------------------------------------
// Reemplazan a Google Forms: se diligencian dentro de la app y cada
// respuesta queda como una fila en una hoja del archivo de ROSA:
//   Formulario_1_AutoReporte · Formulario_2_Seguimiento · Formulario_3_IPT
//
// Los encabezados son los mismos textos de los formularios originales,
// así las reglas de hallazgos de Ruta_Ingreso.gs los reconocen.
// Para cambiar una pregunta u opción, edítala aquí: si agregas una
// pregunta nueva, su columna se crea sola al guardar la siguiente respuesta.
//
// Tipos de campo:
//   seccion · nota · autorizacion · fijo (dato de la persona, no editable)
//   texto · numero · correo · parrafo · opcion · casillas · cuadricula
//   tablaSelects (dos listas por fila) · foto
// "si": { campo, valor } muestra la pregunta solo con esa respuesta.
// ============================================================

var SI_NO_F = ['Sí', 'No'];
var SI_NO_NA_F = ['Sí', 'No', 'No aplica'];

var TEXTO_AUTORIZACION_F =
  'AUTORIZACIÓN PARA LA UTILIZACIÓN DE LOS DATOS PERSONALES (LEY 1581 DE 2012) Autorizo a Compañía de Seguros Bolívar S.A., ' +
  'Capitalizadora Bolívar S.A., Grupo Bolívar S.A., Seguros Comerciales Bolívar S.A., Servicios Bolívar S.A., Investigaciones y ' +
  'Cobranzas El Libertador S.A., Agencia de Seguros El Libertador Ltda., Fundación Cultiva El Arte La Cultura, Bolívar Salud IPS S.A.S., ' +
  'Salud Bolívar EPS S.A.S., en adelante Empresas Bolívar y Servicios Bolívar Facilities S.A.S., para que traten los datos que he incluido ' +
  'en el presente formulario, con el fin de participar y beneficiarme de las actividades que realiza el área de Bienestar & Salud ' +
  'Organizacional para el fomento del autocuidado de mi salud. Entiendo que en el desarrollo de las mismas, se podrán tratar datos de ' +
  'carácter sensible como de salud, biométricos y desde ahora autorizo de manera explícita su tratamiento.';

var SEGMENTOS_F = [
  ['Cuello', 'Cuello'], ['Espalda Alta', 'Espalda Alta'], ['Espalda Baja', 'Espalda baja'],
  ['Hombro(s)', 'Hombro(s)'], ['Codo(s)', 'Codo(s)'], ['Antebrazo(s)', 'Antebrazo(s)'],
  ['Muñeca(s)', 'Muñeca(s)'], ['Mano(s)', 'Mano(s)'], ['Cadera(s)', 'Cadera(s)'],
  ['Muslo(s)', 'Muslo(s)'], ['Rodilla(s)', 'Rodilla(s)'], ['Pierna(s)', 'Pierna(s)'],
  ['Cuello(s) de pie(s) o pie(s)', 'Cuello(s) de pie(s) o pie(s)']
];

/** Filas de una cuadrícula: el encabezado queda "Grupo [pregunta]". */
function _filasF_(prefijo, grupo, preguntas) {
  return preguntas.map(function(q, i) {
    return { id: prefijo + (i + 1), etiqueta: q, encabezado: grupo + ' [' + q + ']' };
  });
}

var ESQUEMAS_FORM = {

  // ────────────────────────────────────────────────────────────
  1: {
    titulo: 'Auto reporte de condiciones de puesto de trabajo',
    hoja: 'Formulario_1_AutoReporte',
    intro: 'Cuéntanos cómo es tu puesto de trabajo. Te toma unos 10 minutos.',
    campos: [
      { tipo: 'autorizacion', id: 'aut', encabezado: TEXTO_AUTORIZACION_F, texto: TEXTO_AUTORIZACION_F },

      { tipo: 'seccion', titulo: 'Tus datos' },
      { tipo: 'fijo', id: 'cedula', origen: 'cedula', etiqueta: 'Número de identificación',
        encabezado: 'Número de identificación (sin puntos, comas ni espacios)' },
      { tipo: 'numero', id: 'celular', etiqueta: 'Número de celular', requerido: true,
        encabezado: 'Número de Celular (sin puntos, comas ni espacios)' },
      { tipo: 'texto', id: 'ciudad', etiqueta: 'Ciudad del lugar de teletrabajo', requerido: true,
        encabezado: 'Ciudad del lugar de teletrabajo' },
      { tipo: 'texto', id: 'direccion', etiqueta: 'Dirección del lugar de teletrabajo', requerido: true,
        encabezado: 'Dirección del lugar de Teletrabajo' },

      { tipo: 'seccion', titulo: 'Sintomatología' },
      { tipo: 'opcion', id: 'sintomas', etiqueta: '¿Has presentado sintomatología en los últimos 6 meses?', opciones: SI_NO_F,
        requerido: true, encabezado: '¿Ha presentado sintomatología en los últimos 6 meses?' },
      { tipo: 'casillas', id: 'sistemas', etiqueta: '¿Con cuál(es) sistema(s) está asociada la sintomatología?',
        opciones: ['Osteomuscular (dolor en músculos, huesos o articulaciones)', 'Visual', 'Auditivo', 'Voz', 'Otro'],
        requerido: true, si: { campo: 'sintomas', valor: 'Sí' },
        encabezado: '¿Con cuál(es) sistema(s) está asociada la sintomatología reportada?' },
      { tipo: 'tablaSelects', id: 'segmentos', etiqueta: 'Frecuencia y severidad por zona del cuerpo',
        ayuda: 'Marca solo las zonas donde sientes molestia.',
        si: { campo: 'sintomas', valor: 'Sí' },
        columnas: [
          { clave: 'frec', titulo: 'Frecuencia', opciones: ['Nunca', 'Ocasional', 'Frecuente', 'Permanente'] },
          { clave: 'sev', titulo: 'Severidad', opciones: ['Sin dolor', 'Leve', 'Moderado', 'Severo'] }
        ],
        filas: SEGMENTOS_F.map(function(s, i) {
          return { id: 'seg' + (i + 1), etiqueta: s[0],
                   encabezados: { frec: 'Frecuencia [' + s[0] + ']', sev: 'Severidad [' + s[1] + ']' } };
        }) },

      { tipo: 'seccion', titulo: 'Tu puesto de trabajo' },
      { tipo: 'opcion', id: 'area', opciones: SI_NO_F, requerido: true,
        etiqueta: '¿El área del suelo para ubicar la silla y el escritorio tiene como mínimo 1.75 m²?',
        encabezado: '¿El área del suelo para ubicar la silla y el escritorio tiene como mínimo 1.75 m²?' },
      { tipo: 'opcion', id: 'herramienta', requerido: true,
        opciones: ['Computador portátil', 'Computador de escritorio', 'Tablet', 'Celular'],
        etiqueta: '¿Qué herramienta tecnológica usas con mayor frecuencia para tu trabajo?',
        encabezado: '¿Qué herramienta tecnológica usas con mayor frecuencia para tu trabajo?' },
      { tipo: 'opcion', id: 'herramientaDe', requerido: true, opciones: ['Propia', 'De la compañía'],
        etiqueta: 'Esta herramienta tecnológica es:', encabezado: 'Esta herramienta tecnológica es:' },
      { tipo: 'opcion', id: 'escritorio', opciones: SI_NO_F, requerido: true,
        etiqueta: '¿El escritorio que utilizas cuenta con una dimensión mínima de 90 x 60 cm?',
        encabezado: '¿El escritorio que utilizas cuenta con una dimensión mínima de 90 x 60 cm?' },
      { tipo: 'opcion', id: 'silla', requerido: true,
        opciones: ['Silla ergonómica (ajustable)', 'Silla de oficina sin ajustes', 'Silla de comedor', 'Silla plástica',
                   'Banco o butaco', 'Sofá o cama', 'No tengo silla'],
        etiqueta: '¿Qué silla de trabajo utilizas?', encabezado: '¿Qué silla de trabajo utilizas?' },
      { tipo: 'cuadricula', id: 'puesto', etiqueta: 'Puesto de trabajo', opciones: SI_NO_F, requerido: true,
        filas: _filasF_('pt', 'Puesto de Trabajo', [
          '¿Los elementos de trabajo que más usas se encuentran ubicados a menos de 25 cm de distancia de alcance?',
          '¿La ubicación del puesto de trabajo te permite movilidad de la silla?',
          '¿El escritorio te permite ubicar el teclado manteniendo la mano, muñeca y brazo rectos?',
          '¿El mouse lo ubicas al lado del teclado (y no en otro nivel del escritorio) de modo que se pueda alcanzar fácilmente y con la muñeca recta?',
          '¿El espacio debajo del escritorio tiene como mínimo 60cm para mover las piernas?',
          '¿El área de trabajo tiene ventilación natural (ventanas)?',
          '¿En tu puesto de trabajo existen ruidos continuos que te impidan concentrarte?',
          '¿El área de trabajo se encuentra en orden y limpio?'
        ]) },

      { tipo: 'seccion', titulo: 'Voz y audición' },
      { tipo: 'opcion', id: 'voz', requerido: true,
        opciones: ['No la uso de forma continua', 'Menos de 2 horas', 'Entre 2 y 4 horas', 'Más de 4 horas'],
        etiqueta: '¿Cuánto tiempo utilizas la voz como herramienta de trabajo de manera continua?',
        encabezado: '¿Cuánto tiempo utilizas la voz como herramienta de trabajo de manera continua?' },
      { tipo: 'opcion', id: 'auditivos', opciones: SI_NO_F, requerido: true,
        etiqueta: '¿Para el desarrollo de tu labor es indispensable el uso de elementos auditivos externos?',
        encabezado: '¿Para el desarrollo de tu labor es indispensable el uso de elementos auditivos externos?' },
      { tipo: 'casillas', id: 'auditivosTipo', requerido: true, si: { campo: 'auditivos', valor: 'Sí' },
        opciones: ['Diadema', 'Audífonos de inserción', 'Audífonos de copa', 'Parlantes'],
        etiqueta: '¿Qué tipo de elementos auditivos externos usas?',
        encabezado: '¿Qué tipo de elementos auditivos externos usas?' },
      { tipo: 'opcion', id: 'auditivosTiempo', requerido: true, si: { campo: 'auditivos', valor: 'Sí' },
        opciones: ['Menos de 2 horas', 'Entre 2 y 4 horas', 'Más de 4 horas'],
        etiqueta: '¿Cuánto tiempo utilizas estos elementos auditivos externos de manera continua?',
        encabezado: '¿Cuánto tiempo utilizas estos elementos auditivos externos de manera continua?' },

      { tipo: 'seccion', titulo: 'Foto de tu puesto' },
      { tipo: 'foto', id: 'foto', max: 1, requerido: true,
        etiqueta: 'Agrega una fotografía que evidencie las condiciones de tu puesto de trabajo',
        ayuda: 'Pide a alguien que te tome la foto de lado mientras estás sentado en tu puesto, como en la guía de la app.',
        encabezado: 'Por favor agrega una fotografía que evidencie las condiciones de tu puesto de trabajo. Es importante que alguien te tome la foto mientras estás sentado en tu puesto de trabajo. (Guíate por la imagen)' },

      { tipo: 'seccion', titulo: 'Iluminación' },
      { tipo: 'cuadricula', id: 'ilum', etiqueta: 'Iluminación', opciones: SI_NO_F, requerido: true,
        filas: _filasF_('il', 'Iluminación', [
          '¿En el área de trabajo tienes iluminación natural?',
          '¿Consideras que la cantidad de luz es suficiente para la actividad que desarrollas?',
          '¿Se percibe que la intensidad lumínica en el área te permite leer sin ninguna dificultad?',
          '¿La luz natural y/o artificial te genera reflejos en la pantalla?',
          '¿La ventana cuenta con algún elemento que mitigue los reflejos? (persianas, blackout, cortinas)'
        ]) },

      { tipo: 'seccion', titulo: 'Instalaciones' },
      { tipo: 'cuadricula', id: 'loc', etiqueta: 'Instalaciones locativas', opciones: SI_NO_NA_F, requerido: true,
        filas: _filasF_('lo', 'Instalaciones locativas', [
          '¿Las escaleras tienen pasamanos y piso/banda antideslizante?',
          '¿La profundidad del escalón es mayor a 30 centimetros?',
          '¿Las escaleras están libres de obstáculos?',
          '¿El piso, techo, paredes y puertas del área de trabajo esta en buenas condiciones? (Sin humedades, grietas, obstáculos, desniveles y/o plagas)',
          '¿En las instalaciones cuentas con suministro de agua potable?',
          '¿El acceso a las instalaciones de aseo (baño) está libre de obstáculos o se encuentra a desnivel?'
        ]) },
      { tipo: 'cuadricula', id: 'elec', etiqueta: 'Equipos e instalaciones eléctricas', opciones: SI_NO_F, requerido: true,
        filas: _filasF_('el', 'Equipos e Instalaciones Eléctricas', [
          '¿Las tomas, extensiones y enchufes se encuentran protegidos?',
          '¿Los cables de tus equipos de trabajo tienen enmendaduras con algún tipo de cinta?',
          '¿Los enchufes del área de trabajo están sobrecargados con varias conexiones?',
          '¿Las cajas de interruptores están cubiertos?'
        ]) },

      { tipo: 'seccion', titulo: 'Emergencias y entorno' },
      { tipo: 'cuadricula', id: 'emer', etiqueta: 'Atención a emergencias', opciones: SI_NO_F, requerido: true,
        filas: _filasF_('em', 'Atención a emergencias', [
          '¿Conoces los procedimientos para actuar en caso de una emergencia?',
          '¿En la zona de tu puesto de teletrabajo, tienes acceso a puntos de encuentro en caso de una emergencia (parques, vías cerradas, etc.)?',
          '¿Cuentas con medios de extinción o extintor?',
          '¿Conoces el procedimiento para uso y manejo de extintores?',
          '¿Cuentas con un botiquín para la atención de primeros auxilios?',
          '¿Conoces las líneas y ubicación de los centros de atención a emergencias más cercanos?'
        ]) },
      { tipo: 'cuadricula', id: 'seg', etiqueta: 'Seguridad pública y fenómenos naturales', opciones: SI_NO_F, requerido: true,
        filas: _filasF_('sp', 'Seguridad pública y fenómenos naturales', [
          '¿En las instalaciones de teletrabajo te encuentras expuesto a hurtos, vandalismo, terrorismo o extorción?',
          '¿Las instalaciones de teletrabajo se encuentran en una zona con alto potencial de derrumbe, incendio o inundación?',
          '¿Vives cerca a fabricas o vecinos que tengan emisiones de humos, gases o vapores?'
        ]) }
    ]
  },

  // ────────────────────────────────────────────────────────────
  2: {
    titulo: 'Seguimiento uno a uno',
    hoja: 'Formulario_2_Seguimiento',
    intro: 'Queremos saber cómo está hoy tu puesto de trabajo y el estado de tus elementos.',
    campos: [
      { tipo: 'autorizacion', id: 'aut', encabezado: TEXTO_AUTORIZACION_F, texto: TEXTO_AUTORIZACION_F },

      { tipo: 'seccion', titulo: 'Tus datos' },
      { tipo: 'fijo', id: 'cedula', origen: 'cedula', etiqueta: 'Cédula', encabezado: 'Cédula' },
      { tipo: 'fijo', id: 'nombre', origen: 'nombre', etiqueta: 'Nombre completo', encabezado: 'Nombre completo' },
      { tipo: 'fijo', id: 'correo', origen: 'correo', etiqueta: 'Correo electrónico', encabezado: 'Dirección de correo electrónico' },
      { tipo: 'texto', id: 'ciudadDir', requerido: true, etiqueta: 'Ciudad y dirección actual', encabezado: 'Ciudad y dirección actual' },
      { tipo: 'opcion', id: 'modalidad', requerido: true, opciones: ['Híbrido', 'Virtual 100%', 'Presencial'],
        etiqueta: 'Indícanos cuál es tu modalidad de trabajo actual, de acuerdo con tu contrato',
        encabezado: 'Indícanos cuál es tú modalidad de trabajo actual, de acuerdo con tu contrato' },

      { tipo: 'seccion', titulo: 'Foto actual' },
      { tipo: 'foto', id: 'foto', max: 1, requerido: true,
        etiqueta: 'Foto tuya en tu puesto de trabajo en casa, vista lateral',
        ayuda: 'Pide apoyo a otra persona para que aparezcas completo. Debe ser actual: se compara con la de tu inspección inicial.',
        encabezado: 'Por favor envíanos una foto tuya en tu puesto de trabajo en casa, una vista lateral, similar a la siguiente imagen. Por favor solicita apoyo de otra persona para que te tome la foto y aparezcas completamente en ella, con el fin de verificar tu postura. Debe ser una foto actual, ya que se comparará con la foto enviada en la inspección inicial.' },

      { tipo: 'seccion', titulo: 'Tus elementos' },
      { tipo: 'casillas', id: 'elementos', requerido: true,
        opciones: ['Silla', 'Escritorio o superficie', 'Monitor', 'Base o atril para portátil', 'Teclado', 'Mouse',
                   'Apoyapiés', 'Diadema', 'Ninguno'],
        etiqueta: 'Selecciona los elementos que tienes en tu puesto de trabajo',
        encabezado: 'Selecciona los elementos que tienes en tu puesto de trabajo.' },
      { tipo: 'texto', id: 'serial', etiqueta: 'Si tienes silla o superficie entregada por la Compañía, escribe aquí el serial',
        encabezado: 'En caso de tener silla o superficie entregado por la Compañía, indícanos aquí el serial:' },
      { tipo: 'opcion', id: 'estado', opciones: SI_NO_F, requerido: true,
        etiqueta: '¿Tus elementos se encuentran en adecuado estado?', encabezado: '¿Tus elementos se encuentran en adecuado estado?' },
      { tipo: 'parrafo', id: 'malEstado', requerido: true, si: { campo: 'estado', valor: 'No' },
        etiqueta: '¿Qué elementos tienes en mal estado?', encabezado: 'Por favor indícanos qué elementos tienes en mal estado.' },
      { tipo: 'parrafo', id: 'observacion',
        etiqueta: '¿Tienes alguna duda u observación para el área de Bienestar y Salud Organizacional?',
        encabezado: 'Tienes alguna duda u observación para el área de Bienestar y Salud Organizacional?' },
      { tipo: 'nota', texto: 'Si recibiste elementos de la compañía, recuerda diligenciar el acuse de recibido.' }
    ]
  },

  // ────────────────────────────────────────────────────────────
  // Lo diligencia el profesional de Salud Organizacional durante la visita
  3: {
    titulo: 'Inspección de puesto de trabajo en casa (IPT virtual)',
    hoja: 'Formulario_3_IPT',
    intro: 'Formulario de la visita virtual. Lo diligencia Salud Organizacional con el colaborador.',
    soloAdmin: true,
    campos: [
      { tipo: 'seccion', titulo: 'Datos del teletrabajador' },
      { tipo: 'fijo', id: 'nombre', origen: 'nombre', etiqueta: 'Nombre completo',
        encabezado: 'Nombre(s) y apellidos completos del teletrabajador ( MAYÚSCULA)' },
      { tipo: 'fijo', id: 'cedula', origen: 'cedula', etiqueta: 'N° de identificación',
        encabezado: 'N° de identificación del teletrabajador (SIN PUNTOS NI COMAS)' },
      { tipo: 'fijo', id: 'correo', origen: 'correo', etiqueta: 'Correo electrónico', encabezado: 'Dirección de correo electrónico' },
      { tipo: 'texto', id: 'ciudad', requerido: true, etiqueta: 'Ciudad', encabezado: 'Ciudad' },
      { tipo: 'opcion', id: 'modalidad', requerido: true, opciones: ['Híbrido', 'Virtual 100%', 'Presencial'],
        etiqueta: 'Modalidad de trabajo actual de acuerdo con el contrato', encabezado: 'Modalidad de trabajo actual' },
      { tipo: 'autorizacion', id: 'aut', encabezado: 'Autorización de datos personales (Ley 1581 de 2012)',
        texto: 'El teletrabajador autoriza el tratamiento de sus datos personales, incluidos datos sensibles de salud, según la Ley 1581 de 2012.' },
      { tipo: 'texto', id: 'localidad', etiqueta: 'Localidad (aplica para Bogotá) y barrio', encabezado: 'Localidad (aplica para Bogotá) y Barrio' },
      { tipo: 'texto', id: 'direccion', requerido: true, etiqueta: 'Dirección', encabezado: 'Dirección' },
      { tipo: 'numero', id: 'celular', requerido: true, etiqueta: 'Celular', encabezado: 'Celular' },
      { tipo: 'texto', id: 'estatura', etiqueta: 'Estatura del colaborador', encabezado: 'Estatura del colaborador' },
      { tipo: 'foto', id: 'fotoLateral', max: 1, etiqueta: 'Foto del colaborador en su puesto (vista lateral)',
        encabezado: 'Foto del colaborador en su puesto (vista lateral)' },

      { tipo: 'seccion', titulo: 'Sintomatología' },
      { tipo: 'opcion', id: 'sintomas', opciones: SI_NO_F, requerido: true,
        etiqueta: '¿El trabajador reportó sintomatología en los últimos 6 meses?',
        encabezado: '¿El trabajador reporto sintomatología en los últimos 6 meses?' },
      { tipo: 'texto', id: 'lugarDolor', si: { campo: 'sintomas', valor: 'Sí' },
        etiqueta: 'Lugar (segmento corporal con mayor dolor y frecuencia)', encabezado: 'Lugar (Segmento corporal que presente mayor dolor y frecuencia)' },
      { tipo: 'opcion', id: 'frecDolor', si: { campo: 'sintomas', valor: 'Sí' }, opciones: ['Ocasional', 'Frecuente', 'Permanente'],
        etiqueta: 'Frecuencia', encabezado: 'Frecuencia' },
      { tipo: 'parrafo', id: 'descDolor', si: { campo: 'sintomas', valor: 'Sí' },
        etiqueta: 'Descripción del dolor y/o de otras molestias', encabezado: 'Descripción del dolor y/o de otras molestias que también presente' },

      { tipo: 'seccion', titulo: 'Espacio de trabajo' },
      { tipo: 'texto', id: 'espacio', etiqueta: 'Espacio destinado para el puesto: largo × ancho (cm). Mínimo 1.75 m²',
        encabezado: 'Espacio destinado para el puesto de trabajo - Largo x ancho (Cm). Espacio mínimo 1.75 mt²' },
      { tipo: 'parrafo', id: 'obsEspacio', etiqueta: 'Observaciones del espacio (ubicación: habitación, sala, etc.)',
        encabezado: 'Observaciones del espacio de trabajo (ubicación, ej: Habitación, sala, etc)' },
      { tipo: 'foto', id: 'fotoEspacio', max: 1, etiqueta: 'Evidencia fotográfica del espacio', encabezado: 'Evidencia fotográfica del espacio (1 foto)' },

      { tipo: 'seccion', titulo: 'Silla' },
      { tipo: 'opcion', id: 'tipoSilla', opciones: ['Ergonómica ajustable', 'De oficina sin ajustes', 'De comedor', 'Plástica', 'Otra'],
        etiqueta: 'Tipo de silla', encabezado: 'Tipo de silla' },
      { tipo: 'opcion', id: 'apoyabrazos', opciones: SI_NO_F, etiqueta: '¿Cuenta con apoyabrazos?', encabezado: '¿Cuenta con apoyabrazos?' },
      { tipo: 'opcion', id: 'estadoSilla', opciones: ['Bueno', 'Regular', 'Malo'], etiqueta: 'Estado de la silla', encabezado: 'Estado de la silla' },
      { tipo: 'opcion', id: 'movSilla', opciones: SI_NO_F, etiqueta: '¿Cuenta con espacio suficiente para la movilidad de la silla?',
        encabezado: '¿Cuenta con espacio suficiente para la movilidad de la silla' },
      { tipo: 'opcion', id: 'rodillas', opciones: SI_NO_F, etiqueta: '¿Las rodillas y las caderas están al mismo nivel?',
        encabezado: '¿Las rodillas y las caderas están al mismo nivel?' },
      { tipo: 'opcion', id: 'sillaAdecuada', opciones: SI_NO_F, etiqueta: '¿La silla es adecuada para teletrabajo?',
        encabezado: '¿La silla es adecuada para teletrabajo?' },
      { tipo: 'parrafo', id: 'obsSilla', etiqueta: 'Observaciones de la silla', encabezado: 'Observaciones de la silla' },
      { tipo: 'foto', id: 'fotoSilla', max: 1, etiqueta: 'Evidencia fotográfica de la silla', encabezado: 'Evidencia fotográfica de la silla ( 1 foto)' },

      { tipo: 'seccion', titulo: 'Escritorio' },
      { tipo: 'opcion', id: 'tieneEscritorio', opciones: SI_NO_F, etiqueta: '¿Cuenta con escritorio?', encabezado: 'ESCRITORIO - Cuenta con escritorio' },
      { tipo: 'texto', id: 'dimEscritorio', etiqueta: 'Dimensiones: largo × profundidad × altura × espacio para piernas',
        encabezado: 'Dimensiones del plano de trabajo: LARGO X PROFUNDIDAD X ALTURA X ESPACIO MOVILIDAD DE PIERNAS' },
      { tipo: 'texto', id: 'distTeclado', etiqueta: '¿A qué distancia están el teclado y el mouse del borde de la mesa?',
        encabezado: '¿A que distancia esta el teclado y mouse del borde de la mesa' },
      { tipo: 'parrafo', id: 'obsEscritorio', etiqueta: 'Observaciones generales del escritorio', encabezado: 'Observaciones generales del escritorio' },
      { tipo: 'foto', id: 'fotoEscritorio', max: 3, etiqueta: 'Evidencia fotográfica (escritorio, teclado y mouse)',
        encabezado: 'Evidencia fotográfica (Escritorio , teclado y mouse)' },

      { tipo: 'seccion', titulo: 'Equipo y dispositivos' },
      { tipo: 'opcion', id: 'videoterminal', opciones: ['Portátil', 'Computador de escritorio', 'Ambos'],
        etiqueta: '¿Qué tipo de videoterminal maneja?', encabezado: '¿Qué tipo de videoterminal maneja' },
      { tipo: 'texto', id: 'pulgadas', etiqueta: 'Dimensiones de la pantalla (pulgadas)', encabezado: '¿Dimensiones de la pantalla en pulgadas' },
      { tipo: 'texto', id: 'distPantalla', etiqueta: '¿Qué distancia hay entre la pantalla y el usuario?', encabezado: '¿ Qué distancia tiene entre la pantalla y el usuario' },
      { tipo: 'cuadricula', id: 'equipo', etiqueta: 'Equipo', opciones: SI_NO_F,
        filas: [
          { id: 'eq1', etiqueta: '¿El borde superior de la pantalla está alineado con la horizontal de los ojos?', encabezado: '¿El borde superior de la pantalla esta alineado con la horizontal de los ojos?' },
          { id: 'eq2', etiqueta: '¿Cuenta con teclado?', encabezado: '¿ Cuenta con teclado?' },
          { id: 'eq3', etiqueta: '¿Cuenta con mouse?', encabezado: '¿Cuenta con mouse?' },
          { id: 'eq4', etiqueta: '¿El teclado y el mouse están ubicados de forma paralela y al mismo nivel?', encabezado: '¿El teclado y el mouse están ubicados de forma paralela y al mismo nivel?' },
          { id: 'eq5', etiqueta: '¿Usa dispositivos auditivos externos?', encabezado: '¿Usa dispositivos auditivos externos?' }
        ] },
      { tipo: 'texto', id: 'tipoAuditivo', etiqueta: '¿Qué tipo de dispositivo auditivo?', encabezado: '¿Que tipo?' },
      { tipo: 'parrafo', id: 'obsEquipo', etiqueta: 'Observaciones del equipo y sus dispositivos externos', encabezado: 'Observaciones del equipo y sus dispositivos externos' },
      { tipo: 'foto', id: 'fotoEquipo', max: 3, etiqueta: 'Evidencia fotográfica (equipo y dispositivos, preferiblemente con el trabajador)',
        encabezado: 'Evidencia fotográfica ( Equipo y dispositivos externos preferiblemente con el trabajador)' },

      { tipo: 'seccion', titulo: 'Condiciones ambientales' },
      { tipo: 'opcion', id: 'tipoIlum', opciones: ['Natural', 'Artificial', 'Mixta'], etiqueta: '¿Qué tipo de iluminación maneja?', encabezado: '¿Qué tipo de iluminación maneja?' },
      { tipo: 'cuadricula', id: 'ambIlum', etiqueta: 'Iluminación', opciones: SI_NO_F,
        filas: _filasF_('ai', 'Iluminación', [
          '¿Cuenta con mecanismos de regulación ( persiana, cortina y blackout entre otras?',
          '¿Presenta deslumbramientos en la pantalla?',
          '¿Puede llegar a generar fatiga el tipo de iluminación?'
        ]) },
      { tipo: 'opcion', id: 'ventilacion', opciones: ['Natural', 'Artificial', 'Ambas', 'No tiene'], etiqueta: '¿Qué tipo de ventilación tiene el área de trabajo?',
        encabezado: '¿Qué tipo de ventilación tiene el área de trabajo?' },
      { tipo: 'opcion', id: 'ruido', opciones: SI_NO_F, etiqueta: '¿Hay ruido que interfiera con el desarrollo de su actividad laboral?',
        encabezado: '¿ El área de trabajo hay presencia de ruido que interfiera el desarrollo de su actividad laboral?' },
      { tipo: 'opcion', id: 'temperatura', opciones: SI_NO_F, etiqueta: '¿La temperatura del área de trabajo es confortable?',
        encabezado: '¿En su área de trabajo la temperatura es confortable?' },
      { tipo: 'parrafo', id: 'obsAmbiente', etiqueta: 'Observaciones de condiciones ambientales', encabezado: 'Observaciones de condiciones ambientales' },
      { tipo: 'foto', id: 'fotoAmbiente', max: 3, etiqueta: 'Evidencia fotográfica (hasta 3 fotos)', encabezado: 'Evidencia fotográfica condiciones ambientales (3 fotos)' },

      { tipo: 'seccion', titulo: 'Condiciones de seguridad' },
      { tipo: 'cuadricula', id: 'locativas', etiqueta: 'Estado de las instalaciones', opciones: ['Bueno', 'Regular', 'Malo', 'No aplica'],
        filas: _filasF_('ls', 'Condiciones locativas', ['Piso', 'Paredes', 'Puerta', 'Escaleras', 'Orden', 'Aseo']) },
      { tipo: 'cuadricula', id: 'saneamiento', etiqueta: 'Residuos, agua y electricidad', opciones: SI_NO_NA_F,
        filas: _filasF_('sa', 'Condiciones de seguridad', [
          '¿ Las basuras se clasifican de acuerdo con las normas de reciclaje y se disponen en canecas debidamente señalizadas?',
          '¿Las canecas generan malos olores?',
          '¿Las canecas están ubicadas en lugares apropiados?',
          '¿Cuénta con servicio de recolección y disposición adecuada de basuras?',
          '¿Cuénta con agua potable en su hogar?',
          '¿Las instalaciones de los baños son adecuadas?',
          '¿Cuenta con toma exclusiva para su equipo?',
          '¿Tiene extensiones reguladas para conexión de sus equipos?',
          '¿La toma eléctrica se encuentra debidamente instalada?',
          '¿Los puntos de conexión cuentan con polo a tierra?',
          '¿El cableado esta adecuadamente organizado?',
          '¿Los enchufes están sobrecargados ?'
        ]) },
      { tipo: 'parrafo', id: 'obsSeguridad', etiqueta: 'Observaciones generales de condiciones de seguridad', encabezado: 'Observaciones generales de condiciones de seguridad' },
      { tipo: 'foto', id: 'fotoSeguridad', max: 10, etiqueta: 'Evidencias: piso, paredes, escaleras, puertas, residuos y condiciones eléctricas (hasta 10)',
        encabezado: 'Evidencias fotográficas de piso, paredes, escaleras, puertas, disposición de residuos y condiciones eléctricas . (fotos según evidencia, max 10)' },

      { tipo: 'seccion', titulo: 'Atención y respuesta a emergencias' },
      { tipo: 'cuadricula', id: 'emergencias', etiqueta: 'Emergencias', opciones: SI_NO_NA_F,
        filas: _filasF_('ae', 'Emergencias', [
          '¿Cuenta con extintor de incendios al interior de su vivienda?',
          '¿Cuenta con extintor de incendios en áreas comunes ( aplica para propiedad horizontal)',
          '¿Cuenta con botiquín al interior de la vivienda?',
          '¿Cuenta con señalización de emergencias ( aplica para propiedad horizontal)',
          '¿Las áreas de circulación están despejadas?',
          '¿Cuenta con plan de emergencias familiar?',
          '¿Cuenta con kit de emergencias familiar y mascota ( si aplica)?'
        ]) },
      { tipo: 'foto', id: 'fotoEmergencias', max: 3, etiqueta: 'Evidencias de elementos de atención a emergencias (hasta 3)',
        encabezado: 'Evidencias fotográficas de elementos de atención y respuesta a emergencia (max 3 fotos)' },

      { tipo: 'seccion', titulo: 'Ajustes y requerimientos' },
      { tipo: 'parrafo', id: 'ajustes', etiqueta: 'Describa los ajustes realizados durante la visita', encabezado: 'Describa los ajustes realizados durante la visita' },
      { tipo: 'foto', id: 'fotoAntesDespues', max: 4, etiqueta: 'Evidencia fotográfica del antes y el después', encabezado: 'Evidencia fotográfica del antes y el después' },
      { tipo: 'cuadricula', id: 'reqPuesto', etiqueta: 'Requerimientos del puesto de trabajo (E: equipo · P: puesto)', opciones: ['Requiere', 'No requiere'],
        filas: _filasF_('rp', 'Requerimientos/necesidades del puesto de trabajo:', [
          'Equipo de computo: escritorio (E)', 'Equipo de computo: portátil (E)', 'Teclado (P)', 'Mouse (P)', 'Pantalla externa (P)',
          'Atril o brazo para portátil (P)', 'Base o brazo para monitor (P)',
          'Mesa (Altura 73  a 75cm - largo 100cm - Profundidad 60 a 70 cm) (P)',
          'Silla ergonómica ajustable en todos sus mecanismos (P)', 'Realizar mantenimiento a silla (P)',
          'Apoyapiés ajustable en altura (P)', 'Extintor multipropósito 10 lb (P)', 'Botiquín personal de primeros auxilios (P)'
        ]) },
      { tipo: 'cuadricula', id: 'reqGestion', etiqueta: 'Requerimientos de gestión del trabajador', opciones: ['Aplica', 'No aplica'],
        filas: _filasF_('rg', 'Requerimientos de gestión del trabajador', [
          'Reubicación de espacio de trabajo', 'Jornada de orden', 'Jornada de aseo', 'Elaborar plan de emergencias familiar',
          'Realizar pausas activas y alternancia de posturas cada 2 horas', 'Colocar una toma eléctrica doble con polo a tierra',
          'Organizar cableado', 'Anclar muebles o repisas en el área de trabajo',
          'Clasificar los residuos y disponerlos en recipientes debidamente rotulados', 'Limpieza de luminaria o cambio',
          'Colocar o reubicar luminarias', 'Realizar reparaciones locativas ( paredes, pisos u otros que aplique)',
          'Colocar antideslizantes en escaleras o puntos en piso de alto riesgo de caída',
          'Colocar protección tipo baranda y/o pasamanos en escaleras', 'Consultar a médico de su EPS por sintomatología referida'
        ]) },
      { tipo: 'parrafo', id: 'situaciones', etiqueta: 'Situaciones relevantes adicionales observadas y sus recomendaciones',
        encabezado: 'Describa situaciones relevantes adicionales observadas en el momento de la visita con sus respectivas recomendaciones.' },

      { tipo: 'seccion', titulo: 'Concepto' },
      { tipo: 'opcion', id: 'concepto', requerido: true,
        opciones: ['Puesto adecuado', 'Puesto adecuado con recomendaciones', 'Puesto no adecuado: requiere intervención'],
        etiqueta: 'Concepto de la visita', encabezado: 'CONCEPTO DE LA VISITA' }
    ]
  }
};

// ============================================================
// HANDLERS
// ============================================================

/** Devuelve las preguntas y los datos fijos de la persona. */
function handleFormularioEsquema(id, params) {
  var n = Number(params.n);
  var esquema = ESQUEMAS_FORM[n];
  if (!esquema) return { ok: false, error: 'Formulario no existe' };

  var destino = _destinoFormulario_(id, n, params.cedulaObjetivo);
  if (!destino.ok) return destino;

  return {
    ok: true,
    data: {
      n: n,
      titulo: esquema.titulo,
      intro: esquema.intro,
      campos: esquema.campos,
      contexto: { cedula: destino.cedula, nombre: destino.nombre, correo: destino.correo },
      mostrarCedula: !destino.cedulaInterna
    }
  };
}

/** Valida y guarda una respuesta. Devuelve el siguiente formulario pendiente, si hay. */
function handleGuardarFormulario(id, params) {
  var n = Number(params.n);
  var esquema = ESQUEMAS_FORM[n];
  if (!esquema) return { ok: false, error: 'Formulario no existe' };

  var destino = _destinoFormulario_(id, n, params.cedulaObjetivo);
  if (!destino.ok) return destino;

  var resp = params.respuestas || {};
  var fijos = { cedula: destino.cedula, nombre: destino.nombre, correo: destino.correo };
  var valores = {};
  var errores = [];
  var invalidos = [];

  _camposPlanosF_(esquema).forEach(function(c) {
    if (!_visibleF_(c, resp)) { valores[c.encabezado] = ''; return; }

    var v;
    if (c.fijo) v = fijos[c.origen] || '';
    else v = resp[c.clave] == null ? '' : String(resp[c.clave]).trim();

    if (c.opciones && v) {
      var partes = c.multiple ? v.split('\n') : [v];
      if (partes.some(function(x) { return c.opciones.indexOf(x) === -1; })) {
        invalidos.push(c.etiqueta);
        return;
      }
      if (c.multiple) v = partes.join(', ');
    }
    if (c.foto && v) {
      var urls = v.split('\n').filter(Boolean);
      if (urls.some(function(u) { return u.indexOf('https://drive.google.com/') !== 0; })) {
        invalidos.push(c.etiqueta);
        return;
      }
      v = urls.join('\n');
    }
    if (c.autorizacion) v = v ? 'Acepto' : '';
    if (c.requerido && !v) errores.push(c.etiqueta);

    valores[c.encabezado] = v.slice(0, 5000);
  });

  if (invalidos.length) {
    return { ok: false, error: 'Hay respuestas no válidas en: ' + invalidos.slice(0, 3).join(' · ') };
  }
  if (errores.length) {
    return { ok: false, error: 'Falta completar: ' + errores.slice(0, 3).join(' · ') + (errores.length > 3 ? '…' : '') };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var hoja = _hojaFormulario_(esquema);
    var enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);

    // Columnas nuevas si se agregó alguna pregunta
    var faltantes = Object.keys(valores).filter(function(h) { return enc.indexOf(h) === -1; });
    if (faltantes.length) {
      hoja.getRange(1, enc.length + 1, 1, faltantes.length).setValues([faltantes]).setFontWeight('bold');
      enc = enc.concat(faltantes);
    }

    var fila = enc.map(function(h) {
      if (h === 'Marca temporal') return new Date();
      if (h === 'Registrado por') return id.email || '';
      return valores[h] != null ? valores[h] : '';
    });
    var nuevaFila = hoja.getLastRow() + 1;
    hoja.getRange(nuevaFila, 1, 1, fila.length).setValues([fila]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  var siguiente = n < 3 ? handleRutaMiEstado(destino.cedula, destino.correo) : { data: null };
  return { ok: true, data: { siguiente: siguiente.data || null } };
}

// ============================================================
// UTILIDADES
// ============================================================

/**
 * A quién pertenece la respuesta. Formularios 1 y 2: siempre la persona
 * que tiene la app abierta. Formulario 3: solo admins, sobre un caso de la ruta.
 */
function _destinoFormulario_(id, n, cedulaObjetivo) {
  if (ESQUEMAS_FORM[n].soloAdmin) {
    if (!id.esAdmin) return { ok: false, error: 'Este formulario lo diligencia Salud Organizacional.' };
    var ced = String(cedulaObjetivo || '').replace(/\D/g, '');
    var caso = calcularRuta_().casos.filter(function(c) { return c.cedula === ced; })[0];
    if (!caso) return { ok: false, error: 'No encontré ese colaborador en la ruta de ingreso.' };
    return { ok: true, cedula: caso.cedula, nombre: caso.nombre, correo: caso.correo, cedulaInterna: caso.sinCedulaReal };
  }

  if (id.cedula || id.email) {
    var p = null;
    try { p = buscarPersonaMetricaRuta_(id.cedula, id.email); } catch (e) {}
    var cedula = id.cedula || (p && p.cedula) || '';
    if (!cedula) return { ok: false, error: 'No encontramos tu registro en la base de colaboradores.' };
    return { ok: true, cedula: cedula, nombre: (p && p.nombre) || id.nombre || '', correo: id.email || (p && p.correo) || '',
             cedulaInterna: !!(p && p.sinCedulaReal) };
  }
  return { ok: false, error: 'Necesitamos tu cédula para abrir el formulario.' };
}

/** Lista de columnas del formulario (las cuadrículas se abren en una por fila). */
function _camposPlanosF_(esquema) {
  var out = [];
  esquema.campos.forEach(function(c) {
    if (c.tipo === 'seccion' || c.tipo === 'nota') return;
    var base = { etiqueta: c.etiqueta || 'Autorización de datos', requerido: !!c.requerido, si: c.si };

    if (c.tipo === 'cuadricula') {
      c.filas.forEach(function(f) {
        out.push(_extenderF_(base, { clave: f.id, encabezado: f.encabezado, opciones: c.opciones, etiqueta: f.etiqueta }));
      });
    } else if (c.tipo === 'tablaSelects') {
      c.filas.forEach(function(f) {
        c.columnas.forEach(function(col) {
          out.push(_extenderF_(base, { clave: f.id + '_' + col.clave, encabezado: f.encabezados[col.clave],
                                       opciones: col.opciones, requerido: false }));
        });
      });
    } else {
      out.push(_extenderF_(base, {
        clave: c.id, encabezado: c.encabezado,
        opciones: (c.tipo === 'opcion' || c.tipo === 'casillas') ? c.opciones : null,
        multiple: c.tipo === 'casillas',
        foto: c.tipo === 'foto',
        fijo: c.tipo === 'fijo', origen: c.origen,
        autorizacion: c.tipo === 'autorizacion',
        requerido: c.tipo === 'autorizacion' ? true : (c.tipo === 'fijo' ? false : !!c.requerido)
      }));
    }
  });
  return out;
}

function _extenderF_(a, b) {
  var o = {};
  Object.keys(a).forEach(function(k) { o[k] = a[k]; });
  Object.keys(b).forEach(function(k) { o[k] = b[k]; });
  return o;
}

function _visibleF_(c, resp) {
  if (!c.si) return true;
  var v = String(resp[c.si.campo] || '');
  return v === c.si.valor || v.split('\n').indexOf(c.si.valor) !== -1;
}

function _hojaFormulario_(esquema) {
  var ss = SpreadsheetApp.openById(getSpreadsheetId());
  var hoja = ss.getSheetByName(esquema.hoja);
  if (!hoja) {
    hoja = ss.insertSheet(esquema.hoja);
    var enc = ['Marca temporal'].concat(_camposPlanosF_(esquema).map(function(c) { return c.encabezado; }));
    if (esquema.soloAdmin) enc.push('Registrado por');
    hoja.getRange(1, 1, 1, enc.length).setValues([enc])
      .setFontWeight('bold').setBackground('#005224').setFontColor('#ffffff').setWrap(true);
    hoja.setFrozenRows(1);
  }
  return hoja;
}
