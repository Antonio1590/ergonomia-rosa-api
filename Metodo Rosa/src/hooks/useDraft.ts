import { useCallback, useEffect, useState } from "react";
import type { RosaCalculationResult } from "../components/ai/rosa/RosaAssessment";
import type { Detection } from "../ai/yolo/YoloTypes";

const DRAFT_KEY = "rosa_draft";

interface DraftData {
  step: number;
  rosaResult: RosaCalculationResult | null;
  detections: Detection[];
  savedAt: string;
}

export function useDraft() {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftDate, setDraftDate] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const draft: DraftData = JSON.parse(raw);
        setHasDraft(true);
        setDraftDate(draft.savedAt);
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  const saveDraft = useCallback((data: Omit<DraftData, "savedAt">) => {
    const draft: DraftData = { ...data, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setHasDraft(true);
    setDraftDate(draft.savedAt);
  }, []);

  const loadDraft = useCallback((): DraftData | null => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }, []);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setDraftDate(null);
  }, []);

  return { hasDraft, draftDate, saveDraft, loadDraft, discardDraft };
}
