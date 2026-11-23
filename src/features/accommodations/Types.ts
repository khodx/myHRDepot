export type MhdAccommodationStatus =
  | 'INTAKE'
  | 'INTERACTIVE_PROCESS'
  | 'DOCUMENTATION_PENDING'
  | 'EVALUATION'
  | 'DECIDED'
  | 'IMPLEMENTING'
  | 'ACTIVE'
  | 'REVIEW_DUE'
  | 'CLOSED';

export type MhdAccommodationRequestSource =
  | 'SELF'
  | 'REPRESENTATIVE'
  | 'EMPLOYER_OBSERVED'
  | 'LEAVE_EXHAUSTION'
  | 'RETURN_TO_WORK'
  | 'APPLICANT'
  | 'OTHER';

export type MhdAccommodationRequestChannel =
  'VERBAL' | 'WRITTEN' | 'EMAIL' | 'PHONE' | 'PORTAL' | 'OBSERVED' | 'OTHER';

/**
 * The four outcomes an effectiveness review may record. Mirrors the
 * `accommodation_review_effectiveness_allowed` CHECK constraint exactly —
 * anything else is rejected with 23514, so this union is the contract rather
 * than a suggestion.
 */
export type MhdAccommodationReviewEffectiveness =
  'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'NO_LONGER_NEEDED';

export type MhdAccommodationDocumentationType =
  | 'SIMPLE_CERTIFICATION'
  | 'DETAILED_CERTIFICATION'
  | 'PROVIDER_NOTE'
  | 'EMPLOYEE_STATEMENT'
  | 'OTHER';

export type MhdAccommodationDocumentationStatus =
  'NOT_NEEDED' | 'REQUESTED' | 'RECEIVED' | 'INCOMPLETE' | 'SUFFICIENT' | 'EXPIRED' | 'WAIVED';

export interface MhdAccommodationSummaryRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  request_source: MhdAccommodationRequestSource;
  request_channel: MhdAccommodationRequestChannel;
  requested_at: string;
  status: MhdAccommodationStatus;
  owner_user_id: string | null;
  leave_case_id: string | null;
  current_decision: 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED' | null;
  review_due_date: string | null;
}

export interface MhdAccommodationSummary {
  id: string;
  referenceId: string;
  personId: string;
  personDisplayName: string;
  requestSource: MhdAccommodationRequestSource;
  requestChannel: MhdAccommodationRequestChannel;
  requestedAt: string;
  status: MhdAccommodationStatus;
  ownerUserId: string | null;
  leaveCaseId: string | null;
  currentDecision: 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED' | null;
  reviewDueDate: string | null;
}

export interface MhdAccommodationCase {
  id: string;
  reference_id: string;
  company_id: string;
  person_id: string;
  recruiting_application_id: string | null;
  leave_case_id: string | null;
  job_description_id: string | null;
  essential_functions: Array<{ id: string; text: string }>;
  request_source: MhdAccommodationRequestSource;
  request_channel: MhdAccommodationRequestChannel;
  requested_at: string;
  request_summary: string;
  status: MhdAccommodationStatus;
  owner_user_id: string | null;
  closure_reason: string | null;
}

export interface MhdAccommodationInteraction {
  id: string;
  occurred_at: string;
  channel: string;
  participants: unknown[];
  summary: string;
  next_step: string | null;
  next_step_due: string | null;
  employee_visible: boolean;
}

export interface MhdAccommodationOption {
  id: string;
  option_type: string;
  description: string;
  essential_function_ids: string[];
  expected_effectiveness: string;
  employee_preference: boolean;
  removes_essential_function: boolean;
  estimated_cost: number | string | null;
  disposition: string;
  disposition_reason: string | null;
}

export interface MhdAccommodationDecision {
  id: string;
  outcome: 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED';
  selected_option_id: string | null;
  /** The first (primary) denial reason; the full set is `denial_reasons`. */
  denial_reason_code: MhdAccommodationDenialReason | null;
  denial_reasons: MhdAccommodationDecisionDenialReason[];
  decision_summary: string;
  alternatives_considered: boolean;
  interactive_process_continues: boolean;
  decided_at: string;
  superseded_at: string | null;
}

/** One reason for a denial, with the specifics Section D of the package asks for. */
export interface MhdAccommodationDecisionDenialReason {
  reason_code: MhdAccommodationDenialReason;
  label: string;
  detail: string | null;
  alternative_offered: string | null;
  position: number;
}

