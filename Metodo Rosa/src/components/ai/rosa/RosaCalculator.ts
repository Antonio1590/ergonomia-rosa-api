export interface RosaSectionScore {
  score: number;
  reason: string;
}

export interface RosaScores {
  neck: RosaSectionScore;
  trunk: RosaSectionScore;
  legs: RosaSectionScore;
  upperArm: RosaSectionScore;
  lowerArm: RosaSectionScore;
}

function scoreNeck(angle: number): RosaSectionScore {
  const deviation = Math.abs(90 - angle);

  if (deviation <= 10) {
    return {
      score: 1,
      reason: "Cuello cercano a una posiciÃ³n neutra.",
    };
  }

  if (deviation <= 20) {
    return {
      score: 2,
      reason: "Ligera desviaciÃ³n de la posiciÃ³n neutra.",
    };
  }

  if (deviation <= 40) {
    return {
      score: 3,
      reason: "DesviaciÃ³n moderada del cuello.",
    };
  }

  return {
    score: 4,
    reason: "DesviaciÃ³n importante del cuello.",
  };
}

function scoreTrunk(angle: number): RosaSectionScore {
  const deviation = Math.abs(90 - angle);

  if (deviation <= 5) {
    return {
      score: 1,
      reason: "Tronco prÃ³ximo a posiciÃ³n neutra.",
    };
  }

  if (deviation <= 20) {
    return {
      score: 2,
      reason: "Ligera flexiÃ³n o extensiÃ³n del tronco.",
    };
  }

  if (deviation <= 45) {
    return {
      score: 3,
      reason: "FlexiÃ³n o extensiÃ³n moderada del tronco.",
    };
  }

  return {
    score: 4,
    reason: "FlexiÃ³n o extensiÃ³n elevada del tronco.",
  };
}

function scoreLegs(
  leftKnee: number,
  rightKnee: number
): RosaSectionScore {
  const average =
    (leftKnee + rightKnee) / 2;

  if (
    average >= 85 &&
    average <= 95
  ) {
    return {
      score: 1,
      reason:
        "Rodillas prÃ³ximas a 90Â°.",
    };
  }

  if (
    average >= 70 &&
    average <= 110
  ) {
    return {
      score: 2,
      reason:
        "Rodillas con desviaciÃ³n moderada.",
    };
  }

  return {
    score: 3,
    reason:
      "Ãngulo de rodillas fuera del rango recomendado.",
  };
}

function scoreUpperArm(
  leftElbow: number,
  rightElbow: number
): RosaSectionScore {
  const average =
    (leftElbow + rightElbow) / 2;

  if (
    average >= 80 &&
    average <= 110
  ) {
    return {
      score: 1,
      reason:
        "PosiciÃ³n de brazos cercana a neutra.",
    };
  }

  if (
    average >= 60 &&
    average <= 130
  ) {
    return {
      score: 2,
      reason:
        "DesviaciÃ³n moderada de los brazos.",
    };
  }

  return {
    score: 3,
    reason:
      "DesviaciÃ³n importante de los brazos.",
  };
}

function scoreLowerArm(
  leftElbow: number,
  rightElbow: number
): RosaSectionScore {
  const average =
    (leftElbow + rightElbow) / 2;

  if (
    average >= 80 &&
    average <= 100
  ) {
    return {
      score: 1,
      reason:
        "Codos prÃ³ximos al Ã¡ngulo recomendado.",
    };
  }

  if (
    average >= 60 &&
    average <= 120
  ) {
    return {
      score: 2,
      reason:
        "Ãngulo de codo con desviaciÃ³n moderada.",
    };
  }

  return {
    score: 3,
    reason:
      "Ãngulo de codo fuera del rango recomendado.",
  };
}

export function calculateRosaScores(
  angles: {
    leftKnee: number;
    rightKnee: number;
    leftHip: number;
    rightHip: number;
    leftElbow: number;
    rightElbow: number;
  }
): RosaScores {
  const averageHip =
    (angles.leftHip + angles.rightHip) / 2;

  return {
    neck: scoreNeck(averageHip),

    trunk: scoreTrunk(averageHip),

    legs: scoreLegs(
      angles.leftKnee,
      angles.rightKnee
    ),

    upperArm: scoreUpperArm(
      angles.leftElbow,
      angles.rightElbow
    ),

    lowerArm: scoreLowerArm(
      angles.leftElbow,
      angles.rightElbow
    ),
  };
}

