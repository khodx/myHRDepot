import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdAcknowledgeJobDescription } from '../Hook';
import { mhdAcknowledgeJobDescriptionSchema } from '../Schemas';
import type { MhdMyJobAcknowledgment } from '../Types';

interface Props {
  acknowledgment: MhdMyJobAcknowledgment;
  /**
   * True when this acknowledgment is for a version other than the one the page
   * is displaying (for example a newly published version not yet effective).
   */
  isOtherVersion?: boolean;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

/**
 * One job description acknowledgment owed to (or given by) the signed-in person.
 * Acknowledging means typing their full name; the server accepts it only from
 * the person it was assigned to and only once.
 */
export function MhdJobAcknowledgmentCard({ acknowledgment, isOtherVersion = false }: Props) {
  const acknowledge = useMhdAcknowledgeJobDescription();
  const [isOpen, setIsOpen] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const versionLabel = `Version ${acknowledgment.versionNumber}`;

  function close() {
    setIsOpen(false);
    setSignedName('');
    setValidationError(null);
    acknowledge.reset();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = mhdAcknowledgeJobDescriptionSchema.safeParse({ signedName });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Type your full name.');
      return;
    }
    setValidationError(null);
    try {
      await acknowledge.mutateAsync({
        acknowledgmentId: acknowledgment.acknowledgmentId,
        signedName: parsed.data.signedName,
      });
    } catch {
      // The failure is held on the mutation and rendered below; keep the modal open.
      return;
    }
    close();
  }

  if (acknowledgment.status === 'ACKNOWLEDGED') {
    return (
      <p className="text-xs text-muted-foreground">
        Acknowledged on{' '}
        {acknowledgment.acknowledgedAt ? formatDate(acknowledgment.acknowledgedAt) : 'record'}
        {acknowledgment.signedName ? ` as ${acknowledgment.signedName}` : ''} ({versionLabel}).
      </p>
    );
  }

  return (
    <MhdCard className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Acknowledgment</h2>
          <p className="mt-1 text-sm text-foreground">
            {acknowledgment.jobTitle} · {versionLabel} · effective{' '}
            {formatDate(acknowledgment.effectiveFrom)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isOtherVersion
              ? 'A different version of your job description than the one shown below is waiting for your acknowledgment.'
              : 'Please confirm that you have read this job description.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MhdBadge variant="warning">Pending</MhdBadge>
          <Button onClick={() => setIsOpen(true)}>Acknowledge</Button>
        </div>
      </div>

      {isOpen ? (
        <MhdModal
          onClose={close}
          title="Acknowledge Job Description"
          initialFocusRef={nameInputRef}
        >
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Acknowledge Job Description
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {acknowledgment.jobTitle} · {versionLabel}
              </p>
            </div>
            <p className="text-sm text-foreground">
              Typing your full name below records that you have read this job description. It does
              not change your pay or employment terms.
            </p>
            <div>
              <label
                htmlFor="jobAckSignedName"
                className="block text-sm font-medium text-foreground"
              >
                Full name
              </label>
              <input
                id="jobAckSignedName"
                ref={nameInputRef}
                type="text"
                value={signedName}
                onChange={(event) => setSignedName(event.target.value)}
                autoComplete="name"
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            {validationError ? (
              <p className="text-xs text-rose-600" role="alert">
                {validationError}
              </p>
            ) : null}
            {acknowledge.isError ? (
              <p className="text-xs text-rose-600" role="alert">
                {acknowledge.error instanceof Error
                  ? acknowledge.error.message
                  : 'Could not record your acknowledgment.'}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={acknowledge.isPending}>
                {acknowledge.isPending ? 'Recording…' : 'Record Acknowledgment'}
              </Button>
            </div>
          </form>
        </MhdModal>
      ) : null}
    </MhdCard>
  );
}
