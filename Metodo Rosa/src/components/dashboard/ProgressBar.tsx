import { useStep } from "../../context/StepContext";

const STEPS = [
  { n: 1, label: "Silla y Postura" },
  { n: 2, label: "Respaldo" },
  { n: 3, label: "Periféricos" },
  { n: 4, label: "Resultados" },
];

export default function ProgressBar() {
  const { step } = useStep();

  return (
    <div className="mb-10 px-2">
      <div className="flex items-center justify-between relative">
        {/* línea de fondo */}
        <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 z-0" />
        {/* línea de progreso */}
        <div
          className="absolute top-6 left-0 h-0.5 bg-[#006D32] z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map(({ n, label }) => {
          const done    = step > n;
          const current = step === n;
          return (
            <div key={n} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                  ${done    ? "bg-[#006D32] text-white shadow-md" : ""}
                  ${current ? "bg-[#006D32] text-white shadow-lg ring-4 ring-green-100" : ""}
                  ${!done && !current ? "bg-white border-2 border-gray-300 text-gray-400" : ""}
                `}
              >
                {done ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : n}
              </div>
              <span className={`text-xs font-bold whitespace-nowrap
                ${current ? "text-[#005224]" : done ? "text-[#006D32]" : "text-gray-400"}
              `}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
