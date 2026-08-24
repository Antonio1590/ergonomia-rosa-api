import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { RosaCalculationResult } from "../components/ai/rosa/RosaAssessment";
import type { Detection } from "../ai/yolo/YoloTypes";

interface RosaResultContextType {
  rosaResult: RosaCalculationResult | null;
  setRosaResult: (r: RosaCalculationResult | null) => void;
  detections: Detection[];
  setDetections: (d: Detection[]) => void;
}

const RosaResultContext = createContext<RosaResultContextType | null>(null);

export function RosaResultProvider({ children }: { children: ReactNode }) {
  const [rosaResult, setRosaResult] =
    useState<RosaCalculationResult | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);

  return (
    <RosaResultContext.Provider
      value={{ rosaResult, setRosaResult, detections, setDetections }}
    >
      {children}
    </RosaResultContext.Provider>
  );
}

export function useRosaResult() {
  const ctx = useContext(RosaResultContext);
  if (!ctx)
    throw new Error("useRosaResult debe usarse dentro de RosaResultProvider");
  return ctx;
}
