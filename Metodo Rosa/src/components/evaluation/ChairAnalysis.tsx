import { useState } from "react";
import SeatCard from "./SeatCard";

export default function ChairAnalysis() {
  const [selected, setSelected] = useState(1);

  return (
    <div className="max-w-7xl mx-auto">

      {/* Barra de progreso */}

      <div className="mb-10">

        <div className="flex justify-between mb-2">

          <span className="font-bold text-[#005224]">
            Progreso 25%
          </span>

          <span className="text-gray-500">
            Paso 1 de 4
          </span>

        </div>

        <div className="h-3 bg-gray-200 rounded-full">

          <div className="w-1/4 h-3 rounded-full bg-[#006D32]"></div>

        </div>

      </div>

      {/* Encabezado */}

      <h1 className="text-4xl font-bold">
        Análisis de la silla
      </h1>

      <p className="text-gray-500 mt-2 mb-10">
        Evalúe la postura y la configuración de la silla del trabajador.
      </p>

      {/* Tarjetas */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        <SeatCard
          title="Rodillas a 90°"
          description="Pies apoyados completamente sobre el piso."
          score={1}
          color="green"
          selected={selected === 1}
          onClick={() => setSelected(1)}
          image="https://placehold.co/600x450"
        />

        <SeatCard
          title="Muy alta o muy baja"
          description="Las piernas no forman un ángulo cercano a 90°."
          score={2}
          color="orange"
          selected={selected === 2}
          onClick={() => setSelected(2)}
          image="https://placehold.co/600x450"
        />

        <SeatCard
          title="No ajustable"
          description="La silla no permite modificar la altura."
          score={3}
          color="red"
          selected={selected === 3}
          onClick={() => setSelected(3)}
          image="https://placehold.co/600x450"
        />

      </div>

    </div>
  );
}