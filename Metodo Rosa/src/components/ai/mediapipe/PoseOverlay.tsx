import { useEffect, useRef } from "react";

import type { PosePoint } from "./PoseTypes";

interface PoseOverlayProps {
  imageUrl: string;
  landmarks: PosePoint[];
}

const CONNECTIONS: [number, number][] = [
  // Cara
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],

  // Tronco
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],

  // Brazo izquierdo
  [11, 13],
  [13, 15],

  // Brazo derecho
  [12, 14],
  [14, 16],

  // Mano izquierda
  [15, 17],
  [15, 19],
  [15, 21],

  // Mano derecha
  [16, 18],
  [16, 20],
  [16, 22],

  // Pierna izquierda
  [23, 25],
  [25, 27],

  // Pierna derecha
  [24, 26],
  [26, 28],

  // Pie izquierdo
  [27, 29],
  [27, 31],

  // Pie derecho
  [28, 30],
  [28, 32],
];

export default function PoseOverlay({
  imageUrl,
  landmarks,
}: PoseOverlayProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const imageRef =
    useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas) {
      return;
    }

    const draw = () => {
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      /*
       * Dibujar conexiones
       */

      context.lineWidth = Math.max(
        3,
        canvas.width / 250
      );

      context.strokeStyle = "#006D32";

      CONNECTIONS.forEach(
        ([startIndex, endIndex]) => {
          const start =
            landmarks[startIndex];

          const end =
            landmarks[endIndex];

          if (!start || !end) {
            return;
          }

          if (
            start.visibility < 0.3 ||
            end.visibility < 0.3
          ) {
            return;
          }

          context.beginPath();

          context.moveTo(
            start.x * canvas.width,
            start.y * canvas.height
          );

          context.lineTo(
            end.x * canvas.width,
            end.y * canvas.height
          );

          context.stroke();
        }
      );

      /*
       * Dibujar puntos
       */

      landmarks.forEach((point) => {
        if (point.visibility < 0.3) {
          return;
        }

        const x =
          point.x * canvas.width;

        const y =
          point.y * canvas.height;

        context.beginPath();

        context.arc(
          x,
          y,
          Math.max(5, canvas.width / 150),
          0,
          Math.PI * 2
        );

        context.fillStyle = "#FFFFFF";

        context.fill();

        context.lineWidth = 2;

        context.strokeStyle = "#006D32";

        context.stroke();
      });
    };

    if (image.complete) {
      draw();
    } else {
      image.onload = draw;
    }

    return () => {
      image.onload = null;
    };
  }, [imageUrl, landmarks]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gray-900">

      <img
        ref={imageRef}
        src={imageUrl}
        alt="Trabajador analizado"
        className="block h-auto w-full"
      />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

    </div>
  );
}