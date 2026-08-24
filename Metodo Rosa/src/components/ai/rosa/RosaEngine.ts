import type {
  RosaAssessment,
  RosaCalculationResult,
  RosaActionLevel,
  RosaPartialScores,
} from "./RosaAssessment";


/* =========================================================
   TABLA A
   Silla
========================================================= */

const TABLE_A: number[][] = [
  // Reposabrazos + respaldo: 2  3  4  5  6  7  8  9
  [2, 2, 2, 3, 4, 5, 6, 7, 8], // Altura + profundidad = 2
  [2, 2, 3, 4, 5, 6, 7, 8, 9], // 3
  [3, 3, 3, 4, 5, 6, 7, 8, 9], // 4
  [4, 4, 4, 4, 5, 6, 7, 8, 9], // 5
  [5, 5, 5, 5, 6, 7, 8, 9, 9], // 6
  [6, 6, 6, 7, 7, 8, 8, 9, 9], // 7
  [7, 7, 7, 8, 8, 9, 9, 9, 9], // 8
];


/* =========================================================
   TABLA B
   Pantalla + teléfono
========================================================= */

const TABLE_B: number[][] = [
  // Pantalla: 0 1 2 3 4 5 6 7
  [1, 1, 1, 2, 3, 4, 5, 6], // Teléfono 0
  [1, 1, 2, 2, 3, 4, 5, 6], // 1
  [1, 2, 2, 3, 3, 4, 6, 7], // 2
  [2, 2, 3, 3, 4, 5, 6, 8], // 3
  [3, 3, 4, 4, 5, 6, 7, 8], // 4
  [4, 4, 5, 5, 6, 7, 8, 9], // 5
  [5, 5, 6, 7, 8, 8, 9, 9], // 6
];


/* =========================================================
   TABLA C
   Teclado + mouse
========================================================= */

const TABLE_C: number[][] = [
  // Teclado: 0 1 2 3 4 5 6 7
  [1, 1, 1, 2, 3, 4, 5, 6], // Mouse 0
  [1, 1, 2, 3, 4, 5, 6, 7], // 1
  [1, 2, 2, 3, 4, 6, 6, 7], // 2
  [2, 3, 3, 3, 5, 6, 7, 8], // 3
  [3, 4, 4, 5, 5, 6, 7, 8], // 4
  [4, 5, 5, 6, 6, 7, 8, 9], // 5
  [5, 6, 6, 7, 7, 8, 8, 9], // 6
  [6, 7, 7, 8, 8, 9, 9, 9], // 7
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
      10
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

  if (score === 1) {
    return {
      score,
      risk: "Inapreciable",
      level: 0,
      action:
        "No es necesaria actuación.",
    };
  }

  if (score <= 4) {
    return {
      score,
      risk: "Mejorable",
      level: 1,
      action:
        "Pueden mejorarse algunos elementos del puesto.",
    };
  }

  if (score === 5) {
    return {
      score,
      risk: "Alto",
      level: 2,
      action:
        "Es necesaria la actuación.",
    };
  }

  if (score <= 8) {
    return {
      score,
      risk: "Muy Alto",
      level: 3,
      action:
        "Es necesaria la actuación cuanto antes.",
    };
  }

  return {
    score,
    risk: "Extremo",
    level: 4,
    action:
      "Es necesaria la actuación urgentemente.",
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

  if (
    assessment.chair.height > 1 ||
    assessment.chair.insufficientLegSpace ||
    assessment.chair.heightNotAdjustable
  ) {
    recommendations.push(
      "Ajustar la altura de la silla y garantizar el apoyo adecuado de los pies y el espacio suficiente para las piernas."
    );
  }

  if (
    assessment.chair.depth > 1 ||
    assessment.chair.depthNotAdjustable
  ) {
    recommendations.push(
      "Revisar la profundidad del asiento y mantener aproximadamente 8 cm entre el asiento y la parte posterior de las rodillas."
    );
  }

  if (
    assessment.chair.armrest > 1 ||
    assessment.chair.armrestTooFarApart ||
    assessment.chair.armrestHardOrDamaged ||
    assessment.chair.armrestNotAdjustable
  ) {
    recommendations.push(
      "Ajustar los reposabrazos para mantener los codos apoyados y los hombros relajados."
    );
  }

  if (
    assessment.chair.backrest > 1 ||
    assessment.chair.workSurfaceTooHigh ||
    assessment.chair.backrestNotAdjustable
  ) {
    recommendations.push(
      "Ajustar el respaldo y procurar un apoyo lumbar adecuado."
    );
  }

  if (
    assessment.monitor.height > 1 ||
    assessment.monitor.lateralDeviation ||
    assessment.monitor.tooFar
  ) {
    recommendations.push(
      "Ajustar la pantalla para mantener una distancia aproximada de 45–75 cm y evitar flexión, extensión o rotación innecesaria del cuello."
    );
  }

  if (
    assessment.monitor.glare
  ) {
    recommendations.push(
      "Eliminar o reducir los brillos y reflejos sobre la pantalla."
    );
  }

  if (
    assessment.phone.betweenNeckAndShoulder
  ) {
    recommendations.push(
      "Evitar sujetar el teléfono entre el cuello y el hombro; utilizar manos libres o auriculares."
    );
  }

  if (
    assessment.mouse.position > 1 ||
    assessment.mouse.tooSmall ||
    assessment.mouse.differentHeightFromKeyboard ||
    assessment.mouse.hardWristRest
  ) {
    recommendations.push(
      "Ubicar el mouse próximo al cuerpo y alineado con el hombro, manteniendo una posición cómoda de la mano."
    );
  }

  if (
    assessment.keyboard.position > 1 ||
    assessment.keyboard.lateralWristDeviation ||
    assessment.keyboard.tooHigh ||
    assessment.keyboard.notAdjustable
  ) {
    recommendations.push(
      "Ajustar el teclado para favorecer muñecas rectas y hombros relajados."
    );
  }

  if (
    scores.final >= 5
  ) {
    recommendations.push(
      "Priorizar la intervención ergonómica debido al nivel de riesgo obtenido."
    );
  }

  if (
    recommendations.length === 0
  ) {
    recommendations.push(
      "Mantener las condiciones actuales y continuar con seguimiento ergonómico periódico."
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