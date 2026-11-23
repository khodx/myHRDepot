import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdAttachmentUploader } from '@/components/ui/MhdAttachmentUploader';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAttachments } from '@/features/attachments/Hook';
import { mhdLeavesIsHr } from '@/appshell/mhdRouteAccess';
import { useMhdLeavePayrollHours, useMhdRecordLeavePayrollHours } from '../WorkflowHook';

export function MhdLeavePayrollHoursPanel({ caseId }: { caseId: string }) {
  const { roles } = useMhdAuth();
  const record = useMhdLeavePayrollHours(caseId);
  const save = useMhdRecordLeavePayrollHours(caseId);
  const attachments = useMhdAttachments('LEAVE_CASE', caseId);
  const [hours, setHours] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [note, setNote] = useState('');
  const [attachmentId, setAttachmentId] = useState('');
  const [outcome, setOutcome] = useState<string | null>(null);

  if (!mhdLeavesIsHr(roles)) return null;

  const current = record.data;
  async function submit() {
    const parsedHours = Number(hours);
    if (!Number.isFinite(parsedHours) || parsedHours < 0) {
      throw new Error('Enter the 12-month hours worked.');
    }
    if (!periodStart || !periodEnd || !attachmentId) {
      throw new Error('Period dates and a payroll document are required.');
    }
    const result = await save.mutateAsync({
      caseId,
      hoursWorked12Months: parsedHours,
      periodStart,
      periodEnd,
      attachmentId,
      note: note.trim() || null,
    });
    setOutcome(result?.blockers?.length ? result.blockers.join(', ') : 'Evaluation updated.');
  }

  return (
    <MhdCard className="space-y-4">
      <MhdCardHeader title="Payroll Hours" />
      {current ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          <MhdDetailField label="12-month hours" value={String(current.hoursWorked12Months)} />
          <MhdDetailField label="Period" value={`${current.periodStart} to ${current.periodEnd}`} />
          <MhdDetailField label="Note" value={current.note} />
          <MhdDetailField label="Entered" value={new Date(current.enteredAt).toLocaleString()} />
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Payroll hours are required before FMLA/CFRA eligibility can be completed.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm font-medium">
          12-month hours
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            type="number"
            min="0"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Period start
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            type="date"
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Period end
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            type="date"
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Note
        <textarea
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <MhdAttachmentUploader
        isUploading={attachments.isUploading}
        onUpload={async (file, richText, plainText) => {
          await attachments.uploadAttachment(file, richText, plainText);
          const latest = attachments.attachments[attachments.attachments.length - 1];
          if (latest) setAttachmentId(latest.id);
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <Button disabled={save.isPending || !attachmentId} onClick={() => void submit()}>
          {save.isPending ? 'Saving…' : 'Save Payroll Hours'}
        </Button>
        {outcome ? <p className="text-sm text-muted-foreground">{outcome}</p> : null}
      </div>
    </MhdCard>
  );
}
