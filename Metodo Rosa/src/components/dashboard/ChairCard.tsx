import ErgonomicIllustration from "./ErgonomicIllustration";

type ChairCardProps = {
  title: string;
  description: string;
  score: number;
  color: "green" | "orange" | "red";
  selected: boolean;
  onClick: () => void;
};

export default function ChairCard({
  title,
  description,
  score,
  color,
  selected,
  onClick,
}: ChairCardProps) {
  const styles = {
    green: {
      border: "border-[#006D32]",
      ring: "ring-[#006D32]",
      text: "text-green-700",
      icon: "✅",
    },
    orange: {
      border: "border-orange-500",
      ring: "ring-orange-500",
      text: "text-orange-500",
      icon: "⚠️",
    },
    red: {
      border: "border-red-600",
      ring: "ring-red-600",
      text: "text-red-600",
      icon: "❌",
    },
  };

  const s = styles[color];

  return (
    <label
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-3xl bg-white border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
        selected
          ? `${s.border} ring-2 ${s.ring} shadow-2xl`
          : "border-gray-200"
      }`}
    >
      <div className="transition duration-500 group-hover:scale-105">
        <ErgonomicIllustration type={score as 1 | 2 | 3} />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold">{title}</h3>

        <p className="mt-2 text-gray-500">
          {description}
        </p>

        <div className="mt-6 flex items-center gap-2">
          <span className="text-2xl">{s.icon}</span>

          <span className={`font-bold ${s.text}`}>
            Puntaje {score}
          </span>
        </div>
      </div>
    </label>
  );
}