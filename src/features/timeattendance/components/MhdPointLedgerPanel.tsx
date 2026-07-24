import { useMemo } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
    return <p className="text-sm text-muted-foreground">Loading points…</p>;
  }

  return (
    <section className="space-y-4">
      <MhdCard className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {selfView ? 'Your current points' : 'Current points'}
          </p>
          <p className="text-3xl font-semibold text-foreground">{balance}</p>
        </div>
        {nextThreshold ? (
          <p className="text-sm text-muted-foreground">
            {Math.round((nextThreshold.pointsAt - balance) * 100) / 100} more before{' '}
            <span className="font-medium">
              {nextThreshold.actionLevel.replace(/_/g, ' ').toLowerCase()}
            </span>
          </p>
        ) : thresholds.length > 0 ? (
          <p className="text-sm text-muted-foreground">Past the highest configured threshold.</p>
        ) : null}
      </MhdCard>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No point activity on record.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Effective</MhdTh>
                <MhdTh>Entry</MhdTh>
                <MhdTh>Occurrence</MhdTh>
                <MhdTh className="text-right">Points</MhdTh>
                <MhdTh>Rolls off</MhdTh>
                <MhdTh>Reason</MhdTh>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const superseded = reversedIds.has(entry.id);
                const expired = isExpired(entry, today);
                const inactive = superseded || expired;
                return (
                  <MhdTr key={entry.id} className={inactive ? 'text-muted-foreground' : undefined}>
                    <MhdTd className="whitespace-nowrap">{entry.effectiveDate}</MhdTd>
                    <MhdTd className="whitespace-nowrap">{ENTRY_LABELS[entry.entryType]}</MhdTd>
                    <MhdTd className="whitespace-nowrap">
                      {entry.occurrenceReference ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </MhdTd>
                    <MhdTd
                      className={`text-right tabular-nums ${
                        inactive ? '' : entry.pointsDelta > 0 ? 'text-rose-700' : 'text-emerald-700'
                      } ${superseded ? 'line-through' : ''}`}
                    >
                      {formatDelta(entry.pointsDelta)}
                    </MhdTd>
                    <MhdTd className="whitespace-nowrap">
                      {entry.expiresOn ? (
                        <>
                          {entry.expiresOn}
                          {expired ? <span className="ml-1 text-xs">(expired)</span> : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </MhdTd>
                    <MhdTd>
                      {entry.reason ?? <span className="text-muted-foreground">—</span>}
                    </MhdTd>
                  </MhdTr>
                );
              })}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}

      <p className="text-xs text-muted-foreground">
        This record is append-only. Corrections appear as reversing entries rather than edits, so
        the history of any decision stays intact.
      </p>
    </section>
  );
}
