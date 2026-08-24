/* =========================================================
   ROSA ASSESSMENT
   Estructura de datos para el método ROSA
========================================================= */

/**
 * Puntuación temporal ROSA.
 *
 * -1 = menos de 1 hora total
 *      o menos de 30 minutos ininterrumpidos
 *
 *  0 = entre 1 y 4 horas total
 *      o entre 30 minutos y 1 hora ininterrumpida
 *
 * +1 = más de 4 horas
 *      o más de 1 hora ininterrumpida
 */
export type RosaTimeScore = -1 | 0 | 1;


/* =========================================================
   SILLA
========================================================= */

export interface RosaChairAssessment {

  /**
   * Altura del asiento.
   *
   * 1 = adecuada
   * 2 = demasiado alta/baja
   * 3 = sin apoyo de pies
   *
   * Puede incrementarse por circunstancias adicionales.
   */
  height: number;

  /**
   * Profundidad del asiento.
   *
   * 1 = adecuada
   * 2 = demasiado larga/corta
   */
  depth: number;

  /**
   * Reposabrazos.
   *
   * 1 = adecuado
   * 2 = demasiado alto/bajo
   *
   * Puede incrementarse por:
   * - separación excesiva
   * - superficie dura/dañada
   * - no ajustable
   */
  armrest: number;

  /**
   * Respaldo.
   *
   * 1 = adecuado
   * 2 = condición desfavorable
   *
   * Puede incrementarse por:
   * - superficie de trabajo demasiado alta
   * - respaldo no ajustable
   */
  backrest: number;

  /**
   * Tiempo de utilización de la silla.
   */
  duration: RosaTimeScore;

  /**
   * Indica si existe espacio insuficiente
   * para las piernas bajo la mesa.
   */
  insufficientLegSpace?: boolean;

  /**
   * Altura del asiento no regulable.
   */
  heightNotAdjustable?: boolean;

  /**
   * Profundidad del asiento no regulable.
   */
  depthNotAdjustable?: boolean;

  /**
   * Reposabrazos demasiado separados.
   */
  armrestTooFarApart?: boolean;

  /**
   * Superficie del reposabrazos dura o dañada.
   */
  armrestHardOrDamaged?: boolean;

  /**
   * Reposabrazos no ajustables.
   */
  armrestNotAdjustable?: boolean;

  /**
   * Superficie de trabajo demasiado alta.
   */
  workSurfaceTooHigh?: boolean;

  /**
   * Respaldo no ajustable.
   */
  backrestNotAdjustable?: boolean;
}


/* =========================================================
   PANTALLA
========================================================= */

export interface RosaMonitorAssessment {

  /**
   * Puntuación base de la pantalla.
   *
   * 1 = adecuada
   * 2 = demasiado baja
   * 3 = demasiado alta
   */
  height: number;

  /**
   * Distancia de la pantalla.
   *
   * La evaluación final se integra en la puntuación
   * de pantalla según las condiciones ROSA.
   */
  distance: number;

  /**
   * Pantalla desviada lateralmente.
   */
  lateralDeviation?: boolean;

  /**
   * Se manejan documentos sin atril/soporte.
   */
  documentsWithoutStand?: boolean;

  /**
   * Existen brillos o reflejos.
   */
  glare?: boolean;

  /**
   * Pantalla a más de 75 cm o fuera del alcance.
   *
   * Esta condición se aplica específicamente cuando
   * la pantalla está muy baja.
   */
  tooFar?: boolean;

  /**
   * Tiempo de utilización del monitor.
   */
  duration: RosaTimeScore;
}


/* =========================================================
   TELÉFONO
========================================================= */

export interface RosaPhoneAssessment {

  /**
   * Puntuación base.
   *
   * 1 = cerca / manos libres / mano con cuello neutral
   * 2 = teléfono lejos
   */
  distance: number;

  /**
   * El teléfono se sostiene entre cuello y hombro.
   *
   * ROSA añade +2.
   */
  betweenNeckAndShoulder?: boolean;

