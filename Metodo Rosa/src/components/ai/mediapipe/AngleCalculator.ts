import type { PosePoint } from "./PoseTypes";

/* =========================================================
   ÁNGULOS CORPORALES
========================================================= */

export interface BodyAngles {
  neck: number;
  trunk: number;

  leftShoulder: number;
  rightShoulder: number;

  leftElbow: number;
  rightElbow: number;

  leftKnee: number;
  rightKnee: number;
}

/* =========================================================
   ÁNGULO ENTRE TRES PUNTOS
========================================================= */

export function calculateAngle(
  a: PosePoint,
  b: PosePoint,
  c: PosePoint
): number {

  const ab = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };

  const cb = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: c.z - b.z,
  };

  const dot =
    ab.x * cb.x +
    ab.y * cb.y +
    ab.z * cb.z;

  const magnitudeAB =
    Math.sqrt(
      ab.x * ab.x +
      ab.y * ab.y +
      ab.z * ab.z
    );

  const magnitudeCB =
    Math.sqrt(
      cb.x * cb.x +
      cb.y * cb.y +
      cb.z * cb.z
    );

  if (
    magnitudeAB === 0 ||
    magnitudeCB === 0
  ) {
    return 0;
  }

  let cosine =
    dot /
    (magnitudeAB * magnitudeCB);

  cosine = Math.max(
    -1,
    Math.min(1, cosine)
  );

  return (
    Math.acos(cosine) *
    (180 / Math.PI)
  );
}

/* =========================================================
   ÁNGULO RESPECTO A LA VERTICAL
========================================================= */

function calculateVerticalAngle(
  top: PosePoint,
  bottom: PosePoint
): number {

  const dx =
    top.x - bottom.x;

  const dy =
    top.y - bottom.y;

  const dz =
    top.z - bottom.z;

  const magnitude =
    Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    );

  if (magnitude === 0) {
    return 0;
  }

  const cosine =
    Math.max(
      -1,
      Math.min(
        1,
        (-dy) / magnitude
      )
    );

  return (
    Math.acos(cosine) *
    (180 / Math.PI)
  );
}

/* =========================================================
   CÁLCULO PRINCIPAL
========================================================= */

export function calculateBodyAngles(
  landmarks: PosePoint[]
): BodyAngles {

  if (
    !landmarks ||
    landmarks.length < 29
  ) {
    return {
      neck: 0,
      trunk: 0,

      leftShoulder: 0,
      rightShoulder: 0,

      leftElbow: 0,
      rightElbow: 0,

      leftKnee: 0,
      rightKnee: 0,
    };
  }

  /*
   * MediaPipe Pose
   *
   * 0  = nariz
   *
   * 11 = hombro izquierdo
   * 12 = hombro derecho
   *
   * 13 = codo izquierdo
   * 14 = codo derecho
   *
   * 15 = muñeca izquierda
   * 16 = muñeca derecha
   *
   * 23 = cadera izquierda
   * 24 = cadera derecha
   *
   * 25 = rodilla izquierda
   * 26 = rodilla derecha
   *
   * 27 = tobillo izquierdo
   * 28 = tobillo derecho
   */

  const nose = landmarks[0];

  const leftShoulder =
    landmarks[11];

  const rightShoulder =
    landmarks[12];

  const leftElbow =
    landmarks[13];

  const rightElbow =
    landmarks[14];

  const leftWrist =
    landmarks[15];

  const rightWrist =
    landmarks[16];

  const leftHip =
    landmarks[23];

  const rightHip =
    landmarks[24];

  const leftKnee =
    landmarks[25];

  const rightKnee =
    landmarks[26];

  const leftAnkle =
    landmarks[27];

  const rightAnkle =
    landmarks[28];

  /* =======================================================
     CENTRO DE HOMBROS
  ======================================================= */

  const shoulderCenter: PosePoint = {
    x:
      (
        leftShoulder.x +
        rightShoulder.x
      ) / 2,

    y:
      (
        leftShoulder.y +
        rightShoulder.y
      ) / 2,

    z:
      (
        leftShoulder.z +
        rightShoulder.z
      ) / 2,

    visibility:
      Math.min(
        leftShoulder.visibility,
        rightShoulder.visibility
      ),
  };

  /* =======================================================
     CENTRO DE CADERAS
  ======================================================= */

  const hipCenter: PosePoint = {
    x:
      (
        leftHip.x +
        rightHip.x
      ) / 2,

    y:
      (
        leftHip.y +
        rightHip.y
      ) / 2,

    z:
      (
        leftHip.z +
        rightHip.z
      ) / 2,

    visibility:
      Math.min(
        leftHip.visibility,
        rightHip.visibility
      ),
  };

  /* =======================================================
     CUELLO
  ======================================================= */

  const neck =
    calculateVerticalAngle(
      nose,
      shoulderCenter
    );

  /* =======================================================
     TRONCO
  ======================================================= */

  const trunk =
    calculateVerticalAngle(
      shoulderCenter,
      hipCenter
    );

  /* =======================================================
     HOMBROS
  ======================================================= */

  const leftShoulderAngle =
    calculateAngle(
      leftElbow,
      leftShoulder,
      leftHip
    );

  const rightShoulderAngle =
    calculateAngle(
      rightElbow,
      rightShoulder,
      rightHip
    );

  /* =======================================================
     CODOS
  ======================================================= */

  const leftElbowAngle =
    calculateAngle(
      leftShoulder,
      leftElbow,
      leftWrist
    );

  const rightElbowAngle =
    calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );

  /* =======================================================
     RODILLAS
  ======================================================= */

  const leftKneeAngle =
    calculateAngle(
      leftHip,
      leftKnee,
      leftAnkle
    );

  const rightKneeAngle =
    calculateAngle(
      rightHip,
      rightKnee,
      rightAnkle
    );

  /* =======================================================
     RESULTADO
  ======================================================= */

  return {
    neck: Number.isFinite(neck)
      ? neck
      : 0,

    trunk: Number.isFinite(trunk)
      ? trunk
      : 0,

    leftShoulder:
      Number.isFinite(
        leftShoulderAngle
      )
        ? leftShoulderAngle
        : 0,

    rightShoulder:
      Number.isFinite(
        rightShoulderAngle
      )
        ? rightShoulderAngle
        : 0,

    leftElbow:
      Number.isFinite(
        leftElbowAngle
      )
        ? leftElbowAngle
        : 0,

    rightElbow:
      Number.isFinite(
        rightElbowAngle
      )
        ? rightElbowAngle
        : 0,

    leftKnee:
      Number.isFinite(
        leftKneeAngle
      )
        ? leftKneeAngle
        : 0,

    rightKnee:
      Number.isFinite(
        rightKneeAngle
      )
        ? rightKneeAngle
        : 0,
  };
}
