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
  created_at: string;
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

export type MhdTrainingCourseReferenceId = `TRN-${string}`;
export type MhdTrainingAssignmentReferenceId = `TRA-${string}`;
export type MhdTrainingCompletionReferenceId = `TRC-${string}`;

export type MhdTrainingCategory =
  'HARASSMENT' | 'SAFETY' | 'COMPLIANCE' | 'SKILLS' | 'ONBOARDING' | 'OTHER';

export type MhdTrainingDeliveryMode = 'IN_PERSON' | 'ONLINE' | 'DOCUMENT' | 'EXTERNAL';

export type MhdTrainingAssignmentStatus = 'ASSIGNED' | 'COMPLETED' | 'WAIVED' | 'CANCELLED';

export type MhdTrainingCompletionMethod = 'ATTESTED' | 'CERTIFICATE' | 'ADMIN_RECORDED';

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
  createdAt: string;
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
