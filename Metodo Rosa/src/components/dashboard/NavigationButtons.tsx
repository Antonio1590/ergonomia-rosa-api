import { useStep } from "../../context/StepContext";
import { useRosaResult } from "../../context/RosaResultContext";
import { useDraft } from "../../hooks/useDraft";

export default function NavigationButtons() {
  const { step, nextStep, prevStep } = useStep();
  const { rosaResult, detections } = useRosaResult();
  const { saveDraft } = useDraft();

  const canAdvance = step === 1 ? rosaResult !== null : true;

  const handleSaveDraft = () => {
    saveDraft({ step, rosaResult, detections });
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">

      <div className="flex justify-between items-center">

        <button
          onClick={prevStep}
          disabled={step === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition ${
            step === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border border-[#A04100] text-[#A04100] hover:bg-orange-50"
          }`}
        >
          ← Anterior
        </button>

        <div className="flex gap-4">

          <button
            onClick={handleSaveDraft}
            className="px-6 py-3 rounded-2xl font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Guardar borrador
          </button>

          <button
            onClick={canAdvance ? nextStep : undefined}
            disabled={!canAdvance}
            title={!canAdvance ? "Sube y analiza una fotografía primero" : undefined}
            className={`px-6 py-3 rounded-2xl font-semibold transition shadow-lg ${
              canAdvance
                ? "bg-[#FF6B00] text-white hover:bg-[#E05A00]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {step === 4 ? "Finalizar evaluación" : "Siguiente →"}
          </button>

        </div>

      </div>

    </div>
  );
}