import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdToNumber } from './Types';
import type {
  MhdAcceptOfferInput,
  MhdCreateOfferInput,
  MhdDeclineOfferInput,
  MhdExtendOfferInput,
  MhdHirePayload,
  MhdHirePayloadRpcRow,
  MhdOfferAcceptResult,
  MhdOfferAcceptRpcRow,
  MhdOfferDetail,
  MhdOfferDetailRpcRow,
  MhdOfferMutationResult,
  MhdOfferMutationRpcRow,
  MhdOfferRpcRow,
  MhdOfferSummary,
  MhdOnboardingRecommendation,
  MhdRescindOfferInput,
} from './Types';

// Contract-only access. Every method below calls `.rpc()` and nothing else —
// there is not a single `supabaseClient.from('recruiting_offers')` select in this
// service. The whole surface is the seven security-definer `mhd_recruiting_offer_*`
// functions; RLS carries a `using(false) with check(false)` no-direct-write
// policy on `recruiting_offers`, so a direct insert/update is refused regardless
// of role, and reads go through the RPCs so their access checks and column
// projection are the single authority.
const offerRpc = supabaseClient.rpc.bind(supabaseClient);

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapOfferSummary(row: MhdOfferRpcRow): MhdOfferSummary {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdOfferSummary['referenceId'],
    jobTitle: row.job_title,
    startDate: row.start_date,
    // PostgREST may serialise the numeric as a string; normalise, but preserve
    // the semantic null (no salary set) rather than collapsing to 0.
    baseSalary: row.base_salary == null ? null : mhdToNumber(row.base_salary),
    payFrequency: row.pay_frequency,
    employmentType: row.employment_type,
    status: row.status as MhdOfferSummary['status'],
    offerExpirationDate: row.offer_expiration_date,
    esignatureRequestId: row.esignature_request_id,
    acceptedAt: row.accepted_at,
    declinedAt: row.declined_at,
    createdAt: row.created_at,
  };
}

function mapOfferDetail(row: MhdOfferDetailRpcRow): MhdOfferDetail {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdOfferDetail['referenceId'],
    applicationId: row.application_id,
    companyId: row.company_id,
    jobTitle: row.job_title,
    startDate: row.start_date,
    baseSalary: row.base_salary == null ? null : mhdToNumber(row.base_salary),
    payFrequency: row.pay_frequency,
    employmentType: row.employment_type,
    reportingManagerPersonId: row.reporting_manager_person_id,
    offerExpirationDate: row.offer_expiration_date,
    status: row.status as MhdOfferDetail['status'],
    requiresApproval: row.requires_approval,
    documentGenerationId: row.document_generation_id,
    esignatureRequestId: row.esignature_request_id,
    jobAssignmentId: row.job_assignment_id,
    acceptedAt: row.accepted_at,
    declinedAt: row.declined_at,
    declineReason: row.decline_reason,
    createdAt: row.created_at,
  };
}

function mapMutationResult(row: MhdOfferMutationRpcRow): MhdOfferMutationResult {
  return { id: row.id, referenceId: row.reference_id };
}

function mapAcceptResult(row: MhdOfferAcceptRpcRow): MhdOfferAcceptResult {
  return {
    offerId: row.offer_id,
    jobAssignmentId: row.job_assignment_id,
    onboardingOfferLetterId: row.onboarding_offer_letter_id,
    onboardingCandidateEvaluationId: row.onboarding_candidate_evaluation_id,
  };
}

