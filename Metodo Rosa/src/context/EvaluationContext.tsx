import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface EvaluationData {
  // Paso 2 — Respaldo y profundidad de silla
  backrestCondition: 1 | 2;
  backrestNotAdjustable: boolean;
  workSurfaceTooHigh: boolean;
  chairDepth: 1 | 2;
  chairDepthNotAdjustable: boolean;
  // Paso 3 — Monitor
  monitorHeight: 1 | 2 | 3;
  monitorLateralDeviation: boolean;
  monitorTooFar: boolean;
  monitorGlare: boolean;
  monitorDuration: -1 | 0 | 1;
  // Paso 3 — Teléfono
  phoneFar: boolean;
  phoneBetweenNeckShoulder: boolean;
  phoneDuration: -1 | 0 | 1;
  // Paso 3 — Mouse
  mousePosition: 1 | 2;
  mouseTooSmall: boolean;
  mouseDiffHeight: boolean;
  mouseHardWristRest: boolean;
  mouseDuration: -1 | 0 | 1;
  // Paso 3 — Teclado
  keyboardPosition: 1 | 2;
  keyboardLateralDeviation: boolean;
  keyboardTooHigh: boolean;
  keyboardNotAdjustable: boolean;
  keyboardDuration: -1 | 0 | 1;
}

const defaultData: EvaluationData = {
  backrestCondition: 1,
  backrestNotAdjustable: false,
  workSurfaceTooHigh: false,
  chairDepth: 1,
  chairDepthNotAdjustable: false,
  monitorHeight: 1,
  monitorLateralDeviation: false,
  monitorTooFar: false,
  monitorGlare: false,
  monitorDuration: 0,
  phoneFar: false,
  phoneBetweenNeckShoulder: false,
  phoneDuration: 0,
  mousePosition: 1,
  mouseTooSmall: false,
  mouseDiffHeight: false,
  mouseHardWristRest: false,
  mouseDuration: 0,
  keyboardPosition: 1,
  keyboardLateralDeviation: false,
  keyboardTooHigh: false,
  keyboardNotAdjustable: false,
  keyboardDuration: 0,
};

interface EvaluationContextType {
  evalData: EvaluationData;
  updateEval: (partial: Partial<EvaluationData>) => void;
  resetEval: () => void;
}

const EvaluationContext =
  createContext<EvaluationContextType | null>(null);

export function EvaluationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [evalData, setEvalData] =
    useState<EvaluationData>(defaultData);

  function updateEval(partial: Partial<EvaluationData>) {
    setEvalData((prev) => ({ ...prev, ...partial }));
  }

  function resetEval() {
    setEvalData(defaultData);
  }

  return (
    <EvaluationContext.Provider
      value={{ evalData, updateEval, resetEval }}
    >
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluation() {
  const context = useContext(EvaluationContext);

  if (!context) {
    throw new Error(
      "useEvaluation debe utilizarse dentro de EvaluationProvider"
    );
  }

  return context;
}