  /**
   * El teléfono no tiene función manos libres.
   *
   * ROSA añade +1 en las condiciones correspondientes.
   */
  noHandsFree?: boolean;

  /**
   * Tiempo de utilización del teléfono.
   */
  duration: RosaTimeScore;
}


/* =========================================================
   MOUSE
========================================================= */

export interface RosaMouseAssessment {

  /**
   * Puntuación base.
   *
   * 1 = alineado con el hombro
   * 2 = no alineado o alejado
   */
  position: number;

  /**
   * Mouse demasiado pequeño.
   *
   * ROSA añade +1.
   */
  tooSmall?: boolean;

  /**
   * Mouse y teclado a diferentes alturas.
   *
   * ROSA añade +2.
   */
  differentHeightFromKeyboard?: boolean;

  /**
   * Reposamanos duro o puntos de presión.
   *
   * ROSA añade +1.
   */
  hardWristRest?: boolean;

  /**
   * Tiempo de utilización del mouse.
   */
  duration: RosaTimeScore;
}


/* =========================================================
   TECLADO
========================================================= */

export interface RosaKeyboardAssessment {

  /**
   * Puntuación base.
   *
   * 1 = muñecas rectas y hombros relajados
   * 2 = extensión > 15°
   */
  position: number;

  /**
   * Muñecas desviadas lateralmente.
   *
   * ROSA añade +1.
   */
  lateralWristDeviation?: boolean;

  /**
   * Teclado demasiado alto.
   *
   * ROSA añade +1.
   */
  tooHigh?: boolean;

  /**
   * Se deben alcanzar objetos alejados o
   * por encima del nivel de la cabeza.
   *
   * ROSA añade +1.
   */
  reachingObjects?: boolean;

  /**
   * Teclado/plataforma no ajustable.
   *
   * ROSA añade +1.
   */
  notAdjustable?: boolean;

  /**
   * Tiempo de utilización del teclado.
   */
  duration: RosaTimeScore;
}


/* =========================================================
   POSTURA
========================================================= */

export interface RosaPostureAssessment {

  /**
   * Puntuaciones obtenidas del análisis postural.
   *
   * Estas puntuaciones proceden actualmente
   * del módulo de análisis biomecánico.
   */
  neck: number;

  trunk: number;

  legs: number;

  upperArm: number;

  lowerArm: number;
}


/* =========================================================
   EVALUACIÓN COMPLETA
========================================================= */

export interface RosaAssessment {

  /**
   * Componente silla.
   */
  chair: RosaChairAssessment;

  /**
   * Pantalla.
   */
  monitor: RosaMonitorAssessment;

  /**
   * Teléfono.
   */
  phone: RosaPhoneAssessment;

  /**
   * Mouse.
   */
  mouse: RosaMouseAssessment;

  /**
   * Teclado.
   */
  keyboard: RosaKeyboardAssessment;

  /**
   * Postura.
   *
   * Se mantiene como información complementaria
   * de nuestra aplicación y no se suma directamente
   * al ROSA oficial.
   */
  posture: RosaPostureAssessment;
}


/* =========================================================
   RESULTADOS PARCIALES
========================================================= */

export interface RosaPartialScores {

  /**
   * Resultado Tabla A + tiempo.
   */
  chair: number;

  /**
   * Resultado Tabla B.
   */
  monitorPhone: number;

  /**
   * Resultado Tabla C.
   */
  keyboardMouse: number;

  /**
   * Resultado Tabla D.
   */
  workstation: number;

  /**
   * Resultado Tabla E.
   */
  final: number;
}


/* =========================================================
   NIVEL DE ACTUACIÓN
========================================================= */

export type RosaRisk =
  | "Inapreciable"
  | "Mejorable"
  | "Alto"
  | "Muy Alto"
  | "Extremo";

export interface RosaActionLevel {

  score: number;

  risk: RosaRisk;

  level: 0 | 1 | 2 | 3 | 4;

  action: string;
}


/* =========================================================
   RESULTADO COMPLETO
========================================================= */

export interface RosaCalculationResult {

  scores: RosaPartialScores;

  action: RosaActionLevel;

  recommendations: string[];
}