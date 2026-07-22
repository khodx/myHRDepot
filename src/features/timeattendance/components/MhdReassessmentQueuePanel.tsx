import { useState } from 'react';
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
    return <p className="text-sm text-neutral-500">Loading reassessments…</p>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-base font-semibold text-neutral-900">Reassessments</h2>
        <p className="mt-1 text-sm text-neutral-600">
          These absences are no longer protected and currently carry no points. Decide whether the
          policy applies — the decision is recorded either way.
        </p>
      </header>

      {open.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing awaiting a decision.</p>
      ) : (
        <ul className="space-y-3">
          {open.map((event) => (
            <li key={event.id} className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{event.personDisplayName}</p>
                  <p className="mt-0.5 text-sm text-neutral-700">
                    {mhdFormatOccurrenceType(event.occurrenceType)} on {event.occurrenceDate} ·{' '}
                    <span className="text-neutral-500">{event.occurrenceReference}</span>
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Reclassified from {mhdFormatClassification(event.fromClassification)} to{' '}
                    {mhdFormatClassification(event.toClassification)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Policy would charge</p>
                  <p className="text-lg font-semibold text-neutral-900">
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
                    <p className="text-xs text-neutral-600">
                      Points will be dated {event.occurrenceDate}, the day of the absence, so the
                      roll-off matches every other occurrence. This may cross a threshold.
                    </p>
                  ) : null}

                  <div>
                    <label
                      htmlFor={`note-${event.id}`}
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Reason <span className="font-normal text-neutral-500">(required)</span>
                    </label>
                    <textarea
                      id={`note-${event.id}`}
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
                      onClick={() => void submit(event)}
                      className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving…' : 'Record decision'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => beginDecision(event.id, 'ASSESSED')}
                    className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50"
                  >
                    Assess points
                  </button>
                  <button
                    type="button"
                    onClick={() => beginDecision(event.id, 'DECLINED')}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
                  >
                    Do not assess
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {resolved.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-neutral-700">Decisions on record</h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            Kept visible on purpose — this is the evidence that the policy was applied consistently.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-4 font-medium">Occurrence</th>
                  <th className="py-2 pr-4 font-medium">Decision</th>
                  <th className="py-2 pr-4 text-right font-medium">Points</th>
                  <th className="py-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((event) => (
                  <tr key={event.id} className="border-b border-neutral-100 text-neutral-800">
                    <td className="py-2 pr-4 whitespace-nowrap">{event.personDisplayName}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {event.occurrenceReference} · {event.occurrenceDate}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          event.status === 'ASSESSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {event.status === 'ASSESSED' ? 'Assessed' : 'Not assessed'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {event.pointsAssessed ?? <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="py-2">{event.decisionNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
