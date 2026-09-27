// ---------------------------------------------------------------------------
import type { Database } from '@/types/database.types';

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

export interface MhdTrainingBlockTranslationRpcRow {
  id: string;
  locale: string;
  content: Record<string, unknown>;
  alt_text: string | null;
  transcript: string | null;
  updated_at: string | null;
}

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
  retired_at: string | null;
  successor_course_id: string | null;
  successor_course_title: string | null;
}

export interface MhdTrainingManagerTeamStatusRpcRow {
  person_id: string;
  person_display_name: string;
  course_id: string;
  course_title: string;
  status: string;
  compliance_status: string;
  due_date: string | null;
}

export interface MhdTrainingBulkAssignRpcRow {
  person_id: string;
  assignment_id: string;
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
  is_active: boolean;
  is_global: boolean;
}

export interface MhdTrainingPrerequisiteRpcRow {
  prerequisite_course_id: string;
  prerequisite_title: string;
  prerequisite_course_key: string;
  created_at: string;
}

export interface MhdTrainingContentApprovalRpcRow {
  id: string;
  from_status: string;
  to_status: string;
  content_version: number;
  review_notes: string | null;
  reviewed_by_name: string;
  created_at: string;
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

/** Row returned by `mhd_training_certificate_generate`. */
export interface MhdTrainingCertificateGenerationRpcRow {
  id: string;
  reference_id: string;
  status: string;
}

export interface MhdTrainingTimeOnTaskRpcRow {
  person_id: string;
  block_id: string;
  minutes: number | string;
}

export interface MhdTrainingExternalAuditorGrantRpcRow {
  id: string;
  reference_id: string;
}

export interface MhdTrainingExternalAuditorGrantListRpcRow {
  id: string;
  reference_id: string;
  course_id: string;
  course_title: string;
  auditor_label: string;
  valid_from: string;
  valid_until: string;
  revoked_at: string | null;
  created_at: string;
}

export interface MhdTrainingContentLicenseRpcRow {
  course_id: string;
  course_title: string;
  is_active: boolean;
  expires_at: string | null;
  updated_at: string | null;
}

export interface MhdTrainingTimeOnTaskSettingsRpcRow {
  max_session_minutes: number;
  updated_at: string | null;
}

export interface MhdTrainingExternalAuditorReportRpcRow {
  person_id: string;
  person_display_name: string;
  status: string;
  completed_at: string | null;
}

export interface MhdTrainingIltSessionCreateRpcRow {
  id: string;
  reference_id: string;
}

export interface MhdTrainingIltSessionRpcRow {
  id: string;
  reference_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  instructor_name: string;
  room_or_resource_label: string | null;
  capacity: number | string | null;
  meeting_provider: string;
  is_cancelled: boolean;
  enrolled_count: number | string;
  waitlisted_count: number | string;
}
export interface MhdTrainingIltSessionByCompanyRpcRow extends MhdTrainingIltSessionRpcRow {
  course_id: string;
  course_title: string;
}
export interface MhdTrainingIltRosterRpcRow {
  enrollment_id: string;
  person_id: string;
  person_display_name: string;
  status: MhdTrainingEnrollmentStatus;
  enrolled_at: string;
  check_in_at: string | null;
  check_out_at: string | null;
  attendance_source: string | null;
  override_reason: string | null;
}

export interface MhdTrainingIltEnrollmentRpcRow {
  id: string;
  status: string;
}

export type MhdTrainingAssignmentExportRow =
  Database['public']['Tables']['training_assignments']['Row'];
export type MhdTrainingCompletionExportRow =
  Database['public']['Tables']['training_completions']['Row'];
export type MhdTrainingBlockProgressExportRow =
  Database['public']['Tables']['training_block_progress']['Row'];
export type MhdTrainingAssessmentAttemptExportRow =
  Database['public']['Tables']['training_assessment_attempts']['Row'];
export type MhdTrainingAuditStatementExportRow =
  Database['public']['Tables']['training_audit_statements']['Row'];

export interface MhdTrainingLearnerExportBundle {
  assignments: MhdTrainingAssignmentExportRow[];
  completions: MhdTrainingCompletionExportRow[];
  blockProgress: MhdTrainingBlockProgressExportRow[];
  assessmentAttempts: MhdTrainingAssessmentAttemptExportRow[];
  auditStatements: MhdTrainingAuditStatementExportRow[];
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
export type MhdTrainingExternalAuditorGrantId = string;
export type MhdTrainingIltSessionId = string;
export type MhdTrainingIltEnrollmentId = string;
export const MHD_TRAINING_DEFAULT_MAX_SESSION_MINUTES = 480;

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
export type MhdTrainingExternalAuditorGrantReferenceId = `EAG-${string}`;
export type MhdTrainingIltSessionReferenceId = `ILT-${string}`;

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
export type MhdTrainingMeetingProvider = 'NONE' | 'TEAMS' | 'MEET';
export type MhdTrainingEnrollmentStatus = 'ENROLLED' | 'WAITLISTED' | 'CANCELLED';
export type MhdTrainingAttendanceSource = 'MANUAL' | 'PROVIDER_SYNC' | 'OVERRIDE';

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
  /** Set once by mhd_training_course_retire; null for a course still in use. */
  retiredAt: string | null;
  successorCourseId: MhdTrainingCourseId | null;
  successorCourseTitle: string | null;
}

export interface MhdTrainingManagerTeamStatusRow {
  personId: string;
  personDisplayName: string;
  courseId: MhdTrainingCourseId;
  courseTitle: string;
  status: MhdTrainingAssignmentStatus;
  complianceStatus: MhdTrainingComplianceStatus;
  dueDate: string | null;
}

export interface MhdTrainingBulkAssignResult {
  personId: string;
  assignmentId: MhdTrainingAssignmentId;
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
  isActive: boolean;
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

/** Mapped document generation requested for a training completion certificate. */
export interface MhdTrainingCertificateGenerationResult {
  id: string;
  referenceId: string;
  status: string;
}

export interface MhdTrainingTimeOnTaskRow {
  personId: string;
  blockId: MhdTrainingBlockId;
  minutes: number;
}

export interface MhdTrainingExternalAuditorGrant extends MhdMutationResult {
  id: MhdTrainingExternalAuditorGrantId;
  referenceId: MhdTrainingExternalAuditorGrantReferenceId;
}

export interface MhdTrainingExternalAuditorReportRow {
  personId: string;
  personDisplayName: string;
  status: string;
  completedAt: string | null;
}

export interface MhdTrainingExternalAuditorGrantListRow {
  id: MhdTrainingExternalAuditorGrantId;
  referenceId: MhdTrainingExternalAuditorGrantReferenceId;
  courseId: string;
  courseTitle: string;
  auditorLabel: string;
  validFrom: string;
  validUntil: string;
  revokedAt: string | null;
  createdAt: string;
}

/** A global course with this company's license expiry, or null when unrestricted. */
export interface MhdTrainingContentLicenseRow {
  courseId: string;
  courseTitle: string;
  isActive: boolean;
  expiresAt: string | null;
  updatedAt: string | null;
}

export interface MhdTrainingTimeOnTaskSettings {
  maxSessionMinutes: number;
  updatedAt: string | null;
}

/** An instructor may be an internal person or an external/vendor named only by text. */
export interface MhdTrainingIltSession {
  id: MhdTrainingIltSessionId;
  referenceId: MhdTrainingIltSessionReferenceId;
  sessionDate: string;
  startTime: string;
  endTime: string;
  instructorName: string;
  // Informational text only: there is no room/resource entity or conflict checker.
  roomOrResourceLabel: string | null;
  capacity: number | null;
  // A provider label only; no Teams/Meet integration or attendance sync exists yet.
  meetingProvider: MhdTrainingMeetingProvider;
  isCancelled: boolean;
  enrolledCount: number;
  waitlistedCount: number;
}

export interface MhdTrainingIltEnrollmentResult {
  id: MhdTrainingIltEnrollmentId;
  status: Exclude<MhdTrainingEnrollmentStatus, 'CANCELLED'>;
}

export interface MhdTrainingIltSessionSummary extends MhdTrainingIltSession {
  courseId: string;
  courseTitle: string;
}
export interface MhdTrainingIltRosterEntry {
  enrollmentId: MhdTrainingIltEnrollmentId;
  personId: string;
  personDisplayName: string;
  status: MhdTrainingEnrollmentStatus;
  enrolledAt: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  attendanceSource: MhdTrainingAttendanceSource | null;
  overrideReason: string | null;
}

// ---------------------------------------------------------------------------
// LMS v2 engagement and social features
// ---------------------------------------------------------------------------

export type MhdTrainingBadgeId = string;
export type MhdContentFlagId = string;
export type MhdTrainingPeerReviewId = string;
export type MhdTrainingBadgeReferenceId = `BDG-${string}`;
export type MhdContentFlagReferenceId = `FLG-${string}`;
export type MhdTrainingPeerReviewReferenceId = `PRV-${string}`;
export type MhdContentFlagEntityType = 'TASK' | 'SUBTASK' | 'ACTIVITY' | 'TRAINING_LESSON' | 'NOTE';
export type MhdContentFlagStatus = 'PENDING' | 'RESOLVED';
export type MhdContentFlagResolveAction = 'NONE' | 'HIDDEN' | 'REMOVED' | 'WARNED';
export type MhdTrainingPeerReviewStatus = 'PENDING' | 'SUBMITTED';

export interface MhdTrainingPointsBalanceRpcRow {
  points: number | string;
}
export interface MhdTrainingBadgeRpcRow {
  id: string;
  reference_id: string;
  title: string;
  description: string | null;
  icon_key: string;
  is_global: boolean;
}
export interface MhdContentFlagRpcRow {
  id: string;
  reference_id: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  status: string;
  created_at: string;
}
export interface MhdTrainingPeerReviewRpcRow {
  id: string;
  reference_id: string;
  reviewer_person_id: string;
  rubric_score: number | string;
  feedback: string;
  status: string;
  submitted_at: string | null;
}
export interface MhdTrainingPeerReviewCandidateRpcRow {
  block_progress_id: string;
  person_id: string;
  person_display_name: string;
  course_title: string;
  block_title: string | null;
  block_type: string;
  response: Record<string, unknown> | null;
  completed_at: string;
  existing_review_count: number | string;
}
export interface MhdTrainingLeaderboardRpcRow {
  person_id: string;
  person_display_name: string;
  total_points: number | string;
  current_streak_days: number | string;
}
export interface MhdTrainingCourseFeedbackSummaryRpcRow {
  average_rating: number | string;
  response_count: number | string;
}

export interface MhdTrainingBadge extends MhdMutationResult {
  referenceId: MhdTrainingBadgeReferenceId;
  title: string;
  description: string | null;
  iconKey: string;
  isGlobal: boolean;
}
export interface MhdTrainingBadgeCreateResult extends MhdMutationResult {
  referenceId: MhdTrainingBadgeReferenceId;
}
export interface MhdContentFlag extends MhdMutationResult {
  referenceId: MhdContentFlagReferenceId;
  entityType: MhdContentFlagEntityType;
  entityId: string;
  reason: string;
  status: MhdContentFlagStatus;
  createdAt: string;
}
export interface MhdContentFlagCreateResult extends MhdMutationResult {
  referenceId: MhdContentFlagReferenceId;
}
export interface MhdTrainingPeerReview extends MhdMutationResult {
  referenceId: MhdTrainingPeerReviewReferenceId;
  reviewerPersonId: string;
  rubricScore: number;
  feedback: string;
  status: MhdTrainingPeerReviewStatus;
  submittedAt: string | null;
}
export interface MhdTrainingPeerReviewAssignmentResult extends MhdMutationResult {
  referenceId: MhdTrainingPeerReviewReferenceId;
}
export interface MhdTrainingPeerReviewCandidate {
  blockProgressId: string;
  personId: string;
  personDisplayName: string;
  courseTitle: string;
  blockTitle: string | null;
  blockType: string;
  response: Record<string, unknown> | null;
  completedAt: string;
  existingReviewCount: number;
}
export interface MhdTrainingLeaderboardRow {
  personId: string;
  personDisplayName: string;
  totalPoints: number;
  currentStreakDays: number;
}
export interface MhdTrainingCourseFeedbackSummary {
  averageRating: number;
  responseCount: number;
}

export interface MhdCreateTrainingBadgeInput {
  companyId: string;
  title: string;
  description?: string | null;
  iconKey?: string;
}
export interface MhdAwardTrainingBadgeInput {
  badgeId: MhdTrainingBadgeId;
  personId: string;
  reason?: string | null;
}
export interface MhdSetTrainingLeaderboardOptInInput {
  optedIn: boolean;
}
export interface MhdTrainingLeaderboardInput {
  companyId: string;
  limit?: number;
}
export interface MhdCreateContentFlagInput {
  entityType: MhdContentFlagEntityType;
  entityId: string;
  reason: string;
}
export interface MhdListContentFlagsInput {
  companyId: string;
  // undefined = not specified, defaults to PENDING (the review-queue default).
  // Explicit null = show every status — distinct from "not specified", since the
  // RPC's own default is PENDING, not "all" (mhd_content_flag_list, 0294). Widen
  // this to include null deliberately; do not silently collapse it back to
  // PENDING.
  status?: MhdContentFlagStatus | null;
}
export interface MhdResolveContentFlagInput {
  flagId: MhdContentFlagId;
  action: MhdContentFlagResolveAction;
  notes?: string | null;
}
export interface MhdAssignTrainingPeerReviewInput {
  blockProgressId: string;
  reviewerPersonId: string;
}
export interface MhdSubmitTrainingPeerReviewInput {
  reviewId: MhdTrainingPeerReviewId;
  rubricScore: number;
  feedback: string;
}
export interface MhdListTrainingPeerReviewsInput {
  blockProgressId: string;
}
export interface MhdSubmitTrainingCourseFeedbackInput {
  courseId: MhdTrainingCourseId;
  rating: number;
  comments?: string | null;
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
export interface MhdUpdateCurriculumInput {
  curriculumId: MhdTrainingCurriculumId;
  title?: string;
  description?: string | null;
  isActive?: boolean;
}
export interface MhdTrainingProgramFilters {
  companyId: string | null;
  curriculumId?: MhdTrainingCurriculumId | null;
  includeInactive?: boolean;
}
export interface MhdCreateProgramInput {
  companyId: string;
  title: string;
  curriculumId?: MhdTrainingCurriculumId | null;
  description?: string | null;
  sortOrder?: number;
}
export interface MhdUpdateProgramInput {
  programId: MhdTrainingProgramId;
  title?: string;
  description?: string | null;
  curriculumId?: MhdTrainingCurriculumId | null;
  sortOrder?: number;
  isActive?: boolean;
}
export interface MhdCreateCourseModuleInput {
  courseId: MhdTrainingCourseId;
  title: string;
  description?: string | null;
  sortOrder?: number;
}
export interface MhdUpdateCourseModuleInput {
  moduleId: string;
  title?: string;
  description?: string | null;
  sortOrder?: number;
}
export interface MhdCreateLessonInput {
  moduleId: MhdTrainingCourseModuleId;
  title: string;
  description?: string | null;
  sortOrder?: number;
}
export interface MhdUpdateLessonInput {
  lessonId: MhdTrainingLessonId;
  title?: string;
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
export interface MhdUpdateBlockInput {
  blockId: string;
  title?: string | null;
  content?: Record<string, unknown>;
  altText?: string | null;
  transcript?: string | null;
  sortOrder?: number;
}

export interface MhdTrainingBlockTranslation {
  id: string;
  locale: string;
  content: Record<string, unknown>;
  altText: string | null;
  transcript: string | null;
  updatedAt: string | null;
}

export interface MhdUpsertBlockTranslationInput {
  blockId: string;
  locale: string;
  content?: Record<string, unknown>;
  altText?: string | null;
  transcript?: string | null;
}

export interface MhdDeleteBlockTranslationInput {
  translationId: string;
}
export interface MhdUpdateScenarioNodeInput {
  nodeId: string;
  nodeKey?: string;
  content?: Record<string, unknown> | null;
  isStart?: boolean;
  isTerminal?: boolean;
  scenarioContract?: Record<string, unknown> | null;
}
export interface MhdUpdateScenarioChoiceInput {
  choiceId: string;
  label?: string;
  nextNodeId?: string | null;
  feedbackText?: string | null;
  scoreDelta?: number | null;
  sortOrder?: number;
}

export const MHD_TRAINING_VIDEO_UPLOAD_FUNCTION_NAME = 'mhd-video-upload';
export const MHD_TRAINING_VIDEO_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
export const MHD_TRAINING_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
] as const;
export type MhdTrainingVideoMimeType = (typeof MHD_TRAINING_VIDEO_MIME_TYPES)[number];

export interface MhdTrainingVideoUploadRequest {
  blockId: MhdTrainingBlockId;
  file: File;
}

export interface MhdTrainingVideoUploadFunctionResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export interface MhdTrainingVideoUploadResult {
  id: string;
  objectKey: string;
  publicUrl: string;
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
export interface MhdTrainingPrerequisite {
  prerequisiteCourseId: MhdTrainingCourseId;
  prerequisiteTitle: string;
  prerequisiteCourseKey: string;
  createdAt: string;
}
export interface MhdTrainingContentApproval {
  id: string;
  fromStatus: string;
  toStatus: string;
  contentVersion: number;
  reviewNotes: string | null;
  reviewedByName: string;
  createdAt: string;
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

export interface MhdRetireTrainingCourseInput {
  courseId: MhdTrainingCourseId;
  successorCourseId?: MhdTrainingCourseId | null;
}

export interface MhdResolveActiveSuccessorInput {
  courseId: MhdTrainingCourseId;
}

export interface MhdSetTrainingContentLicenseInput {
  companyId: string;
  courseId: MhdTrainingCourseId;
  expiresAt: string;
}

export interface MhdListTrainingContentLicensesInput {
  companyId: string;
}

export interface MhdListTrainingExternalAuditorGrantsInput {
  companyId: string;
}

export interface MhdGetTrainingTimeOnTaskInput {
  companyId: string;
}

export interface MhdTrainingManagerTeamStatusInput {
  managerPersonId: string;
}

export interface MhdBulkAssignTrainingInput {
  companyId: string;
  courseId: MhdTrainingCourseId;
  personIds: string[];
  dueDate?: string | null;
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

export interface MhdSendTrainingDeadlineRemindersInput {
  companyId: string;
  daysBefore?: number;
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

export interface MhdSetTrainingTimeOnTaskInput {
  companyId: string;
  maxSessionMinutes?: number;
}

export interface MhdTrainingTimeOnTaskFilters {
  companyId: string | null;
  personId?: string | null;
  from?: string | null;
  to?: string | null;
}

export interface MhdCreateTrainingExternalAuditorGrantInput {
  companyId: string;
  courseId: MhdTrainingCourseId;
  auditorLabel: string;
  validUntil: string;
}

export interface MhdCreateTrainingIltSessionInput {
  companyId: string;
  courseId: MhdTrainingCourseId;
  sessionDate: string;
  startTime: string;
  endTime: string;
  instructorName: string;
  instructorPersonId?: string | null;
  roomOrResourceLabel?: string | null;
  capacity?: number | null;
  meetingProvider?: MhdTrainingMeetingProvider;
  meetingJoinUrl?: string | null;
}

export interface MhdListTrainingIltSessionsInput {
  courseId: MhdTrainingCourseId;
}

export interface MhdEnrollTrainingIltInput {
  sessionId: MhdTrainingIltSessionId;
  personId: string;
}

export interface MhdCancelTrainingIltEnrollmentInput {
  enrollmentId: MhdTrainingIltEnrollmentId;
}

export interface MhdTrainingIltAttendanceInput {
  sessionId: MhdTrainingIltSessionId;
  personId: string;
}

export interface MhdTrainingIltAttendanceOverrideInput extends MhdTrainingIltAttendanceInput {
  checkInAt: string;
  checkOutAt: string;
  reason: string;
}

export interface MhdTrainingExternalAuditorGrantRevokeInput {
  grantId: MhdTrainingExternalAuditorGrantId;
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

export interface MhdTrainingRichTextContent {
  html: string;
}
export interface MhdTrainingImageContent {
  url: string;
}
export interface MhdTrainingVideoContent {
  url: string;
}
export interface MhdTrainingFileDownloadContent {
  url: string;
  fileName?: string;
}
export interface MhdTrainingCalloutContent {
  tone?: 'info' | 'warning' | 'success';
  text: string;
}
export interface MhdTrainingChecklistContent {
  items: string[];
}
export interface MhdTrainingTableContent {
  headers: string[];
  rows: string[][];
}
export interface MhdTrainingKnowledgeCheckContent {
  question: string;
  options: string[];
  answerIndex: number;
}
export interface MhdTrainingReflectionPromptContent {
  prompt: string;
}

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
  | {
      blockType: Exclude<
        MhdTrainingBlockType,
        | 'RICH_TEXT'
        | 'IMAGE'
        | 'VIDEO'
        | 'FILE_DOWNLOAD'
        | 'CALLOUT'
        | 'CHECKLIST'
        | 'TABLE'
        | 'KNOWLEDGE_CHECK'
        | 'REFLECTION_PROMPT'
      >;
      content: Record<string, unknown>;
    };

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
  id: string;
  blockId: MhdTrainingBlockId;
  status: MhdTrainingBlockProgressStatus;
  response: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface MhdTrainingScenarioChoice {
  id: string;
  label: string;
  nextNodeId: string | null;
  feedbackText: string | null;
  scoreDelta: number | null;
}

export interface MhdTrainingScenarioNode {
  id: string;
  nodeKey: string;
  nodeType: string;
  content: Record<string, unknown>;
  scenarioContract: Record<string, unknown> | null;
  isStart: boolean;
  isTerminal: boolean;
  choices: MhdTrainingScenarioChoice[];
}

export type MhdTrainingScenarioGraph = MhdTrainingScenarioNode[];

export interface MhdTrainingScenarioAiResponse {
  learnerTurnRecorded: boolean;
  aiAvailable: boolean;
  message: string;
}

export interface MhdTrainingScenarioAiTurn {
  turnNumber: number;
  role: string;
  message: string;
  createdAt: string;
}

export interface MhdCreateTrainingScenarioNodeInput {
  blockId: MhdTrainingBlockId;
  nodeKey: string;
  content?: Record<string, unknown>;
  isStart?: boolean;
  isTerminal?: boolean;
  nodeType?: string;
  scenarioContract?: Record<string, unknown> | null;
}

export interface MhdCreateTrainingScenarioChoiceInput {
  nodeId: string;
  label: string;
  nextNodeId?: string | null;
  feedbackText?: string | null;
  scoreDelta?: number | null;
  sortOrder?: number;
}

export interface MhdRecordTrainingScenarioVisitInput {
  blockProgressId: string;
  nodeId: string;
  choiceId?: string | null;
}

export interface MhdRespondToTrainingScenarioAiInput {
  blockProgressId: string;
  nodeId: string;
  learnerMessage: string;
}

export interface MhdGetTrainingScenarioGraphInput {
  blockId: string;
}

export interface MhdTrainingBlockCompletionResult {
  courseCompleted: boolean;
}
