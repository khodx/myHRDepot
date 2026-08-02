import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BellRing, Clock3, FileClock, ShieldCheck } from 'lucide-react';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdEsignatureRecordTabs } from '@/appshell/components/MhdEsignatureRecordTabs';
import { mhdCanMutateEsignature } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdEsignatureActions,
  useMhdEsignatureAuditCertificates,
  useMhdEsignatureEvents,
  useMhdEsignatureRequest,
} from '../Hook';
import { mhdBuildGoogleDriveViewUrl } from '../Types';

const STATUS_VARIANTS: Record<string, MhdBadgeVariant> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  DECLINED: 'error',
  VOIDED: 'neutral',
  EXPIRED: 'error',
  VIEWED: 'info',
  SIGNED: 'success',
};

export function MhdEsignatureDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { roles } = useMhdAuth();
  const canMutate = mhdCanMutateEsignature(roles);
  const requestQuery = useMhdEsignatureRequest(requestId ?? null);
  const eventsQuery = useMhdEsignatureEvents(requestId ?? null);
  const certificatesQuery = useMhdEsignatureAuditCertificates(requestId ?? null);
  const actions = useMhdEsignatureActions();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const request = requestQuery.data ?? null;
  const events = eventsQuery.data ?? [];
  const certificates = certificatesQuery.data ?? [];
  const driveUrl = mhdBuildGoogleDriveViewUrl(
    request?.signedDriveFileId ?? request?.documentDriveFileId,
  );

  async function handleReminder(signerId: string) {
    setActionError(null);
    setActionMessage(null);

    try {
      await actions.sendReminder.mutateAsync(signerId);
      setActionMessage('Reminder queued and email dispatch invoked.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to send reminder.');
    }
  }

  async function handleVoidRequest() {
    if (!requestId) return;

    setActionError(null);
    setActionMessage(null);

    try {
      await actions.voidRequest.mutateAsync(requestId);
      setActionMessage('The signature request was voided.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to void this request.');
    }
  }

  if (requestQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading signature request...</div>;
  }

  if (requestQuery.error || !request) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-rose-700">
          {requestQuery.error instanceof Error
            ? requestQuery.error.message
            : 'Signature request not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/esignature')}
          className="text-sm font-semibold text-accent hover:text-accent-hover"
        >
          Back to E-Signature Center
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/esignature"
        backLabel="E-Signature"
        title={request.documentName}
        description={request.referenceId}
        chips={
          <>
            <MhdBadge variant={STATUS_VARIANTS[request.status] ?? 'neutral'}>
              {request.status}
            </MhdBadge>
            <MhdBadge variant="accent">{request.signingOrder}</MhdBadge>
          </>
        }
        actions={
          driveUrl ? (
            <a
              href={driveUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
            >
              Open Document
            </a>
          ) : undefined
        }
      />
      <MhdEsignatureRecordTabs
        requestId={request.id}
        active="detail"
        onVoid={
          canMutate && ['PENDING', 'IN_PROGRESS'].includes(request.status)
            ? handleVoidRequest
            : undefined
        }
        voidConfirmMessage={`Void the signature request for "${request.documentName}"? This cannot be undone.`}
      />
      <div className="space-y-6">
        {actionMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        ) : null}
        {actionError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <MhdCard className="grid gap-4 rounded-2xl p-5 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Request ID
            </p>
            <p className="mt-2 text-sm text-foreground">{request.referenceId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Created
            </p>
            <p className="mt-2 text-sm text-foreground">
              {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Document Hash
            </p>
            <p className="mt-2 break-all font-mono text-xs text-foreground">
              {request.documentHash ?? 'Missing'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Signed Hash
            </p>
            <p className="mt-2 break-all font-mono text-xs text-foreground">
              {request.signedDocumentHash ?? 'Pending completion'}
            </p>
          </div>
        </MhdCard>

        <MhdCard className="rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Audit Certificate</h2>
          </div>
          {certificatesQuery.error ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {certificatesQuery.error instanceof Error
                ? certificatesQuery.error.message
                : 'Unable to load audit certificates.'}
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            {certificates.map((certificate) => {
              const certificateUrl = mhdBuildGoogleDriveViewUrl(certificate.certificateDriveFileId);

              return (
                <div
                  key={certificate.id}
                  className="rounded-xl border border-border bg-muted p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {certificate.referenceId}
                        </p>
                        <MhdBadge variant={STATUS_VARIANTS[certificate.status] ?? 'neutral'}>
                          {certificate.status}
                        </MhdBadge>
                        <MhdBadge variant={certificate.digitallySigned ? 'success' : 'warning'}>
                          {certificate.digitallySigned
                            ? 'Digitally signed'
                            : 'Hash-verified only'}
                        </MhdBadge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>
                          Generated:{' '}
                          {certificate.generatedAt
                            ? new Date(certificate.generatedAt).toLocaleString()
                            : 'Pending'}
                        </p>
                        <p className="break-all">Verification: {certificate.verificationCode}</p>
                      </div>
                    </div>
                    {certificateUrl ? (
                      <a
                        href={certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
                      >
                        Open Certificate
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {certificatesQuery.isLoading ? (
              <div className="rounded-xl border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
                Loading audit certificate status...
              </div>
            ) : null}
            {!certificatesQuery.isLoading && certificates.length === 0 && !certificatesQuery.error ? (
              <div className="rounded-xl border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
                No audit certificate has been generated for this request yet.
              </div>
            ) : null}
          </div>
        </MhdCard>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-6">
            <MhdCard className="rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">Signer Chain</h2>
              </div>
              <div className="mt-4 space-y-3">
                {request.signers.map((signer) => (
                  <div key={signer.id} className="rounded-xl border border-border bg-muted p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {signer.externalName ||
                              signer.externalEmail ||
                              signer.userId ||
                              signer.id}
                          </p>
                          <MhdBadge variant={STATUS_VARIANTS[signer.status] ?? 'neutral'}>
                            {signer.status}
                          </MhdBadge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Order position {signer.signerOrder}
                        </p>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          <p>
                            Consent:{' '}
                            {signer.consentedAt
                              ? new Date(signer.consentedAt).toLocaleString()
                              : 'Not yet recorded'}
                          </p>
                          <p>
                            Signed:{' '}
                            {signer.signedAt
                              ? new Date(signer.signedAt).toLocaleString()
                              : 'Pending'}
                          </p>
                          <p>Typed name: {signer.signatureName ?? 'Pending'}</p>
                          <p>Decline reason: {signer.declinedReason ?? '—'}</p>
                        </div>
                      </div>

                      {canMutate && ['PENDING', 'VIEWED'].includes(signer.status) ? (
                        <button
                          type="button"
                          onClick={() => void handleReminder(signer.id)}
                          disabled={actions.sendReminder.isPending}
                          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
                        >
                          <BellRing className="h-4 w-4" />
                          Send reminder
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </MhdCard>

            <MhdCard className="rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <FileClock className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">Disclosure Snapshot</h2>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Version {request.disclosureVersion}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {request.disclosureText}
              </p>
            </MhdCard>
          </div>

          <MhdCard className="rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Event Timeline</h2>
            </div>
            {eventsQuery.error ? (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {eventsQuery.error instanceof Error
                  ? eventsQuery.error.message
                  : 'Unable to load events.'}
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-xl border border-border bg-muted p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <MhdBadge variant={STATUS_VARIANTS[event.eventType] ?? 'neutral'}>
                          {event.eventType}
                        </MhdBadge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.eventAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                        <p>Signer: {event.signerId ?? 'System'}</p>
                        <p>IP: {event.ipAddress ?? '—'}</p>
                        <p>User agent: {event.userAgent ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                  {Object.keys(event.metadata).length > 0 ? (
                    <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
              {!eventsQuery.isLoading && events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
                  No event rows have been recorded for this request yet.
                </div>
              ) : null}
            </div>
          </MhdCard>
        </section>
      </div>
    </div>
  );
}
