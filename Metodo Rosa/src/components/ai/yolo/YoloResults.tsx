import type { Detection } from "../../../ai/yolo/YoloTypes";

interface Props {
  detections: Detection[];
}

const CLASS_COLORS: Record<string, string> = {
  chair:           "bg-green-100 text-green-700",
  desk:            "bg-blue-100 text-blue-700",
  document_holder: "bg-yellow-100 text-yellow-700",
  laptop:          "bg-purple-100 text-purple-700",
  monitor:         "bg-indigo-100 text-indigo-700",
  mouse:           "bg-pink-100 text-pink-700",
  person:          "bg-emerald-100 text-emerald-700",
  phone:           "bg-orange-100 text-orange-700",
};

export default function YoloResults({ detections }: Props) {
  if (detections.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
        <p className="font-semibold text-yellow-700">
          No se detectaron objetos del puesto de trabajo en la imagen.
        </p>
        <p className="mt-1 text-sm text-yellow-600">
          Asegúrate de que la fotografía muestre claramente la silla, el monitor y el teclado.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">
        Objetos detectados en el puesto
      </h3>

      <div className="flex flex-wrap gap-3">
        {detections.map((det, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 ${CLASS_COLORS[det.className] ?? "bg-gray-100 text-gray-700"}`}
          >
            <span className="font-semibold">{det.label}</span>
            <span className="text-xs opacity-70">
              {Math.round(det.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {detections.length} elemento{detections.length !== 1 ? "s" : ""} identificado{detections.length !== 1 ? "s" : ""} por el modelo de IA
      </p>
    </div>
  );
}
