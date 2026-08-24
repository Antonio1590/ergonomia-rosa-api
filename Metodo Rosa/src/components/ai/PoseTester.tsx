import { useEffect, useState } from "react";

import { detectPose } from "../../ai/mediapipe/PoseService";
import type {
  PosePoint,
  PoseResult,
} from "../../ai/mediapipe/PoseTypes";

import {
  calculateBodyAngles,
} from "../../ai/mediapipe/AngleCalculator";

import type {
  BodyAngles,
} from "../../ai/mediapipe/AngleCalculator";

import {
  calculateRosaAngles,
} from "./mediapipe/RosaAngles";

import type {
  RosaAngles,
} from "./mediapipe/RosaAngles";

import {
  calculateRosaEngine,
} from "./rosa/RosaEngine";

import type {
  RosaAssessment,
  RosaCalculationResult,
} from "./rosa/RosaAssessment";

import { detectObjects } from "../../ai/yolo/YoloService";
import type { Detection } from "../../ai/yolo/YoloTypes";
import YoloResults from "./yolo/YoloResults";
import { useRosaResult } from "../../context/RosaResultContext";
import { useEvaluation } from "../../context/EvaluationContext";


interface PoseTesterProps {
  imageFile: File | null;
}


export default function PoseTester({
  imageFile,
}: PoseTesterProps) {

  const [preview, setPreview] =
    useState<string | null>(null);

  const [poseResult, setPoseResult] =
    useState<PoseResult | null>(null);

  const [angles, setAngles] =
    useState<BodyAngles | null>(null);

  const [rosaAngles, setRosaAngles] =
    useState<RosaAngles | null>(null);

  const [rosaResult, setRosaResult] =
    useState<RosaCalculationResult | null>(null);

  const [yoloDetections, setYoloDetections] =
    useState<Detection[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const {
    setRosaResult: setSharedRosa,
    setDetections: setSharedDetections,
  } = useRosaResult();

  const { evalData } = useEvaluation();


  /*
   * =========================================================
   * EVALUACIÓN POSTURAL
   * =========================================================
   */

  const createPostureAssessment = (
    bodyAngles: BodyAngles
  ) => {

    const neckScore =
      bodyAngles.neck <= 10
        ? 1
        : bodyAngles.neck <= 20
          ? 2
          : 3;


    const trunkScore =
      bodyAngles.trunk <= 5
        ? 1
        : bodyAngles.trunk <= 20
          ? 2
          : 3;


    const upperArmAngle =
      Math.max(
        Math.abs(bodyAngles.leftShoulder),
        Math.abs(bodyAngles.rightShoulder)
      );


    const upperArmScore =
      upperArmAngle <= 20
        ? 1
        : upperArmAngle <= 45
          ? 2
          : 3;


    const lowerArmAngle =
      (
        bodyAngles.leftElbow +
        bodyAngles.rightElbow
      ) / 2;


    const lowerArmScore =
      lowerArmAngle >= 80 &&
      lowerArmAngle <= 120
        ? 1
        : 2;


    const legsScore =
      bodyAngles.leftKnee >= 80 &&
      bodyAngles.leftKnee <= 120 &&
      bodyAngles.rightKnee >= 80 &&
      bodyAngles.rightKnee <= 120
        ? 1
        : 2;


    return {
      neck: neckScore,
      trunk: trunkScore,
      upperArm: upperArmScore,
      lowerArm: lowerArmScore,
      legs: legsScore,
    };
  };


  /*
   * =========================================================
   * CONSTRUIR ASSESSMENT ROSA
   * =========================================================
   */

  const buildRosaAssessment = (
    bodyAngles: BodyAngles
  ): RosaAssessment => {

    const posture =
      createPostureAssessment(
        bodyAngles
      );


    return {

      chair: {

        height:
          posture.legs,

        depth:
          evalData.chairDepth,

        armrest:
          posture.upperArm,

        backrest:
          evalData.backrestCondition === 1
            ? posture.trunk
            : 2,

        duration:
          0,

        armrestTooFarApart:
          false,

        armrestHardOrDamaged:
          false,

        armrestNotAdjustable:
          false,

        workSurfaceTooHigh:
          evalData.workSurfaceTooHigh,

        backrestNotAdjustable:
          evalData.backrestNotAdjustable,
      },


      monitor: {

        height:
          evalData.monitorHeight,

        lateralDeviation:
          evalData.monitorLateralDeviation,

        tooFar:
          evalData.monitorTooFar,

        glare:
          evalData.monitorGlare,

        distance:
          0,

        duration:
          evalData.monitorDuration,
      },


      phone: {

        betweenNeckAndShoulder:
          evalData.phoneBetweenNeckShoulder,

        distance:
          evalData.phoneFar ? 2 : 1,

        duration:
          evalData.phoneDuration,
      },


      mouse: {

        position:
          evalData.mousePosition,

        tooSmall:
          evalData.mouseTooSmall,

        differentHeightFromKeyboard:
          evalData.mouseDiffHeight,

        hardWristRest:
          evalData.mouseHardWristRest,

        duration:
          evalData.mouseDuration,
      },


      keyboard: {

        position:
          evalData.keyboardPosition,

        lateralWristDeviation:
          evalData.keyboardLateralDeviation,

        tooHigh:
          evalData.keyboardTooHigh,

        notAdjustable:
          evalData.keyboardNotAdjustable,

        duration:
          evalData.keyboardDuration,
      },


      posture: {

        neck:
          posture.neck,

        trunk:
          posture.trunk,

        legs:
          posture.legs,

        upperArm:
          posture.upperArm,

        lowerArm:
          posture.lowerArm,
      },
    };
  };


  /*
   * =========================================================
   * ANALIZAR POSTURA
   * =========================================================
   */

  const handleAnalyzePose = async (
    file: File
  ) => {

    try {

      setLoading(true);
      setError(null);

      const image =
        new Image();

      const imageUrl =
        URL.createObjectURL(file);


      image.src =
        imageUrl;


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


      /*
       * DETECCIÓN MEDIAPIPE
       */

      const result =
        await detectPose(image);


      if (
        !result ||
        !result.landmarks ||
        result.landmarks.length === 0
      ) {

        throw new Error(
          "No se pudieron detectar puntos corporales en la fotografía."
        );

      }


      setPoseResult(
        result
      );


      /*
       * ÁNGULOS CORPORALES
       */

      const bodyAngles =
        calculateBodyAngles(
          result.landmarks
        );


      setAngles(
        bodyAngles
      );


      /*
       * ÁNGULOS ROSA
       */

      const calculatedRosaAngles =
        calculateRosaAngles(
          result.landmarks
        );


      if (!calculatedRosaAngles) {

        throw new Error(
          "No fue posible calcular los ángulos ROSA."
        );

      }


      setRosaAngles(
        calculatedRosaAngles
      );


      /*
       * ASSESSMENT
       */

      const assessment =
        buildRosaAssessment(
          bodyAngles
        );


      /*
       * MOTOR ROSA
       */

      const rosaCalculation =
        calculateRosaEngine(
          assessment
        );


      setRosaResult(
        rosaCalculation
      );

      setSharedRosa(rosaCalculation);


      /*
       * YOLO — detección de objetos
       */

      try {
        const yolo = await detectObjects(image);
        setYoloDetections(yolo);
        setSharedDetections(yolo);
      } catch (err) {
        // YOLO falla silenciosamente; pose ya fue analizada
        console.warn("[YOLO] Detección fallida:", err);
        setYoloDetections([]);
        setSharedDetections([]);
      }


      URL.revokeObjectURL(
        imageUrl
      );

    } catch (err) {

      console.error(
        "Error en análisis ROSA:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error durante el análisis."
      );

    } finally {

      setLoading(false);

    }

  };


  /*
   * =========================================================
   * ARCHIVO RECIBIDO DESDE CameraUploader
   * =========================================================
   */

  useEffect(() => {

    if (!imageFile) {
      return;
    }


    if (
      !imageFile.type.startsWith(
        "image/"
      )
    ) {

      setError(
        "El archivo seleccionado no es una imagen válida."
      );

      return;

    }


    const previewUrl =
      URL.createObjectURL(
        imageFile
      );


    setPreview(
      previewUrl
    );


    setPoseResult(null);
    setAngles(null);
    setRosaAngles(null);
    setRosaResult(null);
    setYoloDetections([]);
    setError(null);


    void handleAnalyzePose(
      imageFile
    );


    return () => {

      URL.revokeObjectURL(
        previewUrl
      );

    };

  }, [imageFile]);


  /*
   * =========================================================
   * INTERFAZ
   * =========================================================
   */

  return (

    <div className="w-full max-w-7xl mx-auto p-6">

      {preview && (

        <div className="mt-8">

          <h3 className="mb-4 text-xl font-bold">
            Fotografía analizada
          </h3>

          <img
            src={preview}
            alt="Fotografía para análisis ROSA"
            className="max-h-[650px] w-full rounded-2xl object-contain"
          />

        </div>

      )}


      {loading && (

        <div className="mt-8 rounded-2xl bg-green-50 p-6 text-center">

          <p className="font-semibold text-green-700">
            Analizando postura...
          </p>

        </div>

      )}


      {error && (

        <div className="mt-8 rounded-2xl bg-red-50 p-6">

          <p className="font-semibold text-red-700">
            {error}
          </p>

        </div>

      )}


      {angles && (

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">

          <h3 className="mb-5 text-xl font-bold">
            Ángulos corporales
          </h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

            <div>
              <p className="text-sm text-gray-500">
                Cuello
              </p>

              <p className="text-2xl font-bold">
                {angles.neck.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Tronco
              </p>

              <p className="text-2xl font-bold">
                {angles.trunk.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Codo izquierdo
              </p>

              <p className="text-2xl font-bold">
                {angles.leftElbow.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Codo derecho
              </p>

              <p className="text-2xl font-bold">
                {angles.rightElbow.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Rodilla izquierda
              </p>

              <p className="text-2xl font-bold">
                {angles.leftKnee.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Rodilla derecha
              </p>

              <p className="text-2xl font-bold">
                {angles.rightKnee.toFixed(1)}°
              </p>
            </div>

          </div>

        </div>

      )}


      {rosaAngles && (

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">

          <h3 className="mb-5 text-xl font-bold">
            Ángulos ROSA
          </h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">

            <div>
              <p className="text-sm text-gray-500">
                Cadera izquierda
              </p>

              <p className="text-2xl font-bold">
                {rosaAngles.leftHip.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Cadera derecha
              </p>

              <p className="text-2xl font-bold">
                {rosaAngles.rightHip.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Rodilla izquierda
              </p>

              <p className="text-2xl font-bold">
                {rosaAngles.leftKnee.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Rodilla derecha
              </p>

              <p className="text-2xl font-bold">
                {rosaAngles.rightKnee.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Codo izquierdo
              </p>

              <p className="text-2xl font-bold">
                {rosaAngles.leftElbow.toFixed(1)}°
              </p>
            </div>


            <div>
              <p className="text-sm text-gray-500">
                Codo derecho
              </p>

              <p className="text-2xl font-bold">
                {rosaAngles.rightElbow.toFixed(1)}°
              </p>
            </div>

          </div>

        </div>

      )}


      {rosaResult && (

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">

          <h3 className="text-2xl font-bold">
            Resultado ROSA
          </h3>


          <div className="mt-5">

            <p className="text-4xl font-bold text-[#006D32]">
              {rosaResult.action.score}
            </p>


            <p className="mt-2 text-lg font-semibold">
              {rosaResult.action.risk}
            </p>


            <p className="mt-2 text-gray-600">
              {rosaResult.action.action}
            </p>

          </div>


          {rosaResult.recommendations?.length > 0 && (

            <div className="mt-6">

              <h4 className="font-bold">
                Recomendaciones
              </h4>


              <ul className="mt-3 list-disc space-y-2 pl-6">

                {rosaResult.recommendations.map(
                  (
                    recommendation,
                    index
                  ) => (

                    <li key={index}>
                      {recommendation}
                    </li>

                  )
                )}

              </ul>

            </div>

          )}

        </div>

      )}


      {yoloDetections.length >= 0 && rosaResult && (
        <YoloResults detections={yoloDetections} />
      )}


      {poseResult && (

        <details className="mt-8 rounded-2xl border border-gray-200 p-6">

          <summary className="cursor-pointer font-semibold">
            Ver puntos corporales detectados
          </summary>


          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">

            {poseResult.landmarks.map(
              (
                point: PosePoint,
                index: number
              ) => (

                <div
                  key={index}
                  className="rounded-xl bg-gray-50 p-3"
                >

                  <p className="font-semibold text-gray-700">
                    Punto {index}
                  </p>

                  <p className="text-sm text-gray-500">
                    X: {point.x.toFixed(3)}
                  </p>

                  <p className="text-sm text-gray-500">
                    Y: {point.y.toFixed(3)}
                  </p>

                  <p className="text-sm text-gray-500">
                    Z: {point.z.toFixed(3)}
                  </p>

                  <p className="text-sm text-gray-500">
                    Visibilidad: {point.visibility.toFixed(3)}
                  </p>

                </div>

              )
            )}

          </div>

        </details>

      )}

    </div>

  );
}