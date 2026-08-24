export const YOLO_CLASSES = [
  "chair",
  "desk",
  "document_holder",
  "laptop",
  "monitor",
  "mouse",
  "person",
  "phone",
] as const;

export type YoloClass = (typeof YOLO_CLASSES)[number];

export const YOLO_CLASS_LABELS: Record<YoloClass, string> = {
  chair: "Silla",
  desk: "Escritorio",
  document_holder: "Atril / portadocumentos",
  laptop: "Laptop",
  monitor: "Monitor",
  mouse: "Mouse",
  person: "Persona",
  phone: "Teléfono",
};

export interface Detection {
  classId: number;
  className: YoloClass;
  label: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
