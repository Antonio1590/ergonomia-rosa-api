type Props = {
  type: 1 | 2 | 3;
};

export default function ErgonomicIllustration({ type }: Props) {
  const colors = {
    1: "#16a34a",
    2: "#f97316",
    3: "#dc2626",
  };

  return (
    <div className="w-full h-64 bg-[#EDF4FF] flex items-center justify-center">

      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        fill="none"
      >
        {/* silla */}

        <rect
          x="35"
          y="80"
          width="55"
          height="18"
          rx="5"
          fill="#7C8AA5"
        />

        <rect
          x="80"
          y="40"
          width="12"
          height="55"
          fill="#7C8AA5"
        />

        {/* persona */}

        <circle
          cx="105"
          cy="42"
          r="14"
          fill={colors[type]}
        />

        <line
          x1="105"
          y1="56"
          x2="105"
          y2="95"
          stroke={colors[type]}
          strokeWidth="7"
          strokeLinecap="round"
        />

        <line
          x1="105"
          y1="70"
          x2="135"
          y2="82"
          stroke={colors[type]}
          strokeWidth="7"
          strokeLinecap="round"
        />

        <line
          x1="105"
          y1="70"
          x2="83"
          y2="82"
          stroke={colors[type]}
          strokeWidth="7"
          strokeLinecap="round"
        />

        <line
          x1="105"
          y1="95"
          x2="135"
          y2="125"
          stroke={colors[type]}
          strokeWidth="7"
          strokeLinecap="round"
        />

        <line
          x1="105"
          y1="95"
          x2="90"
          y2="125"
          stroke={colors[type]}
          strokeWidth="7"
          strokeLinecap="round"
        />

      </svg>

    </div>
  );
}