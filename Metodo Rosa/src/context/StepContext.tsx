import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type StepContextType = {
  step: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
};

const StepContext = createContext<StepContextType | null>(null);

export function StepProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <StepContext.Provider
      value={{
        step,
        setStep,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </StepContext.Provider>
  );
}

export function useStep() {
  const context = useContext(StepContext);

  if (!context) {
    throw new Error("useStep debe utilizarse dentro de StepProvider");
  }

  return context;
}

