// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// These mirror the shapes in `Database['public']['Functions']['mhd_training_*']`
// as regenerated after migration 0040. They are kept as local interfaces (rather
// than aliased off the generated types) so the mappers below can normalise the
// PostgREST numeric-string quirk without fighting the generated `number` typing.
//
// Two numeric business fields exist here — `duration_minutes` and
// `recurrence_months` — and both are typed `number | string | null` because
// PostgREST can serialise an integer column as a JSON string. Every mapper below
// runs them through `mhdToNumber()`; never compare or arithmetic a raw row value.
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_training_course_list`. */
export interface MhdTrainingCourseRpcRow {
  id: string;
  reference_id: string;
  company_id: string | null;
  course_key: string;
  title: string;
  description: string | null;
  category: string;
  delivery_mode: string;
  duration_minutes: number | string | null;
  recurrence_months: number | string | null;
  requires_evidence: boolean;
  external_url: string | null;
  is_active: boolean;
  // `company_id is null` computed server-side. A global course is platform-owned
  // and read-only to a tenant admin (update / set_active refuse it) — the UI
  // reads this flag to hide the edit and retire affordances.
  is_global: boolean;
  content_mode: string;
  program_id: string | null;
  template_id: string | null;
  source_course_id: string | null;
  fork_state: string;
  content_version: number | string;
  approval_status: string;
}

export interface MhdTrainingCurriculumRpcRow {
  id: string;
  reference_id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  is_active: boolean;
  is_global: boolean;
}

export interface MhdTrainingProgramRpcRow {
  id: string;
  reference_id: string;
  company_id: string | null;
  curriculum_id: string | null;
  title: string;
  description: string | null;
  sort_order: number | string;
  is_global: boolean;
}

/** Row shape returned by `mhd_training_list_assignments`. */
export interface MhdTrainingAssignmentRpcRow {
  id: string;
  reference_id: string;
  course_id: string;
  course_title: string;
  category: string;
  person_id: string;
  person_display_name: string;
  assigned_by: string;
  due_date: string | null;
  status: string;
  // Derived server-side by `mhd_training_compliance_status`. RENDER it, never
  // recompute compliance/expiry client-side — the frozen completion rows are the
  // only authority and they live server-side.
  compliance_status: string;
  source_type: string;
  source_id: string | null;
  is_emergency_priority: boolean;
  created_at: string;
}

export interface MhdTrainingComplianceRuleRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  title: string;
  target_type: string;
  target_department: string | null;
  target_job_id: string | null;
  target_jurisdiction: string | null;
  course_id: string;
  course_title: string;
  due_offset_days: number | string | null;
  is_active: boolean;
}

export interface MhdTrainingSelfEnrollmentRequestRpcRow {
  id: string;
  reference_id: string;
  course_id: string;
  course_title: string;
  person_id: string;
  person_display_name: string;
  status: string;
  requested_at: string;
  decided_at: string | null;
  decision_notes: string | null;
}

export interface MhdTrainingAssignProgramRpcRow {
  course_id: string;
  assignment_id: string;
}

export interface MhdTrainingComplianceRuleApplyRpcRow {
  assigned_person_id: string;
  assignment_id: string;
}

export interface MhdTrainingComplianceRuleApplyResult {
  assignedPersonId: string;
  assignmentId: string;
}

export interface MhdTrainingSelfEnrollmentDecisionRpcRow {
  assignment_id: string | null;
}

/** Row shape returned by `mhd_training_list_completions`. */
export interface MhdTrainingCompletionRpcRow {
  id: string;
  reference_id: string;
  course_id: string;
  course_title: string;
  completed_at: string;
  completion_method: string;
  expires_at: string | null;
  attachment_id: string | null;
  // Derived server-side (`expires_at <= now`). RENDER it verbatim — do not
  // re-derive expiry from `expires_at` on the client.
  is_expired: boolean;
}

/** Row shape returned by `mhd_training_compliance` (the consumer contract). */
export interface MhdTrainingComplianceRpcRow {
  course_id: string;
  course_title: string;
  category: string;
  status: string;
  last_completed_at: string | null;
  expires_at: string | null;
}

/** Row shape returned by `mhd_training_compliance_matrix` (the admin board). */
export interface MhdTrainingComplianceMatrixRpcRow {
  person_id: string;
  person_display_name: string;
  course_id: string;
  course_title: string;
  category: string;
  status: string;
  expires_at: string | null;
}

/** Row shape returned by a create/assign RPC that mints a reference: `(id, reference_id)`. */
export interface MhdTrainingMutationRpcRow {
  id: string;
  reference_id: string;
}

/** Row shape returned by the completion RPCs: `(id, reference_id, expires_at)`. */
export interface MhdTrainingCompletionResultRpcRow {
  id: string;
  reference_id: string;
  expires_at: string | null;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdTrainingCourseId = string;
export type MhdTrainingAssignmentId = string;
export type MhdTrainingCompletionId = string;
export type MhdTrainingCurriculumId = string;
export type MhdTrainingProgramId = string;
export type MhdTrainingCourseModuleId = string;
export type MhdTrainingLessonId = string;
export type MhdTrainingBlockId = string;
export type MhdTrainingComplianceRuleId = string;
export type MhdTrainingSelfEnrollmentRequestId = string;

export type MhdTrainingCourseReferenceId = `TRN-${string}`;
export type MhdTrainingAssignmentReferenceId = `TRA-${string}`;
export type MhdTrainingCompletionReferenceId = `TRC-${string}`;
export type MhdTrainingCurriculumReferenceId = `CUR-${string}`;
export type MhdTrainingProgramReferenceId = `PRG-${string}`;
export type MhdTrainingTemplateReferenceId = `TPL-${string}`;
export type MhdTrainingCourseModuleReferenceId = `TCM-${string}`;
export type MhdTrainingLessonReferenceId = `LSN-${string}`;
export type MhdTrainingBlockReferenceId = `BLK-${string}`;
export type MhdTrainingComplianceRuleReferenceId = `TCR-${string}`;
export type MhdTrainingSelfEnrollmentRequestReferenceId = `TSR-${string}`;

export type MhdTrainingCategory =
  'HARASSMENT' | 'SAFETY' | 'COMPLIANCE' | 'SKILLS' | 'ONBOARDING' | 'OTHER';

export type MhdTrainingDeliveryMode = 'IN_PERSON' | 'ONLINE' | 'DOCUMENT' | 'EXTERNAL';

export type MhdTrainingAssignmentStatus = 'ASSIGNED' | 'COMPLETED' | 'WAIVED' | 'CANCELLED';
export type MhdTrainingAssignmentSourceType =
  | 'MANUAL'
  | 'COMPLIANCE_RULE'
  | 'COMPETENCY_GAP'
  | 'SELF_ENROLLMENT'
  | 'ONBOARDING_BUNDLE'
  | 'CORRECTIVE_ACTION';
export type MhdTrainingComplianceRuleTargetType = 'ORG_UNIT' | 'JOB_TITLE' | 'JURISDICTION';
export type MhdTrainingSelfEnrollmentStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export type MhdTrainingCompletionMethod = 'ATTESTED' | 'CERTIFICATE' | 'ADMIN_RECORDED';
export type MhdTrainingContentMode = 'EVIDENCE_ONLY' | 'AUTHORED';
export type MhdTrainingForkState = 'LINKED' | 'FORKED';
export type MhdTrainingApprovalStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED';
export type MhdTrainingBlockType =
  | 'RICH_TEXT'
  | 'VIDEO'
  | 'AUDIO'
  | 'IMAGE'
  | 'FILE_DOWNLOAD'
  | 'EMBED'
  | 'CALLOUT'
  | 'ACCORDION'
  | 'FLIP_CARDS'
  | 'HOTSPOT_IMAGE'
  | 'DRAG_DROP_SORT'
  | 'MATCHING'
  | 'TIMELINE'
  | 'SCENARIO_BRANCHING'
  | 'REFLECTION_PROMPT'
  | 'KNOWLEDGE_CHECK'
  | 'DISCUSSION_PROMPT'
  | 'CODE_FORMULA'
  | 'TABLE'
  | 'CHECKLIST'
  | 'JOB_AID'
  | 'AI_CONVERSATION';

/**
 * The DERIVED compliance vocabulary. Never stored — `mhd_training_compliance_status`
 * computes it from the frozen completion rows and the live assignment. The UI
 * renders whatever the server returned; it does not derive these.
 */
export type MhdTrainingComplianceStatus = 'CURRENT' | 'EXPIRED' | 'OVERDUE' | 'ASSIGNED' | 'NONE';

export const MHD_TRAINING_CATEGORIES = [
  'HARASSMENT',
  'SAFETY',
  'COMPLIANCE',
  'SKILLS',
  'ONBOARDING',
  'OTHER',
] as const satisfies readonly MhdTrainingCategory[];

export const MHD_TRAINING_DELIVERY_MODES = [
  'IN_PERSON',
  'ONLINE',
  'DOCUMENT',
  'EXTERNAL',
] as const satisfies readonly MhdTrainingDeliveryMode[];

export const MHD_TRAINING_ASSIGNMENT_STATUSES = [
  'ASSIGNED',
  'COMPLETED',
  'WAIVED',
  'CANCELLED',
] as const satisfies readonly MhdTrainingAssignmentStatus[];

export const MHD_TRAINING_ASSIGNMENT_SOURCE_TYPES = [
  'MANUAL',
  'COMPLIANCE_RULE',
  'COMPETENCY_GAP',
  'SELF_ENROLLMENT',
  'ONBOARDING_BUNDLE',
  'CORRECTIVE_ACTION',
] as const satisfies readonly MhdTrainingAssignmentSourceType[];

export const MHD_TRAINING_COMPLIANCE_RULE_TARGET_TYPES = [
  'ORG_UNIT',
  'JOB_TITLE',
  'JURISDICTION',
] as const satisfies readonly MhdTrainingComplianceRuleTargetType[];

export const MHD_TRAINING_SELF_ENROLLMENT_STATUSES = [
  'PENDING',
  'APPROVED',
  'DENIED',
] as const satisfies readonly MhdTrainingSelfEnrollmentStatus[];

export const MHD_TRAINING_COMPLETION_METHODS = [
  'ATTESTED',
  'CERTIFICATE',
  'ADMIN_RECORDED',
] as const satisfies readonly MhdTrainingCompletionMethod[];

export const MHD_TRAINING_COMPLIANCE_STATUSES = [
  'CURRENT',
  'EXPIRED',
  'OVERDUE',
  'ASSIGNED',
  'NONE',
] as const satisfies readonly MhdTrainingComplianceStatus[];

export const MHD_TRAINING_CONTENT_MODES = [
  'EVIDENCE_ONLY',
  'AUTHORED',
] as const satisfies readonly MhdTrainingContentMode[];
export const MHD_TRAINING_FORK_STATES = [
  'LINKED',
  'FORKED',
] as const satisfies readonly MhdTrainingForkState[];
export const MHD_TRAINING_APPROVAL_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'PUBLISHED',
] as const satisfies readonly MhdTrainingApprovalStatus[];
export const MHD_TRAINING_BLOCK_TYPES = [
  'RICH_TEXT',
  'VIDEO',
  'AUDIO',
  'IMAGE',
  'FILE_DOWNLOAD',
  'EMBED',
  'CALLOUT',
  'ACCORDION',
  'FLIP_CARDS',
  'HOTSPOT_IMAGE',
  'DRAG_DROP_SORT',
  'MATCHING',
  'TIMELINE',
  'SCENARIO_BRANCHING',
  'REFLECTION_PROMPT',
  'KNOWLEDGE_CHECK',
  'DISCUSSION_PROMPT',
  'CODE_FORMULA',
  'TABLE',
  'CHECKLIST',
  'JOB_AID',
  'AI_CONVERSATION',
] as const satisfies readonly MhdTrainingBlockType[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

/**
 * A catalog course, from `course_list`. `isGlobal` (`company_id IS NULL`) marks
 * a platform-seeded course that a tenant admin may READ but never edit or retire
 * — the update / set_active RPCs refuse it, and the UI hides those affordances.
 * `recurrenceMonths` is `null` for a one-time course (no expiry).
 */
export interface MhdTrainingCourse {
  id: MhdTrainingCourseId;
  referenceId: MhdTrainingCourseReferenceId;
  companyId: string | null;
  courseKey: string;
  title: string;
  description: string | null;
  category: MhdTrainingCategory;
  deliveryMode: MhdTrainingDeliveryMode;
  durationMinutes: number | null;
  recurrenceMonths: number | null;
  requiresEvidence: boolean;
  externalUrl: string | null;
  isActive: boolean;
  isGlobal: boolean;
  contentMode: MhdTrainingContentMode;
  programId: MhdTrainingProgramId | null;
  templateId: string | null;
  sourceCourseId: MhdTrainingCourseId | null;
  forkState: MhdTrainingForkState;
  contentVersion: number;
  approvalStatus: MhdTrainingApprovalStatus;
}

export interface MhdTrainingCurriculum {
  id: MhdTrainingCurriculumId;
  referenceId: MhdTrainingCurriculumReferenceId;
  companyId: string | null;
  title: string;
  description: string | null;
  isActive: boolean;
  isGlobal: boolean;
}

export interface MhdTrainingProgram {
  id: MhdTrainingProgramId;
  referenceId: MhdTrainingProgramReferenceId;
  companyId: string | null;
  curriculumId: MhdTrainingCurriculumId | null;
  title: string;
  description: string | null;
  sortOrder: number;
  isGlobal: boolean;
}

export interface MhdTrainingCourseModule extends MhdMutationResult {
  referenceId: MhdTrainingCourseModuleReferenceId;
}
export interface MhdTrainingLesson extends MhdMutationResult {
  referenceId: MhdTrainingLessonReferenceId;
}
export interface MhdTrainingBlock extends MhdMutationResult {
  referenceId: MhdTrainingBlockReferenceId;
}

/**
 * One assignment row, carrying its SERVER-DERIVED `complianceStatus`. The status
 * is authoritative and already accounts for a completion's frozen expiry — the
 * component renders it and does not recompute compliance from dates.
 */
export interface MhdTrainingAssignment {
  id: MhdTrainingAssignmentId;
  referenceId: MhdTrainingAssignmentReferenceId;
  courseId: MhdTrainingCourseId;
  courseTitle: string;
  category: MhdTrainingCategory;
  personId: string;
  personDisplayName: string;
  assignedBy: string;
  dueDate: string | null;
  status: MhdTrainingAssignmentStatus;
  complianceStatus: MhdTrainingComplianceStatus;
  sourceType: MhdTrainingAssignmentSourceType;
  sourceId: string | null;
  isEmergencyPriority: boolean;
  createdAt: string;
}

export interface MhdTrainingComplianceRule {
  id: MhdTrainingComplianceRuleId;
  referenceId: MhdTrainingComplianceRuleReferenceId;
  companyId: string;
  title: string;
  targetType: MhdTrainingComplianceRuleTargetType;
  targetDepartment: string | null;
  targetJobId: string | null;
  targetJurisdiction: string | null;
  courseId: MhdTrainingCourseId;
  courseTitle: string;
  dueOffsetDays: number | null;
  isActive: boolean;
}

export interface MhdTrainingSelfEnrollmentRequest {
  id: MhdTrainingSelfEnrollmentRequestId;
  referenceId: MhdTrainingSelfEnrollmentRequestReferenceId;
  courseId: MhdTrainingCourseId;
  courseTitle: string;
  personId: string;
  personDisplayName: string;
  status: MhdTrainingSelfEnrollmentStatus;
  requestedAt: string;
  decidedAt: string | null;
  decisionNotes: string | null;
}

export interface MhdTrainingAssignProgramResult {
  courseId: MhdTrainingCourseId;
  assignmentId: MhdTrainingAssignmentId;
}

export interface MhdTrainingSelfEnrollmentDecisionResult {
  assignmentId: MhdTrainingAssignmentId | null;
}

/**
 * One completion from the append-only ledger. `isExpired` is derived server-side;
 * render it rather than re-deriving expiry from `expiresAt`. `expiresAt` is `null`
 * for a one-time course and is FROZEN at completion time — reconfiguring the
 * course later never moves it.
 */
export interface MhdTrainingCompletion {
  id: MhdTrainingCompletionId;
  referenceId: MhdTrainingCompletionReferenceId;
  courseId: MhdTrainingCourseId;
  courseTitle: string;
  completedAt: string;
  completionMethod: MhdTrainingCompletionMethod;
  expiresAt: string | null;
  attachmentId: string | null;
  isExpired: boolean;
}

/** One row of the consumer compliance contract (`mhd_training_compliance`). */
export interface MhdTrainingCompliance {
  courseId: MhdTrainingCourseId;
  courseTitle: string;
  category: MhdTrainingCategory;
  status: MhdTrainingComplianceStatus;
  lastCompletedAt: string | null;
  expiresAt: string | null;
}

/** One cell of the admin compliance board (`mhd_training_compliance_matrix`). */
export interface MhdTrainingComplianceMatrixRow {
  personId: string;
  personDisplayName: string;
  courseId: MhdTrainingCourseId;
  courseTitle: string;
  category: MhdTrainingCategory;
  status: MhdTrainingComplianceStatus;
  expiresAt: string | null;
}

/** Mapped result of a create / assign RPC that mints a reference. */
export interface MhdMutationResult {
  id: string;
  referenceId: string;
}

/** Mapped result of a completion RPC — carries the frozen `expiresAt`. */
export interface MhdTrainingCompletionResult {
  id: string;
  referenceId: string;
  expiresAt: string | null;
}

// ---------------------------------------------------------------------------
// Inputs and filters
// ---------------------------------------------------------------------------

export interface MhdCreateCourseInput {
  companyId: string;
  courseKey: string;
  title: string;
  description?: string | null;
  category?: MhdTrainingCategory;
  deliveryMode?: MhdTrainingDeliveryMode;
  durationMinutes?: number | null;
  recurrenceMonths?: number | null;
  requiresEvidence?: boolean;
  externalUrl?: string | null;
  // The remaining new-in-v2 course fields (contentMode, templateId, sourceCourseId, forkState,
  // contentVersion, approvalStatus) are NOT creation inputs — the RPC sets them server-side
  // (defaults, or via mhd_training_course_set_content_mode / the fork / approval RPCs). Only
  // programId is accepted at creation.
  programId?: MhdTrainingProgramId | null;
}

export interface MhdCreateCurriculumInput {
  companyId: string;
  title: string;
  description?: string | null;
}
export interface MhdTrainingProgramFilters {
  companyId: string | null;
  curriculumId?: MhdTrainingCurriculumId | null;
}
export interface MhdCreateProgramInput {
  companyId: string;
  title: string;
  curriculumId?: MhdTrainingCurriculumId | null;
  description?: string | null;
  sortOrder?: number;
}
export interface MhdCreateCourseModuleInput {
  courseId: MhdTrainingCourseId;
  title: string;
  description?: string | null;
  sortOrder?: number;
}
export interface MhdCreateLessonInput {
  moduleId: MhdTrainingCourseModuleId;
  title: string;
  description?: string | null;
  sortOrder?: number;
}
export interface MhdCreateBlockInput {
  lessonId: MhdTrainingLessonId;
  blockType: MhdTrainingBlockType;
  content?: Record<string, unknown>;
  title?: string | null;
  sortOrder?: number;
  altText?: string | null;
  transcript?: string | null;
}
export interface MhdSetCourseContentModeInput {
  courseId: MhdTrainingCourseId;
  contentMode: MhdTrainingContentMode;
}
export interface MhdForkCourseInput {
  courseId: MhdTrainingCourseId;
  companyId: string;
}
export interface MhdSubmitContentForReviewInput {
  courseId: MhdTrainingCourseId;
}
export interface MhdApproveContentInput {
  courseId: MhdTrainingCourseId;
  reviewNotes?: string | null;
}
export interface MhdPublishContentInput {
  courseId: MhdTrainingCourseId;
}
export interface MhdPrerequisiteInput {
  courseId: MhdTrainingCourseId;
  prerequisiteCourseId: MhdTrainingCourseId;
}

export interface MhdUpdateCourseInput {
  courseId: MhdTrainingCourseId;
  title?: string | null;
  description?: string | null;
  category?: MhdTrainingCategory | null;
  deliveryMode?: MhdTrainingDeliveryMode | null;
  durationMinutes?: number | null;
  recurrenceMonths?: number | null;
  requiresEvidence?: boolean | null;
  externalUrl?: string | null;
}

export interface MhdSetCourseActiveInput {
  courseId: MhdTrainingCourseId;
  isActive: boolean;
}

export interface MhdAssignTrainingInput {
  companyId: string;
  courseId: MhdTrainingCourseId;
  personId: string;
  dueDate?: string | null;
  sourceType?: MhdTrainingAssignmentSourceType;
  sourceId?: string | null;
  isEmergencyPriority?: boolean;
}

export interface MhdCreateTrainingComplianceRuleInput {
  companyId: string;
  title: string;
  targetType: MhdTrainingComplianceRuleTargetType;
  courseId: MhdTrainingCourseId;
  targetDepartment?: string | null;
  targetJobId?: string | null;
  targetJurisdiction?: string | null;
  dueOffsetDays?: number | null;
}

export interface MhdListTrainingComplianceRulesInput {
  companyId: string;
}

export interface MhdApplyTrainingComplianceRuleInput {
  ruleId: MhdTrainingComplianceRuleId;
}

export interface MhdSelfEnrollTrainingInput {
  companyId: string;
  courseId: MhdTrainingCourseId;
}

export interface MhdListTrainingSelfEnrollmentsInput {
  companyId: string;
  status?: MhdTrainingSelfEnrollmentStatus | null;
}

export interface MhdDecideTrainingSelfEnrollmentInput {
  requestId: MhdTrainingSelfEnrollmentRequestId;
  approve: boolean;
  notes?: string | null;
}

export interface MhdAssignTrainingProgramInput {
  companyId: string;
  programId: MhdTrainingProgramId;
  personId: string;
  dueDate?: string | null;
}

export interface MhdWaiveAssignmentInput {
  assignmentId: MhdTrainingAssignmentId;
  reason: string;
}

/**
 * Completing an assignment. `completionMethod` defaults to `ATTESTED`; when a
 * certificate `attachmentId` is provided the caller should pass `CERTIFICATE`.
 * `ADMIN_RECORDED` is refused for a non-admin at the RPC.
 */
export interface MhdCompleteTrainingInput {
  assignmentId: MhdTrainingAssignmentId;
  completionMethod?: MhdTrainingCompletionMethod;
  attachmentId?: string | null;
  completedAt?: string | null;
}

export interface MhdRecordAdminCompletionInput {
  companyId: string;
  courseId: MhdTrainingCourseId;
  personId: string;
  completedAt: string;
  attachmentId?: string | null;
}

export interface MhdTrainingCourseFilters {
  companyId: string | null;
  includeInactive?: boolean;
}

export interface MhdTrainingAssignmentFilters {
  companyId: string | null;
  personId?: string | null;
  status?: MhdTrainingAssignmentStatus | 'ALL' | null;
}

export interface MhdTrainingComplianceMatrixFilters {
  companyId: string | null;
  category?: MhdTrainingCategory | 'ALL' | null;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<MhdTrainingCategory, string> = {
  HARASSMENT: 'Harassment prevention',
  SAFETY: 'Safety',
  COMPLIANCE: 'Compliance',
  SKILLS: 'Skills',
  ONBOARDING: 'Onboarding',
  OTHER: 'Other',
};

const DELIVERY_MODE_LABELS: Record<MhdTrainingDeliveryMode, string> = {
  IN_PERSON: 'In person',
  ONLINE: 'Online',
  DOCUMENT: 'Document',
  EXTERNAL: 'External',
};

const ASSIGNMENT_STATUS_LABELS: Record<MhdTrainingAssignmentStatus, string> = {
  ASSIGNED: 'Assigned',
  COMPLETED: 'Completed',
  WAIVED: 'Waived',
  CANCELLED: 'Cancelled',
};
const ASSIGNMENT_SOURCE_TYPE_LABELS: Record<MhdTrainingAssignmentSourceType, string> = {
  MANUAL: 'Manual',
  COMPLIANCE_RULE: 'Compliance rule',
  COMPETENCY_GAP: 'Competency gap',
  SELF_ENROLLMENT: 'Self-enrollment',
  ONBOARDING_BUNDLE: 'Onboarding bundle',
  CORRECTIVE_ACTION: 'Corrective action',
};
const COMPLIANCE_RULE_TARGET_TYPE_LABELS: Record<MhdTrainingComplianceRuleTargetType, string> = {
  ORG_UNIT: 'Organization unit',
  JOB_TITLE: 'Job title',
  JURISDICTION: 'Jurisdiction',
};
const SELF_ENROLLMENT_STATUS_LABELS: Record<MhdTrainingSelfEnrollmentStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DENIED: 'Denied',
};

const COMPLETION_METHOD_LABELS: Record<MhdTrainingCompletionMethod, string> = {
  ATTESTED: 'Self-attested',
  CERTIFICATE: 'Certificate',
  ADMIN_RECORDED: 'Recorded by admin',
};

const COMPLIANCE_STATUS_LABELS: Record<MhdTrainingComplianceStatus, string> = {
  CURRENT: 'Current',
  EXPIRED: 'Expired',
  OVERDUE: 'Overdue',
  ASSIGNED: 'Assigned',
  NONE: 'None',
};
const CONTENT_MODE_LABELS: Record<MhdTrainingContentMode, string> = {
  EVIDENCE_ONLY: 'Evidence only',
  AUTHORED: 'Authored',
};
const FORK_STATE_LABELS: Record<MhdTrainingForkState, string> = {
  LINKED: 'Linked',
  FORKED: 'Forked',
};
const APPROVAL_STATUS_LABELS: Record<MhdTrainingApprovalStatus, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
};
const BLOCK_TYPE_LABELS: Record<MhdTrainingBlockType, string> = Object.fromEntries(
  MHD_TRAINING_BLOCK_TYPES.map((value) => [
    value,
    value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase()),
  ]),
) as Record<MhdTrainingBlockType, string>;

export function mhdFormatTrainingCategory(value: MhdTrainingCategory | string): string {
  return CATEGORY_LABELS[value as MhdTrainingCategory] ?? value;
}

export function mhdFormatTrainingDeliveryMode(value: MhdTrainingDeliveryMode | string): string {
  return DELIVERY_MODE_LABELS[value as MhdTrainingDeliveryMode] ?? value;
}

export function mhdFormatTrainingAssignmentStatus(
  value: MhdTrainingAssignmentStatus | string,
): string {
  return ASSIGNMENT_STATUS_LABELS[value as MhdTrainingAssignmentStatus] ?? value;
}

export function mhdFormatTrainingAssignmentSourceType(
  value: MhdTrainingAssignmentSourceType | string,
): string {
  return ASSIGNMENT_SOURCE_TYPE_LABELS[value as MhdTrainingAssignmentSourceType] ?? value;
}

export function mhdFormatTrainingComplianceRuleTargetType(
  value: MhdTrainingComplianceRuleTargetType | string,
): string {
  return COMPLIANCE_RULE_TARGET_TYPE_LABELS[value as MhdTrainingComplianceRuleTargetType] ?? value;
}

export function mhdFormatTrainingSelfEnrollmentStatus(
  value: MhdTrainingSelfEnrollmentStatus | string,
): string {
  return SELF_ENROLLMENT_STATUS_LABELS[value as MhdTrainingSelfEnrollmentStatus] ?? value;
}

export function mhdFormatTrainingCompletionMethod(
  value: MhdTrainingCompletionMethod | string,
): string {
  return COMPLETION_METHOD_LABELS[value as MhdTrainingCompletionMethod] ?? value;
}

export function mhdFormatTrainingComplianceStatus(
  value: MhdTrainingComplianceStatus | string,
): string {
  return COMPLIANCE_STATUS_LABELS[value as MhdTrainingComplianceStatus] ?? value;
}

export function mhdFormatTrainingContentMode(value: MhdTrainingContentMode | string): string {
  return CONTENT_MODE_LABELS[value as MhdTrainingContentMode] ?? value;
}
export function mhdFormatTrainingForkState(value: MhdTrainingForkState | string): string {
  return FORK_STATE_LABELS[value as MhdTrainingForkState] ?? value;
}
export function mhdFormatTrainingApprovalStatus(value: MhdTrainingApprovalStatus | string): string {
  return APPROVAL_STATUS_LABELS[value as MhdTrainingApprovalStatus] ?? value;
}
export function mhdFormatTrainingBlockType(value: MhdTrainingBlockType | string): string {
  return BLOCK_TYPE_LABELS[value as MhdTrainingBlockType] ?? value;
}

/**
 * Human phrasing for a course's recurrence. `null` recurrence is a one-time
 * course (no expiry) — the whole reason the field is nullable.
 */
export function mhdFormatTrainingRecurrence(recurrenceMonths: number | null): string {
  if (recurrenceMonths == null) return 'One-time (no expiry)';
  if (recurrenceMonths === 12) return 'Every 12 months';
  return `Every ${recurrenceMonths} month${recurrenceMonths === 1 ? '' : 's'}`;
}

/**
 * PostgREST serialises a numeric/integer column as a string in some paths;
 * normalise before any arithmetic or comparison. Copied verbatim from the house
 * pattern (Investigations / Leaves). Used here by the course mapper for
 * `duration_minutes` and `recurrence_months`.
 */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ---------------------------------------------------------------------------
// LMS v2 learner delivery
// ---------------------------------------------------------------------------

export interface MhdTrainingRichTextContent { html: string }
export interface MhdTrainingImageContent { url: string }
export interface MhdTrainingVideoContent { url: string }
export interface MhdTrainingFileDownloadContent { url: string; fileName?: string }
export interface MhdTrainingCalloutContent { tone?: 'info' | 'warning' | 'success'; text: string }
export interface MhdTrainingChecklistContent { items: string[] }
export interface MhdTrainingTableContent { headers: string[]; rows: string[][] }
export interface MhdTrainingKnowledgeCheckContent {
  question: string;
  options: string[];
  answerIndex: number;
}
export interface MhdTrainingReflectionPromptContent { prompt: string }

export type MhdTrainingBlockContent =
  | { blockType: 'RICH_TEXT'; content: MhdTrainingRichTextContent }
  | { blockType: 'IMAGE'; content: MhdTrainingImageContent }
  | { blockType: 'VIDEO'; content: MhdTrainingVideoContent }
  | { blockType: 'FILE_DOWNLOAD'; content: MhdTrainingFileDownloadContent }
  | { blockType: 'CALLOUT'; content: MhdTrainingCalloutContent }
  | { blockType: 'CHECKLIST'; content: MhdTrainingChecklistContent }
  | { blockType: 'TABLE'; content: MhdTrainingTableContent }
  | { blockType: 'KNOWLEDGE_CHECK'; content: MhdTrainingKnowledgeCheckContent }
  | { blockType: 'REFLECTION_PROMPT'; content: MhdTrainingReflectionPromptContent }
  | { blockType: Exclude<MhdTrainingBlockType, 'RICH_TEXT' | 'IMAGE' | 'VIDEO' | 'FILE_DOWNLOAD' | 'CALLOUT' | 'CHECKLIST' | 'TABLE' | 'KNOWLEDGE_CHECK' | 'REFLECTION_PROMPT'>; content: Record<string, unknown> };

export interface MhdTrainingContentTreeBlock {
  id: MhdTrainingBlockId;
  blockType: MhdTrainingBlockType;
  title: string | null;
  content: Record<string, unknown>;
  sortOrder: number;
  altText: string | null;
  transcript: string | null;
}

export interface MhdTrainingContentTreeLesson {
  id: MhdTrainingLessonId;
  title: string;
  sortOrder: number;
  blocks: MhdTrainingContentTreeBlock[];
}

export interface MhdTrainingContentTreeModule {
  id: MhdTrainingCourseModuleId;
  title: string;
  sortOrder: number;
  lessons: MhdTrainingContentTreeLesson[];
}

export type MhdTrainingContentTree = MhdTrainingContentTreeModule[];
export type MhdTrainingBlockProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';

export interface MhdTrainingBlockProgress {
  blockId: MhdTrainingBlockId;
  status: MhdTrainingBlockProgressStatus;
  response: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface MhdTrainingBlockCompletionResult { courseCompleted: boolean }
