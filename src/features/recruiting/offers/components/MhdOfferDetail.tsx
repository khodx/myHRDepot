import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  useMhdAcceptOffer,
  useMhdDeclineOffer,
  useMhdExtendOffer,
  useMhdOffer,
  useMhdRescindOffer,
} from '../Hook';
import {
  mhdDeclineOfferSchema,
  type MhdDeclineOfferFormValues,
} from '../Schemas';
import type {
  MhdOfferAcceptResult,
  MhdOfferDetail as MhdOfferDetailModel,
  MhdOfferGenerateDocument,
  MhdOfferRequestSignature,
} from '../Types';
import { MhdOfferStatusBadge } from './MhdOfferStatusBadge';

interface Props {
  offerId: string;
  /**
   * Builds the reviewer-facing link to an e-sign request from its id. Injected by
   * the host route because the app owns its routing / public origin — this
   * component does not hard-code the deploy URL. Defaults to `${origin}/sign/{id}`,
   * matching the e-sign `/sign` model.
   */
  buildSignatureUrl?: (esignatureRequestId: string) => string;
  /**
   * APP-LAYER CEREMONY (the Conduct/Handbook pattern). Injected callbacks that
   * mint the offer letter and the signature request and RETURN their ids; this
   * component invents no Doc-Gen/E-Sign RPC — it forwards whatever id the callback
   * yields into `offer_extend`. `null` means "skip that leg" (the shell path). If
   * neither is wired, extend records no soft link and the accept path has no
   * signature to gate on.
   */
  onGenerateDocument?: MhdOfferGenerateDocument;
  onRequestSignature?: MhdOfferRequestSignature;
  /**
   * Fired after the HANDOFF completes (the offer is ACCEPTED and a `job_assignment`
   * exists). The host wires cross-invalidation of Recruiting package 1's
   * application/requisition queries here — this package does not import package 1's
   * service. Receives `(offerId, jobAssignmentId)`.
   */
  onHired?: (result: MhdOfferAcceptResult) => void;
}

