import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BellRing, Clock3, FileClock, ShieldCheck } from 'lucide-react';
import { mhdCanMutateEsignature } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdEsignatureActions, useMhdEsignatureEvents, useMhdEsignatureRequest } from '../Hook';
import { mhdBuildGoogleDriveViewUrl } from '../Types';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-sky-100 text-sky-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  DECLINED: 'bg-rose-100 text-rose-800',
  VOIDED: 'bg-slate-200 text-slate-700',
  EXPIRED: 'bg-orange-100 text-orange-800',
  VIEWED: 'bg-blue-100 text-blue-800',
  SIGNED: 'bg-emerald-100 text-emerald-800',
};

export function MhdEsignatureDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { roles } = useMhdAuth();
  const canMutate = mhdCanMutateEsignature(roles);
  const requestQuery = useMhdEsignatureRequest(requestId ?? null);
  const eventsQuery = useMhdEsignatureEvents(requestId ?? null);
  const actions = useMhdEsignatureActions();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const request = requestQuery.data ?? null;
  const events = eventsQuery.data ?? [];
  const driveUrl = mhdBuildGoogleDriveViewUrl(request?.signedDriveFileId ?? request?.documentDriveFileId);

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
    return <div className="p-6 text-sm text-slate-500">Loading signature request...</div>;
  }

  if (requestQuery.error || !request) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-rose-700">
          {requestQuery.error instanceof Error ? requestQuery.error.message : 'Signature request not found.'}
        </p>
        <button type="button" onClick={() => navigate('/esignature')} className="text-sm font-semibold text-sky-700">
          Back to E-Signature Center
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/esignature" className="font-semibold text-sky-700 hover:underline">E-Signature</Link>
              <span>/</span>
              <span>{request.referenceId}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{request.documentName}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[request.status] ?? 'bg-slate-100 text-slate-700'}`}>
                {request.status}
              </span>
              <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-slate-600">
                {request.signingOrder}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {driveUrl ? (
              <a
                href={driveUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-300 bg-card px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Open Document
              </a>
            ) : null}
            {canMutate && ['PENDING', 'IN_PROGRESS'].includes(request.status) ? (
              <button
                type="button"
                onClick={() => void handleVoidRequest()}
                disabled={actions.voidRequest.isPending}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-neutral-50 disabled:bg-slate-400"
              >
                {actions.voidRequest.isPending ? 'Voiding...' : 'Void Request'}
              </button>
            ) : null}
          </div>
        </div>

        {actionMessage ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{actionMessage}</div> : null}
        {actionError ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{actionError}</div> : null}

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-card p-5 shadow-sm lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Request ID</p>
            <p className="mt-2 text-sm text-slate-900">{request.referenceId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Created</p>
            <p className="mt-2 text-sm text-slate-900">{new Date(request.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Document Hash</p>
            <p className="mt-2 break-all font-mono text-xs text-slate-700">{request.documentHash ?? 'Missing'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Signed Hash</p>
            <p className="mt-2 break-all font-mono text-xs text-slate-700">{request.signedDocumentHash ?? 'Pending completion'}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sky-700" />
                <h2 className="text-lg font-semibold text-slate-900">Signer Chain</h2>
              </div>
              <div className="mt-4 space-y-3">
                {request.signers.map((signer) => (
                  <div key={signer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{signer.externalName || signer.externalEmail || signer.userId || signer.id}</p>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[signer.status] ?? 'bg-slate-100 text-slate-700'}`}>
                            {signer.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Order position {signer.signerOrder}</p>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p>Consent: {signer.consentedAt ? new Date(signer.consentedAt).toLocaleString() : 'Not yet recorded'}</p>
                          <p>Signed: {signer.signedAt ? new Date(signer.signedAt).toLocaleString() : 'Pending'}</p>
                          <p>Typed name: {signer.signatureName ?? 'Pending'}</p>
                          <p>Decline reason: {signer.declinedReason ?? '—'}</p>
                        </div>
                      </div>

                      {canMutate && ['PENDING', 'VIEWED'].includes(signer.status) ? (
                        <button
                          type="button"
                          onClick={() => void handleReminder(signer.id)}
                          disabled={actions.sendReminder.isPending}
                          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-card px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <BellRing className="h-4 w-4" />
                          Send reminder
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FileClock className="h-5 w-5 text-sky-700" />
                <h2 className="text-lg font-semibold text-slate-900">Disclosure Snapshot</h2>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">Version {request.disclosureVersion}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.disclosureText}</p>
            </article>
          </div>

          <article className="rounded-2xl border border-slate-200 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-semibold text-slate-900">Event Timeline</h2>
            </div>
            {eventsQuery.error ? (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {eventsQuery.error instanceof Error ? eventsQuery.error.message : 'Unable to load events.'}
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[event.eventType] ?? 'bg-slate-100 text-slate-700'}`}>
                          {event.eventType}
                        </span>
                        <span className="text-xs text-slate-500">{new Date(event.eventAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-slate-600">
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
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No event rows have been recorded for this request yet.
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
