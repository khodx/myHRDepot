import { useState } from 'react';

interface Props {
  isSubmitting: boolean;
  onSubmit: (pointsDelta: number, reason: string) => Promise<void> | void;
  onCancel: () => void;
}

/**
 * Replaces the two chained `window.prompt` calls that previously captured a
 * manual point adjustment. Both the delta and the reason are mandatory, matching
 * `mhd_attendance_adjust_points` (a non-zero `p_points_delta` and a non-empty
 * `p_reason`) — there is no silent path to a person's point total, and the
 * captured values are validated before the mutation fires rather than after.
 */
export function MhdAdjustPointsDialog({ isSubmitting, onSubmit, onCancel }: Props) {
  const [rawDelta, setRawDelta] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const delta = Number.parseFloat(rawDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      setError('Enter a non-zero adjustment (e.g. -1 to remove a point).');
      return;
    }
    if (!reason.trim()) {
      setError('A reason is required for a manual adjustment.');
      return;
    }
    setError(null);
    await onSubmit(delta, reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-6">
        <h2 className="text-base font-semibold text-neutral-900">Adjust points</h2>
        <p className="mt-1 text-sm text-neutral-600">
          A manual adjustment writes a ledger entry. Use a negative value to remove points, a
          positive value to add them.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="adjust-delta" className="block text-sm font-medium text-neutral-700">
              Adjustment <span className="font-normal text-neutral-500">(e.g. -1)</span>
            </label>
            <input
              id="adjust-delta"
              type="number"
              step="0.25"
              value={rawDelta}
              onChange={(event) => setRawDelta(event.target.value)}
              className="mt-1 w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="adjust-reason" className="block text-sm font-medium text-neutral-700">
              Reason <span className="font-normal text-neutral-500">(required)</span>
            </label>
            <textarea
              id="adjust-reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit()}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Apply adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
}
