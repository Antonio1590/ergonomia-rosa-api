import { useEvaluation } from "../../context/EvaluationContext";

export default function BackSupport() {
  const { evalData, updateEval } = useEvaluation();

  const CheckItem = ({
    checked,
    onChange,
    title,
    description,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    title: string;
    description: string;
  }) => (
    <label
      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition"
      onClick={() => onChange(!checked)}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly
        className="mt-1 w-5 h-5 accent-[#006D32]"
      />
      <div>
        <h4 className="font-bold">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </label>
  );

  return (
    <section className="mt-14">

      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-[#006D32] text-white flex items-center justify-center font-bold">
          2
        </div>
        <h2 className="text-2xl font-bold">
          Respaldo y soporte lumbar
        </h2>
      </div>

      {/* Condición del respaldo */}
      <div className="border rounded-3xl overflow-hidden mb-6">
        <div className="bg-gray-100 p-5 font-semibold">
          Condición del respaldo
        </div>
        <div className="p-4 space-y-2">
          <label className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition">
            <input
              type="radio"
              name="backrestCondition"
              checked={evalData.backrestCondition === 1}
              onChange={() => updateEval({ backrestCondition: 1 })}
              className="mt-1 w-5 h-5 accent-[#006D32]"
            />
            <div>
              <h4 className="font-bold">Soporte lumbar adecuado</h4>
              <p className="text-sm text-gray-500 mt-1">
                La silla mantiene la curvatura natural de la espalda.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition">
            <input
              type="radio"
              name="backrestCondition"
              checked={evalData.backrestCondition === 2}
              onChange={() => updateEval({ backrestCondition: 2 })}
              className="mt-1 w-5 h-5 accent-[#006D32]"
            />
            <div>
              <h4 className="font-bold">Respaldo bajo o inexistente</h4>
              <p className="text-sm text-gray-500 mt-1">
                No alcanza la zona lumbar o superior de la espalda.
              </p>
            </div>
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-2 px-4 pb-4">
          <CheckItem
            checked={evalData.backrestNotAdjustable}
            onChange={(v) => updateEval({ backrestNotAdjustable: v })}
            title="Respaldo no ajustable"
            description="No permite modificar la inclinación ni la altura."
          />
          <CheckItem
            checked={evalData.workSurfaceTooHigh}
            onChange={(v) => updateEval({ workSurfaceTooHigh: v })}
            title="Superficie de trabajo muy alta"
            description="Obliga a elevar los hombros o inclinarse hacia adelante."
          />
        </div>
      </div>

      {/* Profundidad del asiento */}
      <div className="border rounded-3xl overflow-hidden">
        <div className="bg-gray-100 p-5 font-semibold">
          Profundidad del asiento
        </div>
        <div className="p-4 space-y-2">
          <label className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition">
            <input
              type="radio"
              name="chairDepth"
              checked={evalData.chairDepth === 1}
              onChange={() => updateEval({ chairDepth: 1 })}
              className="mt-1 w-5 h-5 accent-[#006D32]"
            />
            <div>
              <h4 className="font-bold">Adecuada (2–4 cm del borde)</h4>
              <p className="text-sm text-gray-500 mt-1">
                El borde del asiento no presiona la parte posterior de las rodillas.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition">
            <input
              type="radio"
              name="chairDepth"
              checked={evalData.chairDepth === 2}
              onChange={() => updateEval({ chairDepth: 2 })}
              className="mt-1 w-5 h-5 accent-[#006D32]"
            />
            <div>
              <h4 className="font-bold">Inadecuada (demasiado corta o larga)</h4>
              <p className="text-sm text-gray-500 mt-1">
                La profundidad no permite usar el respaldo o presiona las rodillas.
              </p>
            </div>
          </label>
        </div>
        <div className="px-4 pb-4">
          <CheckItem
            checked={evalData.chairDepthNotAdjustable}
            onChange={(v) => updateEval({ chairDepthNotAdjustable: v })}
            title="No ajustable"
            description="La profundidad del asiento no puede modificarse."
          />
        </div>
      </div>

    </section>
  );
}
