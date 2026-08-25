import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { detectPose } from "../ai/mediapipe/PoseService";
import { calculateBodyAngles } from "../ai/mediapipe/AngleCalculator";
import { calculateRosaEngine } from "../components/ai/rosa/RosaEngine";
import type { RosaCalculationResult, RosaAssessment } from "../components/ai/rosa/RosaAssessment";
import { detectObjects } from "../ai/yolo/YoloService";
import type { Detection } from "../ai/yolo/YoloTypes";
import type { PosePoint } from "../ai/mediapipe/PoseTypes";
import { saveEvaluation, saveTrainingData, uploadPhoto } from "../services/SheetsService";
import type { BodyAngles } from "../ai/mediapipe/AngleCalculator";
import DetectionOverlay from "../components/DetectionOverlay";
import type { DetectionStatus } from "../components/DetectionOverlay";
import { SeatedPostureArt } from "../components/illustrations/ErgonomicArt";
import type { ZoneStatus, PostureZones } from "../components/illustrations/ErgonomicArt";
import GuidePhoto from "../components/GuidePhoto";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

/* ─── Tipos ─── */
type Phase = "guide" | "upload" | "analyzing" | "results";

interface WorkstationMetrics {
  monitorScore: 1 | 2 | 3;      // 1=óptimo 2=bajo 3=alto
  monitorTooFar: boolean;
  phoneNearNeck: boolean;
  hasMonitor: boolean;
  hasMouse: boolean;
  hasKeyboard: boolean;
  hasDesk: boolean;
  hasPhone: boolean;
  hasChair: boolean;
  hasDocumentHolder: boolean;
  deskHeightStatus: "optimal" | "high" | "unknown";
}

interface PhotoAnalysis {
  previewUrl: string;
  angles: BodyAngles;
  detections: Detection[];
  landmarks: PosePoint[];
  metrics: WorkstationMetrics;
  driveUrl?: string;
}

interface CombinedResult {
  rosaResult: RosaCalculationResult;
  avgAngles: BodyAngles;
  allDetections: Detection[];
  metrics: WorkstationMetrics;
}

const MAX_PHOTOS = 3;

/* ─── Constantes visuales ─── */
const ANALYZING_STEPS = [
  { icon: "person_search",        label: "Detectando postura corporal..." },
  { icon: "straighten",           label: "Calculando ángulos ergonómicos..." },
  { icon: "monitor_heart",        label: "Midiendo elementos del puesto..." },
  { icon: "assignment_turned_in", label: "Generando recomendaciones..." },
];

