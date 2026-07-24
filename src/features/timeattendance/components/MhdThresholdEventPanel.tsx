import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import {
  mhdFormatActionLevel,
  type MhdResolveThresholdEventInput,
  type MhdThresholdEvent,
  type MhdThresholdEventStatus,
} from '../Types';

interface Props {
  events: MhdThresholdEvent[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  onResolve: (input: MhdResolveThresholdEventInput) => Promise<void>;
}

// Semantic mapping (§5): the early coaching levels read warning, the terminal
// levels read error. The label carries the specific level.
const ACTION_VARIANTS: Record<string, MhdBadgeVariant> = {
  VERBAL_WARNING: 'warning',
  WRITTEN_WARNING: 'warning',
  FINAL_WARNING: 'error',
  TERMINATION_REVIEW: 'error',
};

const STATUS_LABELS: Record<MhdThresholdEventStatus, string> = {
  RAISED: 'Needs review',
  ACKNOWLEDGED: 'Acknowledged',
  ACTIONED: 'Actioned',
  DISMISSED: 'Dismissed',
};

const INPUT_CLASSES =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * Threshold crossings awaiting a human.
 *
 * Nothing in this module disciplines anyone; crossing a threshold produces an
 * item here and stops. The highest level is named "termination review" rather
 * than "termination" for the same reason — automatic adverse action off a point
 * total is the failure mode the whole design avoids.
 *
 * Employees never see this panel. An open item is pending discipline, and
 * discovering it by refreshing a page is not how that conversation should
 * start.
 */
export function MhdThresholdEventPanel({
  events,
  isLoading = false,
  isSubmitting = false,
  onResolve,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<Exclude<MhdThresholdEventStatus, 'RAISED'>>('ACKNOWLEDGED');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const open = events.filter(
    (event) => event.status === 'RAISED' || event.status === 'ACKNOWLEDGED',
  );
  const closed = events.filter(
    (event) => event.status === 'ACTIONED' || event.status === 'DISMISSED',
  );

  async function submit(eventId: string) {
    // Dismissing says the crossing should not have counted. That is exactly the
    // decision a challenge would probe, so it cannot be silent.
    if (status === 'DISMISSED' && !note.trim()) {
      setError('Dismissing a threshold requires a reason.');
      return;
    }
    setError(null);
    await onResolve({ eventId, status, resolutionNote: note.trim() || null });
    setActiveId(null);
    setNote('');
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading thresholds…</p>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-base font-semibold text-foreground">Threshold reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          An employee has reached a point total the policy flags. Nothing has been actioned
          automatically.
        </p>
      </header>

      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">No thresholds awaiting review.</p>
      ) : (
        <ul className="space-y-3">
          {open.map((event) => (
            <li key={event.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{event.personDisplayName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Crossed {event.pointsAt} at {event.pointsAtCrossing} points ·{' '}
                    {new Date(event.crossedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MhdBadge variant={ACTION_VARIANTS[event.actionLevel] ?? 'neutral'}>
                    {mhdFormatActionLevel(event.actionLevel)}
                  </MhdBadge>
                  <span className="text-xs text-muted-foreground">
                    {STATUS_LABELS[event.status]}
                  </span>
                </div>
              </div>

              {activeId === event.id ? (
                <div className="mt-4 space-y-3 border-t border-border pt-3">
                  <div>
                    <label
                      htmlFor={`status-${event.id}`}
                      className="block text-sm font-medium text-foreground"
                    >
                      Outcome
                    </label>
                    <select
                      id={`status-${event.id}`}
                      value={status}
                      onChange={(changeEvent) =>
                        setStatus(
                          changeEvent.target.value as Exclude<MhdThresholdEventStatus, 'RAISED'>,
                        )
                      }
                      className={INPUT_CLASSES}
                    >
                      <option value="ACKNOWLEDGED">Acknowledged — reviewing</option>
                      <option value="ACTIONED">Actioned — discipline issued</option>
                      <option value="DISMISSED">Dismissed — should not have counted</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`resolution-${event.id}`}
                      className="block text-sm font-medium text-foreground"
                    >
                      Note{' '}
                      <span className="font-normal text-muted-foreground">
                        {status === 'DISMISSED' ? '(required)' : '(optional)'}
                      </span>
                    </label>
                    <textarea
                      id={`resolution-${event.id}`}
                      rows={2}
                      value={note}
                      onChange={(changeEvent) => setNote(changeEvent.target.value)}
                      className={INPUT_CLASSES}
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
                      onClick={() => void submit(event.id)}
                    >
                      {isSubmitting ? 'Saving…' : 'Save outcome'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="mt-3 px-3 py-1.5"
                  onClick={() => {
                    setActiveId(event.id);
                    setStatus('ACKNOWLEDGED');
                    setNote('');
                    setError(null);
                  }}
                >
                  Review
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {closed.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-foreground">Closed</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {closed.map((event) => (
              <li key={event.id}>
                {event.personDisplayName} · {mhdFormatActionLevel(event.actionLevel)} ·{' '}
                {STATUS_LABELS[event.status]}
                {event.resolutionNote ? ` — ${event.resolutionNote}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
