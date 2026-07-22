import { useState } from 'react';
import { useMhdCreateOffer, useMhdOffers } from '../Hook';
import type { MhdOfferFormValues } from '../Schemas';
import type {
  MhdOfferAcceptResult,
  MhdOfferGenerateDocument,
  MhdOfferRequestSignature,
  MhdOfferSummary,
} from '../Types';
import { MhdOfferForm } from './MhdOfferForm';
import { MhdOfferDetail } from './MhdOfferDetail';
import { MhdOfferStatusBadge } from './MhdOfferStatusBadge';
import { MhdHirePreviewPanel } from './MhdHirePreviewPanel';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  applicationId: string;
  /**
   * People eligible to be the new hire's reporting manager. Passed in by the host
   * (the application detail page owns the People query); the panel does not fetch.
   */
  reportingManagers: PersonOption[];
  /** Optional default job title — the host may seed it from the requisition. */
  defaultJobTitle?: string;
  /**
   * The APP-LAYER ceremony callbacks and signature-link builder, threaded straight
   * through to `MhdOfferDetail`. This panel does not run the ceremony itself; it
   * only wires the injected callbacks down. See `MhdOfferDetail` for the contract.
   */
  onGenerateDocument?: MhdOfferGenerateDocument;
  onRequestSignature?: MhdOfferRequestSignature;
  buildSignatureUrl?: (esignatureRequestId: string) => string;
  /**
   * Fired after the HANDOFF (offer ACCEPTED, `job_assignment` created). The host
   * wires cross-invalidation of its application/requisition queries here — this
   * package does not import Recruiting package 1's service.
   */
  onHired?: (result: MhdOfferAcceptResult) => void;
}

/**
 * An application's offers panel — lives on the application detail page under
 * Recruiting.
 *
 * Lists the application's offers (`offer_list`), lets a recruiter open one into the
 * full `MhdOfferDetail` (terms + lifecycle actions), and offers a create-offer
 * form. The "at most one live offer" rule is a server invariant (partial unique
 * index); a second live offer raises and the error surfaces on the form.
 */
export function MhdOfferPanel({
  applicationId,
  reportingManagers,
  defaultJobTitle,
  onGenerateDocument,
  onRequestSignature,
  buildSignatureUrl,
  onHired,
}: Props) {
  const offers = useMhdOffers(applicationId);
  const create = useMhdCreateOffer();

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showHirePreview, setShowHirePreview] = useState(false);

  async function handleCreate(values: MhdOfferFormValues) {
    const result = await create.mutateAsync({
      applicationId,
      jobTitle: values.jobTitle,
      startDate: values.startDate || null,
      baseSalary: values.baseSalary ?? null,
      payFrequency: values.payFrequency || null,
      employmentType: values.employmentType || null,
      reportingManagerPersonId: values.reportingManagerPersonId || null,
      offerExpirationDate: values.offerExpirationDate || null,
      requiresApproval: values.requiresApproval,
    });
    setIsCreating(false);
    setSelectedOfferId(result.id);
  }

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Offers</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Accepting an offer hires the applicant — it creates the employment record and marks the
            application hired.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowHirePreview((prev) => !prev)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            {showHirePreview ? 'Hide handoff preview' : 'Preview handoff'}
          </button>
          {!isCreating ? (
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setSelectedOfferId(null);
              }}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              New offer
            </button>
          ) : null}
        </div>
      </div>

      {/* The read-only "what onboarding will receive" bridge — previewable before
          acceptance and confirmable after. Its own RPC (`hire_payload`); no ceremony. */}
      {showHirePreview ? <MhdHirePreviewPanel applicationId={applicationId} /> : null}

      {isCreating ? (
        <div className="rounded-md border border-neutral-200 p-4">
          <MhdOfferForm
            applicationId={applicationId}
            reportingManagers={reportingManagers}
            defaultJobTitle={defaultJobTitle}
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isSubmitting={create.isPending}
          />
          {create.isError ? (
            <p className="mt-2 text-xs text-rose-600">
              {create.error instanceof Error ? create.error.message : 'Could not create the offer.'}
            </p>
          ) : null}
        </div>
      ) : null}

      {offers.isLoading ? (
        <p className="text-sm text-neutral-500">Loading offers…</p>
      ) : offers.isError ? (
        <p className="text-sm text-rose-600">
          {offers.error instanceof Error ? offers.error.message : 'Could not load offers.'}
        </p>
      ) : (offers.data ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">No offers yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-md border border-neutral-200">
          {(offers.data ?? []).map((offer: MhdOfferSummary) => {
            const isSelected = offer.id === selectedOfferId;
            return (
              <li key={offer.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOfferId(isSelected ? null : offer.id);
                    setIsCreating(false);
                  }}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left ${
                    isSelected ? 'bg-neutral-50' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{offer.jobTitle}</p>
                    <p className="font-mono text-xs text-neutral-400">{offer.referenceId}</p>
                  </div>
                  <MhdOfferStatusBadge status={offer.status} />
                </button>

                {isSelected ? (
                  <div className="border-t border-neutral-100 bg-neutral-50 p-4">
                    <MhdOfferDetail
                      offerId={offer.id}
                      buildSignatureUrl={buildSignatureUrl}
                      onGenerateDocument={onGenerateDocument}
                      onRequestSignature={onRequestSignature}
                      onHired={onHired}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
