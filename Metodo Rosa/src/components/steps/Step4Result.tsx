import { useState } from "react";
import { useRosaResult } from "../../context/RosaResultContext";
import { useAuth } from "../../context/AuthContext";
import { saveEvaluation } from "../../services/SheetsService";

const RISK_COLORS: Record<string, string> = {
  Inapreciable: "text-green-600 bg-green-50 border-green-200",
  Mejorable:    "text-yellow-600 bg-yellow-50 border-yellow-200",
  Alto:         "text-orange-600 bg-orange-50 border-orange-200",
  "Muy Alto":   "text-red-600 bg-red-50 border-red-200",
  Extremo:      "text-red-800 bg-red-100 border-red-400",
};

export default function Step4Result() {
  const { rosaResult, detections } = useRosaResult();
  const { user } = useAuth();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!rosaResult) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-700">
          Aún no hay resultados
        </h2>
        <p className="mt-3 text-gray-500">
          Sube una fotografía en el Paso 1 para generar el análisis ROSA.
        </p>
      </div>
    );
  }

  const { action, scores, recommendations } = rosaResult;
  const riskClass =
    RISK_COLORS[action.risk] ?? "text-gray-700 bg-gray-50 border-gray-200";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveEvaluation({
        fecha:            new Date().toISOString(),
        email:            user.email,
        puntajeFinal:     scores.final,
        nivelRiesgo:      action.risk,
        postura:          action.risk,
        detalles:         JSON.stringify({
          silla: scores.chair,
          pantalla: scores.monitorPhone,
          teclado: scores.keyboardMouse,
          objetos: detections.map((d) => d.label).join(", "),
        }),
        recomendaciones:  recommendations.join(" | "),
        // ángulos de postura si están disponibles en rosaResult
        neck:   (rosaResult as { angles?: { neck?: number } }).angles?.neck,
        trunk:  (rosaResult as { angles?: { trunk?: number } }).angles?.trunk,
        legs:   (rosaResult as { angles?: { legs?: number } }).angles?.legs,
        arms:   (rosaResult as { angles?: { arms?: number } }).angles?.arms,
        wrist:  (rosaResult as { angles?: { wrist?: number } }).angles?.wrist,
      });
      setSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Error al guardar"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Puntaje final */}
      <div className={`rounded-2xl border p-8 text-center ${riskClass}`}>
        <p className="text-6xl font-black">{scores.final}</p>
        <p className="mt-2 text-2xl font-bold">{action.risk}</p>
        <p className="mt-1 text-sm font-medium opacity-80">{action.action}</p>
      </div>

      {/* Puntajes parciales */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Silla", value: scores.chair },
          { label: "Pantalla / Teléfono", value: scores.monitorPhone },
          { label: "Teclado / Mouse", value: scores.keyboardMouse },
          { label: "Puesto (D)", value: scores.workstation },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-200 bg-white p-5 text-center"
          >
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Objetos detectados */}
      {detections.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-3 font-bold text-gray-900">
            Elementos detectados en el puesto
          </h3>
          <div className="flex flex-wrap gap-2">
            {detections.map((d, i) => (
              <span
                key={i}
                className="rounded-lg bg-green-50 px-3 py-1 text-sm font-medium text-green-700"
              >
                {d.label} ({Math.round(d.confidence * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-bold text-gray-900">Recomendaciones</h3>
        <ul className="space-y-3">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#005224] text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-gray-700">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Guardar */}
      {user && !saved && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-2 font-bold text-gray-900">
            Guardar evaluación
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            El resultado quedará registrado en el sistema para{" "}
            <strong>{user.nombre || user.email}</strong>.
          </p>

          {saveError && (
            <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {saveError}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#005224] px-6 py-3 font-semibold text-white hover:bg-[#006D32] transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar resultado"}
          </button>
        </div>
      )}

      {saved && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <p className="font-semibold text-green-700">
            Evaluación guardada correctamente en el sistema.
          </p>
        </div>
      )}

    </div>
  );
}
