import { useState } from "react";

export interface ChairAssessmentData {
  chairHeight: number;
  chairDepth: number;
  backrest: number;
  armrest: number;
  footSupport: number;
}

interface ChairAssessmentProps {
  onChange?: (
    data: ChairAssessmentData
  ) => void;
}

const OPTIONS = {
  chairHeight: [
    {
      value: 1,
      title: "Rodillas a 90°",
      description:
        "Pies completamente apoyados sobre el suelo.",
    },
    {
      value: 2,
      title: "Muy alta o muy baja",
      description:
        "Las piernas no forman un ángulo cercano a 90°.",
    },
    {
      value: 3,
      title: "No ajustable",
      description:
        "La altura de la silla no puede modificarse.",
    },
  ],

  chairDepth: [
    {
      value: 1,
      title: "Profundidad adecuada",
      description:
        "Existe espacio suficiente entre el borde del asiento y la parte posterior de las rodillas.",
    },
    {
      value: 2,
      title: "Profundidad inadecuada",
      description:
        "El asiento es demasiado profundo o demasiado corto.",
    },
  ],

  backrest: [
    {
      value: 1,
      title: "Respaldo adecuado",
      description:
        "La espalda cuenta con soporte y el respaldo está correctamente utilizado.",
    },
    {
      value: 2,
      title: "Respaldo inadecuado",
      description:
        "El trabajador no utiliza correctamente el respaldo.",
    },
  ],

  armrest: [
    {
      value: 1,
      title: "Reposabrazos adecuado",
      description:
        "Los brazos cuentan con soporte adecuado.",
    },
    {
      value: 2,
      title: "Reposabrazos inadecuado",
      description:
        "El soporte de los brazos no es adecuado.",
    },
  ],

  footSupport: [
    {
      value: 1,
      title: "Pies apoyados",
      description:
        "Los pies permanecen completamente apoyados.",
    },
    {
      value: 2,
      title: "Sin apoyo adecuado",
      description:
        "Los pies no cuentan con apoyo suficiente.",
    },
  ],
};

export default function ChairAssessment({
  onChange,
}: ChairAssessmentProps) {
  const [data, setData] =
    useState<ChairAssessmentData>({
      chairHeight: 1,
      chairDepth: 1,
      backrest: 1,
      armrest: 1,
      footSupport: 1,
    });

  function updateValue(
    field: keyof ChairAssessmentData,
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
    <div className="mt-10 space-y-10">

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Análisis de la silla
        </h2>

        <p className="mt-2 text-gray-500">
          Evalúe la configuración de la silla y
          seleccione la condición que corresponda
          con la fotografía analizada.
        </p>
      </div>

      <AssessmentGroup
        title="Altura de la silla"
        options={OPTIONS.chairHeight}
        value={data.chairHeight}
        onChange={(value) =>
          updateValue("chairHeight", value)
        }
      />

      <AssessmentGroup
        title="Profundidad del asiento"
        options={OPTIONS.chairDepth}
        value={data.chairDepth}
        onChange={(value) =>
          updateValue("chairDepth", value)
        }
      />

      <AssessmentGroup
        title="Respaldo"
        options={OPTIONS.backrest}
        value={data.backrest}
        onChange={(value) =>
          updateValue("backrest", value)
        }
      />

      <AssessmentGroup
        title="Reposabrazos"
        options={OPTIONS.armrest}
        value={data.armrest}
        onChange={(value) =>
          updateValue("armrest", value)
        }
      />

      <AssessmentGroup
        title="Apoyo de los pies"
        options={OPTIONS.footSupport}
        value={data.footSupport}
        onChange={(value) =>
          updateValue("footSupport", value)
        }
      />

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
    <section>

      <h3 className="mb-4 text-lg font-bold text-gray-900">
        {title}
      </h3>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        {options.map((option) => {
          const selected =
            value === option.value;

          const scoreColor =
            option.value === 1
              ? "green"
              : option.value === 2
              ? "orange"
              : "red";

          const styles =
            scoreColor === "green"
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
              : scoreColor === "orange"
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

    </section>
  );
}