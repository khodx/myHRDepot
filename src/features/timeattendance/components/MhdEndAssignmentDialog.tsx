import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdModal } from '@/components/ui/MhdModal';
import { mhdEndAssignmentSchema } from '../Schemas';

interface Props {
  assignmentId: string;
  templateName: string;
  effectiveFrom: string;
  /** Default end date (today). */
  defaultDate: string;
  isSubmitting: boolean;
  onSubmit: (assignmentId: string, effectiveTo: string) => Promise<void> | void;
  onCancel: () => void;
}

const DIALOG_CLASS =
  'relative flex w-full max-w-md flex-col rounded-lg border border-border bg-background shadow-xl';

/**
 * Ends the current pattern assignment without replacing it - for example when an
 * employee leaves a regular schedule. The row is closed, never deleted, so shifts
 * already generated keep resolving against the pattern in force when they were made.
 */
export function MhdEndAssignmentDialog({
  assignmentId,
  templateName,
  effectiveFrom,
  defaultDate,
  isSubmitting,
  onSubmit,
  onCancel,
}: Props) {
  const [effectiveTo, setEffectiveTo] = useState(defaultDate);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsed = mhdEndAssignmentSchema.safeParse({ assignmentId, effectiveTo });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'An end date is required.');
      return;
    }
    if (parsed.data.effectiveTo < effectiveFrom) {
      setError(`The end date cannot be before the assignment started on ${effectiveFrom}.`);
      return;
    }
    setError(null);
    await onSubmit(parsed.data.assignmentId, parsed.data.effectiveTo);
  }

  return (
    <MhdModal title="End Schedule Assignment" onClose={onCancel} className={DIALOG_CLASS}>
      <h2 className="text-base font-semibold text-foreground">End Schedule Assignment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-medium">{templateName}</span> has applied since {effectiveFrom}.
        Ending it closes the assignment; history and shifts already generated are kept.
      </p>

      <div className="mt-4">
        <label htmlFor="end-assignment-date" className="block text-sm font-medium text-foreground">
          Last day of the pattern{' '}
          <span className="font-normal text-muted-foreground">(required)</span>
        </label>
        <MhdDateField
          id="end-assignment-date"
          value={effectiveTo}
          onChange={(nextValue) => setEffectiveTo(nextValue)}
          className="mt-1"
        />
        {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" className="px-3 py-1.5" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="px-3 py-1.5" disabled={isSubmitting} onClick={() => void submit()}>
          {isSubmitting ? 'Ending…' : 'End Assignment'}
        </Button>
      </div>
    </MhdModal>
  );
}
