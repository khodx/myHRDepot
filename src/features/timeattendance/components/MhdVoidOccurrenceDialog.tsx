import { useState } from 'react';

interface Props {
  /** Human-readable label of the occurrence being voided, shown for confirmation. */
  occurrenceLabel: string;
  isSubmitting: boolean;
  onSubmit: (reason: string) => Promise<void> | void;
  onCancel: () => void;
}

/**
 * Replaces the former `window.prompt` for a void reason. The reason is
 * mandatory here exactly as it is at the RPC (`mhd_attendance_void_occurrence`
 * requires a non-empty `p_reason`); an empty submit is refused in the dialog so
 * the void never round-trips to fail server-side, and so the record always
 * carries why it was unwound.
 */
export function MhdVoidOccurrenceDialog({
  occurrenceLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) {
      setError('A reason is required to void an occurrence.');
      return;
    }
    setError(null);
    await onSubmit(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-6">
        <h2 className="text-base font-semibold text-neutral-900">Void occurrence</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Voiding {occurrenceLabel} unwinds its points as reversing ledger entries. The occurrence
          stays on record.
        </p>
        <div className="mt-4">
          <label htmlFor="void-reason" className="block text-sm font-medium text-neutral-700">
            Reason <span className="font-normal text-neutral-500">(required)</span>
          </label>
          <textarea
            id="void-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
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
            {isSubmitting ? 'Voiding…' : 'Void occurrence'}
          </button>
        </div>
      </div>
    </div>
  );
}
