import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert, FileSignature, ShieldCheck } from 'lucide-react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { mhdEsignatureService } from '../Service';
import {
  mhdBuildGoogleDrivePreviewUrl,
  mhdBuildGoogleDriveViewUrl,
  type MhdSignatureRequestByToken,
} from '../Types';

interface ConsentState {
  consentedToElectronicRecords: boolean;
  acknowledgedHardwareRequirements: boolean;
  acknowledgedPaperCopyRight: boolean;
  acknowledgedWithdrawalRight: boolean;
  agreedToUseElectronicSignature: boolean;
}

const INITIAL_CONSENT_STATE: ConsentState = {
  consentedToElectronicRecords: false,
  acknowledgedHardwareRequirements: false,
  acknowledgedPaperCopyRight: false,
  acknowledgedWithdrawalRight: false,
  agreedToUseElectronicSignature: false,
};

function isConsentComplete(consent: ConsentState): boolean {
  return Object.values(consent).every(Boolean);
}

function isTerminalState(request: MhdSignatureRequestByToken | null): boolean {
  if (!request) return false;
  return (
    request.requestStatus === 'COMPLETED' ||
    request.requestStatus === 'DECLINED' ||
    request.requestStatus === 'VOIDED' ||
    request.requestStatus === 'EXPIRED' ||
    request.signerStatus === 'SIGNED' ||
    request.signerStatus === 'DECLINED'
  );
}

