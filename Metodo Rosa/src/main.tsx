import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { StepProvider } from "./context/StepContext";
import { EvaluationProvider } from "./context/EvaluationContext";
import { RosaResultProvider } from "./context/RosaResultContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <EvaluationProvider>
        <StepProvider>
          <RosaResultProvider>
            <App />
          </RosaResultProvider>
        </StepProvider>
      </EvaluationProvider>
    </AuthProvider>
  </StrictMode>
);
