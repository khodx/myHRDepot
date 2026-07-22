import { useState } from 'react';
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

const ACTION_STYLES: Record<string, string> = {
  VERBAL_WARNING: 'bg-yellow-100 text-yellow-800',
  WRITTEN_WARNING: 'bg-orange-100 text-orange-800',
  FINAL_WARNING: 'bg-rose-100 text-rose-800',
  TERMINATION_REVIEW: 'bg-red-200 text-red-900',
};

const STATUS_LABELS: Record<MhdThresholdEventStatus, string> = {
  RAISED: 'Needs review',
  ACKNOWLEDGED: 'Acknowledged',
  ACTIONED: 'Actioned',
  DISMISSED: 'Dismissed',
};

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

  const open = events.filter((event) => event.status === 'RAISED' || event.status === 'ACKNOWLEDGED');
  const closed = events.filter((event) => event.status === 'ACTIONED' || event.status === 'DISMISSED');

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
    return <p className="text-sm text-neutral-500">Loading thresholds…</p>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-base font-semibold text-neutral-900">Threshold reviews</h2>
        <p className="mt-1 text-sm text-neutral-600">
          An employee has reached a point total the policy flags. Nothing has been actioned
          automatically.
        </p>
      </header>

      {open.length === 0 ? (
        <p className="text-sm text-neutral-500">No thresholds awaiting review.</p>
      ) : (
        <ul className="space-y-3">
          {open.map((event) => (
            <li key={event.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{event.personDisplayName}</p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    Crossed {event.pointsAt} at {event.pointsAtCrossing} points ·{' '}
                    {new Date(event.crossedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ACTION_STYLES[event.actionLevel] ?? 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {mhdFormatActionLevel(event.actionLevel)}
                  </span>
                  <span className="text-xs text-neutral-500">{STATUS_LABELS[event.status]}</span>
                </div>
              </div>

              {activeId === event.id ? (
                <div className="mt-4 space-y-3 border-t border-neutral-200 pt-3">
                  <div>
                    <label
                      htmlFor={`status-${event.id}`}
                      className="block text-sm font-medium text-neutral-700"
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
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    >
                      <option value="ACKNOWLEDGED">Acknowledged — reviewing</option>
                      <option value="ACTIONED">Actioned — discipline issued</option>
                      <option value="DISMISSED">Dismissed — should not have counted</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`resolution-${event.id}`}
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Note{' '}
                      <span className="font-normal text-neutral-500">
                        {status === 'DISMISSED' ? '(required)' : '(optional)'}
                      </span>
                    </label>
                    <textarea
                      id={`resolution-${event.id}`}
                      rows={2}
                      value={note}
                      onChange={(changeEvent) => setNote(changeEvent.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                    {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void submit(event.id)}
                      className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving…' : 'Save outcome'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(event.id);
                    setStatus('ACKNOWLEDGED');
                    setNote('');
                    setError(null);
                  }}
                  className="mt-3 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
                >
                  Review
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {closed.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-neutral-700">Closed</h3>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
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
