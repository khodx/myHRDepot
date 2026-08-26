export interface MhdCalculatorHistoryEntry {
  id: string;
  mode: 'standard' | 'guided';
  label: string;
  expression: string;
  result: number;
  timestamp: number;
}

const HISTORY_LIMIT = 50;

function storageKey(userId: string): string {
  return `mhd-calculator-history:${userId}`;
}

function isHistoryEntry(value: unknown): value is MhdCalculatorHistoryEntry {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    (entry.mode === 'standard' || entry.mode === 'guided') &&
    typeof entry.label === 'string' &&
    typeof entry.expression === 'string' &&
    typeof entry.result === 'number' &&
    Number.isFinite(entry.result) &&
    typeof entry.timestamp === 'number' &&
    Number.isFinite(entry.timestamp)
  );
}

function isHistoryList(value: unknown): value is MhdCalculatorHistoryEntry[] {
  return Array.isArray(value) && value.every(isHistoryEntry);
}

export function mhdReadCalculatorHistory(userId: string): MhdCalculatorHistoryEntry[] {
  try {
    const stored = localStorage.getItem(storageKey(userId));
    if (stored === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    return isHistoryList(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mhdAppendCalculatorHistoryEntry(
  userId: string,
  entry: Omit<MhdCalculatorHistoryEntry, 'id' | 'timestamp'>,
): MhdCalculatorHistoryEntry[] {
  const updated = [
    {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    },
    ...mhdReadCalculatorHistory(userId),
  ].slice(0, HISTORY_LIMIT);

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(updated));
  } catch {
    // Client storage can be unavailable; the in-memory result is still useful.
  }

  return updated;
}

export function mhdClearCalculatorHistory(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // Clearing history is best effort when client storage is unavailable.
  }
}
