import type { PosePoint } from "../../../ai/mediapipe/PoseTypes";
import { calculateAngle } from "../../../ai/mediapipe/AngleCalculator";

export interface RosaAngles {
  leftKnee: number;
  rightKnee: number;
  leftHip: number;
  rightHip: number;
  leftElbow: number;
  rightElbow: number;
}

export function calculateRosaAngles(
  landmarks: PosePoint[]
): RosaAngles | null {
  if (landmarks.length < 33) {
    return null;
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];

  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];

  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  return {
    leftKnee: calculateAngle(
      leftHip,
      leftKnee,
      leftAnkle
    ),

    rightKnee: calculateAngle(
      rightHip,
      rightKnee,
      rightAnkle
    ),

    leftHip: calculateAngle(
      leftShoulder,
      leftHip,
      leftKnee
    ),

    rightHip: calculateAngle(
      rightShoulder,
      rightHip,
      rightKnee
    ),

    leftElbow: calculateAngle(
      leftShoulder,
      leftElbow,
      leftWrist
    ),

    rightElbow: calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    ),
  };
}