export interface MhdAccommodationImplementation {
  id: string;
  option_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  manager_instruction: string;
  review_due_date: string | null;
  equipment_ordered_on: string | null;
  equipment_ordered_by: string | null;
  equipment_received_on: string | null;
}

export interface MhdAccommodationReview {
  id: string;
  implementation_id: string;
  due_date: string;
  completed_at: string | null;
  effectiveness: string | null;
  summary: string | null;
  reengage_required: boolean | null;
}

export interface MhdAccommodationMedicalStatus {
  id: string;
  documentation_type: string;
  status: string;
  need_is_obvious: boolean;
  documentation_requested: boolean;
  requested_at: string | null;
  due_date: string | null;
  received_at: string | null;
  has_attachment: boolean;
}

export interface MhdAccommodationNotice {
  id: string;
  company_id: string;
  accommodation_case_id: string;
  notice_type: string;
  status: string;
  template_key: string;
  template_version: number;
  document_generation_id: string | null;
  issued_at: string | null;
  created_at: string;
  created_by: string;
}

/**
 * The ONLY two medical facts this platform stores about an accommodation, both
 * encrypted at rest and revealable only through the audited
 * `mhd_accommodation_medical_reveal` RPC (Platform Admin / HR Partner). There is
 * deliberately no diagnosis, causation, medical-history, or genetic-information
 * field anywhere in this type — an accommodation needs to know what the person
 * cannot currently do and what change would help, and nothing further.
 */
export interface MhdAccommodationMedicalReveal {
  functional_limitation: string | null;
  accommodation_need: string | null;
}

export interface MhdRecordAccommodationMedicalInput {
  caseId: string;
  documentationType: MhdAccommodationDocumentationType;
  status: MhdAccommodationDocumentationStatus;
  needIsObvious: boolean;
  documentationRequested: boolean;
  requestedAt?: string | null;
  dueDate?: string | null;
  receivedAt?: string | null;
  functionalLimitation?: string | null;
  accommodationNeed?: string | null;
}

/**
 * Everything a MANAGER is ever told about an accommodation: what to do, from
 * when, until when. No case, no request narrative, no documentation status, and
 * no medical field — `mhd_accommodation_manager_projection` selects exactly
 * these columns server-side, so the medical partition is never a client concern.
 */
export interface MhdAccommodationManagerInstruction {
  implementationId: string;
  optionType: string;
  managerInstruction: string;
  startDate: string;
  endDate: string | null;
  reviewDueDate: string | null;
}

/** Section A of the package: dates, flags and contact facts (non-medical, case-scoped). */
export interface MhdAccommodationRequestDetails {
  id: string;
  limitation_duration: MhdAccommodationLimitationDuration | null;
  anticipated_recovery_date: string | null;
  workers_comp_claim: boolean;
  workers_comp_claim_filed_on: string | null;
  leave_requested: boolean;
  leave_request_details: string | null;
  employee_certified_at: string | null;
  employee_certified_method: MhdAccommodationCertificationMethod | null;
  contact_phone: string | null;
  contact_email: string | null;
  work_location: string | null;
  supervisor_name: string | null;
  supervisor_person_id: string | null;
}

/**
 * Section B status and dates, returned to medical roles only. The provider's name and the
 * recommendation are encrypted and come back only from the audited reveal RPC.
 */
export interface MhdAccommodationProviderCertification {
  id: string;
  certified_at: string | null;
  disability_verified: boolean;
  limitation_duration: MhdAccommodationLimitationDuration | null;
  limitation_end_date: string | null;
  accommodation_begin_on: string | null;
  accommodation_end_on: string | null;
  accommodation_continuous: boolean;
  job_duty_statement_sent_at: string | null;
  has_provider_name: boolean;
  has_recommendation: boolean;
  has_attachment: boolean;
}

export interface MhdAccommodationProviderCertificationReveal {
  provider_name: string | null;
  recommendation: string | null;
}

export interface MhdAccommodationDetail {
  case: MhdAccommodationCase;
  /** Null until Section A has been recorded. */
  request_details: MhdAccommodationRequestDetails | null;
  interactions: MhdAccommodationInteraction[];
  options: MhdAccommodationOption[];
  decisions: MhdAccommodationDecision[];
  implementations: MhdAccommodationImplementation[];
  reviews: MhdAccommodationReview[];
  /** Medical roles only; an empty list for everyone else. */
  medical_status: MhdAccommodationMedicalStatus[];
  /** Medical roles only; null for everyone else. */
  provider_certification: MhdAccommodationProviderCertification | null;
}

