import type {
  RosaAssessment,
  RosaCalculationResult,
  RosaActionLevel,
  RosaPartialScores,
} from "./RosaAssessment";


/* =========================================================
   TABLA A
   Silla

   Alineada el 2026-08-24 con AppsScript/JS_Rosa.html (T_SILLA), fuente
   validada contra la hoja de trabajo oficial del método ROSA (Sonne,
   Villalta & Andrews, 2012). Antes esta tabla no coincidía con Apps
   Script en un número significativo de celdas — ver docs/CHANGELOG.md.
========================================================= */

const TABLE_A: number[][] = [
  // Reposabrazos + respaldo: 2  3  4  5  6  7  8  9
  [1, 2, 3, 4, 5, 6, 7, 8], // Altura + profundidad = 2
  [2, 2, 3, 4, 5, 6, 7, 8], // 3
  [3, 3, 3, 4, 5, 6, 7, 8], // 4
  [4, 4, 4, 4, 5, 6, 7, 8], // 5
  [5, 5, 5, 5, 5, 6, 7, 8], // 6
  [6, 6, 6, 6, 6, 6, 7, 8], // 7
  [7, 7, 7, 7, 7, 7, 7, 8], // 8
];


/* =========================================================
   TABLA B
   Pantalla + teléfono

   Alineada el 2026-08-24 con AppsScript/JS_Rosa.html (T_MONITOR_TEL).
========================================================= */

const TABLE_B: number[][] = [
  // Pantalla: 0 1 2 3 4 5 6 7
  [1, 1, 1, 2, 3, 4, 5, 6], // Teléfono 0
  [1, 1, 2, 3, 4, 5, 6, 7], // 1
  [1, 2, 2, 3, 4, 5, 6, 7], // 2
  [2, 3, 3, 3, 4, 5, 6, 7], // 3
  [3, 4, 4, 4, 5, 6, 7, 8], // 4
  [4, 5, 5, 5, 6, 7, 8, 9], // 5
  [5, 6, 6, 6, 7, 8, 9, 9], // 6
];


/* =========================================================
   TABLA C
   Teclado + mouse

   Alineada el 2026-08-24 con AppsScript/JS_Rosa.html (T_MOUSE_TECLADO,
   transpuesta: Apps Script indexa [teclado][mouse], aquí se indexa
   [mouse][teclado] porque calculateTableC llama a tableLookup con
   fila=mouse, columna=teclado).
========================================================= */

const TABLE_C: number[][] = [
  // Teclado: 0 1 2 3 4 5 6 7
  [1, 1, 1, 2, 3, 4, 5, 6], // Mouse 0
  [1, 1, 2, 3, 4, 5, 6, 7], // 1
  [1, 2, 2, 3, 4, 5, 6, 7], // 2
  [2, 3, 3, 3, 4, 5, 6, 7], // 3
  [3, 4, 4, 4, 5, 6, 7, 8], // 4
  [4, 5, 5, 5, 6, 7, 8, 9], // 5
  [5, 6, 6, 6, 7, 8, 9, 9], // 6
  [6, 7, 7, 7, 8, 9, 9, 9], // 7
];


/* =========================================================
   TABLA D
   Pantalla/teléfono + teclado/mouse
========================================================= */

const TABLE_D: number[][] = [
  // Tabla C: 1 2 3 4 5 6 7 8 9
  [1, 1, 2, 3, 4, 5, 6, 7, 8], // Tabla B = 1
  [2, 2, 3, 4, 5, 6, 7, 8, 9], // 2
  [3, 3, 3, 4, 5, 6, 7, 8, 9], // 3
  [4, 4, 4, 4, 5, 6, 7, 8, 9], // 4
  [5, 5, 5, 5, 5, 6, 7, 8, 9], // 5
  [6, 6, 6, 6, 6, 6, 7, 8, 9], // 6
  [7, 7, 7, 7, 7, 7, 7, 8, 9], // 7
  [8, 8, 8, 8, 8, 8, 8, 8, 9], // 8
  [9, 9, 9, 9, 9, 9, 9, 9, 9], // 9
];


