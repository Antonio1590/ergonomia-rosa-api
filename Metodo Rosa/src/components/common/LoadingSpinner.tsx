// Arco de puntos en forma de sonrisa, con una ola de brillo que recorre
// el arco en bucle — usa los verdes de la marca ROSA Expert en vez del
// blanco/negro genérico, para que se sienta parte del sistema en
// cualquier pantalla de carga (login, panel admin, análisis de foto).

const DOT_COUNT = 12;
const START_DEG = 122;
const END_DEG = 238;
const RADIUS = 34;
const CENTER = 40;

// Del verde menta claro (borde/reposo) al verde de marca (pico de la ola).
const DOT_COLORS = [
  "#BFE8CC", "#9bf7ac", "#5fd489", "#2fa66a",
  "#16A34A", "#0f8a3f", "#006D32", "#005224",
];

function dotPosition(index: number) {
  const t = index / (DOT_COUNT - 1);
  const deg = START_DEG + t * (END_DEG - START_DEG);
  const rad = (deg * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.sin(rad),
    y: CENTER - RADIUS * Math.cos(rad),
  };
}

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function LoadingSpinner({ size = 96, label, className }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
      <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={label ?? "Cargando"}>
        {Array.from({ length: DOT_COUNT }, (_, i) => {
          const { x, y } = dotPosition(i);
          const color = DOT_COLORS[i % DOT_COLORS.length];
          const delay = (i / DOT_COUNT) * 1.4;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3.4}
              fill={color}
              style={{
                transformOrigin: `${x}px ${y}px`,
                animation: "rosa-loading-pulse 1.4s ease-in-out infinite",
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </svg>
      {label && (
        <p className="text-sm font-semibold text-[#006D32] tracking-wide">{label}</p>
      )}
    </div>
  );
}
