export default function Evaluation() {
  return (
    <div className="space-y-8">

      <div>
        <div className="flex justify-between mb-2">

          <span className="font-semibold text-green-700">
            Progreso 25%
          </span>

          <span className="text-gray-500">
            Paso 1 de 4
          </span>

        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full">
          <div className="w-1/4 h-3 rounded-full bg-green-700" />
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-bold">
          Evaluación ROSA
        </h1>

        <p className="text-gray-500 mt-2">
          Evaluación ergonómica automática mediante análisis de postura.
        </p>
      </div>

    </div>
  );
}
