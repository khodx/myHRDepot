import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MHD_FIELD_INPUT_CLASS, MhdFieldLabel } from '@/components/ui/MhdFieldLabel';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdRecordRetentionDecision } from '../Hook';
import { createMhdRetentionDecisionSchema } from '../Schemas';
import type { MhdRetentionDecision, MhdRetentionReviewItem } from '../Types';
import {
  RETENTION_DECISION_EXPLANATION,
  RETENTION_DECISION_LABEL,
  RETENTION_REASON_LABEL,
  formatRetentionDate,
  humaniseRetentionEntityType,
  localIsoDate,
} from './MhdDocumentRetentionUtils';

interface MhdRetentionDecisionModalProps {
  item: MhdRetentionReviewItem;
  decision: MhdRetentionDecision;
  onClose: () => void;
}

export function MhdRetentionDecisionModal({
  item,
  decision,
  onClose,
}: MhdRetentionDecisionModalProps) {
  const record = useMhdRecordRetentionDecision();
  const [reason, setReason] = useState('');
  const [extendUntil, setExtendUntil] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ reason?: string; extendUntil?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const schema = createMhdRetentionDecisionSchema({
      decision,
      effectiveExpiresAt: item.effectiveExpiresAt,
      today: localIsoDate(new Date()),
    });
    const parsed = schema.safeParse({ reason, extendUntil });
    if (!parsed.success) {
      const errors: { reason?: string; extendUntil?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'reason' || key === 'extendUntil') errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      await record.mutateAsync({
        scheduleId: item.scheduleId,
        decision,
        reason: parsed.data.reason,
        extendUntil: decision === 'EXTEND' ? parsed.data.extendUntil : null,
      });
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message ? error.message : 'Unable to record this decision.',
      );
    }
  }

  const label = RETENTION_DECISION_LABEL[decision];
  const subject = `${humaniseRetentionEntityType(item.entityType)}${
    item.personName ? ` — ${item.personName}` : ''
  }`;

  return (
    <MhdModal
      title={label}
      onClose={onClose}
      className="relative flex w-full max-w-lg flex-col rounded-lg border border-border bg-background shadow-xl"
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{label}</h2>
          <p className="text-sm text-muted-foreground">{subject}</p>
          <p className="mt-2 text-sm">{RETENTION_DECISION_EXPLANATION[decision]}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Current retention date: {formatRetentionDate(item.effectiveExpiresAt)}
          </p>
        </div>
        <MhdFormFieldStack>
          {decision === 'EXTEND' ? (
            <div>
              <MhdFieldLabel htmlFor="retention-extend-until" required>
                Retain Until
              </MhdFieldLabel>
              <div className="mt-1">
                <MhdDateField
                  id="retention-extend-until"
                  value={extendUntil}
                  onChange={setExtendUntil}
                  aria-invalid={Boolean(fieldErrors.extendUntil)}
                />
              </div>
              {fieldErrors.extendUntil ? (
                <p role="alert" className="mt-1 text-xs text-red-700">
                  {fieldErrors.extendUntil}
                </p>
              ) : null}
            </div>
          ) : null}
          <div>
            <MhdFieldLabel htmlFor="retention-reason" required>
              {RETENTION_REASON_LABEL[decision]}
            </MhdFieldLabel>
            <textarea
              id="retention-reason"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-invalid={Boolean(fieldErrors.reason)}
              className={MHD_FIELD_INPUT_CLASS}
            />
            {fieldErrors.reason ? (
              <p role="alert" className="mt-1 text-xs text-red-700">
                {fieldErrors.reason}
              </p>
            ) : null}
          </div>
        </MhdFormFieldStack>
        {submitError ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {submitError}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={record.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={decision === 'APPROVE_DISPOSAL' ? 'destructive' : 'primary'}
            disabled={record.isPending}
          >
            {record.isPending ? 'Saving…' : label}
          </Button>
        </div>
      </form>
    </MhdModal>
  );
}