const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; color: string; icon: string }> = {
  Bajo:       { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200", color: "#059669", icon: "check_circle" },
  Medio:      { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", color: "#ca8a04", icon: "info" },
  Alto:       { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",   color: "#f43f5e", icon: "warning" },
  "Muy Alto": { bg: "bg-red-100",   text: "text-red-900",    border: "border-red-400",   color: "#9f1239", icon: "dangerous" },
};

const EMPTY_ANGLES: BodyAngles = {
  neck: 0, trunk: 0, leftShoulder: 0, rightShoulder: 0,
  leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 0,
  leftKnee: 0, rightKnee: 0,
};

/* ─── Derivar métricas del puesto a partir de bounding boxes YOLO ─── */
function deriveWorkstationMetrics(detections: Detection[]): WorkstationMetrics {
  const find = (cls: string) => detections.find((d) => d.className === cls);

  const person   = find("person");
  const monitor  = find("monitor") ?? find("laptop");
  const desk     = find("desk");
  const phone    = find("phone");
  const mouse    = find("mouse");
  const keyboard = find("laptop");
  const chair    = find("chair");
  const holder   = find("document_holder");

  const base = {
    hasMonitor: !!monitor, hasMouse: !!mouse, hasKeyboard: !!keyboard,
    hasDesk: !!desk, hasPhone: !!phone, hasChair: !!chair,
    hasDocumentHolder: !!holder,
  };

  if (!person) {
    return {
      ...base, monitorScore: 1, monitorTooFar: false,
      phoneNearNeck: false, deskHeightStatus: "unknown",
    };
  }

  const pH = person.height;
  const pT = person.y;
  // Referencias anatómicas aproximadas (% desde el top del bbox de la persona)
  const eyeY      = pT + pH * 0.08;
  const shoulderY = pT + pH * 0.22;
  const elbowY    = pT + pH * 0.36;
  const pCenterX  = person.x + person.width / 2;

  let monitorScore: 1 | 2 | 3 = 1;
  let monitorTooFar = false;

  if (monitor) {
    const mCY = monitor.y + monitor.height / 2;
    const mCX = monitor.x + monitor.width / 2;
    monitorTooFar = Math.abs(mCX - pCenterX) > person.width * 1.2;
    if (mCY < eyeY - pH * 0.08)      monitorScore = 3; // demasiado alto
    else if (mCY > eyeY + pH * 0.22) monitorScore = 2; // demasiado bajo
    else                             monitorScore = 1; // óptimo
  }

  let phoneNearNeck = false;
  if (phone) {
    const phoneCY = phone.y + phone.height / 2;
    phoneNearNeck = phoneCY > shoulderY - pH * 0.08 && phoneCY < shoulderY + pH * 0.12;
  }

  let deskHeightStatus: "optimal" | "high" | "unknown" = "unknown";
  if (desk) deskHeightStatus = desk.y < elbowY - pH * 0.1 ? "high" : "optimal";

  return { ...base, monitorScore, monitorTooFar, phoneNearNeck, deskHeightStatus };
}

/* ─── Promedio de BodyAngles ─── */
function averageAngles(list: BodyAngles[]): BodyAngles {
  if (list.length === 0) return { ...EMPTY_ANGLES };
  const keys = Object.keys(EMPTY_ANGLES) as (keyof BodyAngles)[];
  const out = { ...EMPTY_ANGLES };
  for (const k of keys) {
    const vals = list.map((a) => a[k]).filter((v) => Number.isFinite(v));
    out[k] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  }
  return out;
}

/* ─── Combinar detecciones (mejor confianza por clase) ─── */
function mergeDetections(lists: Detection[][]): Detection[] {
  const map = new Map<string, Detection>();
  for (const list of lists) {
    for (const d of list) {
      const prev = map.get(d.className);
      if (!prev || d.confidence > prev.confidence) map.set(d.className, d);
    }
  }
  return Array.from(map.values());
}

/* ─── Combinar métricas (tomar la más conservadora) ─── */
function combineMetrics(list: WorkstationMetrics[]): WorkstationMetrics {
  if (list.length === 0) {
    return {
      monitorScore: 1, monitorTooFar: false, phoneNearNeck: false,
      hasMonitor: false, hasMouse: false, hasKeyboard: false, hasDesk: false,
      hasPhone: false, hasChair: false, hasDocumentHolder: false,
      deskHeightStatus: "unknown",
    };
  }
  return {
    monitorScore:      Math.max(...list.map((m) => m.monitorScore)) as 1 | 2 | 3,
    monitorTooFar:     list.some((m) => m.monitorTooFar),
    phoneNearNeck:     list.some((m) => m.phoneNearNeck),
    hasMonitor:        list.some((m) => m.hasMonitor),
    hasMouse:          list.some((m) => m.hasMouse),
    hasKeyboard:       list.some((m) => m.hasKeyboard),
    hasDesk:           list.some((m) => m.hasDesk),
    hasPhone:          list.some((m) => m.hasPhone),
    hasChair:          list.some((m) => m.hasChair),
    hasDocumentHolder: list.some((m) => m.hasDocumentHolder),
    deskHeightStatus:  list.find((m) => m.deskHeightStatus !== "unknown")?.deskHeightStatus ?? "unknown",
  };
}

/* ─── Puntajes posturales por zona ─── */
function neckScoreOf(a: BodyAngles)  { return a.neck  <= 10 ? 1 : a.neck  <= 20 ? 2 : 3; }
function trunkScoreOf(a: BodyAngles) { return a.trunk <=  5 ? 1 : a.trunk <= 20 ? 2 : 3; }
function legsScoreOf(a: BodyAngles) {
  const avg = (a.leftKnee + a.rightKnee) / 2;
  if (avg === 0) return 1;
  return avg >= 80 && avg <= 120 ? 1 : 2;
}
function armScoreOf(a: BodyAngles) {
  const s = Math.max(Math.abs(a.leftShoulder), Math.abs(a.rightShoulder));
  return s <= 20 ? 1 : s <= 45 ? 2 : 3;
}

/* ─── Construir RosaAssessment desde ángulos + métricas ─── */
function buildAssessment(angles: BodyAngles, metrics: WorkstationMetrics): RosaAssessment {
  const neckScore  = neckScoreOf(angles);
  const trunkScore = trunkScoreOf(angles);
  const legsScore  = legsScoreOf(angles);
  const armScore   = armScoreOf(angles);

  return {
    chair: {
      height: legsScore, depth: 1, armrest: armScore, backrest: trunkScore, duration: 0,
      armrestTooFarApart: false, armrestHardOrDamaged: false, armrestNotAdjustable: false,
      workSurfaceTooHigh: metrics.deskHeightStatus === "high",
      backrestNotAdjustable: false, insufficientLegSpace: false,
      heightNotAdjustable: false, depthNotAdjustable: false,
    },
    monitor: {
      height: metrics.hasMonitor ? metrics.monitorScore : 2,
      distance: 0, duration: 0, tooFar: metrics.monitorTooFar,
      lateralDeviation: false,
      documentsWithoutStand: !metrics.hasDocumentHolder && metrics.hasMonitor,
      glare: false,
    },
    phone: {
      distance: metrics.hasPhone ? 2 : 1,
      duration: metrics.hasPhone ? 0 : -1,
      betweenNeckAndShoulder: metrics.phoneNearNeck,
      noHandsFree: false,
    },
    mouse: {
      position: metrics.hasMouse ? 1 : 2, duration: 0,
      tooSmall: false, differentHeightFromKeyboard: false, hardWristRest: false,
    },
    keyboard: {
      position: metrics.hasKeyboard ? 1 : 2, duration: 0,
      lateralWristDeviation: false, tooHigh: metrics.deskHeightStatus === "high",
      reachingObjects: false, notAdjustable: false,
    },
    posture: {
      neck: neckScore, trunk: trunkScore, legs: legsScore,
      upperArm: armScore, lowerArm: 1,
    },
  };
}

/* ─── Calcular resultado combinado ─── */
function computeCombined(analyses: PhotoAnalysis[]): CombinedResult {
  const avgAngles     = averageAngles(analyses.map((a) => a.angles));
  const allDetections = mergeDetections(analyses.map((a) => a.detections));
  const metrics       = combineMetrics(analyses.map((a) => a.metrics));
  const assessment    = buildAssessment(avgAngles, metrics);
  const rosaResult    = calculateRosaEngine(assessment);
  return {
    rosaResult: { ...rosaResult, recommendations: buildDetailedRecommendations(avgAngles, metrics) },
    avgAngles, allDetections, metrics,
  };
}

/* ─── Recomendaciones específicas con ángulos reales ─── */
function buildDetailedRecommendations(angles: BodyAngles, metrics: WorkstationMetrics): string[] {
  const recs: string[] = [];

  if (angles.neck > 20) {
    recs.push(`Cuello severamente inclinado (${angles.neck.toFixed(0)}°). El rango ideal es menor a 10°. Eleve el monitor a la altura de los ojos o use un atril para documentos.`);
  } else if (angles.neck > 10) {
    recs.push(`Cuello ligeramente inclinado (${angles.neck.toFixed(0)}°). Ajuste la altura del monitor 5–10 cm hacia arriba para alinear la visión con la parte superior de la pantalla.`);
  }

  if (angles.trunk > 20) {
    recs.push(`Tronco fuera de rango (${angles.trunk.toFixed(0)}°). El ideal es menor a 5°. Ajuste el respaldo de la silla para mantener la columna erguida y use apoyo lumbar.`);
  } else if (angles.trunk > 5) {
    recs.push(`Tronco ligeramente inclinado (${angles.trunk.toFixed(0)}°). Procure apoyar completamente la espalda en el respaldo y verifique la altura del monitor.`);
  }

  const kneeAvg = (angles.leftKnee + angles.rightKnee) / 2;
  if (kneeAvg > 0 && kneeAvg < 80) {
    recs.push(`Rodillas con ángulo reducido (${kneeAvg.toFixed(0)}°). La silla puede estar muy alta. Baje el asiento hasta que las rodillas queden entre 90° y 110°.`);
  } else if (kneeAvg > 120) {
    recs.push(`Rodillas con ángulo amplio (${kneeAvg.toFixed(0)}°). La silla está muy baja. Eleve el asiento hasta alcanzar 90°–110° en las rodillas, o use un reposapiés.`);
  }

  const elbowAvg = (angles.leftElbow + angles.rightElbow) / 2;
  if (elbowAvg > 0 && (elbowAvg < 80 || elbowAvg > 120)) {
    recs.push(`Ángulo de codo inadecuado (${elbowAvg.toFixed(0)}°). El rango ideal es 80°–120°. Ajuste la altura de la mesa o los reposabrazos para que los codos queden al nivel del teclado.`);
  }

  if (metrics.hasMonitor) {
    if (metrics.monitorScore === 2) {
      recs.push("Monitor detectado por debajo del nivel de ojos. Eleve la pantalla con un soporte o coloque un libro firme debajo hasta que el borde superior quede a la altura de los ojos.");
    } else if (metrics.monitorScore === 3) {
      recs.push("Monitor detectado por encima del nivel de ojos. Baje la pantalla para evitar extensión crónica del cuello; el borde superior debe quedar a la altura de los ojos o ligeramente por debajo.");
    }
    if (metrics.monitorTooFar) {
      recs.push("Monitor detectado a mayor distancia de la recomendada. Acérquelo a 45–75 cm de sus ojos para evitar esfuerzo visual y proyección del cuello hacia adelante.");
    }
  } else {
    recs.push("No se detectó monitor ni laptop en la fotografía. Incluya la pantalla en el encuadre para un análisis más completo del puesto.");
  }

  if (metrics.deskHeightStatus === "high") {
    recs.push("Escritorio detectado por encima del nivel del codo. Esto genera elevación crónica de hombros. Baje la superficie de trabajo o eleve la silla y use un reposapiés.");
  }

  if (!metrics.hasMouse) {
    recs.push("No se detectó mouse en la fotografía. Asegúrese de que esté al alcance del cuerpo, alineado con el hombro, sin necesidad de extender el brazo.");
  }

  if (metrics.phoneNearNeck) {
    recs.push("¡Atención! Teléfono detectado entre el cuello y el hombro. Esta postura causa contracturas cervicales graves. Use manos libres, auriculares o altavoz de inmediato.");
  }

  if (recs.length === 0) {
    recs.push(`Postura general adecuada (cuello ${angles.neck.toFixed(0)}°, tronco ${angles.trunk.toFixed(0)}°). Mantenga los hábitos actuales y realice pausas activas cada 45 minutos.`);
  }

  return [...new Set(recs)];
}

/* ─── Calibración local (localStorage) ─── */
const CALIB_KEY = "rosa_calibration_history";
interface CalibEntry { neck: number; trunk: number; kneeAvg: number; score: number; ts: number }

function saveCalibrationEntry(angles: BodyAngles, score: number) {
  try {
    const raw = localStorage.getItem(CALIB_KEY);
    const history: CalibEntry[] = raw ? JSON.parse(raw) : [];
    history.push({
      neck: angles.neck, trunk: angles.trunk,
      kneeAvg: (angles.leftKnee + angles.rightKnee) / 2,
      score, ts: Date.now(),
    });
    if (history.length > 200) history.splice(0, history.length - 200);
    localStorage.setItem(CALIB_KEY, JSON.stringify(history));
  } catch { /* silencioso */ }
}

function getCalibrationStats(): { count: number; avgNeck: number; avgTrunk: number } | null {
  try {
    const raw = localStorage.getItem(CALIB_KEY);
    if (!raw) return null;
    const history: CalibEntry[] = JSON.parse(raw);
    if (history.length < 5) return null;
    const n = history.length;
    return {
      count: n,
      avgNeck:  history.reduce((s, e) => s + e.neck, 0) / n,
      avgTrunk: history.reduce((s, e) => s + e.trunk, 0) / n,
    };
  } catch { return null; }
}

/* ─── Mapear puntajes a estados de color ─── */
function scoreToStatus(score: number): ZoneStatus {
  return score <= 1 ? "ok" : score === 2 ? "warn" : "error";
}

function zonesFromResult(r: CombinedResult): PostureZones {
  const { avgAngles: a, metrics: m } = r;
  return {
    neck:    scoreToStatus(neckScoreOf(a)),
    trunk:   scoreToStatus(trunkScoreOf(a)),
    legs:    scoreToStatus(legsScoreOf(a)),
    arms:    scoreToStatus(armScoreOf(a)),
    chair:   scoreToStatus(legsScoreOf(a)),
    monitor: m.hasMonitor ? scoreToStatus(m.monitorScore) : "missing",
    desk:    m.hasDesk ? (m.deskHeightStatus === "high" ? "warn" : "ok") : "missing",
  };
}

function statusByClassFrom(m: WorkstationMetrics): Record<string, DetectionStatus> {
  return {
    monitor:  m.monitorScore === 1 && !m.monitorTooFar ? "ok" : "warn",
    laptop:   m.monitorScore === 1 && !m.monitorTooFar ? "ok" : "warn",
    desk:     m.deskHeightStatus === "high" ? "warn" : "ok",
    phone:    m.phoneNearNeck ? "error" : "ok",
    mouse:    "ok",
    chair:    "ok",
    document_holder: "ok",
    person:   "ok",
  };
}

/* ────────────────────────────────────
   SUB-COMPONENTES VISUALES
──────────────────────────────────── */

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const dash = (Math.min(Math.max(score, 0), 10) / 10) * C;
  return (
    <svg viewBox="0 0 180 180" className="w-36 h-36 shrink-0">
      <circle cx="90" cy="90" r={R} fill="none" stroke="#e5e7eb" strokeWidth="14" />
      <circle cx="90" cy="90" r={R} fill="none" stroke={color} strokeWidth="14"
        strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
        transform="rotate(-90 90 90)" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="90" y="88" textAnchor="middle" dominantBaseline="middle" fontSize="36" fontWeight="800" fill={color}>{score}</text>
      <text x="90" y="112" textAnchor="middle" fontSize="11" fill="#9ca3af">de 10</text>
    </svg>
  );
}

function BodyPartCard({ icon, label, score, detail, max = 3 }: {
  icon: string; label: string; score: number; detail: string; max?: number;
}) {
  const pct = Math.min(score / max, 1);
  const tone =
    pct <= 0.34 ? { c: "#16a34a", box: "bg-green-50 border-green-200",   txt: "Óptimo"   }
  : pct <= 0.67 ? { c: "#ca8a04", box: "bg-yellow-50 border-yellow-200", txt: "Ajustar"  }
  :               { c: "#dc2626", box: "bg-red-50 border-red-200",       txt: "Atención" };

  return (
    <div className={`rounded-2xl border p-4 flex flex-col items-center gap-2 ${tone.box}`}>
      <span className="material-symbols-outlined text-3xl" style={{ color: tone.c }}>{icon}</span>
      <p className="text-xs font-bold text-gray-600 text-center leading-tight">{label}</p>
      <p className="text-lg font-black" style={{ color: tone.c }}>{detail}</p>
      <div className="w-full bg-white rounded-full h-2 border border-gray-200">
        <div className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct * 100}%`, backgroundColor: tone.c }} />
      </div>
      <p className="text-xs font-semibold" style={{ color: tone.c }}>{tone.txt}</p>
    </div>
  );
}

function MetricChip({ icon, label, value, status }: {
  icon: string; label: string; value: string; status: "ok" | "warn" | "error" | "neutral";
}) {
  const colors = {
    ok:      "bg-green-50 border-green-200 text-green-700",
    warn:    "bg-yellow-50 border-yellow-200 text-yellow-700",
    error:   "bg-red-50 border-red-200 text-red-700",
    neutral: "bg-gray-50 border-gray-200 text-gray-400",
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 ${colors[status]}`}>
      <span className="material-symbols-outlined text-xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold truncate">{label}</p>
        <p className="text-xs opacity-80 truncate">{value}</p>
      </div>
    </div>
  );
}

