import { useState } from "react";

export interface WorkstationAssessmentData {
  monitorHeight: number;
  monitorDistance: number;
  monitorDuration: number;

  keyboardPosition: number;
  mousePosition: number;
  keyboardMouseDuration: number;
}

interface WorkstationAssessmentProps {
  onChange?: (
    data: WorkstationAssessmentData
  ) => void;
}

const MONITOR_HEIGHT_OPTIONS = [
  {
    value: 1,
    title: "Altura adecuada",
    description:
      "La parte superior del monitor está aproximadamente a la altura de los ojos.",
  },
  {
    value: 2,
    title: "Ligeramente elevada o baja",
    description:
      "El monitor presenta una desviación moderada respecto a la altura recomendada.",
  },
  {
    value: 3,
    title: "Altura inadecuada",
    description:
      "La posición obliga a mantener el cuello en una postura desfavorable.",
  },
];

const MONITOR_DISTANCE_OPTIONS = [
  {
    value: 1,
    title: "Distancia adecuada",
    description:
      "El monitor se encuentra a una distancia cómoda para la visualización.",
  },
  {
    value: 2,
    title: "Distancia inadecuada",
    description:
      "El monitor está demasiado cerca o demasiado lejos.",
  },
];

const MONITOR_DURATION_OPTIONS = [
  {
    value: 1,
    title: "Menos de 2 horas",
    description:
      "Exposición relativamente corta durante la jornada.",
  },
  {
    value: 2,
    title: "Entre 2 y 4 horas",
    description:
      "Exposición moderada durante la jornada.",
  },
  {
    value: 3,
    title: "Más de 4 horas",
    description:
      "Exposición prolongada durante la jornada.",
  },
];

const KEYBOARD_OPTIONS = [
  {
    value: 1,
    title: "Posición adecuada",
    description:
      "Teclado próximo al trabajador y muñecas en posición cómoda.",
  },
  {
    value: 2,
    title: "Posición inadecuada",
    description:
      "El teclado genera una postura desfavorable de manos o muñecas.",
  },
];

const MOUSE_OPTIONS = [
  {
    value: 1,
    title: "Posición adecuada",
    description:
      "El mouse está próximo al teclado y permite trabajar con el brazo cómodo.",
  },
  {
    value: 2,
    title: "Posición inadecuada",
    description:
      "El mouse obliga a extender o separar excesivamente el brazo.",
  },
];

const KEYBOARD_MOUSE_DURATION_OPTIONS = [
  {
    value: 1,
    title: "Menos de 2 horas",
    description:
      "Uso relativamente corto durante la jornada.",
  },
  {
    value: 2,
    title: "Entre 2 y 4 horas",
    description:
      "Uso moderado durante la jornada.",
  },
  {
    value: 3,
    title: "Más de 4 horas",
    description:
      "Uso prolongado durante la jornada.",
  },
];

export default function WorkstationAssessment({
  onChange,
}: WorkstationAssessmentProps) {
  const [data, setData] =
    useState<WorkstationAssessmentData>({
      monitorHeight: 1,
      monitorDistance: 1,
      monitorDuration: 1,

      keyboardPosition: 1,
      mousePosition: 1,
      keyboardMouseDuration: 1,
    });

  function updateValue(
    field: keyof WorkstationAssessmentData,
    value: number
  ) {
    const updated = {
      ...data,
      [field]: value,
    };

    setData(updated);

    onChange?.(updated);
  }

  return (
    <div className="mt-12 space-y-12">

      {/* =====================================================
          MONITOR
      ===================================================== */}

      <section>

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-gray-900">
            Análisis del monitor
          </h2>

          <p className="mt-2 text-gray-500">
            Evalúe la posición y el tiempo de exposición
            frente al monitor.
          </p>

        </div>

        <AssessmentGroup
          title="Altura del monitor"
          options={MONITOR_HEIGHT_OPTIONS}
          value={data.monitorHeight}
          onChange={(value) =>
            updateValue(
              "monitorHeight",
              value
            )
          }
        />

        <div className="mt-10">

          <AssessmentGroup
            title="Distancia del monitor"
            options={MONITOR_DISTANCE_OPTIONS}
            value={data.monitorDistance}
            onChange={(value) =>
              updateValue(
                "monitorDistance",
                value
              )
            }
          />

        </div>

        <div className="mt-10">

          <AssessmentGroup
            title="Tiempo de uso del monitor"
            options={MONITOR_DURATION_OPTIONS}
            value={data.monitorDuration}
            onChange={(value) =>
              updateValue(
                "monitorDuration",
                value
              )
            }
          />

        </div>

      </section>


      {/* =====================================================
          TECLADO Y MOUSE
      ===================================================== */}

      <section>

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-gray-900">
            Teclado y mouse
          </h2>

          <p className="mt-2 text-gray-500">
            Evalúe la posición de los elementos y el
            tiempo de utilización durante la jornada.
          </p>

        </div>

        <AssessmentGroup
          title="Posición del teclado"
          options={KEYBOARD_OPTIONS}
          value={data.keyboardPosition}
          onChange={(value) =>
            updateValue(
              "keyboardPosition",
              value
            )
          }
        />

        <div className="mt-10">

          <AssessmentGroup
            title="Posición del mouse"
            options={MOUSE_OPTIONS}
            value={data.mousePosition}
            onChange={(value) =>
              updateValue(
                "mousePosition",
                value
              )
            }
          />

        </div>

        <div className="mt-10">

          <AssessmentGroup
            title="Tiempo de uso de teclado y mouse"
            options={KEYBOARD_MOUSE_DURATION_OPTIONS}
            value={data.keyboardMouseDuration}
            onChange={(value) =>
              updateValue(
                "keyboardMouseDuration",
                value
              )
            }
          />

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   GRUPO DE OPCIONES
========================================================= */

function AssessmentGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: {
    value: number;
    title: string;
    description: string;
  }[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>

      <h3 className="mb-4 text-lg font-bold text-gray-900">
        {title}
      </h3>

      <div
        className={`grid grid-cols-1 gap-5 ${
          options.length === 2
            ? "md:grid-cols-2"
            : "md:grid-cols-3"
        }`}
      >

        {options.map((option) => {

          const selected =
            value === option.value;

          const styles =
            option.value === 1
              ? {
                  border:
                    "border-[#006D32]",
                  ring:
                    "ring-[#006D32]",
                  background:
                    "bg-green-50",
                  text:
                    "text-green-700",
                }
              : option.value === 2
              ? {
                  border:
                    "border-orange-500",
                  ring:
                    "ring-orange-500",
                  background:
                    "bg-orange-50",
                  text:
                    "text-orange-600",
                }
              : {
                  border:
                    "border-red-600",
                  ring:
                    "ring-red-600",
                  background:
                    "bg-red-50",
                  text:
                    "text-red-600",
                };

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(option.value)
              }
              className={`rounded-3xl border p-6 text-left transition-all duration-300 ${
                selected
                  ? `${styles.border} ${styles.background} ring-2 ${styles.ring} shadow-xl`
                  : "border-gray-200 bg-white hover:-translate-y-1 hover:shadow-lg"
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <h4 className="text-lg font-bold text-gray-900">
                  {option.title}
                </h4>

                {selected && (
                  <span
                    className={`text-xl ${styles.text}`}
                  >
                    ✓
                  </span>
                )}

              </div>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                {option.description}
              </p>

              <div
                className={`mt-5 font-bold ${styles.text}`}
              >
                Puntaje {option.value}
              </div>

            </button>
          );
        })}

      </div>

    </div>
  );
}