// The release gate is a platform concern shared with Leaves, so its type lives
// in @/types/mhdCompliance. Re-exported here so the feature's public contract
// stays complete for callers of mhdAccommodationsService.readiness().
export type { MhdComplianceReadiness } from '@/types/mhdCompliance';

export const MHD_ACCOMMODATION_STATUSES: readonly MhdAccommodationStatus[] = [
  'INTAKE',
  'INTERACTIVE_PROCESS',
  'DOCUMENTATION_PENDING',
  'EVALUATION',
  'DECIDED',
  'IMPLEMENTING',
  'ACTIVE',
  'REVIEW_DUE',
  'CLOSED',
];

export const MHD_ACCOMMODATION_REQUEST_SOURCES: readonly MhdAccommodationRequestSource[] = [
  'SELF',
  'REPRESENTATIVE',
  'EMPLOYER_OBSERVED',
  'LEAVE_EXHAUSTION',
  'RETURN_TO_WORK',
  'APPLICANT',
  'OTHER',
];

export const MHD_ACCOMMODATION_REQUEST_CHANNELS: readonly MhdAccommodationRequestChannel[] = [
  'VERBAL',
  'WRITTEN',
  'EMAIL',
  'PHONE',
  'PORTAL',
  'OBSERVED',
  'OTHER',
];

export const MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS: readonly MhdAccommodationReviewEffectiveness[] =
  ['EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE', 'NO_LONGER_NEEDED'];

/**
 * Review outcomes that mean the accommodation is not working as decided, so the
 * interactive process must resume. The database does not force this
 * (mhd_accommodation_complete_review only reopens the case when
 * p_reengage_required is true), so the form enforces it: a partially or wholly
 * ineffective accommodation left ACTIVE would end the process early.
 */
export const MHD_ACCOMMODATION_REVIEW_OUTCOMES_REQUIRING_REENGAGEMENT: readonly MhdAccommodationReviewEffectiveness[] =
  ['PARTIALLY_EFFECTIVE', 'INEFFECTIVE'];

export const MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS_LABELS: Record<
  MhdAccommodationReviewEffectiveness,
  string
> = {
  EFFECTIVE: 'Effective',
  PARTIALLY_EFFECTIVE: 'Partially Effective',
  INEFFECTIVE: 'Ineffective',
  NO_LONGER_NEEDED: 'No Longer Needed',
};

export const MHD_ACCOMMODATION_DOCUMENTATION_TYPES: readonly MhdAccommodationDocumentationType[] = [
  'SIMPLE_CERTIFICATION',
  'DETAILED_CERTIFICATION',
  'PROVIDER_NOTE',
  'EMPLOYEE_STATEMENT',
  'OTHER',
];

export const MHD_ACCOMMODATION_DOCUMENTATION_STATUSES: readonly MhdAccommodationDocumentationStatus[] =
  ['NOT_NEEDED', 'REQUESTED', 'RECEIVED', 'INCOMPLETE', 'SUFFICIENT', 'EXPIRED', 'WAIVED'];

/**
 * The option types and denial reasons `accommodation_options` and
 * `accommodation_decisions` accept (CHECK constraints
 * accommodation_option_type_allowed and accommodation_denial_reason_allowed in
 * 0053). Every picker in the module reads these lists so the UI can never offer
 * a value the database rejects.
 */
export const MHD_ACCOMMODATION_OPTION_TYPES = [
  'EQUIPMENT',
  'JOB_RESTRUCTURING',
  'SCHEDULE_CHANGE',
  'LEAVE',
  'TELEWORK',
  'WORKSITE_CHANGE',
  'REASSIGNMENT',
  'SERVICE_OR_INTERPRETER',
  'POLICY_MODIFICATION',
  'TRAINING',
  'OTHER',
] as const;
export type MhdAccommodationOptionType = (typeof MHD_ACCOMMODATION_OPTION_TYPES)[number];

/**
 * Denial reason codes (table accommodation_denial_reason_codes, migration 0388): the eight reasons of
 * Section D of the package, in form order, plus the two statutory grounds. The interface renders the
 * vocabulary from the table; this list and the rules below exist for validation and tests and are held
 * to the table by a parity test.
 */
export const MHD_ACCOMMODATION_DENIAL_REASONS = [
  'INEFFECTIVE',
  'UNDUE_HARDSHIP',
  'MEDICAL_DOCUMENTATION_INADEQUATE',
  'REMOVES_ESSENTIAL_FUNCTION',
  'LOWERS_STANDARD',
  'NO_VACANT_POSITION',
  'EMPLOYEE_REJECTED_ALTERNATIVE',
  'OTHER',
  'NO_COVERED_DISABILITY',
  'DIRECT_THREAT',
] as const;
export type MhdAccommodationDenialReason = (typeof MHD_ACCOMMODATION_DENIAL_REASONS)[number];