/* =========================================================
   TABLA E
   Silla + pantalla/periféricos
========================================================= */

const TABLE_E: number[][] = [
  // Pantalla/periféricos: 1 2 3 4 5 6 7 8 9 10
  [1, 1, 2, 3, 4, 5, 6, 7, 8, 9],  // Silla 1
  [2, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 2
  [3, 3, 3, 4, 5, 6, 7, 8, 9, 10], // 3
  [4, 4, 4, 4, 5, 6, 7, 8, 9, 10], // 4
  [5, 5, 5, 5, 5, 6, 7, 8, 9, 10], // 5
  [6, 6, 6, 6, 6, 6, 7, 8, 9, 10], // 6
  [7, 7, 7, 7, 7, 7, 7, 8, 9, 10], // 7
  [8, 8, 8, 8, 8, 8, 8, 8, 9, 10], // 8
  [9, 9, 9, 9, 9, 9, 9, 9, 9, 10], // 9
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // 10
];


/* =========================================================
   UTILIDADES
========================================================= */

function tableLookup(
  table: number[][],
  row: number,
  column: number,
  rowMin: number,
  rowMax: number,
  columnMin: number,
  columnMax: number
): number {

  const safeRow = Math.min(
    Math.max(row, rowMin),
    rowMax
  );

  const safeColumn = Math.min(
    Math.max(column, columnMin),
    columnMax
  );

  return table[
    safeRow - rowMin
  ][
    safeColumn - columnMin
  ];
}


function addTime(
  score: number,
  time: -1 | 0 | 1
): number {
  return Math.min(
    Math.max(score + time, 1),
    10
  );
}


/* =========================================================
   SILLA
========================================================= */

function calculateChair(
  assessment: RosaAssessment
): number {

  const chair =
    assessment.chair;

  let height =
    chair.height;

  if (
    chair.insufficientLegSpace
  ) {
    height += 1;
  }

  if (
    chair.heightNotAdjustable
  ) {
    height += 1;
  }

  let depth =
    chair.depth;

  if (
    chair.depthNotAdjustable
  ) {
    depth += 1;
  }

  let armrest =
    chair.armrest;

  if (
    chair.armrestTooFarApart
  ) {
    armrest += 1;
  }

  if (
    chair.armrestHardOrDamaged
  ) {
    armrest += 1;
  }

  if (
    chair.armrestNotAdjustable
  ) {
    armrest += 1;
  }

  let backrest =
    chair.backrest;

  if (
    chair.workSurfaceTooHigh
  ) {
    backrest += 1;
  }

  if (
    chair.backrestNotAdjustable
  ) {
    backrest += 1;
  }

  const seatSum =
    height + depth;

  const upperBodySum =
    armrest + backrest;

  const tableScore =
    tableLookup(
      TABLE_A,
      seatSum,
      upperBodySum,
      2,
      8,
      2,
      9
    );

  return addTime(
    tableScore,
    chair.duration
  );
}


/* =========================================================
   PANTALLA
========================================================= */

function calculateMonitor(
  assessment: RosaAssessment
): number {

  const monitor =
    assessment.monitor;

  let score =
    monitor.height;

  if (
    monitor.lateralDeviation
  ) {
    score += 1;
  }

  if (
    monitor.documentsWithoutStand
  ) {
    score += 1;
  }

  if (
    monitor.glare
  ) {
    score += 1;
  }

  /*
   * La condición "muy lejos" solo incrementa
   * cuando la pantalla ya está muy baja.
   */
  if (
    monitor.tooFar &&
    monitor.height === 2
  ) {
    score += 1;
  }

  return addTime(
    score,
    monitor.duration
  );
}


/* =========================================================
   TELÉFONO
========================================================= */

function calculatePhone(
  assessment: RosaAssessment
): number {

  const phone =
    assessment.phone;

  let score =
    phone.distance;

  if (
    phone.betweenNeckAndShoulder
  ) {
    score += 2;
  }

  if (
    phone.noHandsFree
  ) {
    score += 1;
  }

  return addTime(
    score,
    phone.duration
  );
}


/* =========================================================
   MOUSE
========================================================= */

function calculateMouse(
  assessment: RosaAssessment
): number {

  const mouse =
    assessment.mouse;

  let score =
    mouse.position;

  if (
    mouse.tooSmall
  ) {
    score += 1;
  }

  if (
    mouse.differentHeightFromKeyboard
  ) {
    score += 2;
  }

  if (
    mouse.hardWristRest
  ) {
    score += 1;
  }

  return addTime(
    score,
    mouse.duration
  );
}


/* =========================================================
   TECLADO
========================================================= */

function calculateKeyboard(
  assessment: RosaAssessment
): number {

  const keyboard =
    assessment.keyboard;

  let score =
    keyboard.position;

  if (
    keyboard.lateralWristDeviation
  ) {
    score += 1;
  }

  if (
    keyboard.tooHigh
  ) {
    score += 1;
  }

  if (
    keyboard.reachingObjects
  ) {
    score += 1;
  }

  if (
    keyboard.notAdjustable
  ) {
    score += 1;
  }

  return addTime(
    score,
    keyboard.duration
  );
}


/* =========================================================
   TABLA B
========================================================= */

function calculateTableB(
  monitor: number,
  phone: number
): number {

  return tableLookup(
    TABLE_B,
    phone,
    monitor,
    0,
    6,
    0,
    7
  );
}


/* =========================================================
   TABLA C
========================================================= */

function calculateTableC(
  keyboard: number,
  mouse: number
): number {

  return tableLookup(
    TABLE_C,
    mouse,
    keyboard,
    0,
    7,
    0,
    7
  );
}


/* =========================================================
   TABLA D
========================================================= */

function calculateTableD(
  tableB: number,
  tableC: number
): number {

  return tableLookup(
    TABLE_D,
    tableB,
    tableC,
    1,
    9,
    1,
    9
  );
}


/* =========================================================
   TABLA E
========================================================= */

function calculateTableE(
  chair: number,
  peripherals: number
): number {

  return tableLookup(
    TABLE_E,
    chair,
    peripherals,
    1,
    10,
    1,
    10
  );
}


/* =========================================================
   NIVEL DE ACTUACIÓN
========================================================= */

function calculateAction(
  score: number
): RosaActionLevel {

  // Cortes idénticos a Apps Script (AppsScript/JS_Rosa.html, nivelRiesgo):
  // <=2 Bajo, <=4 Medio, <=7 Alto, >7 Muy Alto. El umbral de intervención
  // del método ROSA oficial sigue siendo 5 en ambos (requiereIntervencion).
  if (score <= 2) {
    return {
      score,
      risk: "Bajo",
      level: 0,
      action:
        "Puesto aceptable. Mantén esta configuración.",
    };
  }

  if (score <= 4) {
    return {
      score,
      risk: "Medio",
      level: 1,
      action:
        "Conviene hacer ajustes preventivos.",
    };
  }

  if (score <= 7) {
    return {
      score,
      risk: "Alto",
      level: 2,
      action:
        "Requiere intervención ergonómica.",
    };
  }

  return {
    score,
    risk: "Muy Alto",
    level: 3,
    action:
      "Intervención prioritaria e inmediata.",
  };
}


/* =========================================================
   RECOMENDACIONES
========================================================= */

function generateRecommendations(
  assessment: RosaAssessment,
  scores: RosaPartialScores
): string[] {

  const recommendations: string[] = [];

  // Tono cercano y accionable (en segunda persona), alineado con
  // AppsScript/JS_Rosa.html — evita fraseo clínico/alarmista, describe
  // siempre la acción concreta a hacer.
  if (
    assessment.chair.height > 1 ||
    assessment.chair.insufficientLegSpace ||
    assessment.chair.heightNotAdjustable
  ) {
    recommendations.push(
      "Ajusta la altura de tu silla: tus pies deben apoyar completamente en el piso y tener espacio libre para las piernas."
    );
  }

  if (
    assessment.chair.depth > 1 ||
    assessment.chair.depthNotAdjustable
  ) {
    recommendations.push(
      "Revisa la profundidad del asiento: deja unos 8 cm entre el borde y la parte de atrás de tus rodillas."
    );
  }

  if (
    assessment.chair.armrest > 1 ||
    assessment.chair.armrestTooFarApart ||
    assessment.chair.armrestHardOrDamaged ||
    assessment.chair.armrestNotAdjustable
  ) {
    recommendations.push(
      "Regula los reposabrazos para que tus codos descansen con los hombros relajados."
    );
  }

  if (
    assessment.chair.backrest > 1 ||
    assessment.chair.workSurfaceTooHigh ||
    assessment.chair.backrestNotAdjustable
  ) {
    recommendations.push(
      "Ajusta el respaldo para que tu zona lumbar quede bien apoyada."
    );
  }

  if (
    assessment.monitor.height > 1 ||
    assessment.monitor.lateralDeviation ||
    assessment.monitor.tooFar
  ) {
    recommendations.push(
      "Ubica la pantalla a una distancia de 45–75 cm y a la altura de tus ojos, para no forzar el cuello."
    );
  }

  if (
    assessment.monitor.glare
  ) {
    recommendations.push(
      "Reduce los reflejos de la pantalla: reubícala o ajusta la iluminación del espacio."
    );
  }

  if (
    assessment.phone.betweenNeckAndShoulder
  ) {
    recommendations.push(
      "Evita sostener el teléfono entre el cuello y el hombro — prueba con manos libres o auriculares."
    );
  }

  if (
    assessment.mouse.position > 1 ||
    assessment.mouse.tooSmall ||
    assessment.mouse.differentHeightFromKeyboard ||
    assessment.mouse.hardWristRest
  ) {
    recommendations.push(
      "Acerca el mouse a tu cuerpo, alineado con el hombro, para que tu mano quede en una posición cómoda."
    );
  }

  if (
    assessment.keyboard.position > 1 ||
    assessment.keyboard.lateralWristDeviation ||
    assessment.keyboard.tooHigh ||
    assessment.keyboard.notAdjustable
  ) {
    recommendations.push(
      "Ajusta el teclado para mantener las muñecas rectas y los hombros relajados al escribir."
    );
  }

  if (
    scores.final >= 5
  ) {
    recommendations.push(
      "Con los ajustes de arriba puedes mejorar bastante tu comodidad — vale la pena priorizarlos esta semana."
    );
  }

  if (
    recommendations.length === 0
  ) {
    recommendations.push(
      "¡Buen trabajo! Tu puesto de trabajo está bien configurado. Sigue así y revisa tu postura de vez en cuando."
    );
  }

  return [
    ...new Set(recommendations),
  ];
}


/* =========================================================
   MOTOR ROSA
========================================================= */

export function calculateRosaEngine(
  assessment: RosaAssessment
): RosaCalculationResult {

  const chair =
    calculateChair(
      assessment
    );

  const monitor =
    calculateMonitor(
      assessment
    );

  const phone =
    calculatePhone(
      assessment
    );

  const mouse =
    calculateMouse(
      assessment
    );

  const keyboard =
    calculateKeyboard(
      assessment
    );


  const tableB =
    calculateTableB(
      monitor,
      phone
    );

  const tableC =
    calculateTableC(
      keyboard,
      mouse
    );

  const tableD =
    calculateTableD(
      tableB,
      tableC
    );

  const final =
    calculateTableE(
      chair,
      tableD
    );


  const scores: RosaPartialScores = {
    chair,
    monitorPhone: tableB,
    keyboardMouse: tableC,
    workstation: tableD,
    final,
  };


  const action =
    calculateAction(
      final
    );


  const recommendations =
    generateRecommendations(
      assessment,
      scores
    );


  return {
    scores,
    action,
    recommendations,
  };
}