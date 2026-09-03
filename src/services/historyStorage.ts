import AsyncStorage from "@react-native-async-storage/async-storage";

export type HistoryKind =
  | "qr_scan"
  | "qr_generate"
  | "calculation"
  | "conversion"
  | "age"
  | "date_diff";

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  /** Short human-readable label, e.g. "15% off $80" or "Scanned URL" */
  title: string;
  /** Human-readable result, e.g. "$68.00" or "https://example.com" */
  subtitle: string;
  createdAt: number;
  /** Kind-specific payload for re-opening the entry (never PII beyond what the user entered). */
  data: Record<string, unknown>;
}

const HISTORY_KEY = "@quickkit/history";
const MAX_ENTRIES = 200;

async function readAll(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: HistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES)),
    );
  } catch {
    // Storage write failures should not interrupt the user's task.
  }
}

export async function addHistoryEntry(
  entry: Omit<HistoryEntry, "id" | "createdAt">,
): Promise<void> {
  const all = await readAll();
  const withId: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  await writeAll([withId, ...all]);
}

export async function getHistory(kind?: HistoryKind): Promise<HistoryEntry[]> {
  const all = await readAll();
  return kind ? all.filter((e) => e.kind === kind) : all;
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((e) => e.id !== id));
}

export async function clearHistory(kind?: HistoryKind): Promise<void> {
  if (!kind) {
    await writeAll([]);
    return;
  }
  const all = await readAll();
  await writeAll(all.filter((e) => e.kind !== kind));
}