/** Which codes need their specifics, mirroring requires_detail / requires_alternative in the table. */
export const MHD_ACCOMMODATION_DENIAL_REASON_RULES: Readonly<
  Record<MhdAccommodationDenialReason, { requiresDetail: boolean; requiresAlternative: boolean }>
> = {
  INEFFECTIVE: { requiresDetail: false, requiresAlternative: false },
  UNDUE_HARDSHIP: { requiresDetail: true, requiresAlternative: false },
  MEDICAL_DOCUMENTATION_INADEQUATE: { requiresDetail: false, requiresAlternative: false },
  REMOVES_ESSENTIAL_FUNCTION: { requiresDetail: true, requiresAlternative: false },
  LOWERS_STANDARD: { requiresDetail: true, requiresAlternative: false },
  NO_VACANT_POSITION: { requiresDetail: true, requiresAlternative: false },
  EMPLOYEE_REJECTED_ALTERNATIVE: { requiresDetail: true, requiresAlternative: true },
  OTHER: { requiresDetail: true, requiresAlternative: false },
  NO_COVERED_DISABILITY: { requiresDetail: false, requiresAlternative: false },
  DIRECT_THREAT: { requiresDetail: true, requiresAlternative: false },
};

/** A row of accommodation_denial_reason_codes. */
export interface MhdAccommodationDenialReasonCode {
  code: MhdAccommodationDenialReason;
  label: string;
  sortOrder: number;
  requiresDetail: boolean;
  detailPrompt: string | null;
  requiresAlternative: boolean;
  alternativePrompt: string | null;
}

/** One reason sent with a decision (p_denial_reasons). */
export interface MhdAccommodationDenialReasonInput {
  code: MhdAccommodationDenialReason;
  detail?: string | null;
  alternativeOffered?: string | null;
}

/** accommodation_request_duration_allowed (0387). */
export const MHD_ACCOMMODATION_LIMITATION_DURATIONS = [
  'PERMANENT',
  'TEMPORARY',
  'UNKNOWN',
] as const;
export type MhdAccommodationLimitationDuration =
  (typeof MHD_ACCOMMODATION_LIMITATION_DURATIONS)[number];

/** accommodation_request_certified_method_allowed (0387). */
export const MHD_ACCOMMODATION_CERTIFICATION_METHODS = [
  'SELF_SERVICE',
  'IN_PERSON_PAPER',
  'E_SIGNATURE',
] as const;
export type MhdAccommodationCertificationMethod =
  (typeof MHD_ACCOMMODATION_CERTIFICATION_METHODS)[number];

/** accommodation_implementations_status (0053): IN_PROGRESS means ordered equipment has not arrived. */
export const MHD_ACCOMMODATION_IMPLEMENTATION_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'ACTIVE',
  'ENDED',
  'CANCELLED',
] as const;

/**
 * The status each decision/implementation step must start from (mhd_accommodation_transition graph, 0388).
 * The interface offers a control only in its status; the database refuses it anywhere else (22023).
 */
export const MHD_ACCOMMODATION_DECIDE_FROM_STATUS: MhdAccommodationStatus = 'EVALUATION';
export const MHD_ACCOMMODATION_IMPLEMENT_FROM_STATUS: MhdAccommodationStatus = 'DECIDED';

export interface MhdAccommodationRequestDetailsInput {
  caseId: string;
  limitationDuration?: MhdAccommodationLimitationDuration | null;
  anticipatedRecoveryDate?: string | null;
  workersCompClaim?: boolean;
  workersCompClaimFiledOn?: string | null;
  leaveRequested?: boolean;
  leaveRequestDetails?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  workLocation?: string | null;
  supervisorName?: string | null;
  supervisorPersonId?: string | null;
}

export interface MhdAccommodationEmployeeCertifyInput {
  caseId: string;
  method?: MhdAccommodationCertificationMethod;
}

export interface MhdAccommodationProviderCertificationInput {
  caseId: string;
  /** Encrypted at rest; never returned except by the audited reveal. */
  providerName?: string | null;
  certifiedAt?: string | null;
  disabilityVerified?: boolean;
  limitationDuration?: MhdAccommodationLimitationDuration | null;
  limitationEndDate?: string | null;
  accommodationBeginOn?: string | null;
  accommodationEndOn?: string | null;
  accommodationContinuous?: boolean;
  /** Functional recommendation only: never a diagnosis, causation, or genetic information. */
  recommendation?: string | null;
  jobDutyStatementSentAt?: string | null;
  attachmentId?: string | null;
}

