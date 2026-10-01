import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MHD_FIELD_INPUT_CLASS } from '@/components/ui/MhdFieldLabel';
import { MhdModal } from '@/components/ui/MhdModal';
import { mhdOverrideShiftSchema } from '../Schemas';
import type { MhdOverrideShiftInput, MhdScheduledShift } from '../Types';

interface Props {
  shift: MhdScheduledShift;
  isSubmitting: boolean;
  onSubmit: (input: MhdOverrideShiftInput) => Promise<void> | void;
  onCancel: () => void;
}

const DIALOG_CLASS =
  'relative flex w-full max-w-md flex-col rounded-lg border border-border bg-background shadow-xl';

/** The database stores `time` as HH:MM:SS; the time input wants HH:MM. */
function toTimeInput(value: string): string {
  return value.slice(0, 5);
}

/**
 * Hand-edits one day's shift. The row is marked OVERRIDE so regeneration never
 * replaces it, and a reason is mandatory - an unexplained change to the schedule an
 * absence is measured against is exactly what a later dispute would probe.
 */
export function MhdOverrideShiftDialog({ shift, isSubmitting, onSubmit, onCancel }: Props) {
  const [startTime, setStartTime] = useState(toTimeInput(shift.startTime));
  const [endTime, setEndTime] = useState(toTimeInput(shift.endTime));
  const [breakMinutes, setBreakMinutes] = useState(String(shift.unpaidBreakMinutes));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsed = mhdOverrideShiftSchema.safeParse({
      shiftId: shift.id,
      startTime,
      endTime,
      unpaidBreakMinutes: breakMinutes === '' ? 0 : Number(breakMinutes),
      reason,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the highlighted fields.');
      return;
    }
    setError(null);
    await onSubmit({
      shiftId: parsed.data.shiftId,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      unpaidBreakMinutes: parsed.data.unpaidBreakMinutes ?? 0,
      reason: parsed.data.reason,
    });
  }

  return (
    <MhdModal title="Override Shift" onClose={onCancel} className={DIALOG_CLASS}>
      <h2 className="text-base font-semibold text-foreground">Override Shift</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {shift.shiftDate}. Regeneration will not replace an overridden day.
      </p>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="override-start" className="block text-sm font-medium text-foreground">
              Start
            </label>
            <input
              id="override-start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={MHD_FIELD_INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="override-end" className="block text-sm font-medium text-foreground">
              End
            </label>
            <input
              id="override-end"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className={MHD_FIELD_INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label htmlFor="override-break" className="block text-sm font-medium text-foreground">
            Unpaid break (minutes)
          </label>
          <input
            id="override-break"
            type="number"
            min={0}
            max={480}
            value={breakMinutes}
            onChange={(event) => setBreakMinutes(event.target.value)}
            className={MHD_FIELD_INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="override-reason" className="block text-sm font-medium text-foreground">
            Reason <span className="font-normal text-muted-foreground">(required)</span>
          </label>
          <textarea
            id="override-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={MHD_FIELD_INPUT_CLASS}
          />
        </div>

        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" className="px-3 py-1.5" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="px-3 py-1.5" disabled={isSubmitting} onClick={() => void submit()}>
          {isSubmitting ? 'Saving…' : 'Override Shift'}
        </Button>
      </div>
    </MhdModal>
  );
}
