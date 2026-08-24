// ============================================================
// ROSA Expert — Análisis de imagen con la API de Gemini
//
// La llamada se hace desde el servidor a propósito: si se
// hiciera desde el navegador, la clave quedaría visible en el
// código fuente para cualquiera que abra la aplicación.
//
// Gemini SOLO observa la fotografía. El puntaje ROSA se calcula
// después en JS_Rosa con las tablas oficiales, de modo que las
// cifras siguen siendo verificables y no dependen del modelo.
//
// CONFIGURACIÓN (una sola vez):
//   Configuración del proyecto → Propiedades de la secuencia
//   → Agregar propiedad:  GEMINI_API_KEY = <tu clave>
//   O ejecuta guardarClaveGemini('tu-clave') desde el editor.
// ============================================================

var GEMINI_MODELO_POR_DEFECTO = 'gemini-2.5-flash';
var GEMINI_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

/**
 * Guarda la clave en las propiedades del proyecto.
 * Ejecutar UNA vez desde el editor y luego borrar la clave de aquí.
 */
function guardarClaveGemini(clave) {
  if (!clave) throw new Error('Pasa la clave como argumento');
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', clave);
  return 'Clave guardada';
}

/** Comprueba que la configuración esté completa. */
function verificarGemini() {
  var props = PropertiesService.getScriptProperties();
  var clave = props.getProperty('GEMINI_API_KEY');
  Logger.log(clave ? 'Clave configurada (' + clave.length + ' caracteres)'
                   : 'FALTA la propiedad GEMINI_API_KEY');
  Logger.log('Modelo: ' + (props.getProperty('GEMINI_MODELO') || GEMINI_MODELO_POR_DEFECTO));
  return !!clave;
}

function obtenerClaveGemini_() {
  var clave = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!clave) {
    throw new Error(
      'Falta configurar la clave de Gemini. En Apps Script ve a ' +
      'Configuración del proyecto → Propiedades de la secuencia de comandos ' +
      'y agrega GEMINI_API_KEY.'
    );
  }
  return clave;
}

/* ============================================================
   ESQUEMA DE RESPUESTA
   Obliga al modelo a devolver exactamente los campos que el
   cálculo ROSA necesita, sin texto libre que haya que interpretar.
   ============================================================ */
