import { useMemo } from 'react';
import { mhdNextThreshold, type MhdAttendanceThreshold, type MhdPointLedgerEntry } from '../Types';

interface Props {
  entries: MhdPointLedgerEntry[];
  balance: number;
  thresholds: MhdAttendanceThreshold[];
  isLoading?: boolean;
  /**
   * Rendered for the employee viewing their own record. Same data — employees
   * see their full ledger, because a balance with no visible entries is harder
   * to contest than full disclosure, and a disputed total nobody can explain is
   * the worst outcome for everyone.
   */
  selfView?: boolean;
}

const ENTRY_LABELS: Record<MhdPointLedgerEntry['entryType'], string> = {
  ASSESSMENT: 'Assessed',
  ROLL_OFF: 'Rolled off',
  REVERSAL: 'Reversed',
  MANUAL_ADJUSTMENT: 'Adjustment',
  PERFECT_ATTENDANCE_CREDIT: 'Attendance credit',
};

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function isExpired(entry: MhdPointLedgerEntry, today: string): boolean {
  return Boolean(entry.expiresOn && entry.expiresOn <= today);
}

export function MhdPointLedgerPanel({
  entries,
  balance,
  thresholds,
  isLoading = false,
  selfView = false,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const nextThreshold = useMemo(() => mhdNextThreshold(balance, thresholds), [balance, thresholds]);

  // Reversed entries stay visible but read as struck-through history: the whole
  // point of an append-only ledger is that a correction is shown, not hidden.
  const reversedIds = useMemo(
    () => new Set(entries.map((entry) => entry.reversalOfEntryId).filter(Boolean) as string[]),
    [entries],
  );

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading points…</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {selfView ? 'Your current points' : 'Current points'}
          </p>
          <p className="text-3xl font-semibold text-neutral-900">{balance}</p>
        </div>
        {nextThreshold ? (
          <p className="text-sm text-neutral-600">
            {Math.round((nextThreshold.pointsAt - balance) * 100) / 100} more before{' '}
            <span className="font-medium">{nextThreshold.actionLevel.replace(/_/g, ' ').toLowerCase()}</span>
          </p>
        ) : thresholds.length > 0 ? (
          <p className="text-sm text-neutral-600">Past the highest configured threshold.</p>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">No point activity on record.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Effective</th>
                <th className="py-2 pr-4 font-medium">Entry</th>
                <th className="py-2 pr-4 font-medium">Occurrence</th>
                <th className="py-2 pr-4 text-right font-medium">Points</th>
                <th className="py-2 pr-4 font-medium">Rolls off</th>
                <th className="py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const superseded = reversedIds.has(entry.id);
                const expired = isExpired(entry, today);
                const inactive = superseded || expired;
                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-neutral-100 ${inactive ? 'text-neutral-400' : 'text-neutral-800'}`}
                  >
                    <td className="py-2 pr-4 whitespace-nowrap">{entry.effectiveDate}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{ENTRY_LABELS[entry.entryType]}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {entry.occurrenceReference ?? <span className="text-neutral-400">—</span>}
                    </td>
                    <td
                      className={`py-2 pr-4 text-right tabular-nums ${
                        inactive ? '' : entry.pointsDelta > 0 ? 'text-rose-700' : 'text-emerald-700'
                      } ${superseded ? 'line-through' : ''}`}
                    >
                      {formatDelta(entry.pointsDelta)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {entry.expiresOn ? (
                        <>
                          {entry.expiresOn}
                          {expired ? <span className="ml-1 text-xs">(expired)</span> : null}
                        </>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-2">{entry.reason ?? <span className="text-neutral-400">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        This record is append-only. Corrections appear as reversing entries rather than edits, so
        the history of any decision stays intact.
      </p>
    </section>
  );
}
