import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { useMhdGenerateTrainingCertificate } from '../Hook';
import { mhdFormatTrainingCompletionMethod, type MhdTrainingCompletion } from '../Types';

interface Props {
  completions: MhdTrainingCompletion[];
  isLoading?: boolean;
  /** Optional heading override — the panel is reused on My Training and admin views. */
  title?: string;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

/**
 * A person's completion history — the append-only evidence ledger, read.
 *
 * `isExpired` is DERIVED server-side (`expires_at <= now`) and rendered verbatim;
 * this panel never re-derives expiry by comparing `expiresAt` to the clock, so an
 * expired completion always reads as expired and never quietly as "complete". A
 * null `expiresAt` is a one-time course — shown as "no expiry", not as a gap.
 */
export function MhdCompletionHistoryPanel({
  completions,
  isLoading = false,
  title = 'Completion history',
}: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading history…</p>
      ) : completions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No completions on record.</p>
      ) : (
        <ul className="space-y-2">
          {completions.map((completion) => (
            <li
              key={completion.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{completion.courseTitle}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Completed {formatDate(completion.completedAt)} ·{' '}
                  {mhdFormatTrainingCompletionMethod(completion.completionMethod)}
                  {completion.attachmentId ? ' · certificate on file' : ''}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {completion.referenceId}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 text-right">
                {/* Render the server's derived is_expired, never a local recompute. */}
                {completion.expiresAt == null ? (
                  <MhdBadge variant="neutral">No expiry</MhdBadge>
                ) : completion.isExpired ? (
                  <MhdBadge variant="error">Expired {formatDate(completion.expiresAt)}</MhdBadge>
                ) : (
                  <MhdBadge variant="success">Valid to {formatDate(completion.expiresAt)}</MhdBadge>
                )}
                <MhdCompletionCertificateAction completionId={completion.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface CertificateActionProps {
  completionId: string;
}

/**
 * Generates (or re-opens) a completion certificate on demand — the training
 * completion certificate PDF/verification code (mhd_certificate_issue via
 * mhd_training_certificate_generate) is not pre-generated at completion time,
 * so this is the "natural follow-up" Stage 6 deferred: a UI trigger for the
 * data layer that already existed.
 */
function MhdCompletionCertificateAction({ completionId }: CertificateActionProps) {
  const generate = useMhdGenerateTrainingCertificate();
  const [driveFileId, setDriveFileId] = useState<string | null>(null);

  async function handleGenerate() {
    const result = await generate.mutateAsync(completionId);
    setDriveFileId(result.outputDriveFileId);
  }

  if (driveFileId) {
    return (
      <a
        href={`https://drive.google.com/file/d/${encodeURIComponent(driveFileId)}/view`}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-medium text-accent hover:text-accent-hover"
      >
        Download Certificate
      </a>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        onClick={() => void handleGenerate()}
        disabled={generate.isPending}
      >
        {generate.isPending ? 'Generating…' : 'Generate Certificate'}
      </Button>
      {generate.isError ? (
        <p className="text-xs text-rose-600">
          {generate.error instanceof Error ? generate.error.message : 'Could not generate the certificate.'}
        </p>
      ) : null}
    </div>
  );
}
