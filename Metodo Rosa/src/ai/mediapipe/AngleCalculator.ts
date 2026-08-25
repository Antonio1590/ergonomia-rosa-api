import type { PosePoint } from "./PoseTypes";

export interface BodyAngles {
  neck: number;
  trunk: number;
  leftShoulder: number;
  rightShoulder: number;
  leftElbow: number;
  rightElbow: number;
  leftWrist: number;
  rightWrist: number;
  leftKnee: number;
  rightKnee: number;
}

export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

interface Point2D {
  x: number;
  y: number;
}

function getLandmark(
  landmarks: PosePoint[],
  index: number
): Point2D | null {
  const point = landmarks[index];

  if (!point) {
    return null;
  }

  return {
    x: point.x,
    y: point.y,
  };
}

export function calculateAngle(
  a: Point2D,
  b: Point2D,
  c: Point2D
): number {

  const BA = {
    x: a.x - b.x,
    y: a.y - b.y,
  };

  const BC = {
    x: c.x - b.x,
    y: c.y - b.y,
  };

  const dot =
    BA.x * BC.x +
    BA.y * BC.y;

  const magnitudeBA =
    Math.sqrt(
      BA.x * BA.x +
      BA.y * BA.y
    );

  const magnitudeBC =
    Math.sqrt(
      BC.x * BC.x +
      BC.y * BC.y
    );

  if (
    magnitudeBA === 0 ||
    magnitudeBC === 0
  ) {
    return 0;
  }

  let cosine =
    dot /
    (magnitudeBA * magnitudeBC);

  cosine = Math.max(
    -1,
    Math.min(1, cosine)
  );

  return (
    Math.acos(cosine) *
    180 /
    Math.PI
  );
}

function calculateElbowAngle(
  landmarks: PosePoint[],
  shoulderIndex: number,
  elbowIndex: number,
  wristIndex: number
): number {

  const shoulder =
    getLandmark(
      landmarks,
      shoulderIndex
    );

  const elbow =
    getLandmark(
      landmarks,
      elbowIndex
    );

  const wrist =
    getLandmark(
      landmarks,
      wristIndex
    );

  if (
    !shoulder ||
    !elbow ||
    !wrist
  ) {
    return 0;
  }

  return calculateAngle(
    shoulder,
    elbow,
    wrist
  );
}

function calculateKneeAngle(
  landmarks: PosePoint[],
  hipIndex: number,
  kneeIndex: number,
  ankleIndex: number
): number {

  const hip =
    getLandmark(
      landmarks,
      hipIndex
    );

  const knee =
    getLandmark(
      landmarks,
      kneeIndex
    );

  const ankle =
    getLandmark(
      landmarks,
      ankleIndex
    );

  if (
    !hip ||
    !knee ||
    !ankle
  ) {
    return 0;
  }

  return calculateAngle(
    hip,
    knee,
    ankle
  );
}

function calculateShoulderAngle(
  landmarks: PosePoint[],
  hipIndex: number,
  shoulderIndex: number,
  elbowIndex: number
): number {

  const hip =
    getLandmark(
      landmarks,
      hipIndex
    );

  const shoulder =
    getLandmark(
      landmarks,
      shoulderIndex
    );

  const elbow =
    getLandmark(
      landmarks,
      elbowIndex
    );

  if (
    !hip ||
    !shoulder ||
    !elbow
  ) {
    return 0;
  }

  return calculateAngle(
    hip,
    shoulder,
    elbow
  );
}