function esquemaRosa_() {
  function enumerado(valores, descripcion) {
    return { type: 'STRING', enum: valores, description: descripcion };
  }
  function booleano(descripcion) {
    return { type: 'BOOLEAN', description: descripcion };
  }

  return {
    type: 'OBJECT',
    required: ['personaDetectada', 'encuadre', 'respuestas', 'objetos', 'puntos'],
    properties: {
      personaDetectada: booleano('true solo si hay una persona sentada visible'),

      encuadre: {
        type: 'OBJECT',
        required: ['esPerfil', 'cuerpoCompleto', 'iluminacionSuficiente'],
        properties: {
          esPerfil:              booleano('La persona se ve de costado'),
          cuerpoCompleto:        booleano('Se ven cabeza, tronco y piernas'),
          iluminacionSuficiente: booleano('La foto tiene luz adecuada'),
          observacion: { type: 'STRING', description: 'Qué impide medir bien, si aplica' }
        }
      },

      respuestas: {
        type: 'OBJECT',
        required: ['seatHeight', 'feet', 'backSupport', 'monitorHeight'],
        properties: {
          seatHeight:   enumerado(['ok','low','high'], 'Rodillas a 90 grados = ok; más altas que la cadera = low; más bajas = high'),
          feet:         enumerado(['floor','footrest','dangling'], 'Apoyo de los pies'),
          panDepth:     enumerado(['ok','short','long'], 'Espacio entre borde del asiento y rodilla'),
          armrest:      enumerado(['ok','bad'], 'ok si los codos se apoyan con hombros relajados'),
          armrestHard:  booleano('Apoyabrazos de superficie dura o dañada'),
          armrestWide:  booleano('Apoyabrazos más separados que los hombros'),
          backSupport:  enumerado(['ok','nolumbar','reclined','forward'], 'forward si trabaja inclinado sin apoyar la espalda'),
          surfaceHigh:  booleano('Hombros encogidos por superficie alta'),
          underDesk:    booleano('Espacio insuficiente para las piernas'),
          monitorHeight:   enumerado(['ok','low','high'], 'Borde superior de pantalla respecto a los ojos'),
          monitorDistance: enumerado(['ok','near','far'], 'Distancia a la pantalla, ideal 40-75 cm'),
          neckTwist:    booleano('Gira el cuello más de 30 grados hacia la pantalla'),
          glare:        booleano('Reflejos visibles en la pantalla'),
          sinAtril:     booleano('Hay documentos impresos sin atril'),
          phone:        enumerado(['headset','hand','cradle','none'], 'cradle = teléfono entre hombro y oreja'),
          phoneReach:   booleano('Teléfono fuera del alcance cercano'),
          sinManosLibres: booleano('No se ve diadema ni altavoz'),
          mouseAligned:   booleano('Mouse alineado con el hombro, sin estirar el brazo'),
          mouseSameSurface: booleano('Mouse y teclado en la misma superficie'),
          pinchGrip:      booleano('Sujeta el mouse en pinza'),
          apoyaMunecas:   booleano('Apoyamuñecas delante del mouse'),
          wristStraight:  booleano('Muñecas rectas al escribir'),
          wristDeviated:  booleano('Muñecas desviadas lateralmente'),
          keyboardHigh:   booleano('Hombros encogidos al escribir'),
          alcanceElevado: booleano('Alcanza objetos por encima de los hombros')
        }
      },

      angulos: {
        type: 'OBJECT',
        description: 'Ángulos estimados en grados',
        properties: {
          cuello:  { type: 'NUMBER', description: 'Flexión del cuello respecto a la vertical' },
          tronco:  { type: 'NUMBER', description: 'Inclinación del tronco respecto a la vertical' },
          rodilla: { type: 'NUMBER', description: 'Ángulo de la rodilla' },
          codo:    { type: 'NUMBER', description: 'Ángulo del codo' }
        }
      },

      objetos: {
        type: 'ARRAY',
        description: 'Elementos del puesto de trabajo visibles',
        items: {
          type: 'OBJECT',
          required: ['clase', 'x', 'y', 'w', 'h'],
          properties: {
            clase: enumerado(
              ['monitor','laptop','teclado','mouse','telefono','silla','escritorio','atril','persona'],
              'Tipo de objeto'),
            x: { type: 'NUMBER', description: 'Borde izquierdo, escala 0 a 1000' },
            y: { type: 'NUMBER', description: 'Borde superior, escala 0 a 1000' },
            w: { type: 'NUMBER', description: 'Ancho, escala 0 a 1000' },
            h: { type: 'NUMBER', description: 'Alto, escala 0 a 1000' }
          }
        }
      },

      puntos: {
        type: 'ARRAY',
        description: 'Articulaciones visibles de la persona',
        items: {
          type: 'OBJECT',
          required: ['nombre', 'x', 'y'],
          properties: {
            nombre: enumerado(
              ['oreja','hombro','codo','muneca','cadera','rodilla','tobillo'],
              'Articulación'),
            x: { type: 'NUMBER', description: 'Horizontal, escala 0 a 1000' },
            y: { type: 'NUMBER', description: 'Vertical, escala 0 a 1000' }
          }
        }
      }
    }
  };
}

/* ============================================================
   INSTRUCCIÓN AL MODELO
   ============================================================ */
