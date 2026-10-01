import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MHD_FIELD_INPUT_CLASS } from '@/components/ui/MhdFieldLabel';
import { MhdModal } from '@/components/ui/MhdModal';
import { mhdCompanyHolidaySchema } from '../Schemas';
import type { MhdCompanyHoliday } from '../Types';

interface Props {
  companyId: string;
  /** Present when editing; absent when adding. The RPC upserts on (company, date). */
  holiday?: MhdCompanyHoliday | null;
  defaultDate: string;
  isSubmitting: boolean;
  onSubmit: (input: {
    holidayDate: string;
    holidayName: string;
    isPaid: boolean;
  }) => Promise<void> | void;
  onCancel: () => void;
}

const DIALOG_CLASS =
  'relative flex w-full max-w-md flex-col rounded-lg border border-border bg-background shadow-xl';

/**
 * Adds or edits a company holiday. Shift generation skips holidays, so an absence
 * cannot be raised against one; saving here changes future generation, not shifts
 * already generated.
 */
export function MhdHolidayDialog({
  companyId,
  holiday,
  defaultDate,
  isSubmitting,
  onSubmit,
  onCancel,
}: Props) {
  const [holidayDate, setHolidayDate] = useState(holiday?.holidayDate ?? defaultDate);
  const [holidayName, setHolidayName] = useState(holiday?.holidayName ?? '');
  const [isPaid, setIsPaid] = useState(holiday?.isPaid ?? true);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsed = mhdCompanyHolidaySchema.safeParse({
      companyId,
      holidayDate,
      holidayName,
      isPaid,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the highlighted fields.');
      return;
    }
    setError(null);
    await onSubmit({
      holidayDate: parsed.data.holidayDate,
      holidayName: parsed.data.holidayName,
      isPaid: parsed.data.isPaid,
    });
  }

  const title = holiday ? 'Edit Holiday' : 'Add Holiday';

  return (
    <MhdModal title={title} onClose={onCancel} className={DIALOG_CLASS}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="holiday-date" className="block text-sm font-medium text-foreground">
            Date
          </label>
          <MhdDateField
            id="holiday-date"
            value={holidayDate}
            onChange={(nextValue) => setHolidayDate(nextValue)}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="holiday-name" className="block text-sm font-medium text-foreground">
            Name
          </label>
          <input
            id="holiday-name"
            type="text"
            value={holidayName}
            onChange={(event) => setHolidayName(event.target.value)}
            className={MHD_FIELD_INPUT_CLASS}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isPaid}
            onChange={(event) => setIsPaid(event.target.checked)}
          />
          Paid holiday
        </label>

        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" className="px-3 py-1.5" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="px-3 py-1.5" disabled={isSubmitting} onClick={() => void submit()}>
          {isSubmitting ? 'Saving…' : 'Save Holiday'}
        </Button>
      </div>
    </MhdModal>
  );
}