function calculateTrunkAngle(
  landmarks: PosePoint[]
): number {

  const leftShoulder =
    getLandmark(
      landmarks,
      POSE_LANDMARKS.LEFT_SHOULDER
    );

  const rightShoulder =
    getLandmark(
      landmarks,
      POSE_LANDMARKS.RIGHT_SHOULDER
    );

  const leftHip =
    getLandmark(
      landmarks,
      POSE_LANDMARKS.LEFT_HIP
    );

  const rightHip =
    getLandmark(
      landmarks,
      POSE_LANDMARKS.RIGHT_HIP
    );

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip
  ) {
    return 0;
  }

  const shoulderX =
    (
      leftShoulder.x +
      rightShoulder.x
    ) / 2;

  const shoulderY =
    (
      leftShoulder.y +
      rightShoulder.y
    ) / 2;

  const hipX =
    (
      leftHip.x +
      rightHip.x
    ) / 2;

  const hipY =
    (
      leftHip.y +
      rightHip.y
    ) / 2;

  const dx =
    shoulderX - hipX;

  const dy =
    shoulderY - hipY;

  return (
    Math.atan2(
      Math.abs(dx),
      Math.abs(dy)
    ) *
    180 /
    Math.PI
  );
}

function calculateNeckAngle(
  landmarks: PosePoint[]
): number {

  const nose =
    getLandmark(
      landmarks,
      POSE_LANDMARKS.NOSE
    );

  const leftShoulder =
    getLandmark(
      landmarks,
      POSE_LANDMARKS.LEFT_SHOULDER
    );

  const rightShoulder =
    getLandmark(
      landmarks,
      POSE_LANDMARKS.RIGHT_SHOULDER
    );

  if (
    !nose ||
    !leftShoulder ||
    !rightShoulder
  ) {
    return 0;
  }

  const shoulderX =
    (
      leftShoulder.x +
      rightShoulder.x
    ) / 2;

  const shoulderY =
    (
      leftShoulder.y +
      rightShoulder.y
    ) / 2;

  const dx =
    nose.x - shoulderX;

  const dy =
    nose.y - shoulderY;

  return (
    Math.atan2(
      Math.abs(dx),
      Math.abs(dy)
    ) *
    180 /
    Math.PI
  );
}

export function calculateBodyAngles(
  landmarks: PosePoint[]
): BodyAngles {

  return {
    neck:
      calculateNeckAngle(
        landmarks
      ),

    trunk:
      calculateTrunkAngle(
        landmarks
      ),

    leftShoulder:
      calculateShoulderAngle(
        landmarks,
        POSE_LANDMARKS.LEFT_HIP,
        POSE_LANDMARKS.LEFT_SHOULDER,
        POSE_LANDMARKS.LEFT_ELBOW
      ),

    rightShoulder:
      calculateShoulderAngle(
        landmarks,
        POSE_LANDMARKS.RIGHT_HIP,
        POSE_LANDMARKS.RIGHT_SHOULDER,
        POSE_LANDMARKS.RIGHT_ELBOW
      ),

    leftElbow:
      calculateElbowAngle(
        landmarks,
        POSE_LANDMARKS.LEFT_SHOULDER,
        POSE_LANDMARKS.LEFT_ELBOW,
        POSE_LANDMARKS.LEFT_WRIST
      ),

    rightElbow:
      calculateElbowAngle(
        landmarks,
        POSE_LANDMARKS.RIGHT_SHOULDER,
        POSE_LANDMARKS.RIGHT_ELBOW,
        POSE_LANDMARKS.RIGHT_WRIST
      ),

    // El modelo de pose (33 puntos) no incluye landmarks de mano: sin un
    // punto más allá de la muñeca no hay forma de medir flexión/desviación
    // de muñeca. Requeriría integrar el Hand Landmarker de MediaPipe
    // aparte. Se deja en 0 a propósito (no se usa en ningún puntaje ROSA
    // hoy, ver armScoreOf en AutoEvaluationPage.tsx).
    leftWrist: 0,

    rightWrist: 0,

    leftKnee:
      calculateKneeAngle(
        landmarks,
        POSE_LANDMARKS.LEFT_HIP,
        POSE_LANDMARKS.LEFT_KNEE,
        POSE_LANDMARKS.LEFT_ANKLE
      ),

    rightKnee:
      calculateKneeAngle(
        landmarks,
        POSE_LANDMARKS.RIGHT_HIP,
        POSE_LANDMARKS.RIGHT_KNEE,
        POSE_LANDMARKS.RIGHT_ANKLE
      ),
  };
}
