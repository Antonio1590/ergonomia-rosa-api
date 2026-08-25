import { useCallback, useMemo, useState } from "react";

const DRAFT_KEY = "rosa_draft";

interface StoredDraft<T> {
  data: T;
  savedAt: string;
}

// Hook genérico: la página que lo usa decide qué forma tiene el borrador
// (evita que este archivo dependa de tipos definidos en AutoEvaluationPage.tsx).
export function useDraft<T>() {
  const [hasDraft, setHasDraft] = useState(() => localStorage.getItem(DRAFT_KEY) !== null);
  const [draftDate, setDraftDate] = useState<string | null>(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try { return (JSON.parse(raw) as StoredDraft<T>).savedAt; } catch { return null; }
  });

  const saveDraft = useCallback((data: T) => {
    const draft: StoredDraft<T> = { data, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setHasDraft(true);
    setDraftDate(draft.savedAt);
  }, []);

  const loadDraft = useCallback((): StoredDraft<T> | null => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredDraft<T>; } catch { return null; }
  }, []);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setDraftDate(null);
  }, []);

  // Objeto estable entre renders: si no, cualquier useCallback/useEffect
  // consumidor que dependa de "draft" completo se recrearía en cada render.
  return useMemo(
    () => ({ hasDraft, draftDate, saveDraft, loadDraft, discardDraft }),
    [hasDraft, draftDate, saveDraft, loadDraft, discardDraft]
  );
}
