import { useState } from 'react';

interface Props {
  templateName: string;
  /** Sensible default (today) for the effective-from date. */
  defaultDate: string;
  isSubmitting: boolean;
  onSubmit: (effectiveFrom: string, note: string | null) => Promise<void> | void;
  onCancel: () => void;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Replaces the former `window.prompt` for an assignment effective-date. The date
 * is mandatory (an assignment with no start is meaningless, and the RPC requires
 * `p_effective_from`); it is validated as a real ISO date in the dialog rather
 * than being accepted as free text as the prompt did.
 */
export function MhdAssignTemplateDialog({
  templateName,
  defaultDate,
  isSubmitting,
  onSubmit,
  onCancel,
}: Props) {
  const [effectiveFrom, setEffectiveFrom] = useState(defaultDate);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!ISO_DATE.test(effectiveFrom)) {
      setError('An effective-from date is required (YYYY-MM-DD).');
      return;
    }
    setError(null);
    await onSubmit(effectiveFrom, note.trim() ? note.trim() : null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-6">
        <h2 className="text-base font-semibold text-neutral-900">Assign schedule pattern</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Assigning <span className="font-medium">{templateName}</span> closes any current pattern
          rather than rewriting it. Shifts already generated keep the pattern they were made under.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="assign-from" className="block text-sm font-medium text-neutral-700">
              Effective from <span className="font-normal text-neutral-500">(required)</span>
            </label>
            <input
              id="assign-from"
              type="date"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
              className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="assign-note" className="block text-sm font-medium text-neutral-700">
              Note <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <textarea
              id="assign-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
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
            {isSubmitting ? 'Assigning…' : 'Assign pattern'}
          </button>
        </div>
      </div>
    </div>
  );
}
