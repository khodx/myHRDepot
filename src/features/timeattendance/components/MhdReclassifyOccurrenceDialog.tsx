import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MHD_FIELD_INPUT_CLASS } from '@/components/ui/MhdFieldLabel';
import { MhdModal } from '@/components/ui/MhdModal';
import { mhdReclassifyOccurrenceSchema } from '../Schemas';
import {
  MHD_ATTENDANCE_CLASSIFICATIONS,
  MHD_PROTECTED_LEAVE_CATEGORIES,
  mhdFormatClassification,
  mhdFormatOccurrenceType,
  mhdFormatProtectedLeaveCategory,
  type MhdAttendanceClassification,
  type MhdAttendanceOccurrence,
  type MhdProtectedLeaveCategory,
  type MhdReclassifyOccurrenceInput,
} from '../Types';

interface Props {
  occurrence: MhdAttendanceOccurrence;
  isSubmitting: boolean;
  onSubmit: (input: MhdReclassifyOccurrenceInput) => Promise<void> | void;
  onCancel: () => void;
}

const DIALOG_CLASS =
  'relative flex w-full max-w-md flex-col rounded-lg border border-border bg-background shadow-xl';

/**
 * Moves an occurrence between classifications - the legally significant operation.
 *
 * The consequence is stated before saving, because it differs by direction: moving
 * INTO Protected unwinds any points automatically; moving OUT of Protected assesses
 * nothing and instead queues a reassessment decision for a person, so the absence is
 * never pointed - or silently forgiven - without a recorded reason. The database
 * enforces both; this dialog explains them.
 */
export function MhdReclassifyOccurrenceDialog({
  occurrence,
  isSubmitting,
  onSubmit,
  onCancel,
}: Props) {
  const [classification, setClassification] = useState<MhdAttendanceClassification>(
    occurrence.classification,
  );
  const [category, setCategory] = useState<MhdProtectedLeaveCategory | ''>(
    occurrence.protectedLeaveCategory ?? '',
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wasProtected = occurrence.classification === 'PROTECTED';
  const movingIntoProtected = classification === 'PROTECTED' && !wasProtected;
  const movingOutOfProtected = classification !== 'PROTECTED' && wasProtected;

  async function submit() {
    const parsed = mhdReclassifyOccurrenceSchema.safeParse({
      occurrenceId: occurrence.id,
      classification,
      protectedLeaveCategory: classification === 'PROTECTED' ? category || null : null,
      reason,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the highlighted fields.');
      return;
    }
    const unchanged =
      parsed.data.classification === occurrence.classification &&
      (parsed.data.protectedLeaveCategory ?? null) === (occurrence.protectedLeaveCategory ?? null);
    if (unchanged) {
      setError('Choose a different classification or category.');
      return;
    }
    setError(null);
    await onSubmit(parsed.data);
  }

  return (
    <MhdModal title="Reclassify Occurrence" onClose={onCancel} className={DIALOG_CLASS}>
      <h2 className="text-base font-semibold text-foreground">Reclassify Occurrence</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {mhdFormatOccurrenceType(occurrence.occurrenceType)} on {occurrence.occurrenceDate} ·
        currently {mhdFormatClassification(occurrence.classification)}
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="reclassify-classification"
            className="block text-sm font-medium text-foreground"
          >
            New classification
          </label>
          <select
            id="reclassify-classification"
            value={classification}
            onChange={(event) => {
              setClassification(event.target.value as MhdAttendanceClassification);
              if (event.target.value !== 'PROTECTED') setCategory('');
            }}
            className={MHD_FIELD_INPUT_CLASS}
          >
            {MHD_ATTENDANCE_CLASSIFICATIONS.map((value) => (
              <option key={value} value={value}>
                {mhdFormatClassification(value)}
              </option>
            ))}
          </select>
        </div>

        {classification === 'PROTECTED' ? (
          <div>
            <label
              htmlFor="reclassify-category"
              className="block text-sm font-medium text-foreground"
            >
              Protected leave category
            </label>
            <select
              id="reclassify-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as MhdProtectedLeaveCategory | '')
              }
              className={MHD_FIELD_INPUT_CLASS}
            >
              <option value="">Select a category…</option>
              {MHD_PROTECTED_LEAVE_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {mhdFormatProtectedLeaveCategory(value)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {movingIntoProtected ? (
          <p className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
            Protected absences cannot accrue points under any policy setting. Any points already
            assessed for this occurrence will be unwound with reversing ledger entries.
          </p>
        ) : null}
        {movingOutOfProtected ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-foreground">
            No points are assessed automatically. A reassessment item is queued so a person decides,
            with a recorded reason, whether the policy applies.
          </p>
        ) : null}

        <div>
          <label htmlFor="reclassify-reason" className="block text-sm font-medium text-foreground">
            Reason <span className="font-normal text-muted-foreground">(required)</span>
          </label>
          <textarea
            id="reclassify-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={MHD_FIELD_INPUT_CLASS}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Do not record medical or safe-time detail here.
          </p>
        </div>

        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" className="px-3 py-1.5" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="px-3 py-1.5" disabled={isSubmitting} onClick={() => void submit()}>
          {isSubmitting ? 'Saving…' : 'Reclassify'}
        </Button>
      </div>
    </MhdModal>
  );
}