function mapHirePayload(row: MhdHirePayloadRpcRow): MhdHirePayload {
  return {
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    requisitionTitle: row.requisition_title,
    offerJobTitle: row.offer_job_title,
    startDate: row.start_date,
    // PostgREST may serialise the numeric as a string; normalise, but preserve
    // the semantic null (no salary / no score) rather than collapsing to 0.
    baseSalary: row.base_salary == null ? null : mhdToNumber(row.base_salary),
    payFrequency: row.pay_frequency,
    employmentType: row.employment_type,
    reportingManagerName: row.reporting_manager_name,
    offerExpirationDate: row.offer_expiration_date,
    evaluationRecommendation: row.evaluation_recommendation,
    // The server-mapped 3-way form; rendered verbatim (do not re-map client-side).
    onboardingRecommendation:
      row.onboarding_recommendation == null
        ? null
        : (row.onboarding_recommendation as MhdOnboardingRecommendation),
    overallScore: row.overall_score == null ? null : mhdToNumber(row.overall_score),
    onboardingOverallRating:
      row.onboarding_overall_rating == null ? null : mhdToNumber(row.onboarding_overall_rating),
    evaluationSummary: row.evaluation_summary,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdOfferService = {
  /**
   * Create an offer against an application. Admin-only at the RPC; the caller sees
   * the minted `(id, reference_id)`. Optional terms are omitted when blank; the
   * numeric `baseSalary` is passed through when set (null/undefined otherwise).
   */
  async createOffer(input: MhdCreateOfferInput): Promise<MhdOfferMutationResult> {
    const { data, error } = await offerRpc('mhd_recruiting_offer_create', {
      p_application_id: input.applicationId,
      p_job_title: input.jobTitle.trim(),
      p_start_date: trimmedOrUndefined(input.startDate),
      p_base_salary: input.baseSalary ?? undefined,
      p_pay_frequency: trimmedOrUndefined(input.payFrequency),
      p_employment_type: trimmedOrUndefined(input.employmentType),
      p_reporting_manager_person_id: trimmedOrUndefined(input.reportingManagerPersonId),
      p_offer_expiration_date: trimmedOrUndefined(input.offerExpirationDate),
      p_requires_approval: input.requiresApproval ?? false,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdOfferMutationRpcRow[])[0];
    if (!row) throw new Error('Offer creation returned no row.');
    return mapMutationResult(row);
  },

  /**
   * The offers on an application (newest first). Visible to whoever can view the
   * parent requisition (RLS). The list projection carries the server-synced
   * status and the e-sign soft link but not the full terms — that is `getOffer`.
   */
  async listOffers(applicationId: string | null): Promise<MhdOfferSummary[]> {
    if (!applicationId) return [];
    const { data, error } = await offerRpc('mhd_recruiting_offer_list', {
      p_application_id: applicationId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdOfferRpcRow[]).map(mapOfferSummary);
  },

  /**
   * The full single offer — the terms, the ceremony soft links, and (once
   * ACCEPTED) the `job_assignment_id`. Single-row via `.single()`. Visible to
   * whoever can view the parent requisition (RLS).
   */
  async getOffer(offerId: string): Promise<MhdOfferDetail> {
    const { data, error } = await offerRpc('mhd_recruiting_offer_get', {
      p_offer_id: offerId,
    }).single();
    if (error) throw error;
    return mapOfferDetail(data as MhdOfferDetailRpcRow);
  },

  /**
   * Extend the offer to the candidate — DRAFT/PENDING_APPROVAL -> EXTENDED. Records
   * the optional ceremony soft links (`document_generation_id` /
   * `esignature_request_id`) minted APP-LAYER by the injected callbacks; this
   * service invents no Doc-Gen/E-Sign RPC — it only forwards the ids it is given.
   * Admin-only at the RPC.
   */
  async extendOffer(input: MhdExtendOfferInput): Promise<void> {
    const { error } = await offerRpc('mhd_recruiting_offer_extend', {
      p_offer_id: input.offerId,
      p_document_generation_id: trimmedOrUndefined(input.documentGenerationId),
      p_esignature_request_id: trimmedOrUndefined(input.esignatureRequestId),
    });
    if (error) throw error;
  },

  /**
   * THE HIRE HANDOFF. Accept the offer: the server property-gates on the signature
   * (an attached request must be COMPLETED), requires the requisition to have a
   * job, creates the `job_assignment` (applicant -> employee), marks the offer
   * ACCEPTED with that id, and marks the application HIRED. Returns
   * `(offerId, jobAssignmentId)`. Admin-only at the RPC. The optional
   * `esignatureRequestId` is the app-layer signature request; do NOT pre-empt the
   * "signature not yet complete" gate — surface it from the RPC error.
   */
  async acceptOffer(input: MhdAcceptOfferInput): Promise<MhdOfferAcceptResult> {
    const { data, error } = await offerRpc('mhd_recruiting_offer_accept', {
      p_offer_id: input.offerId,
      p_esignature_request_id: trimmedOrUndefined(input.esignatureRequestId),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdOfferAcceptRpcRow[])[0];
    if (!row) throw new Error('Offer acceptance returned no row.');
    return mapAcceptResult(row);
  },

  /**
   * Decline the offer (the candidate said no) with an optional reason — terminal.
   * Admin-only at the RPC.
   */
  async declineOffer(input: MhdDeclineOfferInput): Promise<void> {
    const { error } = await offerRpc('mhd_recruiting_offer_decline', {
      p_offer_id: input.offerId,
      p_reason: trimmedOrUndefined(input.reason),
    });
    if (error) throw error;
  },

  /**
   * Rescind the offer (the company pulled it) with an optional reason — terminal.
   * The server refuses an ACCEPTED offer (that is a termination, handled
   * elsewhere); the guard surfaces as an RPC error. Admin-only at the RPC.
   */
  async rescindOffer(input: MhdRescindOfferInput): Promise<void> {
    const { error } = await offerRpc('mhd_recruiting_offer_rescind', {
      p_offer_id: input.offerId,
      p_reason: trimmedOrUndefined(input.reason),
    });
    if (error) throw error;
  },

  /**
   * The read-only hire payload — exactly what the onboarding feed writes at the
   * handoff (offer terms + the mapped recommendation/rating), so a recruiter can
   * preview it before/after acceptance. Single-row via `.single()`. Visible to
   * whoever can view the parent requisition (RLS). The recommendation is
   * server-mapped 4->3 and `overall_score` server-mapped to a 1-5 band; the
   * numerics are normalised, nulls preserved.
   */
  async getHirePayload(applicationId: string): Promise<MhdHirePayload> {
    const { data, error } = await offerRpc('mhd_recruiting_hire_payload', {
      p_application_id: applicationId,
    }).single();
    if (error) throw error;
    return mapHirePayload(data as MhdHirePayloadRpcRow);
  },
};
