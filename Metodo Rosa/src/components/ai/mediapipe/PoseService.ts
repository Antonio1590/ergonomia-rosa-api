import {
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

import type { PosePoint } from "./PoseTypes";


const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";


let detector: PoseLandmarker | null = null;


/* =========================================================
   INICIALIZAR MEDIAPIPE
========================================================= */

export async function initPose(): Promise<PoseLandmarker> {

  if (detector) {
    return detector;
  }

  const vision =
    await FilesetResolver.forVisionTasks(
      WASM_PATH
    );

  detector =
    await PoseLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: "GPU",
        },

        runningMode: "IMAGE",

        numPoses: 1,

        minPoseDetectionConfidence: 0.5,

        minPosePresenceConfidence: 0.5,

        minTrackingConfidence: 0.5,
      }
    );

  return detector;
}


/* =========================================================
   DETECTAR POSTURA
========================================================= */

export async function detectPose(
  image: HTMLImageElement
): Promise<{
  landmarks: PosePoint[];
}> {

  if (!image) {
    throw new Error(
      "No se recibió ninguna imagen."
    );
  }


  /* Esperar a que la imagen esté cargada */

  if (!image.complete) {

    await new Promise<void>(
      (resolve, reject) => {

        image.onload = () => {
          resolve();
        };

        image.onerror = () => {
          reject(
            new Error(
              "No se pudo cargar la imagen."
            )
          );
        };

      }
    );
  }


  /* Obtener detector */

  const poseDetector =
    await initPose();


  /* Ejecutar MediaPipe */

  const result =
    poseDetector.detect(image);


  /* No se detectó ninguna persona */

  if (
    !result.landmarks ||
    result.landmarks.length === 0
  ) {

    return {
      landmarks: [],
    };
  }


  /* Primera persona detectada */

  const detectedLandmarks =
    result.landmarks[0];


  /* Convertir puntos */

  const landmarks: PosePoint[] =
    detectedLandmarks.map(
      (landmark) => ({
        x: landmark.x ?? 0,

        y: landmark.y ?? 0,

        z: landmark.z ?? 0,

        visibility:
          landmark.visibility ?? 1,
      })
    );


  return {
    landmarks,
  };
}


/* =========================================================
   LIBERAR MEDIAPIPE
========================================================= */

export function disposePose(): void {

  if (detector) {

    detector.close();

    detector = null;
  }
}