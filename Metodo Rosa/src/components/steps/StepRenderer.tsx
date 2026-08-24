import { useStep } from "../../context/StepContext";

import Step1Chair from "./Step1Chair";
import Step2BackSupport from "./Step2BackSupport";
import Step3ArmRest from "./Step3ArmRest";
import Step4Result from "./Step4Result";

export default function StepRenderer() {
  const { step } = useStep();

  switch (step) {
    case 1:
      return <Step1Chair />;

    case 2:
      return <Step2BackSupport />;

    case 3:
      return <Step3ArmRest />;

    case 4:
      return <Step4Result />;

    default:
      return <Step1Chair />;
  }
}