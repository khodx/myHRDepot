import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  mhdFormatClassification,
  mhdFormatOccurrenceType,
  type MhdReassessmentEvent,
  type MhdResolveReassessmentInput,
} from '../Types';

interface Props {
  events: MhdReassessmentEvent[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  onResolve: (input: MhdResolveReassessmentInput) => Promise<void>;
}

/**
 * The consistency record.
 *
 * An item appears when an absence stops being protected and becomes
 * point-eligible while carrying no points — the reversal trigger only ever
 * reverses, so nothing is assessed automatically. Someone has to decide.
 *
 * Two design choices carry the compliance weight:
 *
 * 1. **Resolved items stay on screen.** They are not clutter; they are the
 *    evidence that the policy was applied the same way each time. A queue that
 *    empties itself answers "what did we do about the others?" with silence.
 *
 * 2. **A reason is required to decline, not only to assess.** A declined item
 *    with no recorded reason is indistinguishable from one nobody looked at,
 *    and that ambiguity is the exposure the whole queue exists to remove.
 */
export function MhdReassessmentQueuePanel({
  events,
  isLoading = false,
  isSubmitting = false,
  onResolve,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'ASSESSED' | 'DECLINED'>('ASSESSED');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const open = events.filter((event) => event.status === 'RAISED');
  const resolved = events.filter((event) => event.status !== 'RAISED');

  function beginDecision(eventId: string, initial: 'ASSESSED' | 'DECLINED') {
    setActiveId(eventId);
    setDecision(initial);
    setNote('');
    setError(null);
  }

  async function submit(event: MhdReassessmentEvent) {
    if (!note.trim()) {
      setError('A written reason is required either way — it is what evidences consistent application.');
      return;
    }
    setError(null);
    await onResolve({ eventId: event.id, decision, decisionNote: note.trim() });
    setActiveId(null);
    setNote('');
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading reassessments…</p>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-base font-semibold text-foreground">Reassessments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These absences are no longer protected and currently carry no points. Decide whether the
          policy applies — the decision is recorded either way.
        </p>
      </header>

      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing awaiting a decision.</p>
      ) : (
        <ul className="space-y-3">
          {open.map((event) => (
            <li key={event.id} className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{event.personDisplayName}</p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {mhdFormatOccurrenceType(event.occurrenceType)} on {event.occurrenceDate} ·{' '}
                    <span className="text-muted-foreground">{event.occurrenceReference}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reclassified from {mhdFormatClassification(event.fromClassification)} to{' '}
                    {mhdFormatClassification(event.toClassification)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Policy would charge</p>
                  <p className="text-lg font-semibold text-foreground">
                    {event.projectedPoints} {event.projectedPoints === 1 ? 'point' : 'points'}
                  </p>
                </div>
              </div>

              {activeId === event.id ? (
                <div className="mt-4 space-y-3 border-t border-amber-200 pt-3">
                  <div className="flex gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={`decision-${event.id}`}
                        checked={decision === 'ASSESSED'}
                        onChange={() => setDecision('ASSESSED')}
                      />
                      Assess {event.projectedPoints}{' '}
                      {event.projectedPoints === 1 ? 'point' : 'points'}
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={`decision-${event.id}`}
                        checked={decision === 'DECLINED'}
                        onChange={() => setDecision('DECLINED')}
                      />
                      Do not assess
                    </label>
                  </div>

                  {decision === 'ASSESSED' ? (
                    <p className="text-xs text-muted-foreground">
                      Points will be dated {event.occurrenceDate}, the day of the absence, so the
                      roll-off matches every other occurrence. This may cross a threshold.
                    </p>
                  ) : null}

                  <div>
                    <label
                      htmlFor={`note-${event.id}`}
                      className="block text-sm font-medium text-foreground"
                    >
                      Reason <span className="font-normal text-muted-foreground">(required)</span>
                    </label>
                    <textarea
                      id={`note-${event.id}`}
                      rows={2}
                      value={note}
                      onChange={(changeEvent) => setNote(changeEvent.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5"
                      onClick={() => setActiveId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="px-3 py-1.5"
                      disabled={isSubmitting}
                      onClick={() => void submit(event)}
                    >
                      {isSubmitting ? 'Saving…' : 'Record decision'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button
                    className="px-3 py-1.5"
                    onClick={() => beginDecision(event.id, 'ASSESSED')}
                  >
                    Assess points
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5"
                    onClick={() => beginDecision(event.id, 'DECLINED')}
                  >
                    Do not assess
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {resolved.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Decisions on record</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kept visible on purpose — this is the evidence that the policy was applied consistently.
          </p>
          <MhdCard className="overflow-hidden p-0">
            <MhdTable>
              <thead>
                <tr>
                  <MhdTh>Employee</MhdTh>
                  <MhdTh>Occurrence</MhdTh>
                  <MhdTh>Decision</MhdTh>
                  <MhdTh className="text-right">Points</MhdTh>
                  <MhdTh>Reason</MhdTh>
                </tr>
              </thead>
              <tbody>
                {resolved.map((event) => (
                  <MhdTr key={event.id}>
                    <MhdTd className="whitespace-nowrap">{event.personDisplayName}</MhdTd>
                    <MhdTd className="whitespace-nowrap">
                      {event.occurrenceReference} · {event.occurrenceDate}
                    </MhdTd>
                    <MhdTd className="whitespace-nowrap">
                      <MhdBadge variant={event.status === 'ASSESSED' ? 'error' : 'neutral'} hideIcon>
                        {event.status === 'ASSESSED' ? 'Assessed' : 'Not assessed'}
                      </MhdBadge>
                    </MhdTd>
                    <MhdTd className="text-right tabular-nums">
                      {event.pointsAssessed ?? <span className="text-muted-foreground">—</span>}
                    </MhdTd>
                    <MhdTd>{event.decisionNote}</MhdTd>
                  </MhdTr>
                ))}
              </tbody>
            </MhdTable>
          </MhdCard>
        </div>
      ) : null}
    </section>
  );
}
