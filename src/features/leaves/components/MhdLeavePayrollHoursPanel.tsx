import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdAttachmentUploader } from '@/components/ui/MhdAttachmentUploader';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAttachments } from '@/features/attachments/Hook';
import { mhdLeavesIsHr } from '@/appshell/mhdRouteAccess';
import { mhdEligibilityBlockerMessage } from '../EligibilityBlockers';
import { mhdLeavePayrollHoursSchema } from '../Schemas';
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
  const [error, setError] = useState<string | null>(null);

  if (!mhdLeavesIsHr(roles)) return null;

  const current = record.data;
  // Newest document first. Until HR picks one explicitly, the newest is used and shown in the selector.
  const documents = [...attachments.attachments].sort((x, y) =>
    y.uploadedAt.localeCompare(x.uploadedAt),
  );
  const chosenAttachmentId = attachmentId || documents[0]?.id || '';

  async function submit() {
    setError(null);
    setOutcome(null);
    const parsed = mhdLeavePayrollHoursSchema.safeParse({
      caseId,
      hoursWorked12Months: hours.trim() === '' ? Number.NaN : Number(hours),
      periodStart,
      periodEnd,
      attachmentId: chosenAttachmentId,
      note: note.trim() || null,
    });
    if (!parsed.success) {
      setError(
        chosenAttachmentId
          ? (parsed.error.issues[0]?.message ?? 'Check the payroll hours and try again.')
          : 'Upload the payroll document before saving.',
      );
      return;
    }
    try {
      const result = await save.mutateAsync(parsed.data);
      setOutcome(
        result?.blockers?.length
          ? `Payroll hours saved. ${result.blockers.map(mhdEligibilityBlockerMessage).join(' ')}`
          : 'Evaluation updated.',
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The payroll hours could not be saved.');
    }
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
          // The newest document is the one just uploaded; the selector below shows and can change it.
          setAttachmentId('');
        }}
      />
      <label className="block text-sm font-medium">
        Payroll document
        <select
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2"
          value={chosenAttachmentId}
          onChange={(event) => setAttachmentId(event.target.value)}
        >
          {documents.length === 0 ? (
            <option value="">Upload a payroll document first</option>
          ) : null}
          {documents.map((document) => (
            <option key={document.id} value={document.id}>
              {document.originalFileName}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between gap-3">
        <Button disabled={save.isPending} onClick={() => void submit()}>
          {save.isPending ? 'Saving…' : 'Save Payroll Hours'}
        </Button>
        {outcome ? <p className="text-sm text-muted-foreground">{outcome}</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </MhdCard>
  );
}
