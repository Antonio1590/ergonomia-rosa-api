import * as ort from "onnxruntime-web";
import {
  YOLO_CLASSES,
  YOLO_CLASS_LABELS,
} from "./YoloTypes";
import type { Detection } from "./YoloTypes";

/*
 * Rutas relativas a la base de despliegue. Apps Script no puede servir
 * binarios (.onnx / .wasm), así que VITE_ASSETS_URL permite apuntarlos
 * a un host estático cuando la app se publica desde Apps Script.
 */
const RAW_BASE: string =
  import.meta.env.VITE_ASSETS_URL || import.meta.env.BASE_URL || "./";

/*
 * Se resuelve contra el documento, no contra este módulo. onnxruntime carga
 * su loader con import() dinámico: una ruta relativa como "./" se resolvería
 * contra /assets/ (donde vive el bundle) y no encontraría los archivos, que
 * están en la raíz del sitio.
 */
const ASSETS_BASE: string = new URL(
  RAW_BASE.endsWith("/") ? RAW_BASE : `${RAW_BASE}/`,
  document.baseURI
).href;

const MODEL_URL = `${ASSETS_BASE}best.onnx`;
const INPUT_SIZE = 640;
const CONFIDENCE_THRESHOLD = 0.35;
const IOU_THRESHOLD = 0.45;

let session: ort.InferenceSession | null = null;


/* =========================================================
   INICIALIZAR MODELO
========================================================= */

export async function initYolo(): Promise<ort.InferenceSession> {
  if (session) return session;

  ort.env.wasm.wasmPaths = ASSETS_BASE;

  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ["wasm"],
  });

  return session;
}


/* =========================================================
   PRE-PROCESADO
========================================================= */

function preprocessImage(
  imageElement: HTMLImageElement
): { tensor: ort.Tensor; scaleX: number; scaleY: number } {
  const canvas = document.createElement("canvas");
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageElement, 0, 0, INPUT_SIZE, INPUT_SIZE);

  const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const { data } = imageData;

  // Convertir a float32 en formato CHW (channels, height, width)
  const float32 = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    float32[i] = data[i * 4] / 255;                    // R
    float32[i + INPUT_SIZE * INPUT_SIZE] = data[i * 4 + 1] / 255; // G
    float32[i + INPUT_SIZE * INPUT_SIZE * 2] = data[i * 4 + 2] / 255; // B
  }

  const tensor = new ort.Tensor("float32", float32, [
    1,
    3,
    INPUT_SIZE,
    INPUT_SIZE,
  ]);

  return {
    tensor,
    scaleX: imageElement.naturalWidth / INPUT_SIZE,
    scaleY: imageElement.naturalHeight / INPUT_SIZE,
  };
}


/* =========================================================
   NMS
========================================================= */

function iou(
  a: [number, number, number, number],
  b: [number, number, number, number]
): number {
  const xA = Math.max(a[0], b[0]);
  const yA = Math.max(a[1], b[1]);
  const xB = Math.min(a[0] + a[2], b[0] + b[2]);
  const yB = Math.min(a[1] + a[3], b[1] + b[3]);

  const inter = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const areaA = a[2] * a[3];
  const areaB = b[2] * b[3];

  return inter / (areaA + areaB - inter);
}

function nms(detections: Detection[]): Detection[] {
  const sorted = [...detections].sort(
    (a, b) => b.confidence - a.confidence
  );
  const kept: Detection[] = [];

  for (const det of sorted) {
    const box: [number, number, number, number] = [
      det.x, det.y, det.width, det.height,
    ];
    const overlaps = kept.some(
      (k) =>
        k.classId === det.classId &&
        iou(box, [k.x, k.y, k.width, k.height]) > IOU_THRESHOLD
    );
    if (!overlaps) kept.push(det);
  }

  return kept;
}


/* =========================================================
   POST-PROCESADO
========================================================= */

function postprocess(
  output: ort.Tensor,
  scaleX: number,
  scaleY: number
): Detection[] {
  const data = output.data as Float32Array;
  const dims = output.dims;

  // Detectar formato automáticamente:
  // Formato A (clásico): [1, numFields, numAnchors]  — dims[1] < dims[2]
  // Formato B (reciente): [1, numAnchors, numFields] — dims[1] > dims[2]
  const isFormatA = dims[1] < dims[2];
  const numAnchors = isFormatA ? dims[2] : dims[1];
  const numFields  = isFormatA ? dims[1] : dims[2];
  const numClasses = numFields - 4;

  const detections: Detection[] = [];

  for (let a = 0; a < numAnchors; a++) {
    const cx = isFormatA ? data[0 * numAnchors + a] : data[a * numFields + 0];
    const cy = isFormatA ? data[1 * numAnchors + a] : data[a * numFields + 1];
    const w  = isFormatA ? data[2 * numAnchors + a] : data[a * numFields + 2];
    const h  = isFormatA ? data[3 * numAnchors + a] : data[a * numFields + 3];

    let maxConf = 0;
    let classId = 0;

    for (let c = 0; c < numClasses; c++) {
      const conf = isFormatA
        ? data[(4 + c) * numAnchors + a]
        : data[a * numFields + 4 + c];
      if (conf > maxConf) {
        maxConf = conf;
        classId = c;
      }
    }

    if (maxConf < CONFIDENCE_THRESHOLD) continue;
    if (classId >= YOLO_CLASSES.length) continue;

    const className = YOLO_CLASSES[classId];

    detections.push({
      classId,
      className,
      label: YOLO_CLASS_LABELS[className],
      confidence: maxConf,
      x: (cx - w / 2) * scaleX,
      y: (cy - h / 2) * scaleY,
      width: w * scaleX,
      height: h * scaleY,
    });
  }

  return nms(detections);
}


/* =========================================================
   DETECCIÓN
========================================================= */

export async function detectObjects(
  image: HTMLImageElement
): Promise<Detection[]> {
  const { tensor, scaleX, scaleY } = preprocessImage(image);
  const yolo = await initYolo();

  const inputName = yolo.inputNames[0];
  const feeds = { [inputName]: tensor };

  const results = await yolo.run(feeds);
  const output = results[yolo.outputNames[0]];

  return postprocess(output, scaleX, scaleY);
}
