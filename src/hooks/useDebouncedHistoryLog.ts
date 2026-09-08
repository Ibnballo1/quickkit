import { useEffect, useRef } from "react";
import { addHistoryEntry, HistoryKind } from "@/services/historyStorage";

interface HistoryLogInput {
  kind: HistoryKind;
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
}

const DEBOUNCE_MS = 1200;

/**
 * Logs a history entry `DEBOUNCE_MS` after `input` last changed, so a
 * live-recomputed result (calculators, converter) only gets written once
 * the user pauses, not on every keystroke. Pass `null` while there's no
 * valid result yet — nothing is logged in that case.
 */
export function useDebouncedHistoryLog(input: HistoryLogInput | null): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!input) return;

    timeoutRef.current = setTimeout(() => {
      void addHistoryEntry(input);
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input?.kind, input?.title, input?.subtitle]);
}
