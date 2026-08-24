import { useStep } from "../../context/StepContext";
import { useSidebar } from "../../context/SidebarContext";

export default function Sidebar() {
  const { step, setStep } = useStep();
  const { isOpen, close } = useSidebar();

  const menu = [
    "Análisis de la silla",
    "Soporte lumbar",
    "Reposabrazos",
    "Resultado ROSA",
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-gray-200",
          "transform transition-transform motion-reduce:transition-none",
          "lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="pt-16 lg:pt-0 overflow-y-auto h-full">
          <div className="p-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-8">
              Evaluación ROSA
            </h2>

            <div className="space-y-4">
              {menu.map((item, index) => {
                const active = step === index + 1;

                return (
                  <button
                    key={item}
                    onClick={() => {
                      setStep(index + 1);
                      close();
                    }}
                    className={`w-full flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 ${
                      active
                        ? "bg-[#006D32] text-white shadow-lg"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                        active
                          ? "bg-white text-[#006D32]"
                          : "bg-gray-200"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
