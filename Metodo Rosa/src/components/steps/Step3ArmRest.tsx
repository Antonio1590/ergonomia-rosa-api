import { useEvaluation } from "../../context/EvaluationContext";
import type { EvaluationData } from "../../context/EvaluationContext";

type Duration = -1 | 0 | 1;

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-[#006D32] text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
    </div>
  );
}

function CheckItem({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-[#006D32]"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

function DurationSelect({
  value,
  onChange,
}: {
  value: Duration;
  onChange: (v: Duration) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold text-gray-600 mb-2">
        Tiempo de uso diario
      </p>
      <div className="flex flex-wrap gap-3">
        {([-1, 0, 1] as Duration[]).map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name={`duration-${Math.random()}`}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="w-4 h-4 accent-[#006D32]"
            />
            <span className="text-sm">
              {opt === -1
                ? "< 1 hora/día"
                : opt === 0
                ? "1 a 4 horas/día"
                : "> 4 horas/día"}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Step3ArmRest() {
  const { evalData, updateEval } = useEvaluation();

  const card = "border rounded-3xl overflow-hidden mb-6";
  const cardHeader = "bg-gray-100 p-5";
  const cardBody = "p-5 space-y-1";

  return (
    <div className="mt-14">

      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-full bg-[#006D32] text-white flex items-center justify-center font-bold">
          3
        </div>
        <h2 className="text-2xl font-bold">
          Periféricos y puesto de trabajo
        </h2>
      </div>

      {/* ── MONITOR ── */}
      <div className={card}>
        <div className={cardHeader}>
          <SectionHeader number={1} title="Monitor / Pantalla" />
        </div>
        <div className={cardBody}>
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Altura de la pantalla
          </p>
          {(
            [
              { val: 1 as 1 | 2 | 3, label: "Adecuada — a nivel de los ojos" },
              { val: 2 as 1 | 2 | 3, label: "Baja — obliga a flexionar el cuello" },
              { val: 3 as 1 | 2 | 3, label: "Alta — obliga a extender el cuello" },
            ] as { val: EvaluationData["monitorHeight"]; label: string }[]
          ).map(({ val, label }) => (
            <label
              key={val}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition"
            >
              <input
                type="radio"
                name="monitorHeight"
                checked={evalData.monitorHeight === val}
                onChange={() => updateEval({ monitorHeight: val })}
                className="w-4 h-4 accent-[#006D32]"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}

          <div className="mt-3 grid md:grid-cols-2 gap-1">
            <CheckItem
              checked={evalData.monitorLateralDeviation}
              onChange={(v) => updateEval({ monitorLateralDeviation: v })}
              label="Desviación lateral de cuello"
            />
            <CheckItem
              checked={evalData.monitorTooFar}
              onChange={(v) => updateEval({ monitorTooFar: v })}
              label="Monitor demasiado lejos"
            />
            <CheckItem
              checked={evalData.monitorGlare}
              onChange={(v) => updateEval({ monitorGlare: v })}
              label="Reflejos o deslumbramiento"
            />
          </div>

          <DurationSelect
            value={evalData.monitorDuration}
            onChange={(v) => updateEval({ monitorDuration: v })}
          />
        </div>
      </div>

      {/* ── TELÉFONO ── */}
      <div className={card}>
        <div className={cardHeader}>
          <SectionHeader number={2} title="Teléfono" />
        </div>
        <div className={cardBody}>
          <div className="grid md:grid-cols-2 gap-1">
            <CheckItem
              checked={evalData.phoneFar}
              onChange={(v) => updateEval({ phoneFar: v })}
              label="Teléfono demasiado lejos del cuerpo"
            />
            <CheckItem
              checked={evalData.phoneBetweenNeckShoulder}
              onChange={(v) => updateEval({ phoneBetweenNeckShoulder: v })}
              label="Usado entre cuello y hombro"
            />
          </div>

          <DurationSelect
            value={evalData.phoneDuration}
            onChange={(v) => updateEval({ phoneDuration: v })}
          />
        </div>
      </div>

      {/* ── MOUSE ── */}
      <div className={card}>
        <div className={cardHeader}>
          <SectionHeader number={3} title="Mouse" />
        </div>
        <div className={cardBody}>
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Posición del mouse
          </p>
          {(
            [
              { val: 1 as 1 | 2, label: "Alineado con el hombro" },
              { val: 2 as 1 | 2, label: "No alineado o alejado" },
            ] as { val: EvaluationData["mousePosition"]; label: string }[]
          ).map(({ val, label }) => (
            <label
              key={val}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition"
            >
              <input
                type="radio"
                name="mousePosition"
                checked={evalData.mousePosition === val}
                onChange={() => updateEval({ mousePosition: val })}
                className="w-4 h-4 accent-[#006D32]"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}

          <div className="mt-3 grid md:grid-cols-2 gap-1">
            <CheckItem
              checked={evalData.mouseTooSmall}
              onChange={(v) => updateEval({ mouseTooSmall: v })}
              label="Mouse demasiado pequeño para la mano"
            />
            <CheckItem
              checked={evalData.mouseDiffHeight}
              onChange={(v) => updateEval({ mouseDiffHeight: v })}
              label="Mouse a diferente altura del teclado"
            />
            <CheckItem
              checked={evalData.mouseHardWristRest}
              onChange={(v) => updateEval({ mouseHardWristRest: v })}
              label="Reposamuñecas duro o elevado"
            />
          </div>

          <DurationSelect
            value={evalData.mouseDuration}
            onChange={(v) => updateEval({ mouseDuration: v })}
          />
        </div>
      </div>

      {/* ── TECLADO ── */}
      <div className={card}>
        <div className={cardHeader}>
          <SectionHeader number={4} title="Teclado" />
        </div>
        <div className={cardBody}>
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Posición de muñecas
          </p>
          {(
            [
              { val: 1 as 1 | 2, label: "Muñecas rectas y hombros relajados" },
              { val: 2 as 1 | 2, label: "Extensión de muñecas > 15°" },
            ] as { val: EvaluationData["keyboardPosition"]; label: string }[]
          ).map(({ val, label }) => (
            <label
              key={val}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition"
            >
              <input
                type="radio"
                name="keyboardPosition"
                checked={evalData.keyboardPosition === val}
                onChange={() => updateEval({ keyboardPosition: val })}
                className="w-4 h-4 accent-[#006D32]"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}

          <div className="mt-3 grid md:grid-cols-2 gap-1">
            <CheckItem
              checked={evalData.keyboardLateralDeviation}
              onChange={(v) => updateEval({ keyboardLateralDeviation: v })}
              label="Desviación lateral de muñecas"
            />
            <CheckItem
              checked={evalData.keyboardTooHigh}
              onChange={(v) => updateEval({ keyboardTooHigh: v })}
              label="Teclado demasiado alto"
            />
            <CheckItem
              checked={evalData.keyboardNotAdjustable}
              onChange={(v) => updateEval({ keyboardNotAdjustable: v })}
              label="No ajustable"
            />
          </div>

          <DurationSelect
            value={evalData.keyboardDuration}
            onChange={(v) => updateEval({ keyboardDuration: v })}
          />
        </div>
      </div>

    </div>
  );
}
