import { useEffect, useRef, useState } from "react";
import type { Detection } from "../ai/yolo/YoloTypes";
import type { PosePoint } from "../ai/mediapipe/PoseTypes";

/* Conexiones del esqueleto MediaPipe (índices de landmark) */
const SKELETON: [number, number][] = [
  [11, 12], [11, 23], [12, 24], [23, 24],       // torso
  [11, 13], [13, 15],                            // brazo izq
  [12, 14], [14, 16],                            // brazo der
  [23, 25], [25, 27],                            // pierna izq
  [24, 26], [26, 28],                            // pierna der
  [27, 31], [28, 32],                            // pies
  [0, 11], [0, 12],                              // cuello
];

const KEY_POINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

/* Color de cada clase según si representa un problema */
export type DetectionStatus = "ok" | "warn" | "error";

const STATUS_COLOR: Record<DetectionStatus, string> = {
  ok:    "#16A34A",
  warn:  "#F59E0B",
  error: "#DC2626",
};

export interface OverlayProps {
  src: string;
  detections: Detection[];
  landmarks?: PosePoint[];
  /** Estado por clase YOLO — determina el color del recuadro */
  statusByClass?: Record<string, DetectionStatus>;
  showSkeleton?: boolean;
  showBoxes?: boolean;
  className?: string;
}

export default function DetectionOverlay({
  src,
  detections,
  landmarks,
  statusByClass = {},
  showSkeleton = true,
  showBoxes = true,
  className = "",
}: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setDims({ w, h });

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      // Escala de trazos relativa al tamaño de la imagen
      const unit = Math.max(w, h) / 400;

      /* ---------- ESQUELETO ---------- */
      if (showSkeleton && landmarks && landmarks.length >= 33) {
        ctx.lineWidth = 2.5 * unit;
        ctx.strokeStyle = "rgba(0, 109, 50, 0.85)";
        ctx.lineCap = "round";

        for (const [a, b] of SKELETON) {
          const pa = landmarks[a];
          const pb = landmarks[b];
          if (!pa || !pb) continue;
          if ((pa.visibility ?? 1) < 0.4 || (pb.visibility ?? 1) < 0.4) continue;
          ctx.beginPath();
          ctx.moveTo(pa.x * w, pa.y * h);
          ctx.lineTo(pb.x * w, pb.y * h);
          ctx.stroke();
        }

        for (const idx of KEY_POINTS) {
          const p = landmarks[idx];
          if (!p || (p.visibility ?? 1) < 0.4) continue;
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 3.5 * unit, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.lineWidth = 2 * unit;
          ctx.strokeStyle = "#006D32";
          ctx.stroke();
        }
      }

      /* ---------- RECUADROS DE OBJETOS ---------- */
      if (showBoxes) {
        const fontSize = Math.max(11, 12 * unit);
        ctx.font = `700 ${fontSize}px "Public Sans", system-ui, sans-serif`;
        ctx.textBaseline = "alphabetic";

        for (const d of detections) {
          // La persona ya se representa con el esqueleto
          if (d.className === "person" && showSkeleton) continue;

          const color = STATUS_COLOR[statusByClass[d.className] ?? "ok"];

          // Recuadro
          ctx.lineWidth = 3 * unit;
          ctx.strokeStyle = color;
          ctx.strokeRect(d.x, d.y, d.width, d.height);

          // Velo tenue para destacar el objeto
          ctx.fillStyle = color + "1A";
          ctx.fillRect(d.x, d.y, d.width, d.height);

          // Etiqueta
          const text = `${d.label} ${Math.round(d.confidence * 100)}%`;
          const padX = 6 * unit;
          const padY = 5 * unit;
          const tw = ctx.measureText(text).width;
          const boxH = fontSize + padY * 2;

          // Si no cabe arriba, se dibuja dentro del recuadro
          const labelY = d.y - boxH < 0 ? d.y : d.y - boxH;

          ctx.fillStyle = color;
          ctx.fillRect(d.x, labelY, tw + padX * 2, boxH);

          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(text, d.x + padX, labelY + boxH - padY - 1);
        }
      }
    };

    return () => { cancelled = true; };
  }, [src, detections, landmarks, statusByClass, showSkeleton, showBoxes]);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-100 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto block"
        style={{ aspectRatio: dims ? `${dims.w} / ${dims.h}` : "4 / 3" }}
      />
    </div>
  );
}