export interface MhdAccommodationEquipmentInput {
  implementationId: string;
  orderedOn?: string | null;
  orderedBy?: string | null;
  receivedOn?: string | null;
}

export function mhdFormatAccommodationValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * The reusable option-catalog library (0186_accommodation_option_catalog.sql).
 * Completely separate from `accommodation_options` above, which stays
 * free-text and case-specific — this is a library of common starting points
 * a case's option-evaluation step may copy from and then edit, never a
 * constraint on the case. Carries no medical content and no case/person
 * linkage.
 */
export type MhdAccommodationOptionCatalogCategory =
  | 'SCHEDULE'
  | 'EQUIPMENT'
  | 'FACILITIES'
  | 'JOB_RESTRUCTURING'
  | 'REASSIGNMENT'
  | 'LEAVE_RELATED'
  | 'TECHNOLOGY'
  | 'POLICY_EXCEPTION'
  | 'OTHER';

export const MHD_ACCOMMODATION_OPTION_CATALOG_CATEGORIES: readonly MhdAccommodationOptionCatalogCategory[] =
  [
    'SCHEDULE',
    'EQUIPMENT',
    'FACILITIES',
    'JOB_RESTRUCTURING',
    'REASSIGNMENT',
    'LEAVE_RELATED',
    'TECHNOLOGY',
    'POLICY_EXCEPTION',
    'OTHER',
  ];

export type MhdAccommodationFunctionalLimitationTag =
  | 'MOBILITY'
  | 'LIFTING_CARRYING'
  | 'STANDING_SITTING'
  | 'FINE_MOTOR'
  | 'VISION'
  | 'HEARING'
  | 'SPEECH_COMMUNICATION'
  | 'CONCENTRATION_MEMORY'
  | 'STRESS_MENTAL_HEALTH'
  | 'FATIGUE_STAMINA'
  | 'RESPIRATORY_ENVIRONMENTAL'
  | 'COMMUTE_TRAVEL'
  | 'TEMPERATURE_SENSITIVITY';

export const MHD_ACCOMMODATION_FUNCTIONAL_LIMITATION_TAGS: readonly MhdAccommodationFunctionalLimitationTag[] =
  [
    'MOBILITY',
    'LIFTING_CARRYING',
    'STANDING_SITTING',
    'FINE_MOTOR',
    'VISION',
    'HEARING',
    'SPEECH_COMMUNICATION',
    'CONCENTRATION_MEMORY',
    'STRESS_MENTAL_HEALTH',
    'FATIGUE_STAMINA',
    'RESPIRATORY_ENVIRONMENTAL',
    'COMMUTE_TRAVEL',
    'TEMPERATURE_SENSITIVITY',
  ];

export interface MhdAccommodationOptionCatalogEntryRpcRow {
  id: string;
  company_id: string | null;
  option_type: string;
  description_template: string;
  category: MhdAccommodationOptionCatalogCategory;
  functional_limitation_tags: string[];
  typical_cost_range: string | null;
  source_option_id: string | null;
  is_active: boolean;
  sort_order: number;
  /** true when company_id is null — a global/platform library entry. */
  is_library: boolean;
}

export interface MhdAccommodationOptionCatalogEntry {
  id: string;
  companyId: string | null;
  optionType: string;
  descriptionTemplate: string;
  category: MhdAccommodationOptionCatalogCategory;
  functionalLimitationTags: string[];
  typicalCostRange: string | null;
  sourceOptionId: string | null;
  isActive: boolean;
  sortOrder: number;
  isLibrary: boolean;
}

export interface MhdCreateAccommodationOptionCatalogEntryInput {
  /** null creates a global/platform library entry (Platform Admin/HR Partner only, server-enforced). */
  companyId: string | null;
  optionType: string;
  descriptionTemplate: string;
  category?: MhdAccommodationOptionCatalogCategory;
  functionalLimitationTags?: string[];
  typicalCostRange?: string | null;
  sortOrder?: number;
  sourceOptionId?: string | null;
}

export interface MhdUpdateAccommodationOptionCatalogEntryInput {
  entryId: string;
  descriptionTemplate?: string;
  category?: MhdAccommodationOptionCatalogCategory;
  functionalLimitationTags?: string[];
  typicalCostRange?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}