function defaultBuildSignatureUrl(esignatureRequestId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/sign/${encodeURIComponent(esignatureRequestId)}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

/**
 * One offer's terms and its lifecycle actions.
 *
 * Renders the server-synced status (never recomputed) and offers exactly the moves
 * the status allows:
 *   - DRAFT / PENDING_APPROVAL → Extend (runs the app-layer document + signature
 *     ceremony, then EXTENDED), Decline, Rescind.
 *   - EXTENDED → the e-sign link, "Accept & hire" (THE HANDOFF), Decline, Rescind.
 *   - ACCEPTED → the created `job_assignment_id` (proof of hire); no rescind (an
 *     accepted offer's reversal is a termination, handled elsewhere).
 *   - DECLINED / RESCINDED / EXPIRED → terminal, with the recorded reason.
 *
 * Accept surfaces the server's "signature not yet complete" gate rather than
 * pre-empting it: the button stays enabled and the RPC error is shown.
 */
export function MhdOfferDetail({
  offerId,
  buildSignatureUrl = defaultBuildSignatureUrl,
  onGenerateDocument,
  onRequestSignature,
  onHired,
}: Props) {
  const offer = useMhdOffer(offerId);
  const extend = useMhdExtendOffer();
  const accept = useMhdAcceptOffer();
  const decline = useMhdDeclineOffer();
  const rescind = useMhdRescindOffer();

  const [ceremonyStep, setCeremonyStep] = useState<null | 'document' | 'signature'>(null);
  const [dialog, setDialog] = useState<null | 'decline' | 'rescind'>(null);
  // The accept result carries the onboarding ids the handoff seeded; hold them for
  // this session so the confirmation ("onboarding packet started") shows right
  // after acceptance, even before the refetched offer detail lands.
  const [handoff, setHandoff] = useState<MhdOfferAcceptResult | null>(null);

  if (offer.isLoading) {
    return <p className="text-sm text-neutral-500">Loading offer…</p>;
  }
  if (offer.isError) {
    return (
      <p className="text-sm text-rose-600">
        {offer.error instanceof Error ? offer.error.message : 'Could not load the offer.'}
      </p>
    );
  }
  if (!offer.data) {
    return <p className="text-sm text-neutral-500">Offer not found.</p>;
  }

  const o: MhdOfferDetailModel = offer.data;
  const isLive =
    o.status === 'DRAFT' || o.status === 'PENDING_APPROVAL' || o.status === 'EXTENDED';
  const canExtend = o.status === 'DRAFT' || o.status === 'PENDING_APPROVAL';
  const canAccept = o.status === 'EXTENDED';
  // The server refuses declining anything but a live offer and rescinding an
  // ACCEPTED one; mirror those so we only offer the moves that will succeed.
  const canDecline = isLive;
  const canRescind = isLive;

  async function handleExtend() {
    // App-layer extend ceremony: render the offer letter and open a signature
    // request via the injected callbacks (if wired), forwarding their ids as the
    // soft links; otherwise extend with no links (shell path). The callbacks own
    // the Doc-Gen/E-Sign call — this component never touches those RPCs.
    let documentGenerationId: string | null = null;
    let esignatureRequestId: string | null = null;
    try {
      if (onGenerateDocument) {
        setCeremonyStep('document');
        documentGenerationId = await onGenerateDocument(o.id);
      }
      if (onRequestSignature) {
        setCeremonyStep('signature');
        esignatureRequestId = await onRequestSignature(o.id);
      }
    } finally {
      setCeremonyStep(null);
    }
    await extend.mutateAsync({ offerId: o.id, documentGenerationId, esignatureRequestId });
  }

  async function handleAccept() {
    // THE HANDOFF. Do NOT pre-empt the signature gate — call accept and let the
    // server property-gate on the attached signature (and the requisition's job).
    // The RPC error surfaces below on failure.
    const result = await accept.mutateAsync({ offerId: o.id });
    setHandoff(result);
    onHired?.(result);
  }

  const salaryText =
    o.baseSalary == null
      ? '—'
      : o.baseSalary.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  const signatureUrl = o.esignatureRequestId ? buildSignatureUrl(o.esignatureRequestId) : '';
  const isExtending = extend.isPending || ceremonyStep !== null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">{o.jobTitle}</h2>
          <p className="font-mono text-xs text-neutral-400">{o.referenceId}</p>
        </div>
        <MhdOfferStatusBadge status={o.status} />
      </header>

      <dl className="divide-y divide-neutral-100 rounded-md border border-neutral-200 px-4 py-2">
        <DetailRow label="Start date" value={o.startDate ?? '—'} />
        <DetailRow label="Base salary" value={salaryText} />
        <DetailRow label="Pay frequency" value={o.payFrequency ?? '—'} />
        <DetailRow label="Employment type" value={o.employmentType ?? '—'} />
        <DetailRow label="Offer expires" value={o.offerExpirationDate ?? '—'} />
        {o.requiresApproval ? <DetailRow label="Approval" value="Required" /> : null}
      </dl>

      {/* EXTENDED: the e-sign link (soft-linked signature request, created app-layer). */}
      {o.status === 'EXTENDED' && o.esignatureRequestId ? (
        <div className="space-y-1 rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-800">Signature request</p>
          <p className="text-xs text-blue-700">
            The offer is out for signature. Acceptance is gated on this completing.
          </p>
          <a
            href={signatureUrl}
            className="break-all font-mono text-xs text-blue-700 underline"
            target="_blank"
            rel="noreferrer"
          >
            {signatureUrl}
          </a>
        </div>
      ) : null}

      {/* ACCEPTED: the created employment record — proof the applicant is now an
          employee — plus the onboarding packet the handoff seeded. The onboarding
          ids come back on the accept result (offer_get does not carry them), so
          the "packet started" confirmation shows when this session did the accept
          and both onboarding ids are present. */}
      {o.status === 'ACCEPTED' && o.jobAssignmentId ? (
        <div className="space-y-1 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">
            {handoff &&
            handoff.onboardingOfferLetterId &&
            handoff.onboardingCandidateEvaluationId
              ? 'Hired — onboarding packet started'
              : 'Hired'}
          </p>
          <p className="text-xs text-emerald-700">
            Accepting created the employment record. The applicant is now an employee and
            onboarding begins downstream.
          </p>
          <p className="font-mono text-xs text-emerald-700">
            Job assignment: {o.jobAssignmentId}
          </p>
          {handoff?.onboardingOfferLetterId ? (
            <p className="font-mono text-xs text-emerald-700">
              Onboarding offer letter: {handoff.onboardingOfferLetterId}
            </p>
          ) : null}
          {handoff?.onboardingCandidateEvaluationId ? (
            <p className="font-mono text-xs text-emerald-700">
              Onboarding candidate evaluation: {handoff.onboardingCandidateEvaluationId}
            </p>
          ) : null}
          {o.acceptedAt ? (
            <p className="text-xs text-emerald-700">
              Accepted {new Date(o.acceptedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Terminal decline / rescind — show the recorded reason. */}
      {(o.status === 'DECLINED' || o.status === 'RESCINDED') && o.declineReason ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-sm font-medium text-neutral-700">
            {o.status === 'DECLINED' ? 'Declined' : 'Rescinded'}
          </p>
          <p className="mt-0.5 text-sm text-neutral-600">{o.declineReason}</p>
        </div>
      ) : null}

      {/* Actions. */}
      <div className="flex flex-wrap gap-2">
        {canExtend ? (
          <button
            type="button"
            onClick={() => void handleExtend()}
            disabled={isExtending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {ceremonyStep === 'document'
              ? 'Preparing document…'
              : ceremonyStep === 'signature'
                ? 'Requesting signature…'
                : extend.isPending
                  ? 'Extending…'
                  : 'Extend offer'}
          </button>
        ) : null}

        {canAccept ? (
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={accept.isPending}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {accept.isPending ? 'Hiring…' : 'Accept & hire'}
          </button>
        ) : null}

        {canDecline ? (
          <button
            type="button"
            onClick={() => setDialog('decline')}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            Decline
          </button>
        ) : null}

        {canRescind ? (
          <button
            type="button"
            onClick={() => setDialog('rescind')}
            className="rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700"
          >
            Rescind
          </button>
        ) : null}
      </div>

      {/* Surface the server's guards verbatim — notably the accept "signature not
          yet complete" / "requisition has no job" gate. Never pre-empted. */}
      {extend.isError ? (
        <p className="text-xs text-rose-600">
          {extend.error instanceof Error ? extend.error.message : 'Could not extend the offer.'}
        </p>
      ) : null}
      {accept.isError ? (
        <p className="text-xs text-rose-600">
          {accept.error instanceof Error ? accept.error.message : 'Could not accept the offer.'}
        </p>
      ) : null}

      {dialog === 'decline' ? (
        <OfferReasonDialog
          title="Decline offer"
          subtitle={`${o.jobTitle} · ${o.referenceId}`}
          confirmLabel="Decline offer"
          pendingLabel="Declining…"
          isSubmitting={decline.isPending}
          error={decline.isError ? decline.error : null}
          onCancel={() => setDialog(null)}
          onSubmit={async (values) => {
            await decline.mutateAsync({ offerId: o.id, reason: values.reason || null });
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === 'rescind' ? (
        <OfferReasonDialog
          title="Rescind offer"
          subtitle={`${o.jobTitle} · ${o.referenceId}`}
          confirmLabel="Rescind offer"
          pendingLabel="Rescinding…"
          isSubmitting={rescind.isPending}
          error={rescind.isError ? rescind.error : null}
          onCancel={() => setDialog(null)}
          onSubmit={async (values) => {
            await rescind.mutateAsync({ offerId: o.id, reason: values.reason || null });
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline reason dialog (decline / rescind) — a reason field, never window.prompt.
// Both reasons share the same shape; the schema differs only by name so this
// dialog validates against the decline schema (identical to rescind's).
// ---------------------------------------------------------------------------

interface OfferReasonDialogProps {
  title: string;
  subtitle: string;
  confirmLabel: string;
  pendingLabel: string;
  isSubmitting: boolean;
  error: unknown;
  onCancel: () => void;
  onSubmit: (values: MhdDeclineOfferFormValues) => Promise<void>;
}

function OfferReasonDialog({
  title,
  subtitle,
  confirmLabel,
  pendingLabel,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: OfferReasonDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdDeclineOfferFormValues>({
    resolver: zodResolver(mhdDeclineOfferSchema),
    // The offerId is carried by the caller's mutate call; the dialog only collects
    // the reason. A placeholder id satisfies the schema's non-empty guard.
    defaultValues: { offerId: 'dialog', reason: '' },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <input type="hidden" {...register('offerId')} readOnly />

          <div>
            <label htmlFor="offerReason" className="block text-sm font-medium text-neutral-700">
              Reason <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <textarea
              id="offerReason"
              rows={3}
              {...register('reason')}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {errors.reason ? (
              <p className="mt-1 text-xs text-rose-600">{errors.reason.message}</p>
            ) : null}
          </div>

          {error ? (
            <p className="text-xs text-rose-600">
              {error instanceof Error ? error.message : 'The action could not be completed.'}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? pendingLabel : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
