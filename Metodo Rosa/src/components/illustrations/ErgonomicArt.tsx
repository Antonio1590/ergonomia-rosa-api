/* =========================================================
   ILUSTRACIONES ERGONÓMICAS
   SVG dibujados a mano — sin dependencias ni imágenes externas.
   Cada zona acepta un estado que define su color, de modo que
   tras el análisis el usuario ve exactamente qué debe corregir.
========================================================= */

export type ZoneStatus = "ok" | "warn" | "error" | "idle" | "missing";

/* Paleta Bolívar + semáforo ergonómico */
export const ZONE_COLORS: Record<ZoneStatus, string> = {
  ok:      "#16A34A", // verde — correcto
  warn:    "#F59E0B", // ámbar — ajustar
  error:   "#DC2626", // rojo — corregir ya
  idle:    "#006D32", // verde Bolívar — estado neutro (guía)
  missing: "#CBD5E1", // gris — no detectado
};

export const ZONE_FILLS: Record<ZoneStatus, string> = {
  ok:      "#DCFCE7",
  warn:    "#FEF3C7",
  error:   "#FEE2E2",
  idle:    "#E7F3EC",
  missing: "#F1F5F9",
};

/* Zonas del cuerpo y del puesto que se pueden colorear */
export interface PostureZones {
  neck?:    ZoneStatus;
  trunk?:   ZoneStatus;
  arms?:    ZoneStatus;
  legs?:    ZoneStatus;
  chair?:   ZoneStatus;
  monitor?: ZoneStatus;
  desk?:    ZoneStatus;
}

const DEFAULT_ZONES: Required<PostureZones> = {
  neck: "idle", trunk: "idle", arms: "idle",
  legs: "idle", chair: "idle", monitor: "idle", desk: "idle",
};

/* =========================================================
   VISTA LATERAL — persona sentada en el puesto
   Se usa en la guía (todo "idle") y en resultados (coloreado).
========================================================= */
export function SeatedPostureArt({
  zones,
  className = "",
  showLabels = false,
  style,
}: {
  zones?: PostureZones;
  className?: string;
  showLabels?: boolean;
  style?: React.CSSProperties;
}) {
  const z = { ...DEFAULT_ZONES, ...zones };
  const c = (k: keyof typeof z) => ZONE_COLORS[z[k]];
  const f = (k: keyof typeof z) => ZONE_FILLS[z[k]];

  return (
    <svg
      viewBox="0 0 400 340"
      className={className}
      style={style}
      role="img"
      aria-label="Vista lateral de una persona sentada en su puesto de trabajo, con las zonas coloreadas según su estado ergonómico"
    >
      {/* Suelo */}
      <line x1="20" y1="312" x2="380" y2="312" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

      {/* ---------- ESCRITORIO ---------- */}
      <g>
        <rect x="212" y="214" width="152" height="9" rx="3" fill={f("desk")} stroke={c("desk")} strokeWidth="2.5" />
        <rect x="350" y="223" width="7" height="89" rx="2.5" fill={f("desk")} stroke={c("desk")} strokeWidth="2.5" />
      </g>

      {/* ---------- MONITOR ---------- */}
      <g>
        <rect x="262" y="118" width="86" height="60" rx="5" fill={f("monitor")} stroke={c("monitor")} strokeWidth="2.5" />
        <line x1="272" y1="133" x2="326" y2="133" stroke={c("monitor")} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        <line x1="272" y1="146" x2="338" y2="146" stroke={c("monitor")} strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
        <line x1="272" y1="159" x2="312" y2="159" stroke={c("monitor")} strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
        <path d="M305 178 L305 208" stroke={c("monitor")} strokeWidth="5" strokeLinecap="round" />
        <path d="M286 212 L324 212" stroke={c("monitor")} strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* ---------- SILLA ---------- */}
      <g>
        {/* Respaldo */}
        <path d="M112 246 L106 172" stroke={c("chair")} strokeWidth="11" strokeLinecap="round" />
        {/* Asiento */}
        <rect x="106" y="242" width="96" height="11" rx="5" fill={f("chair")} stroke={c("chair")} strokeWidth="2.5" />
        {/* Pistón */}
        <path d="M152 253 L152 292" stroke={c("chair")} strokeWidth="7" strokeLinecap="round" />
        {/* Base de estrella */}
        <path d="M120 302 L152 292 L184 302" fill="none" stroke={c("chair")} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="118" cy="306" r="6" fill={f("chair")} stroke={c("chair")} strokeWidth="2.5" />
        <circle cx="186" cy="306" r="6" fill={f("chair")} stroke={c("chair")} strokeWidth="2.5" />
      </g>

      {/* ---------- PIERNAS ---------- */}
      <g>
        {/* Muslo: cadera → rodilla */}
        <path d="M163 240 L214 246" stroke={c("legs")} strokeWidth="15" strokeLinecap="round" />
        {/* Pantorrilla: rodilla → tobillo */}
        <path d="M214 246 L222 303" stroke={c("legs")} strokeWidth="13" strokeLinecap="round" />
        {/* Pie */}
        <path d="M218 306 L246 306" stroke={c("legs")} strokeWidth="9" strokeLinecap="round" />
        {/* Articulación rodilla */}
        <circle cx="214" cy="246" r="5" fill="#FFFFFF" stroke={c("legs")} strokeWidth="2.5" />
      </g>

      {/* ---------- TRONCO ---------- */}
      <g>
        <path d="M163 240 L172 162" stroke={c("trunk")} strokeWidth="19" strokeLinecap="round" />
        {/* Articulación cadera */}
        <circle cx="163" cy="240" r="5" fill="#FFFFFF" stroke={c("trunk")} strokeWidth="2.5" />
      </g>

      {/* ---------- BRAZOS ---------- */}
      <g>
        {/* Brazo: hombro → codo */}
        <path d="M172 165 L199 204" stroke={c("arms")} strokeWidth="12" strokeLinecap="round" />
        {/* Antebrazo: codo → muñeca sobre la mesa */}
        <path d="M199 204 L247 211" stroke={c("arms")} strokeWidth="10" strokeLinecap="round" />
        {/* Articulaciones */}
        <circle cx="199" cy="204" r="4.5" fill="#FFFFFF" stroke={c("arms")} strokeWidth="2.5" />
        <circle cx="172" cy="165" r="5"   fill="#FFFFFF" stroke={c("arms")} strokeWidth="2.5" />
      </g>

      {/* ---------- CUELLO Y CABEZA ---------- */}
      <g>
        <path d="M172 162 L178 148" stroke={c("neck")} strokeWidth="11" strokeLinecap="round" />
        <circle cx="184" cy="131" r="19" fill={f("neck")} stroke={c("neck")} strokeWidth="3" />
      </g>

      {/* ---------- ETIQUETAS DE ÁNGULO ---------- */}
      {showLabels && (
        <g fontSize="10" fontWeight="700" fill="#64748B">
          <line x1="184" y1="150" x2="232" y2="150" stroke={c("neck")} strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="236" y="153" fill={c("neck")}>Cuello</text>

          <line x1="167" y1="200" x2="120" y2="200" stroke={c("trunk")} strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="60" y="203" fill={c("trunk")}>Tronco</text>

          <line x1="214" y1="256" x2="250" y2="270" stroke={c("legs")} strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="254" y="274" fill={c("legs")}>Rodillas</text>

          <line x1="199" y1="196" x2="160" y2="120" stroke={c("arms")} strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="112" y="116" fill={c("arms")}>Brazos</text>
        </g>
      )}
    </svg>
  );
}