function instruccionRosa_() {
  return [
    'Eres un evaluador ergonómico. Analiza esta fotografía de un puesto de trabajo de oficina',
    'aplicando los criterios del método ROSA (Rapid Office Strain Assessment).',
    '',
    'REGLAS IMPORTANTES:',
    '1. Responde ÚNICAMENTE sobre lo que se ve en la imagen. No supongas ni completes con lo habitual.',
    '2. Si un aspecto NO es visible o no puedes determinarlo, responde el valor normal:',
    '   "ok" en las opciones de texto y false en las casillas. Nunca inventes un problema.',
    '3. Marca un problema solo cuando sea claramente observable en la foto.',
    '4. Si no hay ninguna persona sentada, pon personaDetectada en false y deja el resto por defecto.',
    '',
    'CRITERIOS DE REFERENCIA:',
    '- seatHeight: rodillas a 90 grados es correcto. Si las rodillas quedan por encima del nivel',
    '  de la cadera, la silla está baja ("low"); si quedan por debajo, está alta ("high").',
    '- backSupport: "forward" si la persona trabaja inclinada hacia adelante sin apoyar la espalda;',
    '  "nolumbar" si el respaldo es plano y no sostiene la zona lumbar;',
    '  "reclined" si está reclinada más de 110 grados.',
    '- monitorHeight: el borde superior de la pantalla debe quedar a la altura de los ojos.',
    '  Si la persona baja la cabeza para mirar, es "low"; si la sube, es "high".',
    '- phone: "cradle" únicamente si se ve el teléfono sujeto entre el hombro y la oreja.',
    '',
    'COORDENADAS: usa la escala 0 a 1000 tanto en horizontal como en vertical,',
    'donde 0,0 es la esquina superior izquierda de la imagen.',
    'En "puntos" incluye solo las articulaciones que realmente se distinguen.',
    'Si se ve de perfil y solo un lado es visible, reporta ese lado una sola vez.'
  ].join('\n');
}

/* ============================================================
   LLAMADA A LA API
   ============================================================ */
function handleAnalyzePhoto(params) {
  if (!params || !params.base64) {
    return { ok: false, error: 'Sin datos de imagen' };
  }

  var props  = PropertiesService.getScriptProperties();
  var clave  = obtenerClaveGemini_();
  var modelo = props.getProperty('GEMINI_MODELO') || GEMINI_MODELO_POR_DEFECTO;

  var cuerpo = {
    contents: [{
      parts: [
        { text: instruccionRosa_() },
        { inline_data: {
            mime_type: params.mimeType || 'image/jpeg',
            data: params.base64
        }}
      ]
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: esquemaRosa_(),
      temperature: 0.1          // observación, no creatividad
    }
  };

  var respuesta;
  try {
    respuesta = UrlFetchApp.fetch(
      GEMINI_URL_BASE + modelo + ':generateContent?key=' + encodeURIComponent(clave),
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(cuerpo),
        muteHttpExceptions: true
      }
    );
  } catch (err) {
    return { ok: false, error: 'No se pudo contactar la API de Gemini: ' + err.message };
  }

  var codigo = respuesta.getResponseCode();
  var texto  = respuesta.getContentText();

  if (codigo !== 200) {
    return { ok: false, error: mensajeDeError_(codigo, texto, modelo) };
  }

  var datos;
  try {
    var sobre = JSON.parse(texto);
    var parte = sobre.candidates &&
                sobre.candidates[0] &&
                sobre.candidates[0].content &&
                sobre.candidates[0].content.parts &&
                sobre.candidates[0].content.parts[0];
    if (!parte || !parte.text) {
      return { ok: false, error: 'Gemini no devolvió contenido analizable' };
    }
    datos = JSON.parse(parte.text);
  } catch (err) {
    return { ok: false, error: 'Respuesta de Gemini con formato inesperado: ' + err.message };
  }

  return { ok: true, data: datos };
}

/** Traduce los errores de la API a algo accionable. */
function mensajeDeError_(codigo, texto, modelo) {
  var detalle = '';
  try {
    var e = JSON.parse(texto);
    detalle = (e.error && e.error.message) ? e.error.message : '';
  } catch (_) {}

  if (codigo === 400 && detalle.indexOf('API key') !== -1) {
    return 'La clave de Gemini no es válida. Revisa GEMINI_API_KEY.';
  }
  if (codigo === 403) {
    return 'La clave de Gemini no tiene permiso o la API no está habilitada.';
  }
  if (codigo === 404) {
    return 'El modelo "' + modelo + '" no está disponible para esta clave. ' +
           'Cambia la propiedad GEMINI_MODELO.';
  }
  if (codigo === 429) {
    return 'Se alcanzó el límite de solicitudes de Gemini. Intenta en unos minutos.';
  }
  return 'Gemini respondió con error ' + codigo + (detalle ? ': ' + detalle : '');
}