/* Leyenda de colores para las ilustraciones */
function ColorLegend() {
  const items = [
    { c: "#16A34A", t: "Correcto" },
    { c: "#F59E0B", t: "Ajustar" },
    { c: "#DC2626", t: "Corregir" },
    { c: "#CBD5E1", t: "No detectado" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3">
      {items.map(({ c, t }) => (
        <div key={t} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
          <span className="text-xs text-gray-500">{t}</span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════ */
export default function AutoEvaluationPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase]       = useState<Phase>("guide");
  const [analysisStep, setStep] = useState(0);
  const [analyses, setAnalyses] = useState<PhotoAnalysis[]>([]);
  const [combined, setCombined] = useState<CombinedResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const fileRef    = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const analysesRef = useRef<PhotoAnalysis[]>([]);

  // Mantener una referencia viva para evitar closures obsoletos
  useEffect(() => { analysesRef.current = analyses; }, [analyses]);

  // Cada cambio de fase arranca desde arriba: al terminar el análisis el
  // resultado queda a la vista sin tener que desplazarse.
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [phase]);

  // Liberar los object URLs al desmontar
  useEffect(() => () => {
    analysesRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
  }, []);

  /* ── análisis de una foto ── */
  const runAnalysis = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG, PNG o HEIC).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("La imagen supera los 20 MB. Usa una foto más liviana.");
      return;
    }

    setPhase("analyzing");
    setError(null);
    setStep(0);

    const previewUrl = URL.createObjectURL(file);

    try {
      const image = new Image();
      const loaded = new Promise<void>((res, rej) => {
        image.onload  = () => res();
        image.onerror = () => rej(new Error("No se pudo leer la imagen. Intenta con otro archivo."));
      });
      image.src = previewUrl;
      await loaded;

      /* 1 · Postura */
      const poseResult = await detectPose(image);
      if (!poseResult?.landmarks?.length) {
        throw new Error("No se detectó ninguna persona en la fotografía. Asegúrate de que el cuerpo sea visible de lado y con buena iluminación.");
      }

      /* 2 · Ángulos */
      setStep(1);
      const angles = calculateBodyAngles(poseResult.landmarks);

      /* 3 · Objetos del puesto */
      setStep(2);
      let detections: Detection[] = [];
      try {
        detections = await detectObjects(image);
      } catch (yoloErr) {
        // El análisis postural sigue siendo válido sin YOLO, pero el fallo
        // debe quedar registrado: si se silencia, la detección de objetos
        // se cae sin que nadie lo note y todo aparece como "no detectado".
        console.warn("[ROSA] Detección de objetos no disponible:", yoloErr);
      }
      const metrics = deriveWorkstationMetrics(detections);

      /* 4 · Resultado */
      setStep(3);
      const newAnalysis: PhotoAnalysis = {
        previewUrl, angles, detections,
        landmarks: poseResult.landmarks, metrics,
      };
      const newList = [...analysesRef.current, newAnalysis];
      const newCombined = computeCombined(newList);

      setAnalyses(newList);
      setCombined(newCombined);
      setActivePhoto(newList.length - 1);
      setSaved(false);
      setSaveErr(null);
      setPhase("results");

      saveCalibrationEntry(newCombined.avgAngles, newCombined.rosaResult.scores.final);

      /* Subir la foto a la carpeta de Drive (en segundo plano) */
      if (user) {
        setUploading(true);
        uploadPhoto(file, user.email)
          .then(({ url }) => {
            setAnalyses((prev) =>
              prev.map((a) => (a.previewUrl === previewUrl ? { ...a, driveUrl: url } : a))
            );
          })
          .catch(() => { /* la foto local sigue disponible */ })
          .finally(() => setUploading(false));

        void saveTrainingData({
          fecha:         new Date().toISOString(),
          email:         user.email,
          neck:          newCombined.avgAngles.neck,
          trunk:         newCombined.avgAngles.trunk,
          leftKnee:      newCombined.avgAngles.leftKnee,
          rightKnee:     newCombined.avgAngles.rightKnee,
          leftElbow:     newCombined.avgAngles.leftElbow,
          rightElbow:    newCombined.avgAngles.rightElbow,
          leftShoulder:  newCombined.avgAngles.leftShoulder,
          rightShoulder: newCombined.avgAngles.rightShoulder,
          puntajeFinal:  newCombined.rosaResult.scores.final,
          nivelRiesgo:   newCombined.rosaResult.action.risk,
          detecciones:   JSON.stringify(newCombined.allDetections.map((d) => ({
            label: d.label, conf: Number(d.confidence.toFixed(2)),
          }))),
          numFotos:       newList.length,
          monitorScore:   newCombined.metrics.monitorScore,
          deskHighStatus: newCombined.metrics.deskHeightStatus,
          phoneNearNeck:  newCombined.metrics.phoneNearNeck,
          revisadoPorExperto: "",
          correcciones:   "",
        });
      }
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setError(err instanceof Error ? err.message : "Error durante el análisis.");
      setPhase("upload");
    }
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void runAnalysis(file);
  }, [runAnalysis]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";               // permite volver a elegir el mismo archivo
    if (file) void runAnalysis(file);
  }, [runAnalysis]);

  const resetSession = () => {
    analyses.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAnalyses([]);
    setCombined(null);
    setSaved(false);
    setSaveErr(null);
    setActivePhoto(0);
    setPhase("upload");
    setError(null);
  };

  const handleSave = async () => {
    if (!user || !combined) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const { rosaResult, avgAngles, allDetections } = combined;
      await saveEvaluation({
        fecha:        new Date().toISOString(),
        email:        user.email,
        nombre:       user.nombre,
        cedula:       user.cedula,
        puntajeFinal: rosaResult.scores.final,
        nivelRiesgo:  rosaResult.action.risk,
        postura:      rosaResult.action.risk,
        urlImagen:    analyses.map((a) => a.driveUrl).filter(Boolean).join(" | "),
        // El servidor (Sheets.gs → handleSaveEvaluation) reconstruye la
        // columna "Detalles" a partir de estos campos sueltos — no lee
        // "detalles" directamente. Antes se enviaba un "detalles" ya armado
        // que el servidor simplemente ignoraba y sobrescribía con undefined,
        // por lo que "objetos detectados" nunca quedaba guardado.
        puntajeSilla:       rosaResult.scores.chair,
        puntajePantalla:    rosaResult.scores.monitorPhone,
        puntajeTeclado:     rosaResult.scores.keyboardMouse,
        objetosDetectados:  allDetections.map((d) => d.label),
        recomendaciones: rosaResult.recommendations.join(" | "),
        neck:  Number(avgAngles.neck.toFixed(1)),
        trunk: Number(avgAngles.trunk.toFixed(1)),
        legs:  Number(((avgAngles.leftKnee + avgAngles.rightKnee) / 2).toFixed(1)),
        arms:  Number(((avgAngles.leftShoulder + avgAngles.rightShoulder) / 2).toFixed(1)),
        wrist: 0,
      });
      setSaved(true);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "No se pudo guardar la evaluación.");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────── NAVBAR ─────────────────── */
  const navBar = (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 shadow-sm z-50 flex items-center justify-between px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#005224] flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-base">accessibility_new</span>
        </div>
        <span className="text-lg font-bold text-[#005224]">ROSA Expert</span>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/historial")}
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
            <span className="material-symbols-outlined text-base">history</span>
            Mi historial
          </button>
          <span className="material-symbols-outlined text-[#006D32]">account_circle</span>
          <span className="text-sm text-gray-600 hidden sm:block">{user.nombre || user.email}</span>
          <button onClick={logout}
            className="ml-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition">
            Salir
          </button>
        </div>
      )}
    </header>
  );

  /* Inputs de archivo, compartidos entre fases */
  const fileInputs = (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={handleFileChange} onClick={(e) => e.stopPropagation()} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={handleFileChange} onClick={(e) => e.stopPropagation()} />
    </>
  );

  /* ─────────────────── FASE: GUÍA ─────────────────── */
  if (phase === "guide") {
    const cards = [
      {
        n: "01",
        title: "Vista lateral completa",
        subtitle: "Foto 1 · Postura del cuerpo",
        photo: { file: "postura-lateral.jpg", alt: "Persona sentada de perfil en su puesto de trabajo, con el cuerpo completo visible" },
        tag: { color: "bg-[#005224]", label: "Foto 1 · Postura" },
        items: [
          { icon: "straighten",    text: "Toma la foto desde el lado, con el cuerpo completo de la cabeza a los pies." },
          { icon: "phone_android", text: "Celular perpendicular al piso, aproximadamente a la altura del asiento." },
          { icon: "groups",        text: "Pide ayuda a un compañero mientras trabajas con normalidad." },
        ],
      },
      {
        n: "02",
        title: "Vista del puesto de trabajo",
        subtitle: "Foto 2 · Elementos del escritorio",
        photo: { file: "puesto-trabajo.jpg", alt: "Vista general del puesto de trabajo con pantalla, teclado y mouse sobre el escritorio" },
        tag: { color: "bg-[#FF6B00]", label: "Foto 2 · Periféricos" },
        items: [
          { icon: "desktop_windows", text: "Que se vean la pantalla, el teclado y el mouse dentro del encuadre." },
          { icon: "visibility",      text: "Muestra la posición de tus antebrazos sobre el escritorio." },
          { icon: "wb_sunny",        text: "Busca buena iluminación para que la IA identifique los elementos." },
        ],
      },
    ];

    return (
      <div className="min-h-screen bg-[#F0F7F2]">
        {navBar}
        {fileInputs}
        <div className="pt-24 pb-32 px-4 max-w-5xl mx-auto">

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#005224] text-white text-xs font-bold px-4 py-2 rounded-full mb-5">
              <span className="material-symbols-outlined text-sm">camera_alt</span>
              Preparación para el análisis
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#0b1c30] leading-tight text-balance">
              Cómo tomar la foto correcta
            </h1>
            <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              Estos son los dos encuadres que necesitamos. Replícalos y la IA analizará tu postura
              y tu puesto automáticamente.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {cards.map(({ n, title, subtitle, photo, items, tag }) => (
              <article key={n} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                <div className="p-4 pb-0">
                  <GuidePhoto
                    file={photo.file}
                    alt={photo.alt}
                    badge={tag.label}
                    badgeColor={tag.color}
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-xs font-bold text-[#FF6B00] tracking-wide uppercase mb-1">{subtitle}</p>
                  <h3 className="text-xl font-bold text-[#0b1c30] mb-4">{title}</h3>
                  <ul className="space-y-3.5 list-none p-0 m-0">
                    {items.map(({ icon, text }) => (
                      <li key={icon} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[#006D32] mt-0.5 shrink-0">{icon}</span>
                        <span className="text-sm text-gray-600">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 max-w-2xl mx-auto">
            <span className="material-symbols-outlined text-blue-500 shrink-0 mt-0.5">lightbulb</span>
            <p className="text-sm text-blue-700">
              <strong>Consejo:</strong> puedes subir hasta {MAX_PHOTOS} fotos por sesión. Cada foto agrega información
              complementaria y los resultados se combinan automáticamente.
            </p>
          </div>
        </div>

        {/* Barra de acción fija: el botón siempre está a la vista */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100 px-4 py-4 z-40">
          <button
            onClick={() => setPhase("upload")}
            className="max-w-2xl mx-auto w-full bg-[#FF6B00] hover:bg-[#E05A00] active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-3"
          >
            Entendido, comenzar evaluación
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────── FASE: ANALIZANDO ─────────────────── */
  if (phase === "analyzing") {
    return (
      <div className="min-h-screen bg-[#F0F7F2] flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <LoadingSpinner size={128} />
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <span className="material-symbols-outlined text-[#006D32] text-3xl">
                {ANALYZING_STEPS[analysisStep]?.icon}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-semibold mb-2">
            {analyses.length > 0 ? `Foto ${analyses.length + 1} · Sesión activa` : "Primera foto"}
          </div>
          <h2 className="text-2xl font-black text-[#0b1c30] mb-3">Analizando tu foto</h2>
          <p className="text-[#006D32] font-semibold mb-8">{ANALYZING_STEPS[analysisStep]?.label}</p>
          <div className="space-y-3 text-left">
            {ANALYZING_STEPS.map((s, i) => (
              <div key={s.icon} className={`flex items-center gap-3 rounded-xl p-3 transition-all
                ${i < analysisStep ? "bg-green-50" : i === analysisStep ? "bg-white shadow-sm" : "opacity-30"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
                  ${i < analysisStep ? "bg-[#006D32]" : i === analysisStep ? "bg-[#006D32]/20" : "bg-gray-200"}`}>
                  {i < analysisStep
                    ? <span className="material-symbols-outlined text-white text-sm">check</span>
                    : <span className={`font-black text-xs ${i === analysisStep ? "text-[#006D32]" : "text-gray-400"}`}>{i + 1}</span>}
                </div>
                <span className={`text-sm font-medium ${
                  i === analysisStep ? "text-gray-900" : i < analysisStep ? "text-green-700" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── FASE: RESULTADOS ─────────────────── */
  if (phase === "results" && combined) {
    const calibStats = getCalibrationStats();
    const { rosaResult, avgAngles, allDetections, metrics } = combined;
    const { action, scores, recommendations } = rosaResult;
    const cfg = RISK_CONFIG[action.risk] ?? RISK_CONFIG["Medio"];
    const photo = analyses[Math.min(activePhoto, analyses.length - 1)];
    const clsStatus = statusByClassFrom(metrics);

    const kneeAvg = (avgAngles.leftKnee + avgAngles.rightKnee) / 2;
    const shoulderAvg = Math.max(Math.abs(avgAngles.leftShoulder), Math.abs(avgAngles.rightShoulder));

    const bodyParts = [
      { icon: "self_improvement",  label: "Cuello",  score: neckScoreOf(avgAngles),  detail: `${avgAngles.neck.toFixed(0)}°` },
      { icon: "accessibility_new", label: "Tronco",  score: trunkScoreOf(avgAngles), detail: `${avgAngles.trunk.toFixed(0)}°` },
      { icon: "airline_seat_recline_normal", label: "Rodillas", score: legsScoreOf(avgAngles), detail: kneeAvg > 0 ? `${kneeAvg.toFixed(0)}°` : "—" },
      { icon: "sports_martial_arts", label: "Hombros", score: armScoreOf(avgAngles), detail: `${shoulderAvg.toFixed(0)}°` },
    ];

    /* Objetos realmente encontrados en la foto */
    const foundObjects = allDetections
      .filter((d) => d.className !== "person")
      .sort((a, b) => b.confidence - a.confidence);

    const OBJ_ICON: Record<string, string> = {
      monitor: "monitor", laptop: "laptop_mac", mouse: "mouse", desk: "table_restaurant",
      phone: "smartphone", chair: "chair", document_holder: "description",
    };


    // Solo lo que no está ya cubierto por el diagrama corporal (cuello/tronco/
    // rodillas viven ahí) — evita repetir el mismo dato dos veces en la página.
    const workstationChips: { icon: string; label: string; value: string; status: "ok" | "warn" | "error" | "neutral" }[] = [
      { icon: "monitor",           label: "Monitor",  value: metrics.hasMonitor ? (metrics.monitorScore === 1 ? "Altura óptima" : metrics.monitorScore === 2 ? "Demasiado bajo" : "Demasiado alto") : "No detectado", status: !metrics.hasMonitor ? "neutral" : metrics.monitorScore === 1 ? "ok" : "warn" },
      { icon: "table_restaurant",  label: "Escritorio", value: metrics.hasDesk ? (metrics.deskHeightStatus === "high" ? "Muy alto" : "Altura adecuada") : "No detectado", status: !metrics.hasDesk ? "neutral" : metrics.deskHeightStatus === "high" ? "warn" : "ok" },
      { icon: "smartphone",        label: "Teléfono", value: metrics.hasPhone ? (metrics.phoneNearNeck ? "¡Entre cuello y hombro!" : "Sobre el escritorio") : "No detectado", status: !metrics.hasPhone ? "neutral" : metrics.phoneNearNeck ? "error" : "ok" },
    ];

    return (
      <div className="min-h-screen bg-[#F0F7F2]">
        {navBar}
        {fileInputs}
        <div className="pt-20 pb-28 px-4 max-w-2xl lg:max-w-4xl mx-auto">

          {/* Selector de fotos de la sesión */}
          <div className="mt-6 mb-5 flex items-center gap-3 flex-wrap">
            {analyses.map((a, i) => (
              <button key={a.previewUrl} onClick={() => setActivePhoto(i)}
                className={`relative rounded-xl transition ${i === activePhoto ? "ring-2 ring-[#006D32] ring-offset-2" : "opacity-70 hover:opacity-100"}`}>
                <img src={a.previewUrl} className="w-12 h-12 object-cover rounded-xl" alt={`Foto ${i + 1}`} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#006D32] rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                  {i + 1}
                </span>
              </button>
            ))}
            <p className="text-sm text-gray-500">
              {analyses.length} foto{analyses.length > 1 ? "s" : ""} analizada{analyses.length > 1 ? "s" : ""}
              {analyses.length > 1 && <span className="text-[#006D32] font-semibold"> · resultados combinados</span>}
            </p>
            {uploading && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Guardando en Drive
              </span>
            )}
            {!uploading && photo?.driveUrl && (
              <a href={photo.driveUrl} target="_blank" rel="noreferrer"
                className="ml-auto flex items-center gap-1.5 text-xs text-[#006D32] hover:underline">
                <span className="material-symbols-outlined text-sm">cloud_done</span>
                Ver en Drive
              </a>
            )}
          </div>

          {/* Score principal */}
          <div className={`rounded-3xl border p-7 flex flex-col sm:flex-row items-center gap-7 ${cfg.bg} ${cfg.border} mb-5`}>
            <ScoreGauge score={scores.final} color={cfg.color} />
            <div className="text-center sm:text-left">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-3 bg-white ${cfg.text} border ${cfg.border}`}>
                <span className="material-symbols-outlined text-base">{cfg.icon}</span>
                Nivel de riesgo
              </div>
              <p className={`text-3xl font-black mb-2 ${cfg.text}`}>{action.risk}</p>
              <p className="text-gray-600 text-sm">{action.action}</p>
            </div>
          </div>

          {/* Foto analizada + diagrama corporal, en bloque uno al lado del otro
              en pantallas grandes — evita el desplazamiento largo en vertical. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

            {/* Tu foto con lo que la IA encontró (incluye los objetos detectados,
                ya no en una tarjeta aparte) */}
            {photo && (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006D32]">center_focus_strong</span>
                  Lo que la IA identificó
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Esqueleto postural y objetos reconocidos sobre tu foto
                </p>
                <DetectionOverlay
                  src={photo.previewUrl}
                  detections={photo.detections}
                  landmarks={photo.landmarks}
                  statusByClass={clsStatus}
                />
                <ColorLegend />
                {foundObjects.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {foundObjects.map((d) => {
                      const st = clsStatus[d.className] ?? "ok";
                      const tone = st === "error"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : st === "warn"
                        ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                        : "bg-green-50 border-green-200 text-green-700";
                      return (
                        <span key={d.className} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}>
                          <span className="material-symbols-outlined text-sm">{OBJ_ICON[d.className] ?? "widgets"}</span>
                          {d.label} · {Math.round(d.confidence * 100)}%
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Diagrama corporal + los mismos ángulos, en la misma tarjeta */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006D32]">body_system</span>
                Qué debes corregir
              </h3>
              <p className="text-xs text-gray-400 mb-2">
                Las zonas en ámbar o rojo son las que requieren tu atención
              </p>
              <SeatedPostureArt zones={zonesFromResult(combined)} showLabels className="w-full h-auto" />
              <ColorLegend />
              <div className="grid grid-cols-2 gap-2 mt-4">
                {bodyParts.map((p) => <BodyPartCard key={p.label} {...p} />)}
              </div>
            </div>

          </div>

          {/* Puntajes parciales */}
          {/* Puntajes por categoría + resumen del puesto, en bloque */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="grid grid-cols-2 gap-3 content-start">
              {[
                { label: "Silla y postura", value: scores.chair,         icon: "chair" },
                { label: "Pantalla",        value: scores.monitorPhone,  icon: "monitor" },
                { label: "Teclado y mouse", value: scores.keyboardMouse, icon: "keyboard" },
                { label: "Puesto total",    value: scores.workstation,   icon: "workspaces" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF7F2] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#006D32] text-lg">{icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006D32]">sensors</span>
                Resumen del puesto
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Derivadas automáticamente de {analyses.length > 1 ? "las fotos combinadas" : "tu foto"}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {workstationChips.map((c) => <MetricChip key={c.label} {...c} />)}
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF6B00]">tips_and_updates</span>
              Recomendaciones
              <span className="ml-auto text-xs font-semibold bg-orange-50 text-[#FF6B00] px-2.5 py-1 rounded-full">
                {recommendations.length}
              </span>
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={rec} className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Aprendizaje continuo */}
          {calibStats && (
            <div className="bg-white rounded-3xl border border-gray-100 p-5 mb-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="material-symbols-outlined text-[#005224]">model_training</span>
                <h3 className="font-bold text-gray-900 text-sm">Aprendizaje continuo activo</h3>
                <span className="ml-auto text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                  {calibStats.count} análisis acumulados
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                El sistema acumula datos de cada análisis para mejorar su precisión. Con más sesiones, las
                recomendaciones serán cada vez más ajustadas a tu perfil.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#F0F7F2] rounded-xl p-3">
                  <p className="text-gray-400">Promedio cuello (histórico)</p>
                  <p className="text-[#005224] font-black text-lg">{calibStats.avgNeck.toFixed(1)}°</p>
                  <p className="text-gray-400 mt-0.5">Este análisis: <strong>{avgAngles.neck.toFixed(1)}°</strong></p>
                </div>
                <div className="bg-[#F0F7F2] rounded-xl p-3">
                  <p className="text-gray-400">Promedio tronco (histórico)</p>
                  <p className="text-[#005224] font-black text-lg">{calibStats.avgTrunk.toFixed(1)}°</p>
                  <p className="text-gray-400 mt-0.5">Este análisis: <strong>{avgAngles.trunk.toFixed(1)}°</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          {analyses.length < MAX_PHOTOS && (
            <button
              onClick={() => { setError(null); setPhase("upload"); }}
              className="w-full border-2 border-dashed border-[#006D32] text-[#006D32] py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition mb-3"
            >
              <span className="material-symbols-outlined">add_photo_alternate</span>
              Agregar otra foto para mejorar la precisión
            </button>
          )}

          {saveError && (
            <div className="mb-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          )}

          <button onClick={resetSession}
            className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition">
            ← Comenzar una nueva evaluación
          </button>
        </div>

        {/* Barra fija: guardar sin recorrer todo el informe */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100 px-4 py-3 z-40">
          <div className="max-w-2xl lg:max-w-4xl mx-auto">
            {!saved ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#005224] hover:bg-[#006D32] text-white py-3.5 rounded-2xl font-bold text-base transition shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving
                  ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Guardando...</>
                  : <><span className="material-symbols-outlined">save</span> Guardar evaluación</>}
              </button>
            ) : (
              <div className="w-full bg-green-50 border border-green-200 py-3.5 rounded-2xl text-green-700 font-semibold text-center flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">check_circle</span>
                Evaluación guardada correctamente
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── FASE: UPLOAD (y respaldo) ─────────────────── */
  return (
    <div className="min-h-screen bg-[#F0F7F2] flex flex-col">
      {navBar}
      {fileInputs}
      <div className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-xl">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#0b1c30]">
              {analyses.length === 0 ? "Sube tu foto" : `Foto ${analyses.length + 1} de la sesión`}
            </h2>
            <p className="text-gray-500 mt-2">
              {analyses.length === 0
                ? "La IA analizará tu postura y tu puesto automáticamente"
                : "Agrega otra perspectiva para mejorar la precisión"}
            </p>
          </div>

          {analyses.length > 0 && (
            <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
              {analyses.map((a, i) => (
                <div key={a.previewUrl} className="shrink-0 relative">
                  <img src={a.previewUrl} className="w-20 h-20 object-cover rounded-xl border-2 border-[#006D32]" alt={`Foto ${i + 1}`} />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#006D32] rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[10px]">check</span>
                  </span>
                  <p className="text-xs text-center text-gray-500 mt-1">Foto {i + 1}</p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
              <span className="material-symbols-outlined text-red-500 shrink-0">error</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Zona de arrastre */}
          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
            className={`cursor-pointer rounded-3xl border-2 border-dashed transition-all p-12 flex flex-col items-center gap-5 outline-none focus-visible:ring-2 focus-visible:ring-[#006D32] focus-visible:ring-offset-2
              ${dragging ? "border-[#006D32] bg-green-50 scale-[1.02]" : "border-gray-300 bg-white hover:border-[#006D32] hover:bg-green-50"}`}
          >
            <div className="w-20 h-20 rounded-full bg-[#EEF7F2] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#006D32] text-4xl">add_photo_alternate</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">Arrastra tu foto aquí</p>
              <p className="text-gray-400 text-sm mt-1">o haz clic para seleccionarla</p>
              <p className="text-gray-300 text-xs mt-3">JPG · PNG · HEIC · hasta 20 MB</p>
            </div>
          </div>

          <button
            onClick={() => cameraRef.current?.click()}
            className="mt-4 w-full border-2 border-[#006D32] text-[#006D32] py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-green-50 transition"
          >
            <span className="material-symbols-outlined">photo_camera</span>
            Tomar foto con la cámara
          </button>

          <div className="mt-3">
            {combined ? (
              <button onClick={() => setPhase("results")}
                className="w-full text-[#005224] text-sm py-2 hover:text-[#006D32] transition font-semibold">
                ← Ver resultados actuales
              </button>
            ) : (
              <button onClick={() => setPhase("guide")}
                className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition">
                ← Ver guía de fotografía
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
