// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// TODO(build-wave): retype from database.types.ts after 0043 gen:types —
// replace these local interfaces with
// `Database['public']['Functions']['mhd_interview_guide_list_items']['Returns'][number]`
// et al. once the migration has shipped and types are regenerated.
//
// The numeric business fields — `weight` / `avg_rating` (evaluation rollup),
// `overall_score` (evaluation get / overall-score scalar), the integer counters
// (`sort_order`, `response_count`, `existing_rating`) — are typed
// `number | string | null` because PostgREST can serialise a numeric/integer
// column as a JSON string. Every mapper below runs them through `mhdToNumber()`;
// never compare or arithmetic a raw row value. The one exception is a value whose
// NULL is meaningful (a not-yet-answered `existing_rating`, an unscored
// `overall_score`), which the mapper preserves as `null` rather than coercing to 0.
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_interview_category_list`. */
export interface MhdInterviewCategoryRpcRow {
  id: string;
  category_key: string;
  category_name: string;
  sort_order: number | string | null;
  // `company_id is null` computed server-side — a platform-seeded category.
  is_global: boolean;
}

/** Row shape returned by `mhd_interview_question_list`. */
export interface MhdInterviewQuestionRpcRow {
  id: string;
  company_id: string | null;
  category_id: string | null;
  category_name: string | null;
  question_key: string;
  question_text: string;
  guidance: string | null;
  competency_id: string | null;
  scope: string;
  response_type: string;
  compliance_status: string;
  compliance_guidance: string | null;
  is_global: boolean;
}

/** Row shape returned by `mhd_interview_job_competencies` (the JD derivation helper). */
export interface MhdInterviewJobCompetencyRpcRow {
  competency_id: string;
  weight: number | string | null;
}

/** Row shape returned by `mhd_interview_guide_list_items`. */
export interface MhdInterviewGuideItemRpcRow {
  id: string;
  // `null` for a CUSTOM item held inline (no bank row behind it).
  question_id: string | null;
  question_text: string;
  response_type: string;
  competency_id: string | null;
  competency_name: string | null;
  source: string;
  // Coalesced to APPROVED server-side for a CUSTOM/inline item with no bank row.
  compliance_status: string;
  sort_order: number | string | null;
}

/** Row shape returned by `mhd_interview_list`. */
export interface MhdInterviewRpcRow {
  id: string;
  reference_id: string;
  interviewer_person_id: string;
  interviewer_name: string | null;
  guide_id: string | null;
  interview_type: string | null;
  scheduled_date: string | null;
  status: string;
  completed_at: string | null;
}

/** Row shape returned by `mhd_interview_get_worksheet` (one per guide item). */
export interface MhdInterviewWorksheetItemRpcRow {
  guide_item_id: string;
  question_text: string;
  response_type: string;
  competency_id: string | null;
  competency_name: string | null;
  compliance_status: string;
  // Why the question is flagged (how to avoid / ask legally). Nullable — the
  // STANDARD/APPROVED pack carries none. Surfaced inline beside the flag.
  compliance_guidance: string | null;
  // The interviewer's prior answers, prefilled on a re-open. `existing_rating`'s
  // NULL is meaningful (unanswered) and is preserved as `null`, not coerced to 0.
  existing_rating: number | string | null;
  existing_bool: boolean | null;
  existing_text: string | null;
}

/** Row shape returned by `mhd_interview_evaluation_rollup` (per-competency). */
export interface MhdInterviewEvaluationRollupRpcRow {
  competency_id: string | null;
  competency_name: string | null;
  weight: number | string | null;
  avg_rating: number | string | null;
  response_count: number | string | null;
}

/** Row shape returned by `mhd_interview_evaluation_get` (single row). */
export interface MhdInterviewEvaluationRpcRow {
  id: string;
  reference_id: string;
  overall_recommendation: string | null;
  decision_summary: string | null;
  status: string;
  decided_by: string | null;
  decided_at: string | null;
  // The DERIVED overall weighted score, re-computed server-side on every read.
  // NULL when no rated responses exist yet — preserved as `null` by the mapper.
  overall_score: number | string | null;
}

/** Row shape returned by a create/finalize RPC that mints a reference: `(id, reference_id)`. */
export interface MhdInterviewMutationRpcRow {
  id: string;
  reference_id: string;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdInterviewQuestionId = string;
export type MhdInterviewCategoryId = string;
export type MhdInterviewGuideId = string;
export type MhdInterviewGuideItemId = string;
export type MhdInterviewId = string;
export type MhdCandidateEvaluationId = string;

export type MhdInterviewReferenceId = `IVW-${string}`;
export type MhdCandidateEvaluationReferenceId = `IVE-${string}`;

/** Bank-question scope. STANDARD = all applicants, JOB = competency-matched, GENERAL = pool. */
export type MhdInterviewQuestionScope = 'STANDARD' | 'JOB' | 'GENERAL';

/** How a question is answered. Only `RATING_1_5` contributes to the weighted rollup. */
export type MhdInterviewResponseType = 'RATING_1_5' | 'YES_NO' | 'TEXT';

/** The compliance flag on a bank question. CAUTION = legal risk (guidance explains). */
export type MhdInterviewComplianceStatus = 'APPROVED' | 'REVIEW' | 'CAUTION';

/** Where a guide item came from — drives the review grouping in the builder. */
export type MhdInterviewGuideItemSource = 'STANDARD' | 'JOB_COMPETENCY' | 'BANK' | 'CUSTOM';

/** An interview instance's lifecycle (record-only scheduling in v1). */
export type MhdInterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

/** The hiring recommendation atop the evaluation rollup. */
export type MhdInterviewRecommendation =
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'NO_HIRE'
  | 'STRONG_NO_HIRE';

/** The evaluation record's status. */
export type MhdCandidateEvaluationStatus = 'DRAFT' | 'FINAL';

export const MHD_INTERVIEW_QUESTION_SCOPES = [
  'STANDARD',
  'JOB',
  'GENERAL',
] as const satisfies readonly MhdInterviewQuestionScope[];

export const MHD_INTERVIEW_RESPONSE_TYPES = [
  'RATING_1_5',
  'YES_NO',
  'TEXT',
] as const satisfies readonly MhdInterviewResponseType[];

export const MHD_INTERVIEW_COMPLIANCE_STATUSES = [
  'APPROVED',
  'REVIEW',
  'CAUTION',
] as const satisfies readonly MhdInterviewComplianceStatus[];

export const MHD_INTERVIEW_GUIDE_ITEM_SOURCES = [
  'STANDARD',
  'JOB_COMPETENCY',
  'BANK',
  'CUSTOM',
] as const satisfies readonly MhdInterviewGuideItemSource[];

export const MHD_INTERVIEW_STATUSES = [
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly MhdInterviewStatus[];

export const MHD_INTERVIEW_RECOMMENDATIONS = [
  'STRONG_HIRE',
  'HIRE',
  'NO_HIRE',
  'STRONG_NO_HIRE',
] as const satisfies readonly MhdInterviewRecommendation[];

export const MHD_CANDIDATE_EVALUATION_STATUSES = [
  'DRAFT',
  'FINAL',
] as const satisfies readonly MhdCandidateEvaluationStatus[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

/** A question-bank category, from `category_list`. `isGlobal` marks a platform-seeded one. */
export interface MhdInterviewCategory {
  id: MhdInterviewCategoryId;
  categoryKey: string;
  categoryName: string;
  sortOrder: number;
  isGlobal: boolean;
}

/**
 * One bank question, from `question_list`. `scope` drives assembly (STANDARD is
 * pulled for every candidate, JOB when it matches the requisition's competencies).
 * `complianceStatus` + `complianceGuidance` are the compliance flag surfaced in the
 * builder and worksheet. `isGlobal` (`company_id IS NULL`) marks a platform pack.
 */
export interface MhdInterviewQuestion {
  id: MhdInterviewQuestionId;
  companyId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  questionKey: string;
  questionText: string;
  guidance: string | null;
  competencyId: string | null;
  scope: MhdInterviewQuestionScope;
  responseType: MhdInterviewResponseType;
  complianceStatus: MhdInterviewComplianceStatus;
  complianceGuidance: string | null;
  isGlobal: boolean;
}

/** A competency + JD weight of a requisition's job, from `job_competencies`. */
export interface MhdInterviewJobCompetency {
  competencyId: string;
  weight: number;
}

/**
 * One assembled guide item, from `guide_list_items`. `source` groups the review
 * (STANDARD / JOB_COMPETENCY are auto-assembled; BANK / CUSTOM are hand-added).
 * `complianceStatus` is the flag (coalesced to APPROVED for an inline custom item).
 */
export interface MhdInterviewGuideItem {
  id: MhdInterviewGuideItemId;
  questionId: string | null;
  questionText: string;
  responseType: MhdInterviewResponseType;
  competencyId: string | null;
  competencyName: string | null;
  source: MhdInterviewGuideItemSource;
  complianceStatus: MhdInterviewComplianceStatus;
  sortOrder: number;
}

/**
 * One interview instance on an application, from `interview_list`. Interviewers are
 * NOT anonymous to the hiring manager (unlike Performance 360), so `interviewerName`
 * is surfaced. `status` is server-managed (SCHEDULED -> COMPLETED on submit).
 */
export interface MhdInterview {
  id: MhdInterviewId;
  referenceId: MhdInterviewReferenceId;
  interviewerPersonId: string;
  interviewerName: string | null;
  guideId: string | null;
  interviewType: string | null;
  scheduledDate: string | null;
  status: MhdInterviewStatus;
  completedAt: string | null;
}

/**
 * One worksheet row, from `get_worksheet` — a guide item to answer, with the
 * interviewer's prior answer prefilled. `existingRating` is `null` when unanswered
 * (preserved, not 0). The compliance flag rides along so the interviewer sees it
 * inline and never asks a CAUTION question unprepared.
 */
export interface MhdInterviewWorksheetItem {
  guideItemId: MhdInterviewGuideItemId;
  questionText: string;
  responseType: MhdInterviewResponseType;
  competencyId: string | null;
  competencyName: string | null;
  complianceStatus: MhdInterviewComplianceStatus;
  // Why the question is flagged; `null` for an APPROVED/STANDARD item with none.
  // Shown inline beneath the flag so the interviewer sees WHY, not just that it is.
  complianceGuidance: string | null;
  existingRating: number | null;
  existingBool: boolean | null;
  existingText: string | null;
}

/**
 * One per-competency row of the evaluation rollup, from `evaluation_rollup`. The
 * `weight` is the JD competency weight (1 when unweighted); `avgRating` is the mean
 * of RATING_1_5 responses across all COMPLETED interviews. DERIVED — never stored,
 * never recomputed client-side.
 */
export interface MhdInterviewEvaluationRollupRow {
  competencyId: string | null;
  competencyName: string | null;
  weight: number;
  avgRating: number;
  responseCount: number;
}

/**
 * The per-application evaluation record, from `evaluation_get`. `overallScore` is
 * the DERIVED weighted score, re-computed server-side on every read; it is `null`
 * when no rated responses exist yet. `overallRecommendation` is `null` on a DRAFT
 * that has not yet recorded a decision.
 */
export interface MhdCandidateEvaluation {
  id: MhdCandidateEvaluationId;
  referenceId: MhdCandidateEvaluationReferenceId;
  overallRecommendation: MhdInterviewRecommendation | null;
  decisionSummary: string | null;
  status: MhdCandidateEvaluationStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  overallScore: number | null;
}

/** Mapped result of a create/finalize RPC that mints a reference. */
export interface MhdInterviewMutationResult {
  id: string;
  referenceId: string;
}

// ---------------------------------------------------------------------------
// Inputs and filters
// ---------------------------------------------------------------------------

export interface MhdCreateQuestionInput {
  companyId: string;
  categoryId: string;
  questionKey: string;
  questionText: string;
  scope?: MhdInterviewQuestionScope;
  responseType?: MhdInterviewResponseType;
  competencyId?: string | null;
  guidance?: string | null;
  complianceStatus?: MhdInterviewComplianceStatus;
  complianceGuidance?: string | null;
}

export interface MhdAddGuideQuestionInput {
  guideId: MhdInterviewGuideId;
  questionId: MhdInterviewQuestionId;
}

export interface MhdAddCustomQuestionInput {
  guideId: MhdInterviewGuideId;
  questionText: string;
  responseType?: MhdInterviewResponseType;
  competencyId?: string | null;
  // When set, the question is also written back to the company bank (as a new
  // GENERAL question, compliance REVIEW until an admin clears it) so the library grows.
  saveToBank?: boolean;
  categoryId?: string | null;
}

export interface MhdCreateInterviewInput {
  applicationId: string;
  interviewerPersonId: string;
  guideId?: string | null;
  interviewType?: string | null;
  scheduledDate?: string | null;
}

/**
 * One draft answer for the worksheet. Exactly the fields relevant to the item's
 * `responseType` are set; the service turns these into the `p_responses` jsonb
 * array. A `null`/blank value is a non-answer and is dropped server-side.
 */
export interface MhdInterviewResponseDraft {
  guideItemId: MhdInterviewGuideItemId;
  rating?: number | null;
  responseBool?: boolean | null;
  responseText?: string | null;
}

export interface MhdSubmitResponsesInput {
  interviewId: MhdInterviewId;
  responses: MhdInterviewResponseDraft[];
}

export interface MhdFinalizeEvaluationInput {
  applicationId: string;
  recommendation: MhdInterviewRecommendation;
  summary?: string | null;
  status?: MhdCandidateEvaluationStatus;
}

export interface MhdInterviewQuestionFilters {
  companyId: string | null;
  categoryId?: string | null;
  scope?: MhdInterviewQuestionScope | 'ALL' | null;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const QUESTION_SCOPE_LABELS: Record<MhdInterviewQuestionScope, string> = {
  STANDARD: 'Standard (all applicants)',
  JOB: 'Job-specific',
  GENERAL: 'General bank',
};

const RESPONSE_TYPE_LABELS: Record<MhdInterviewResponseType, string> = {
  RATING_1_5: 'Rating (1–5)',
  YES_NO: 'Yes / No',
  TEXT: 'Free text',
};

const COMPLIANCE_STATUS_LABELS: Record<MhdInterviewComplianceStatus, string> = {
  APPROVED: 'Approved',
  REVIEW: 'Review',
  CAUTION: 'Caution',
};

const GUIDE_ITEM_SOURCE_LABELS: Record<MhdInterviewGuideItemSource, string> = {
  STANDARD: 'Standard questions',
  JOB_COMPETENCY: 'Job competencies',
  BANK: 'Added from bank',
  CUSTOM: 'Custom',
};

const INTERVIEW_STATUS_LABELS: Record<MhdInterviewStatus, string> = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const RECOMMENDATION_LABELS: Record<MhdInterviewRecommendation, string> = {
  STRONG_HIRE: 'Strong hire',
  HIRE: 'Hire',
  NO_HIRE: 'No hire',
  STRONG_NO_HIRE: 'Strong no hire',
};

const EVALUATION_STATUS_LABELS: Record<MhdCandidateEvaluationStatus, string> = {
  DRAFT: 'Draft',
  FINAL: 'Final',
};

export function mhdFormatQuestionScope(value: MhdInterviewQuestionScope | string): string {
  return QUESTION_SCOPE_LABELS[value as MhdInterviewQuestionScope] ?? value;
}

export function mhdFormatResponseType(value: MhdInterviewResponseType | string): string {
  return RESPONSE_TYPE_LABELS[value as MhdInterviewResponseType] ?? value;
}

export function mhdFormatComplianceStatus(value: MhdInterviewComplianceStatus | string): string {
  return COMPLIANCE_STATUS_LABELS[value as MhdInterviewComplianceStatus] ?? value;
}

export function mhdFormatGuideItemSource(value: MhdInterviewGuideItemSource | string): string {
  return GUIDE_ITEM_SOURCE_LABELS[value as MhdInterviewGuideItemSource] ?? value;
}

export function mhdFormatInterviewStatus(value: MhdInterviewStatus | string): string {
  return INTERVIEW_STATUS_LABELS[value as MhdInterviewStatus] ?? value;
}

export function mhdFormatRecommendation(value: MhdInterviewRecommendation | string): string {
  return RECOMMENDATION_LABELS[value as MhdInterviewRecommendation] ?? value;
}

export function mhdFormatEvaluationStatus(value: MhdCandidateEvaluationStatus | string): string {
  return EVALUATION_STATUS_LABELS[value as MhdCandidateEvaluationStatus] ?? value;
}

/**
 * PostgREST serialises a numeric/integer column as a string in some paths;
 * normalise before any arithmetic or comparison. Copied verbatim from the house
 * pattern (Recruiting package 1 / Training / Investigations / Leaves). Used by the
 * mappers for `weight` / `avg_rating` / `overall_score` and the integer counters.
 */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
