import { useState } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEntityMessagingPanel } from '@/components/ui/MhdEntityMessagingPanel';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanRevealEncryptedFields } from '@/appshell/mhdRouteAccess';
import type { MhdFormSubmission } from '../Types';
import { mhdIsEncryptedFormValue, mhdIsFormFileValue } from '../Types';
import { mhdFormService } from '../Service';

interface MhdFormSubmissionReviewProps {
  submission: MhdFormSubmission | null;
  companyId: string | null;
  currentUserId: string | null;
}

interface MhdEncryptedValueCellProps {
  submissionId: string;
  fieldId: string;
  canReveal: boolean;
}

/**
 * Masked display for an encrypted submission value. The database never sends
 * the ciphertext (reads return a masked wrapper); "Reveal" calls the audited,
 * role-gated mhd_reveal_submission_field RPC and shows the plaintext
 * transiently in component state only — it is never written back into the
 * submission, cached, or persisted anywhere.
 */
function MhdEncryptedValueCell({ submissionId, fieldId, canReveal }: MhdEncryptedValueCellProps) {
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  const handleReveal = async () => {
    setIsRevealing(true);
    setRevealError(null);
    try {
      const plaintext = await mhdFormService.revealSubmissionField(submissionId, fieldId);
      setRevealedValue(plaintext);
    } catch (error) {
      setRevealError(error instanceof Error ? error.message : 'Unable to reveal encrypted field');
    } finally {
      setIsRevealing(false);
    }
  };

  if (revealedValue !== null) {
    return (
      <span className="inline-flex items-center gap-2">
        <span>{revealedValue}</span>
        <button
          type="button"
          onClick={() => setRevealedValue(null)}
          className="rounded border border-border bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground hover:border-accent"
        >
          Hide
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground">
        &#8226;&#8226;&#8226;&#8226;&#8226;&#8226; (encrypted)
      </span>
      {canReveal ? (
        <button
          type="button"
          onClick={() => void handleReveal()}
          disabled={isRevealing}
          className="rounded border border-accent bg-accent-tint px-2 py-0.5 text-xs font-semibold text-accent-hover hover:border-accent-hover disabled:opacity-50"
        >
          {isRevealing ? 'Revealing...' : 'Reveal'}
        </button>
      ) : null}
      {revealError ? <span className="text-xs text-red-600">{revealError}</span> : null}
    </span>
  );
}

export function MhdFormSubmissionReview({
  submission,
  companyId,
  currentUserId,
}: MhdFormSubmissionReviewProps) {
  const { roles } = useMhdAuth();
  const canReveal = mhdCanRevealEncryptedFields(roles);

  if (!submission) {
    return (
      <MhdCard className="p-6 text-sm text-muted-foreground">
        Select a submission to review its answers.
      </MhdCard>
    );
  }

  const entries = Object.entries(submission.values);

  return (
    <div className="space-y-4">
      <MhdCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {submission.referenceId}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{submission.status}</h3>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Created {new Date(submission.createdAt).toLocaleString()}</p>
            {submission.submittedAt ? (
              <p>Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submission values were recorded.</p>
          ) : (
            <dl className="grid gap-3">
              {entries.map(([fieldId, value]) => (
                <div key={fieldId} className="rounded-md border border-border bg-muted p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {fieldId}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">
                    {mhdIsEncryptedFormValue(value) ? (
                      // Keyed on submission+field so switching submissions remounts the
                      // cell and any transiently revealed plaintext is discarded.
                      <MhdEncryptedValueCell
                        key={`${submission.id}-${fieldId}`}
                        submissionId={submission.id}
                        fieldId={fieldId}
                        canReveal={canReveal}
                      />
                    ) : mhdIsFormFileValue(value) ? (
                      value.driveWebViewLink ? (
                        <a
                          href={value.driveWebViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-accent hover:text-accent-hover"
                        >
                          {value.fileName}
                        </a>
                      ) : (
                        value.fileName
                      )
                    ) : typeof value === 'object' ? (
                      JSON.stringify(value, null, 2)
                    ) : (
                      String(value)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </MhdCard>

      <MhdEntityMessagingPanel
        entityType="FORM_SUBMISSION"
        entityId={submission.id}
        companyId={companyId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
