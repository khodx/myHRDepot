import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MHD_FIELD_INPUT_CLASS } from '@/components/ui/MhdFieldLabel';
import { MhdModal } from '@/components/ui/MhdModal';
import { mhdUpdateOccurrenceSchema } from '../Schemas';
import {
  MHD_OCCURRENCE_TYPES,
  mhdFormatOccurrenceType,
  type MhdAttendanceOccurrence,
  type MhdOccurrenceType,
  type MhdUpdateOccurrenceInput,
} from '../Types';

interface Props {
  occurrence: MhdAttendanceOccurrence;
  isSubmitting: boolean;
  onSubmit: (input: MhdUpdateOccurrenceInput) => Promise<void> | void;
  onCancel: () => void;
}

const DIALOG_CLASS =
  'relative flex w-full max-w-md flex-col rounded-lg border border-border bg-background shadow-xl';

/**
 * Edits an occurrence's descriptive fields. Classification is deliberately not here -
 * it moves only through the reclassify dialog, so the automatic-reversal path can
 * never be bypassed by an ordinary edit. A field left unchanged is sent as null and
 * the RPC keeps the stored value.
 */
export function MhdEditOccurrenceDialog({ occurrence, isSubmitting, onSubmit, onCancel }: Props) {
  const [occurrenceType, setOccurrenceType] = useState<MhdOccurrenceType>(
    occurrence.occurrenceType,
  );
  const [minutes, setMinutes] = useState(
    occurrence.minutesVariance == null ? '' : String(occurrence.minutesVariance),
  );
  const [note, setNote] = useState(occurrence.reasonNote ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsed = mhdUpdateOccurrenceSchema.safeParse({
      occurrenceId: occurrence.id,
      occurrenceType: occurrenceType === occurrence.occurrenceType ? null : occurrenceType,
      minutesVariance: minutes === '' ? null : Number(minutes),
      reasonNote: note.trim() === (occurrence.reasonNote ?? '') ? null : note.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the highlighted fields.');
      return;
    }
    setError(null);
    await onSubmit(parsed.data);
  }

  return (
    <MhdModal title="Edit Occurrence" onClose={onCancel} className={DIALOG_CLASS}>
      <h2 className="text-base font-semibold text-foreground">Edit Occurrence</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {occurrence.referenceId} · {occurrence.occurrenceDate}
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="edit-type" className="block text-sm font-medium text-foreground">
            Type
          </label>
          <select
            id="edit-type"
            value={occurrenceType}
            onChange={(event) => setOccurrenceType(event.target.value as MhdOccurrenceType)}
            className={MHD_FIELD_INPUT_CLASS}
          >
            {MHD_OCCURRENCE_TYPES.map((value) => (
              <option key={value} value={value}>
                {mhdFormatOccurrenceType(value)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edit-minutes" className="block text-sm font-medium text-foreground">
            Minutes variance
          </label>
          <input
            id="edit-minutes"
            type="number"
            min={0}
            max={1440}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            className={MHD_FIELD_INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="edit-note" className="block text-sm font-medium text-foreground">
            Note
          </label>
          <textarea
            id="edit-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className={MHD_FIELD_INPUT_CLASS}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Keep it coarse. Never record medical, diagnosis or safe-time detail here.
          </p>
        </div>

        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" className="px-3 py-1.5" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="px-3 py-1.5" disabled={isSubmitting} onClick={() => void submit()}>
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </MhdModal>
  );
}
