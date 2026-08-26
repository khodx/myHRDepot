import { useState } from 'react';
import {
  mhdClearCalculatorHistory,
  mhdReadCalculatorHistory,
  type MhdCalculatorHistoryEntry,
} from '../historyStore';

interface MhdCalculatorHistoryProps {
  userId: string;
  onRecall: (entry: MhdCalculatorHistoryEntry) => void;
  refreshToken?: number;
}

function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 10 });

export function MhdCalculatorHistory({ userId, onRecall, refreshToken = 0 }: MhdCalculatorHistoryProps) {
  const [, setClearVersion] = useState(0);
  // Reading during render keeps the shared panel current when its parent records a result.
  void refreshToken;
  const entries = mhdReadCalculatorHistory(userId);

  function clearHistory() {
    mhdClearCalculatorHistory(userId);
    setClearVersion((version) => version + 1);
  }

  return (
    <section className="rounded-lg border border-border bg-card" aria-label="Calculator history">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">History</h2>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Clear history
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">Your calculations will appear here.</p>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <button
              type="button"
              key={entry.id}
              onClick={() => onRecall(entry)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">{entry.label}</span>
                <span className="block text-xs text-muted-foreground">{relativeTime(entry.timestamp)}</span>
              </span>
              <span className="shrink-0 text-sm font-medium text-foreground">
                {numberFormatter.format(entry.result)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
