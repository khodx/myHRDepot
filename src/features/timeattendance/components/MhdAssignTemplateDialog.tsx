import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';

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
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Assign schedule pattern</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assigning <span className="font-medium">{templateName}</span> closes any current pattern
          rather than rewriting it. Shifts already generated keep the pattern they were made under.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="assign-from" className="block text-sm font-medium text-foreground">
              Effective from <span className="font-normal text-muted-foreground">(required)</span>
            </label>
            <MhdDateField
              id="assign-from"
              value={effectiveFrom}
              onChange={(nextValue) => setEffectiveFrom(nextValue)}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="assign-note" className="block text-sm font-medium text-foreground">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="assign-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" className="px-3 py-1.5" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="px-3 py-1.5" disabled={isSubmitting} onClick={() => void submit()}>
            {isSubmitting ? 'Assigning…' : 'Assign pattern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
