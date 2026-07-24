// ---------------------------------------------------------------------------
// Recruiting: Offers & Hire Handoff — contract types (package 3 of 3).
//
// RPC row shapes (local snake_case interfaces).
//
// TODO(build-wave): retype from database.types.ts after 0044 gen:types —
// replace these local interfaces with
// `Database['public']['Functions']['mhd_recruiting_offer_list']['Returns'][number]`
// et al. once the migration has shipped and types are regenerated.
//
// The numeric business field `base_salary` (offer list + detail) is typed
// `number | string | null` because PostgREST can serialise a numeric column as
// a JSON string. The mappers run it through `mhdToNumber()` but preserve the
// semantic `null` (no salary set) rather than collapsing it to 0. Never compare
// or arithmetic a raw row value.
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_recruiting_offer_list` (list projection on an application). */
export interface MhdOfferRpcRow {
  id: string;
  reference_id: string;
  job_title: string;
  start_date: string | null;
  base_salary: number | string | null;
  pay_frequency: string | null;
  employment_type: string | null;
  status: string;
  offer_expiration_date: string | null;
  esignature_request_id: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  created_at: string;
}

/**
 * Row shape returned by `mhd_recruiting_offer_get` (the full single offer). Adds
 * the terms, the ceremony soft links (`document_generation_id` /
 * `esignature_request_id`) and — once ACCEPTED — the `job_assignment_id`, the
 * proof the applicant became an employee.
 */
export interface MhdOfferDetailRpcRow {
  id: string;
  reference_id: string;
  application_id: string;
  company_id: string;
  job_title: string;
  start_date: string | null;
  base_salary: number | string | null;
  pay_frequency: string | null;
  employment_type: string | null;
  reporting_manager_person_id: string | null;
  offer_expiration_date: string | null;
  status: string;
  requires_approval: boolean;
  document_generation_id: string | null;
  esignature_request_id: string | null;
  job_assignment_id: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  created_at: string;
}

/** Row shape returned by `mhd_recruiting_offer_create`: `(id, reference_id)`. */
export interface MhdOfferMutationRpcRow {
  id: string;
  reference_id: string;
}

/**
 * Row shape returned by `mhd_recruiting_offer_accept` — THE HANDOFF. Carries the
 * `job_assignment_id` created by the accept path (applicant -> employee) and the
 * two onboarding records the DB now seeds at the handoff — the offer letter and
 * the candidate evaluation. The onboarding ids are `null` when nothing was fed
 * (the shell path), non-null when the onboarding packet was started.
 */
export interface MhdOfferAcceptRpcRow {
  offer_id: string;
  job_assignment_id: string;
  onboarding_offer_letter_id: string | null;
  onboarding_candidate_evaluation_id: string | null;
}

/**
 * Row shape returned by `mhd_recruiting_hire_payload` — the read-only bridge that
 * shows exactly what the onboarding feed writes at the handoff. The recommendation
 * is server-mapped to a 3-way vocabulary and `overall_score` to a 1-5 band;
 * `overall_score` and `onboarding_overall_rating` are numerics PostgREST may
 * serialise as strings, so they are typed `number | string | null` and normalised
 * by the mapper.
 */
export interface MhdHirePayloadRpcRow {
  person_id: string;
  person_display_name: string;
  requisition_title: string;
  offer_job_title: string;
  start_date: string | null;
  base_salary: number | string | null;
  pay_frequency: string | null;
  employment_type: string | null;
  reporting_manager_name: string | null;
  offer_expiration_date: string | null;
  evaluation_recommendation: string | null;
  onboarding_recommendation: string | null;
  overall_score: number | string | null;
  onboarding_overall_rating: number | string | null;
  evaluation_summary: string | null;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdOfferId = string;
export type MhdOfferReferenceId = `OFR-${string}`;

/**
 * The offer lifecycle. Transitioned server-side by the offer RPCs; the UI renders
 * the status and offers the moves the status allows. `create` -> DRAFT; `extend`
 * -> EXTENDED; `accept` -> ACCEPTED (the hire); `decline`/`rescind` -> terminal;
 * `PENDING_APPROVAL` is the optional approval gate, `EXPIRED` the lapse of the
 * expiration date. Never computed client-side.
 */
export type MhdOfferStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'EXTENDED' | 'ACCEPTED' | 'DECLINED' | 'RESCINDED' | 'EXPIRED';

export const MHD_OFFER_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'EXTENDED',
  'ACCEPTED',
  'DECLINED',
  'RESCINDED',
  'EXPIRED',
] as const satisfies readonly MhdOfferStatus[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

/**
 * One offer row from `offer_list` — the list projection shown on the application's
 * offer panel. `baseSalary` is normalised from a possibly-stringified numeric but
 * kept `null` when no salary was set. Carries the server-synced `status`; render
 * it, do not recompute the lifecycle on the client.
 */
export interface MhdOfferSummary {
  id: MhdOfferId;
  referenceId: MhdOfferReferenceId;
  jobTitle: string;
  startDate: string | null;
  baseSalary: number | null;
  payFrequency: string | null;
  employmentType: string | null;
  status: MhdOfferStatus;
  offerExpirationDate: string | null;
  esignatureRequestId: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
}

/**
 * The full single offer, from `offer_get`. Adds the reporting manager, the
 * `requiresApproval` gate, both ceremony soft links, and — once ACCEPTED — the
 * `jobAssignmentId` (proof of hire: the employment record the accept path
 * created). `baseSalary` is normalised but preserves the semantic null.
 */
export interface MhdOfferDetail {
  id: MhdOfferId;
  referenceId: MhdOfferReferenceId;
  applicationId: string;
  companyId: string;
  jobTitle: string;
  startDate: string | null;
  baseSalary: number | null;
  payFrequency: string | null;
  employmentType: string | null;
  reportingManagerPersonId: string | null;
  offerExpirationDate: string | null;
  status: MhdOfferStatus;
  requiresApproval: boolean;
  documentGenerationId: string | null;
  esignatureRequestId: string | null;
  jobAssignmentId: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  createdAt: string;
}

/** Mapped result of `offer_create` — the minted `(id, referenceId)`. */
export interface MhdOfferMutationResult {
  id: string;
  referenceId: string;
}

/**
 * Mapped result of `offer_accept` — THE HANDOFF. `jobAssignmentId` is the
 * employment record created for the new hire; the caller surfaces it as proof the
 * applicant became an employee. `onboardingOfferLetterId` /
 * `onboardingCandidateEvaluationId` are the two records the DB seeds in onboarding
 * at the handoff — present (non-null) when the onboarding packet was started.
 */
export interface MhdOfferAcceptResult {
  offerId: string;
  jobAssignmentId: string;
  onboardingOfferLetterId: string | null;
  onboardingCandidateEvaluationId: string | null;
}

/**
 * The onboarding recommendation vocabulary — the server maps the 4-way evaluation
 * recommendation down to this 3-way form for the onboarding feed:
 * STRONG_HIRE/HIRE -> HIRE, NO_HIRE/STRONG_NO_HIRE -> NO_HIRE, null -> HOLD.
 */
export type MhdOnboardingRecommendation = 'HIRE' | 'HOLD' | 'NO_HIRE';

export const MHD_ONBOARDING_RECOMMENDATIONS = [
  'HIRE',
  'HOLD',
  'NO_HIRE',
] as const satisfies readonly MhdOnboardingRecommendation[];

/**
 * The read-only hire payload, from `hire_payload` — exactly what the onboarding
 * feed writes at the handoff, so a recruiter can preview it before/after
 * acceptance. `baseSalary` / `overallScore` are normalised numerics (null
 * preserved); `onboardingOverallRating` is the 1-5 band (integer, null when the
 * evaluation carried no score). `onboardingRecommendation` is the server-mapped
 * 3-way form; `evaluationRecommendation` is the raw source value.
 */
export interface MhdHirePayload {
  personId: string;
  personDisplayName: string;
  requisitionTitle: string;
  offerJobTitle: string;
  startDate: string | null;
  baseSalary: number | null;
  payFrequency: string | null;
  employmentType: string | null;
  reportingManagerName: string | null;
  offerExpirationDate: string | null;
  evaluationRecommendation: string | null;
  onboardingRecommendation: MhdOnboardingRecommendation | null;
  overallScore: number | null;
  onboardingOverallRating: number | null;
  evaluationSummary: string | null;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/**
 * Creating an offer against an application. Only `applicationId` + `jobTitle` are
 * required; the terms may be filled in later before it is extended. `baseSalary`
 * is the numeric (CHECK >= 0). The RPC remains the authority on who may create an
 * offer (the three admin roles).
 */
export interface MhdCreateOfferInput {
  applicationId: string;
  jobTitle: string;
  startDate?: string | null;
  baseSalary?: number | null;
  payFrequency?: string | null;
  employmentType?: string | null;
  reportingManagerPersonId?: string | null;
  offerExpirationDate?: string | null;
  requiresApproval?: boolean;
}

/**
 * Extending an offer to the candidate. The optional ceremony soft links
 * (`documentGenerationId` / `esignatureRequestId`) are the ids of the rendered
 * offer document + signature request, both CREATED APP-LAYER (the injected
 * callbacks — invent no Doc-Gen/E-Sign RPC).
 */
export interface MhdExtendOfferInput {
  offerId: MhdOfferId;
  documentGenerationId?: string | null;
  esignatureRequestId?: string | null;
}

/**
 * Accepting an offer — THE HIRE. Optionally carries an `esignatureRequestId` (the
 * app-layer signature request). The server property-gates on the signature being
 * COMPLETED and refuses if the requisition has no job; surface that gate rather
 * than pre-empting it.
 */
export interface MhdAcceptOfferInput {
  offerId: MhdOfferId;
  esignatureRequestId?: string | null;
}

export interface MhdDeclineOfferInput {
  offerId: MhdOfferId;
  reason?: string | null;
}

export interface MhdRescindOfferInput {
  offerId: MhdOfferId;
  reason?: string | null;
}

// ---------------------------------------------------------------------------
// Injected app-layer ceremony callbacks
//
// The offer document + signature request are created APP-LAYER (the
// Conduct/Handbook pattern: `onGenerateDocument` / `onRequestSignature`). This
// contract layer invents NO Doc-Gen/E-Sign RPC — the host route wires a callback
// that mints the id and returns it, and it is forwarded verbatim into
// `offer_extend` / `offer_accept` as the soft link. A `null` return means "skip
// that leg of the ceremony" (the shell path), exactly as Handbook models it.
// ---------------------------------------------------------------------------

/** Renders the offer letter and returns its `document_generation_id` (or null to skip). */
export type MhdOfferGenerateDocument = (offerId: MhdOfferId) => Promise<string | null>;

/** Opens a signature request for the offer and returns its `esignature_request_id` (or null to skip). */
export type MhdOfferRequestSignature = (offerId: MhdOfferId) => Promise<string | null>;

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const OFFER_STATUS_LABELS: Record<MhdOfferStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  EXTENDED: 'Extended',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  RESCINDED: 'Rescinded',
  EXPIRED: 'Expired',
};

export function mhdFormatOfferStatus(value: MhdOfferStatus | string): string {
  return OFFER_STATUS_LABELS[value as MhdOfferStatus] ?? value;
}

const ONBOARDING_RECOMMENDATION_LABELS: Record<MhdOnboardingRecommendation, string> = {
  HIRE: 'Hire',
  HOLD: 'Hold',
  NO_HIRE: 'No hire',
};

export function mhdFormatOnboardingRecommendation(
  value: MhdOnboardingRecommendation | string | null,
): string {
  if (value == null) return 'Hold';
  return ONBOARDING_RECOMMENDATION_LABELS[value as MhdOnboardingRecommendation] ?? value;
}

/**
 * PostgREST serialises a numeric column as a string in some paths; normalise
 * before any arithmetic or comparison. Copied verbatim from the house pattern
 * (Training / Investigations / Leaves / Recruiting package 1). Used here by the
 * offer mappers for `base_salary`.
 */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
