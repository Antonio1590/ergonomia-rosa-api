import { useState } from "react";
import ChairCard from "./ChairCard";
import SectionHeader from "./SectionHeader";

export default function ChairAnalysis() {
  const [selected, setSelected] = useState(1);

  return (
    <>
      <SectionHeader
  number={1}
  title="Análisis de la silla"
  subtitle="Evalúe la postura y configuración de la silla del trabajador."
/>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        <ChairCard
          title="Rodillas a 90°"
          description="Pies apoyados completamente sobre el suelo."
          score={1}
          color="green"
          selected={selected === 1}
          onClick={() => setSelected(1)}
        />

        <ChairCard
          title="Muy alta o muy baja"
          description="Las piernas no forman un ángulo cercano a 90°."
          score={2}
          color="orange"
          selected={selected === 2}
          onClick={() => setSelected(2)}
        />

        <ChairCard
          title="No ajustable"
          description="La silla no permite modificar la altura."
          score={3}
          color="red"
          selected={selected === 3}
          onClick={() => setSelected(3)}
        />

      </div>
    </>
  );
}