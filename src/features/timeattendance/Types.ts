// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// Deliberately hand-maintained, not generated (checked 2026-08-06, migration
// 0032 has long since shipped): gen:types marks every column on a
// table-returning RPC function as non-null regardless of the underlying
// table's real schema, and collapses PostgREST's numeric-as-string
// serialization down to plain `number` — losing exactly the fact this
// file's own comment below warns about. Adopting the generated type here
// would silently reintroduce both.
//
// Numeric RPC columns (points, balances) are typed `number | string` because
// PostgREST serialises `numeric` as a string. Every mapper below runs them
// through `toNumber()` — never compare a raw row value arithmetically.
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_schedule_list_templates`. */
export interface MhdScheduleTemplateRpcRow {
  id: string;
  reference_id: string;
  template_name: string;
  description: string | null;
  is_active: boolean;
  total_weekly_hours: number | string;
  working_days: number | string;
  assigned_count: number | string;
  created_at: string;
}

/** Row shape returned by `mhd_schedule_get_template` — one row per day of week. */
export interface MhdScheduleTemplateDayRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  template_name: string;
  description: string | null;
  is_active: boolean;
  day_of_week: number;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  unpaid_break_minutes: number | string;
}

/** Row shape returned by `mhd_schedule_list_assignments`. */
export interface MhdScheduleAssignmentRpcRow {
  id: string;
  template_id: string;
  template_name: string;
  effective_from: string;
  effective_to: string | null;
  assignment_note: string | null;
}

/** Row shape returned by `mhd_schedule_list_shifts` (left-joined to any occurrence). */
export interface MhdScheduledShiftRpcRow {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  unpaid_break_minutes: number | string;
  source: string;
  is_holiday: boolean;
  override_reason: string | null;
  occurrence_id: string | null;
  occurrence_type: string | null;
  classification: string | null;
}

/** Row shape returned by `mhd_schedule_list_holidays`. */
export interface MhdCompanyHolidayRpcRow {
  id: string;
  holiday_date: string;
  holiday_name: string;
  is_paid: boolean;
}

/** Row shape returned by `mhd_attendance_get_policy`. Children arrive as jsonb. */
export interface MhdAttendancePolicyRpcRow {
  id: string;
  policy_name: string;
  effective_from: string;
  roll_off_months: number | string;
  excused_unpaid_accrues: boolean;
  excused_paid_accrues: boolean;
  point_rules: Array<{ occurrence_type: string; points: number | string }>;
  thresholds: Array<{ id: string; points_at: number | string; action_level: string }>;
}

/** Row shape returned by `mhd_attendance_list_occurrences`. */
export interface MhdAttendanceOccurrenceRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  occurrence_date: string;
  occurrence_type: string;
  classification: string;
  protected_leave_category: string | null;
  minutes_variance: number | string | null;
  reason_note: string | null;
  points_assessed: number | string;
  voided_at: string | null;
}

/** Row shape returned by `mhd_attendance_list_point_ledger`. */
export interface MhdPointLedgerEntryRpcRow {
  id: string;
  occurrence_id: string | null;
  occurrence_reference: string | null;
  entry_type: string;
  points_delta: number | string;
  effective_date: string;
  expires_on: string | null;
  reason: string | null;
  reversal_of_entry_id: string | null;
  created_at: string;
}

/** Row shape returned by `mhd_attendance_list_threshold_events`. */
export interface MhdThresholdEventRpcRow {
  id: string;
  person_id: string;
  person_display_name: string;
  action_level: string;
  points_at: number | string;
  points_at_crossing: number | string;
  crossed_at: string;
  status: string;
  resolution_note: string | null;
  linked_task_id: string | null;
}

/** Row shape returned by `mhd_attendance_list_reassessment_events`. */
export interface MhdReassessmentEventRpcRow {
  id: string;
  person_id: string;
  person_display_name: string;
  occurrence_id: string;
  occurrence_reference: string;
  occurrence_date: string;
  occurrence_type: string;
  from_classification: string;
  to_classification: string;
  raised_at: string;
  status: string;
  decision_note: string | null;
  points_assessed: number | string | null;
  resolved_at: string | null;
  /** What the OCCURRENCE-DATE policy would charge — not today's policy. */
  projected_points: number | string;
}

/** Row shape returned by the create RPCs that mint a reference: `(id, reference_id)`. */
export interface MhdTimeAttendanceMutationRpcRow {
  id: string;
  reference_id: string;
}

/** Row shape returned by `mhd_attendance_record_occurrence`. */
export interface MhdRecordOccurrenceRpcRow {
  id: string;
  reference_id: string;
  points_assessed: number | string;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdScheduleTemplateId = string;
export type MhdScheduleTemplateReferenceId = `SCHD-${string}`;
export type MhdScheduledShiftId = string;
export type MhdAttendanceOccurrenceId = string;
export type MhdAttendanceOccurrenceReferenceId = `OCCR-${string}`;
export type MhdPointLedgerEntryId = string;
export type MhdThresholdEventId = string;

export type MhdOccurrenceType =
  | 'ABSENCE'
  | 'TARDY'
  | 'EARLY_DEPARTURE'
  | 'PARTIAL_ABSENCE'
  | 'NO_CALL_NO_SHOW'
  | 'LEFT_WITHOUT_NOTICE';

/**
 * The points gate. Only UNEXCUSED accrues unconditionally; the two EXCUSED
 * values accrue only where the active policy says so; PROTECTED never accrues
 * under any configuration (enforced by CHECK + trigger in 0032, and mirrored
 * here by `mhdClassificationCanAccrue`).
 */
export type MhdAttendanceClassification =
  'UNEXCUSED' | 'EXCUSED_UNPAID' | 'EXCUSED_PAID' | 'PROTECTED';

/**
 * Protected absence categories. Required iff classification is PROTECTED, and
 * forbidden otherwise — the pairing is a database CHECK, so a form that sets one
 * without the other will be refused rather than silently corrected.
 */
export type MhdProtectedLeaveCategory =
  | 'CA_PAID_SICK_LEAVE'
  | 'CFRA'
  | 'FMLA'
  | 'PREGNANCY_DISABILITY'
  | 'JURY_DUTY'
  | 'WITNESS_DUTY'
  | 'VOTING'
  | 'MILITARY_USERRA'
  | 'WORKERS_COMPENSATION'
  | 'ADA_FEHA_ACCOMMODATION'
  | 'SCHOOL_ACTIVITY'
  | 'VICTIM_OF_VIOLENCE'
  | 'BEREAVEMENT'
  | 'REPRODUCTIVE_LOSS'
  | 'OTHER_PROTECTED';

export type MhdPointLedgerEntryType =
  | 'ASSESSMENT'
  | 'ROLL_OFF'
  | 'REVERSAL'
  | 'MANUAL_ADJUSTMENT'
  /** Reserved vocabulary — unused in v1 (Open Question 5 resolved OUT). */
  | 'PERFECT_ATTENDANCE_CREDIT';

/**
 * Deliberately TERMINATION_REVIEW, not TERMINATION. No threshold in this module
 * performs an adverse action; crossing one raises an event for a human.
 */
export type MhdAttendanceActionLevel =
  'VERBAL_WARNING' | 'WRITTEN_WARNING' | 'FINAL_WARNING' | 'TERMINATION_REVIEW';

export type MhdThresholdEventStatus = 'RAISED' | 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED';

/**
 * `DECLINED` means "we decided not to assess", NOT "dismissed as noise". Both
 * terminal states demand a written reason precisely so the two are
 * distinguishable from each other and from an oversight.
 */
export type MhdReassessmentStatus = 'RAISED' | 'ASSESSED' | 'DECLINED';

export type MhdShiftSource = 'GENERATED' | 'MANUAL' | 'OVERRIDE';

export const MHD_OCCURRENCE_TYPES = [
  'ABSENCE',
  'TARDY',
  'EARLY_DEPARTURE',
  'PARTIAL_ABSENCE',
  'NO_CALL_NO_SHOW',
  'LEFT_WITHOUT_NOTICE',
] as const satisfies readonly MhdOccurrenceType[];

export const MHD_ATTENDANCE_CLASSIFICATIONS = [
  'UNEXCUSED',
  'EXCUSED_UNPAID',
  'EXCUSED_PAID',
  'PROTECTED',
] as const satisfies readonly MhdAttendanceClassification[];

export const MHD_PROTECTED_LEAVE_CATEGORIES = [
  'CA_PAID_SICK_LEAVE',
  'CFRA',
  'FMLA',
  'PREGNANCY_DISABILITY',
  'JURY_DUTY',
  'WITNESS_DUTY',
  'VOTING',
  'MILITARY_USERRA',
  'WORKERS_COMPENSATION',
  'ADA_FEHA_ACCOMMODATION',
  'SCHOOL_ACTIVITY',
  'VICTIM_OF_VIOLENCE',
  'BEREAVEMENT',
  'REPRODUCTIVE_LOSS',
  'OTHER_PROTECTED',
] as const satisfies readonly MhdProtectedLeaveCategory[];

export const MHD_POINT_LEDGER_ENTRY_TYPES = [
  'ASSESSMENT',
  'ROLL_OFF',
  'REVERSAL',
  'MANUAL_ADJUSTMENT',
  'PERFECT_ATTENDANCE_CREDIT',
] as const satisfies readonly MhdPointLedgerEntryType[];

export const MHD_ATTENDANCE_ACTION_LEVELS = [
  'VERBAL_WARNING',
  'WRITTEN_WARNING',
  'FINAL_WARNING',
  'TERMINATION_REVIEW',
] as const satisfies readonly MhdAttendanceActionLevel[];

export const MHD_THRESHOLD_EVENT_STATUSES = [
  'RAISED',
  'ACKNOWLEDGED',
  'ACTIONED',
  'DISMISSED',
] as const satisfies readonly MhdThresholdEventStatus[];

export const MHD_REASSESSMENT_STATUSES = [
  'RAISED',
  'ASSESSED',
  'DECLINED',
] as const satisfies readonly MhdReassessmentStatus[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

export interface MhdScheduleTemplateSummary {
  id: MhdScheduleTemplateId;
  referenceId: MhdScheduleTemplateReferenceId;
  templateName: string;
  description: string | null;
  isActive: boolean;
  totalWeeklyHours: number;
  workingDays: number;
  assignedCount: number;
  createdAt: string;
}

export interface MhdScheduleTemplateDay {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime: string | null;
  endTime: string | null;
  unpaidBreakMinutes: number;
}

export interface MhdScheduleTemplateDetail {
  id: MhdScheduleTemplateId;
  referenceId: MhdScheduleTemplateReferenceId;
  companyId: string;
  templateName: string;
  description: string | null;
  isActive: boolean;
  /** Always seven entries, ordered Sunday (0) through Saturday (6). */
  days: MhdScheduleTemplateDay[];
}

export interface MhdScheduleAssignment {
  id: string;
  templateId: MhdScheduleTemplateId;
  templateName: string;
  effectiveFrom: string;
  /** Null means this is the assignment currently in force. */
  effectiveTo: string | null;
  assignmentNote: string | null;
}

export interface MhdScheduledShift {
  id: MhdScheduledShiftId;
  shiftDate: string;
  startTime: string;
  endTime: string;
  unpaidBreakMinutes: number;
  source: MhdShiftSource;
  isHoliday: boolean;
  overrideReason: string | null;
  /** Present when an occurrence has been recorded against this shift. */
  occurrenceId: MhdAttendanceOccurrenceId | null;
  occurrenceType: MhdOccurrenceType | null;
  classification: MhdAttendanceClassification | null;
}

export interface MhdCompanyHoliday {
  id: string;
  holidayDate: string;
  holidayName: string;
  isPaid: boolean;
}

export interface MhdAttendancePointRule {
  occurrenceType: MhdOccurrenceType;
  points: number;
}

export interface MhdAttendanceThreshold {
  id: string;
  pointsAt: number;
  actionLevel: MhdAttendanceActionLevel;
}

export interface MhdAttendancePolicy {
  id: string;
  policyName: string;
  effectiveFrom: string;
  rollOffMonths: number;
  excusedUnpaidAccrues: boolean;
  excusedPaidAccrues: boolean;
  pointRules: MhdAttendancePointRule[];
  /** Ordered ascending by pointsAt. */
  thresholds: MhdAttendanceThreshold[];
}

export interface MhdAttendanceOccurrence {
  id: MhdAttendanceOccurrenceId;
  referenceId: MhdAttendanceOccurrenceReferenceId;
  personId: string;
  personDisplayName: string;
  occurrenceDate: string;
  occurrenceType: MhdOccurrenceType;
  classification: MhdAttendanceClassification;
  protectedLeaveCategory: MhdProtectedLeaveCategory | null;
  minutesVariance: number | null;
  reasonNote: string | null;
  /** Net of every ledger row for this occurrence — a reversed assessment reads 0. */
  pointsAssessed: number;
  voidedAt: string | null;
}

export interface MhdPointLedgerEntry {
  id: MhdPointLedgerEntryId;
  occurrenceId: MhdAttendanceOccurrenceId | null;
  occurrenceReference: string | null;
  entryType: MhdPointLedgerEntryType;
  pointsDelta: number;
  effectiveDate: string;
  /** Null means the entry never rolls off. */
  expiresOn: string | null;
  reason: string | null;
  reversalOfEntryId: MhdPointLedgerEntryId | null;
  createdAt: string;
}

export interface MhdThresholdEvent {
  id: MhdThresholdEventId;
  personId: string;
  personDisplayName: string;
  actionLevel: MhdAttendanceActionLevel;
  pointsAt: number;
  pointsAtCrossing: number;
  crossedAt: string;
  status: MhdThresholdEventStatus;
  resolutionNote: string | null;
  linkedTaskId: string | null;
}

export interface MhdReassessmentEvent {
  id: string;
  personId: string;
  personDisplayName: string;
  occurrenceId: MhdAttendanceOccurrenceId;
  occurrenceReference: string;
  occurrenceDate: string;
  occurrenceType: MhdOccurrenceType;
  fromClassification: MhdAttendanceClassification;
  toClassification: MhdAttendanceClassification;
  raisedAt: string;
  status: MhdReassessmentStatus;
  decisionNote: string | null;
  pointsAssessed: number | null;
  resolvedAt: string | null;
  /** What the occurrence-date policy would charge — the default offered on assess. */
  projectedPoints: number;
}

// ---------------------------------------------------------------------------
// Inputs and filters
// ---------------------------------------------------------------------------

export interface MhdScheduleTemplateDayInput {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  unpaidBreakMinutes?: number;
}

export interface MhdCreateScheduleTemplateInput {
  companyId: string;
  templateName: string;
  description?: string | null;
  days: MhdScheduleTemplateDayInput[];
}

export interface MhdUpdateScheduleTemplateInput {
  templateId: MhdScheduleTemplateId;
  templateName?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  days?: MhdScheduleTemplateDayInput[] | null;
}

export interface MhdAssignScheduleTemplateInput {
  personId: string;
  templateId: MhdScheduleTemplateId;
  effectiveFrom: string;
  note?: string | null;
}

export interface MhdGenerateShiftsInput {
  personId: string;
  from: string;
  to: string;
}

export interface MhdOverrideShiftInput {
  shiftId: MhdScheduledShiftId;
  startTime: string;
  endTime: string;
  unpaidBreakMinutes?: number | null;
  reason: string;
}

export interface MhdRecordOccurrenceInput {
  personId: string;
  occurrenceDate: string;
  occurrenceType: MhdOccurrenceType;
  classification: MhdAttendanceClassification;
  protectedLeaveCategory?: MhdProtectedLeaveCategory | null;
  minutesVariance?: number | null;
  reasonNote?: string | null;
  scheduledShiftId?: MhdScheduledShiftId | null;
}

export interface MhdUpdateOccurrenceInput {
  occurrenceId: MhdAttendanceOccurrenceId;
  occurrenceType?: MhdOccurrenceType | null;
  minutesVariance?: number | null;
  reasonNote?: string | null;
}

/**
 * Reclassification is a separate contract from a field edit because it is the
 * legally significant operation — it drives the automatic reversal path and
 * audits as CLASSIFICATION_CHANGED. `mhd_attendance_update_occurrence` cannot
 * change classification, by design.
 */
export interface MhdReclassifyOccurrenceInput {
  occurrenceId: MhdAttendanceOccurrenceId;
  classification: MhdAttendanceClassification;
  protectedLeaveCategory?: MhdProtectedLeaveCategory | null;
  reason?: string | null;
}

export interface MhdVoidOccurrenceInput {
  occurrenceId: MhdAttendanceOccurrenceId;
  reason: string;
}

export interface MhdAdjustPointsInput {
  personId: string;
  pointsDelta: number;
  reason: string;
  effectiveDate?: string | null;
  occurrenceId?: MhdAttendanceOccurrenceId | null;
}

export interface MhdResolveThresholdEventInput {
  eventId: MhdThresholdEventId;
  status: Exclude<MhdThresholdEventStatus, 'RAISED'>;
  resolutionNote?: string | null;
  linkedTaskId?: string | null;
}

/**
 * Resolving a reassessment. `decisionNote` is required on BOTH outcomes — a
 * decline with no recorded reason is indistinguishable from an oversight, which
 * is the whole failure the queue exists to prevent.
 *
 * `points` and `effectiveDate` are overrides. Left undefined, the server uses
 * the occurrence-date policy's rule and the occurrence date itself.
 */
export interface MhdResolveReassessmentInput {
  eventId: string;
  decision: 'ASSESSED' | 'DECLINED';
  decisionNote: string;
  points?: number | null;
  effectiveDate?: string | null;
}

export interface MhdCreatePolicyVersionInput {
  companyId: string;
  policyName: string;
  effectiveFrom: string;
  rollOffMonths: number;
  excusedUnpaidAccrues: boolean;
  excusedPaidAccrues: boolean;
  pointRules: MhdAttendancePointRule[];
  thresholds: Array<{ pointsAt: number; actionLevel: MhdAttendanceActionLevel }>;
}

export interface MhdAttendanceOccurrenceFilters {
  companyId: string | null;
  personId?: string | null;
  from?: string | null;
  to?: string | null;
  occurrenceType?: MhdOccurrenceType | 'ALL' | null;
  classification?: MhdAttendanceClassification | 'ALL' | null;
  includeVoided?: boolean;
}

// ---------------------------------------------------------------------------
// Display + rule helpers
// ---------------------------------------------------------------------------

const OCCURRENCE_TYPE_LABELS: Record<MhdOccurrenceType, string> = {
  ABSENCE: 'Absence',
  TARDY: 'Tardy',
  EARLY_DEPARTURE: 'Early departure',
  PARTIAL_ABSENCE: 'Partial absence',
  NO_CALL_NO_SHOW: 'No call / no show',
  LEFT_WITHOUT_NOTICE: 'Left without notice',
};

const CLASSIFICATION_LABELS: Record<MhdAttendanceClassification, string> = {
  UNEXCUSED: 'Unexcused',
  EXCUSED_UNPAID: 'Excused (unpaid)',
  EXCUSED_PAID: 'Excused (paid)',
  PROTECTED: 'Protected leave',
};

const PROTECTED_CATEGORY_LABELS: Record<MhdProtectedLeaveCategory, string> = {
  CA_PAID_SICK_LEAVE: 'California paid sick leave',
  CFRA: 'CFRA',
  FMLA: 'FMLA',
  PREGNANCY_DISABILITY: 'Pregnancy disability leave',
  JURY_DUTY: 'Jury duty',
  WITNESS_DUTY: 'Witness duty',
  VOTING: 'Voting leave',
  MILITARY_USERRA: 'Military leave (USERRA)',
  WORKERS_COMPENSATION: "Workers' compensation",
  ADA_FEHA_ACCOMMODATION: 'ADA / FEHA accommodation',
  SCHOOL_ACTIVITY: 'School activity leave',
  VICTIM_OF_VIOLENCE: 'Victim of violence leave',
  BEREAVEMENT: 'Bereavement leave',
  REPRODUCTIVE_LOSS: 'Reproductive loss leave',
  OTHER_PROTECTED: 'Other protected leave',
};

const ACTION_LEVEL_LABELS: Record<MhdAttendanceActionLevel, string> = {
  VERBAL_WARNING: 'Verbal warning',
  WRITTEN_WARNING: 'Written warning',
  FINAL_WARNING: 'Final warning',
  TERMINATION_REVIEW: 'Termination review',
};

export function mhdFormatOccurrenceType(value: MhdOccurrenceType | string): string {
  return OCCURRENCE_TYPE_LABELS[value as MhdOccurrenceType] ?? value;
}

export function mhdFormatClassification(value: MhdAttendanceClassification | string): string {
  return CLASSIFICATION_LABELS[value as MhdAttendanceClassification] ?? value;
}

export function mhdFormatProtectedLeaveCategory(value: MhdProtectedLeaveCategory | string): string {
  return PROTECTED_CATEGORY_LABELS[value as MhdProtectedLeaveCategory] ?? value;
}

export function mhdFormatActionLevel(value: MhdAttendanceActionLevel | string): string {
  return ACTION_LEVEL_LABELS[value as MhdAttendanceActionLevel] ?? value;
}

/**
 * Mirrors the server's accrual decision so the form can show the recorder what
 * will happen BEFORE they save. The database is the authority — this exists to
 * make the outcome legible, never to gate it.
 *
 * PROTECTED short-circuits to false and never consults the policy: there is no
 * configuration under which protected leave accrues, which is why
 * `MhdAttendancePolicy` has no `protectedAccrues` field to consult.
 */
export function mhdClassificationCanAccrue(
  classification: MhdAttendanceClassification,
  policy: Pick<MhdAttendancePolicy, 'excusedUnpaidAccrues' | 'excusedPaidAccrues'> | null,
): boolean {
  if (classification === 'PROTECTED') return false;
  if (classification === 'UNEXCUSED') return true;
  if (!policy) return false;
  if (classification === 'EXCUSED_UNPAID') return policy.excusedUnpaidAccrues;
  if (classification === 'EXCUSED_PAID') return policy.excusedPaidAccrues;
  return false;
}

/**
 * Points this occurrence would cost under the given policy. Returns 0 whenever
 * the classification does not accrue, so the caller can render "0 points —
 * protected leave" rather than leaving the field blank and ambiguous.
 */
export function mhdProjectedPoints(
  occurrenceType: MhdOccurrenceType,
  classification: MhdAttendanceClassification,
  policy: MhdAttendancePolicy | null,
): number {
  if (!policy || !mhdClassificationCanAccrue(classification, policy)) return 0;
  return policy.pointRules.find((rule) => rule.occurrenceType === occurrenceType)?.points ?? 0;
}

/** The next threshold a person is heading toward, or null when past the last one. */
export function mhdNextThreshold(
  balance: number,
  thresholds: MhdAttendanceThreshold[],
): MhdAttendanceThreshold | null {
  return thresholds.find((threshold) => threshold.pointsAt > balance) ?? null;
}

/** PostgREST serialises `numeric` as a string; normalise before any arithmetic. */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
