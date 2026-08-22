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
  'SIMPLE_CERTIFICATION' | 'DETAILED_CERTIFICATION' | 'PROVIDER_NOTE' | 'OTHER';

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
  denial_reason_code: string | null;
  decision_summary: string;
  alternatives_considered: unknown[];
  interactive_process_continues: boolean;
  decided_at: string;
  superseded_at: string | null;
}

export interface MhdAccommodationImplementation {
  id: string;
  option_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  manager_instruction: string;
  review_due_date: string | null;
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

export interface MhdAccommodationDetail {
  case: MhdAccommodationCase;
  interactions: MhdAccommodationInteraction[];
  options: MhdAccommodationOption[];
  decisions: MhdAccommodationDecision[];
  implementations: MhdAccommodationImplementation[];
  reviews: MhdAccommodationReview[];
  medical_status: MhdAccommodationMedicalStatus[];
}

export interface MhdCreateAccommodationInput {
  companyId: string;
  personId: string;
  requestSource: MhdAccommodationRequestSource;
  requestChannel: MhdAccommodationRequestChannel;
  requestedAt: string;
  requestSummary: string;
  leaveCaseId?: string | null;
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

export const MHD_ACCOMMODATION_DOCUMENTATION_TYPES: readonly MhdAccommodationDocumentationType[] = [
  'SIMPLE_CERTIFICATION',
  'DETAILED_CERTIFICATION',
  'PROVIDER_NOTE',
  'OTHER',
];

export const MHD_ACCOMMODATION_DOCUMENTATION_STATUSES: readonly MhdAccommodationDocumentationStatus[] =
  ['NOT_NEEDED', 'REQUESTED', 'RECEIVED', 'INCOMPLETE', 'SUFFICIENT', 'EXPIRED', 'WAIVED'];

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

export const MHD_ACCOMMODATION_FUNCTIONAL_LIMITATION_TAGS: readonly MhdAccommodationFunctionalLimitationTag[] = [
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
  typicalCostRange?: string | null;
  sortOrder?: number;
  sourceOptionId?: string | null;
}

export interface MhdUpdateAccommodationOptionCatalogEntryInput {
  entryId: string;
  descriptionTemplate?: string;
  category?: MhdAccommodationOptionCatalogCategory;
  typicalCostRange?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}