export function MhdPublicSigningPage() {
  const { token } = useParams<{ token: string }>();
  const [request, setRequest] = useState<MhdSignatureRequestByToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT_STATE);
  const [typedSignatureName, setTypedSignatureName] = useState('');
  const [intentToSign, setIntentToSign] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

  const previewUrl = useMemo(
    () => mhdBuildGoogleDrivePreviewUrl(request?.signedDriveFileId ?? request?.documentDriveFileId),
    [request],
  );
  const completedCopyUrl = useMemo(
    () => mhdBuildGoogleDriveViewUrl(request?.signedDriveFileId ?? request?.documentDriveFileId),
    [request],
  );

  const consentRecorded = !!request?.consentedAt;
  const terminal = isTerminalState(request);

  const loadRequest = useCallback(async () => {
    if (!token) return;

    try {
      const nextRequest = await mhdEsignatureService.getRequestByToken(token);
      setRequest(nextRequest);
      setLoadError(null);
      setTypedSignatureName((current) => current || nextRequest.signerName || '');
    } catch (error) {
      setRequest(null);
      setLoadError(error instanceof Error ? error.message : 'Unable to load the signing link.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: fetch-on-mount with loading state
    void loadRequest();
  }, [loadRequest]);

  async function handleCaptureConsent() {
    if (!token) return;

    setActionError(null);
    setActionMessage(null);
    setIsSubmittingConsent(true);

    try {
      await mhdEsignatureService.recordConsentViaToken({
        signingToken: token,
        ...consent,
        userAgent: navigator.userAgent,
      });
      setActionMessage('Electronic-record consent captured. You may now sign.');
      await loadRequest();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to capture consent.');
    } finally {
      setIsSubmittingConsent(false);
    }
  }

  async function handleSign() {
    if (!token || !request) return;

    setActionError(null);
    setActionMessage(null);
    setIsSubmittingSignature(true);

    try {
      await mhdEsignatureService.signViaToken({
        signingToken: token,
        typedSignatureName,
        intentToSign,
        presentedDocumentHash: request.documentHash ?? '',
        userAgent: navigator.userAgent,
      });
      setActionMessage('Signature recorded successfully.');
      await loadRequest();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to record the signature.');
    } finally {
      setIsSubmittingSignature(false);
    }
  }

  async function handleDecline() {
    if (!token) return;

    setActionError(null);
    setActionMessage(null);
    setIsSubmittingDecline(true);

    try {
      await mhdEsignatureService.declineViaToken({
        signingToken: token,
        reason: declineReason,
        userAgent: navigator.userAgent,
      });
      setActionMessage('This request has been declined.');
      await loadRequest();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to decline this request.');
    } finally {
      setIsSubmittingDecline(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-muted px-6 py-10">
        <MhdCard className="mx-auto max-w-3xl rounded-3xl border-rose-200 p-8">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-1 h-6 w-6 text-rose-600" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">
                Signing Link Unavailable
              </p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                This signing link cannot be used
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                No signing token was provided.
              </p>
            </div>
          </div>
        </MhdCard>
      </main>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading signing ceremony...
      </div>
    );
  }

  if (loadError || !request) {
    return (
      <main className="min-h-screen bg-muted px-6 py-10">
        <MhdCard className="mx-auto max-w-3xl rounded-3xl border-rose-200 p-8">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-1 h-6 w-6 text-rose-600" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">
                Signing Link Unavailable
              </p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                This signing link cannot be used
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {loadError ?? 'The signing request could not be loaded.'}
              </p>
            </div>
          </div>
        </MhdCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <MhdCard className="rounded-3xl p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              My HR Depot Signature Request
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{request.documentName}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <MhdBadge variant="accent">{request.referenceId}</MhdBadge>
              <MhdBadge variant="neutral">{request.requestStatus}</MhdBadge>
              <MhdBadge variant="neutral">Signer {request.signerOrderPosition}</MhdBadge>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-muted p-4 text-sm text-foreground">
              <p>
                <span className="font-semibold">Signer:</span> {request.signerName}
              </p>
              <p>
                <span className="font-semibold">Disclosure version:</span>{' '}
                {request.disclosureVersion}
              </p>
              <p className="break-all font-mono text-xs">
                <span className="font-semibold text-sm font-sans">Document fingerprint:</span>{' '}
                {request.documentHash ?? 'Missing from request'}
              </p>
            </div>

            {previewUrl ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                <iframe
                  title="Document preview"
                  src={previewUrl}
                  className="h-[38rem] w-full bg-card"
                />
              </div>
            ) : null}

            {completedCopyUrl ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={completedCopyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
                >
                  Open Document in Google Drive
                </a>
              </div>
            ) : null}
          </MhdCard>

          <section className="space-y-6">
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

            {terminal ? (
              <MhdCard className="rounded-3xl p-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Signing Ceremony Complete
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-foreground">
                      {request.requestStatus === 'DECLINED' || request.signerStatus === 'DECLINED'
                        ? 'This request was declined'
                        : request.requestStatus === 'COMPLETED'
                          ? 'The signed record is complete'
                          : 'Your signing action has been recorded'}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {request.requestStatus === 'COMPLETED'
                        ? 'A completed copy is available below.'
                        : 'No further action is required on this token.'}
                    </p>
                    {completedCopyUrl ? (
                      <a
                        href={completedCopyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover"
                      >
                        Open Completed Copy
                      </a>
                    ) : null}
                  </div>
                </div>
              </MhdCard>
            ) : !consentRecorded ? (
              <MhdCard className="rounded-3xl p-8">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-6 w-6 text-accent" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
                      Step 1 of 2
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-foreground">
                      Consent to electronic records
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Review the disclosure below and confirm each acknowledgement before the
                      signing controls are shown.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Disclosure text
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {request.disclosureText}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={consent.consentedToElectronicRecords}
                      onChange={(event) =>
                        setConsent((current) => ({
                          ...current,
                          consentedToElectronicRecords: event.target.checked,
                        }))
                      }
                    />
                    <span>I consent to receive and keep this record electronically.</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={consent.acknowledgedHardwareRequirements}
                      onChange={(event) =>
                        setConsent((current) => ({
                          ...current,
                          acknowledgedHardwareRequirements: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      I can access the required hardware, software, and internet connection to
                      review and retain this record.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={consent.acknowledgedPaperCopyRight}
                      onChange={(event) =>
                        setConsent((current) => ({
                          ...current,
                          acknowledgedPaperCopyRight: event.target.checked,
                        }))
                      }
                    />
                    <span>I understand that I may request a paper copy from the sender.</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={consent.acknowledgedWithdrawalRight}
                      onChange={(event) =>
                        setConsent((current) => ({
                          ...current,
                          acknowledgedWithdrawalRight: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      I understand that I may withdraw consent before signing and decline this
                      electronic transaction.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={consent.agreedToUseElectronicSignature}
                      onChange={(event) =>
                        setConsent((current) => ({
                          ...current,
                          agreedToUseElectronicSignature: event.target.checked,
                        }))
                      }
                    />
                    <span>I agree to use an electronic signature for this document.</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCaptureConsent()}
                  disabled={!isConsentComplete(consent) || isSubmittingConsent}
                  className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingConsent ? 'Recording consent...' : 'Continue to Signing'}
                </button>
              </MhdCard>
            ) : (
              <div className="space-y-6">
                <MhdCard className="rounded-3xl p-8">
                  <div className="flex items-start gap-3">
                    <FileSignature className="mt-1 h-6 w-6 text-accent" />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
                        Step 2 of 2
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-foreground">
                        Type your signature and confirm intent
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        The signing action will verify the locked document fingerprint and record
                        your typed signature name together with the required intent affirmation.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <label className="block text-sm font-medium text-foreground">
                      Typed signature name
                      <input
                        value={typedSignatureName}
                        onChange={(event) => setTypedSignatureName(event.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      />
                    </label>

                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-4 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={intentToSign}
                        onChange={(event) => setIntentToSign(event.target.checked)}
                      />
                      <span>
                        I intend to sign this document electronically and adopt the typed name above
                        as my electronic signature.
                      </span>
                    </label>

                    {!request.documentHash ? (
                      <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        This request is missing the required document fingerprint, so signing is
                        disabled until the sender repairs the request.
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleSign()}
                      disabled={
                        !typedSignatureName.trim() ||
                        !intentToSign ||
                        !request.documentHash ||
                        isSubmittingSignature
                      }
                      className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmittingSignature ? 'Recording signature...' : 'Sign Document'}
                    </button>
                  </div>
                </MhdCard>

                <MhdCard className="rounded-3xl p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">
                    Decline Instead
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-foreground">Decline this request</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Declining is a terminal action for the request. Provide a reason so the sender
                    has an auditable explanation.
                  </p>

                  <label className="mt-5 block text-sm font-medium text-foreground">
                    Decline reason
                    <textarea
                      value={declineReason}
                      onChange={(event) => setDeclineReason(event.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleDecline()}
                    disabled={!declineReason.trim() || isSubmittingDecline}
                    className="mt-4 inline-flex rounded-md border border-rose-300 bg-card px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmittingDecline ? 'Recording decline...' : 'Decline Request'}
                  </button>
                </MhdCard>
              </div>
            )}
          </section>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Powered by My HR Depot&apos;s ESIGN/UETA technical workflow. Attorney review remains the
          legal compliance step.
          <div className="mt-2">
            <Link to="/login" className="font-semibold text-accent hover:text-accent-hover">
              Platform sign-in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