/* =========================================================
   VISTA CENITAL DEL ESCRITORIO
   Resalta únicamente los elementos que el modelo encontró.
========================================================= */
export interface DeskItems {
  monitor?:  ZoneStatus;
  keyboard?: ZoneStatus;
  mouse?:    ZoneStatus;
  phone?:    ZoneStatus;
  desk?:     ZoneStatus;
}

export function DeskTopArt({
  items,
  className = "",
}: {
  items?: DeskItems;
  className?: string;
}) {
  const i: Required<DeskItems> = {
    monitor: "idle", keyboard: "idle", mouse: "idle",
    phone: "idle", desk: "idle", ...items,
  };
  const c = (k: keyof typeof i) => ZONE_COLORS[i[k]];
  const f = (k: keyof typeof i) => ZONE_FILLS[i[k]];
  const dim = (k: keyof typeof i) => (i[k] === "missing" ? 0.45 : 1);

  return (
    <svg
      viewBox="0 0 400 260"
      className={className}
      role="img"
      aria-label="Vista superior del escritorio mostrando los elementos detectados por la inteligencia artificial"
    >
      {/* Superficie del escritorio */}
      <rect x="16" y="20" width="368" height="222" rx="14" fill={f("desk")} stroke={c("desk")} strokeWidth="2.5" />

      {/* Monitor (borde superior) */}
      <g opacity={dim("monitor")}>
        <rect x="124" y="34" width="152" height="60" rx="6" fill={f("monitor")} stroke={c("monitor")} strokeWidth="2.5" />
        <rect x="186" y="94" width="28" height="12" rx="3" fill={f("monitor")} stroke={c("monitor")} strokeWidth="2.5" />
        <text x="200" y="70" textAnchor="middle" fontSize="11" fontWeight="700" fill={c("monitor")}>Monitor</text>
      </g>

      {/* Teclado */}
      <g opacity={dim("keyboard")}>
        <rect x="118" y="146" width="164" height="52" rx="7" fill={f("keyboard")} stroke={c("keyboard")} strokeWidth="2.5" />
        <line x1="132" y1="162" x2="268" y2="162" stroke={c("keyboard")} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <line x1="132" y1="174" x2="268" y2="174" stroke={c("keyboard")} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <line x1="152" y1="187" x2="248" y2="187" stroke={c("keyboard")} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      </g>

      {/* Mouse */}
      <g opacity={dim("mouse")}>
        <ellipse cx="318" cy="170" rx="19" ry="27" fill={f("mouse")} stroke={c("mouse")} strokeWidth="2.5" />
        <line x1="318" y1="152" x2="318" y2="166" stroke={c("mouse")} strokeWidth="2.5" strokeLinecap="round" />
        <text x="318" y="216" textAnchor="middle" fontSize="10" fontWeight="700" fill={c("mouse")}>Mouse</text>
      </g>

      {/* Teléfono */}
      <g opacity={dim("phone")}>
        <rect x="48" y="142" width="34" height="60" rx="7" fill={f("phone")} stroke={c("phone")} strokeWidth="2.5" />
        <line x1="57" y1="153" x2="73" y2="153" stroke={c("phone")} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        <circle cx="65" cy="192" r="4" fill="none" stroke={c("phone")} strokeWidth="2" />
        <text x="65" y="220" textAnchor="middle" fontSize="10" fontWeight="700" fill={c("phone")}>Celular</text>
      </g>
    </svg>
  );
}
