type Props = {
  title: string;
  description: string;
  score: number;
  image: string;
  color: "green" | "orange" | "red";
  selected: boolean;
  onClick: () => void;
};

export default function SeatCard({
  title,
  description,
  score,
  image,
  color,
  selected,
  onClick,
}: Props) {
  const styles = {
    green: {
      border: "border-[#006D32]",
      ring: "ring-[#006D32]",
      bg: "bg-green-50",
      text: "text-[#006D32]",
      icon: "✔",
    },

    orange: {
      border: "border-orange-500",
      ring: "ring-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-500",
      icon: "⚠",
    },

    red: {
      border: "border-red-600",
      ring: "ring-red-600",
      bg: "bg-red-50",
      text: "text-red-600",
      icon: "✖",
    },
  };

  const s = styles[color];

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-3xl overflow-hidden border transition-all duration-300
      ${
        selected
          ? `${s.border} ${s.ring} ring-2 ${s.bg} shadow-xl`
          : "border-gray-200 bg-white hover:shadow-xl hover:border-green-700"
      }`}
    >
      <img
        src={image}
        alt={title}
        className="w-full h-64 object-cover"
      />

      <div className="p-6">
        <h3 className="text-xl font-bold">
          {title}
        </h3>

        <p className="text-gray-500 mt-2">
          {description}
        </p>

        <div className={`mt-5 flex items-center gap-2 ${s.text}`}>
          <span className="text-xl">
            {s.icon}
          </span>

          <span className="font-bold">
            Puntaje {score}
          </span>
        </div>
      </div>
    </div>
  );
}