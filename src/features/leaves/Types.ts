import type { Json } from '@/types/database.types';

// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// Deliberately hand-maintained, not generated (checked 2026-08-06, migration
// 0038 has long since shipped): gen:types marks every column on a
// table-returning RPC function as non-null regardless of the underlying
// table's real schema, and collapses PostgREST's numeric-as-string
// serialization down to plain `number`. Adopting the generated type here
// would silently drop real nullability and the `number | string` union this
// module depends on.
//
// Numeric RPC columns (entitlement hours, hour deltas, balances) are typed
// `number | string` because PostgREST serialises `numeric` as a string. Every
// mapper below runs them through `mhdToNumber()` — never compare a raw row
// value arithmetically. (`integer` columns such as measurement_months and
// basis_count arrive as plain numbers, so they are typed accordingly.)
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_leave_type_list`. */
export interface MhdLeaveTypeRpcRow {
  id: string;
  company_id: string | null;
  type_key: string;
  type_name: string;
  jurisdiction: string;
  entitlement_hours: number | string | null;
  measurement_method: string;
  measurement_months: number | null;
  requires_certification: boolean;
  citation: string | null;
  is_global: boolean;
}

/** Row shape returned by `mhd_leave_case_list`. */
export interface MhdLeaveCaseRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  reason_category: string;
  status: string;
  requested_start: string | null;
  requested_end: string | null;
  basis_count: number;
}

/**
 * Direct read of `leave_case_bases` (the designation set). There is no dedicated
 * v1 RPC that returns a case's designated bases — `mhd_leave_case_list` reports
 * only the count — so the detail page reads the set through PostgREST under the
 * `leave_case_bases_via_case` RLS policy. This is NON-medical (which legal bases
 * a case counts against), so it sits outside the certification partition.
 */
export interface MhdLeaveCaseBasisRpcRow {
  leave_type_id: string;
}

/** Row shape returned by `mhd_leave_list_ledger`. */
export interface MhdLeaveLedgerEntryRpcRow {
  id: string;
  reference_id: string;
  leave_type_id: string;
  type_name: string;
  leave_case_id: string | null;
  entry_type: string;
  hours_delta: number | string;
  effective_date: string;
  reason: string | null;
  created_at: string;
}

/**
 * Row shape returned by `mhd_leave_cert_list`.
 *
 * `provider_note` and `drive_file_id` arrive as NULL for anyone who is not
 * Platform Admin or HR Partner — the server masks them (29 CFR 825.500(g)). The
 * null is therefore ambiguous on its own ("masked" vs "genuinely empty"); the
 * component pairs it with a `canSeeMedical` flag from the route to word itself
 * honestly, exactly as the Jobs pay-range field does.
 */
export interface MhdLeaveCertificationRpcRow {
  id: string;
  certification_type: string;
  due_date: string | null;
  received_at: string | null;
  sufficient: boolean | null;
  provider_note: string | null;
  drive_file_id: string | null;
}

/** Row shape returned by the create RPCs that mint a reference: `(id, reference_id)`. */
export interface MhdLeaveMutationRpcRow {
  id: string;
  reference_id: string;
}

/** Mapped result of a create RPC that mints a reference. */
export interface MhdMutationResult {
  id: string;
  referenceId: string;
}

/**
 * Row shape returned by `mhd_create_leave_type` / `mhd_fork_leave_type`. Unlike
 * the case/ledger mutation RPCs above, `leave_types` carries no
 * `reference_id` column, so these two return only the minted id.
 */
export interface MhdLeaveTypeMutationRpcRow {
  id: string;
}

/** Mapped result of `createLeaveType` / `forkLeaveType`. */
export interface MhdCreateLeaveTypeResult {
  id: string;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdLeaveTypeId = string;
export type MhdLeaveCaseId = string;
export type MhdLeaveCaseReferenceId = `LVCS-${string}`;
export type MhdLeaveLedgerEntryId = string;
export type MhdLeaveLedgerEntryReferenceId = `LVLG-${string}`;
export type MhdLeaveCertificationId = string;

export type MhdLeaveJurisdiction = 'FEDERAL' | 'CA' | 'COMPANY' | 'OTHER';

/**
 * How a basis's measurement window is computed. `ROLLING_BACKWARD` (the FMLA
 * look-back) is why the ledger stores every interval rather than a counter —
 * remaining balance is entitlement minus the sum of decrements inside the
 * trailing window, computed at read time by `mhd_leave_balance`.
 */
export type MhdLeaveMeasurementMethod =
  'CALENDAR_YEAR' | 'FIXED_YEAR' | 'ROLLING_FORWARD' | 'ROLLING_BACKWARD' | 'PER_EVENT' | 'NONE';

export type MhdLeaveCaseStatus =
  'REQUESTED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'DENIED' | 'CANCELLED';

export type MhdLeaveCertificationType =
  'INITIAL' | 'RECERTIFICATION' | 'FITNESS_FOR_DUTY' | 'SECOND_OPINION' | 'THIRD_OPINION';

export type MhdLeaveLedgerEntryType = 'DESIGNATION' | 'ADJUSTMENT' | 'RESTORATION' | 'REVERSAL';

export const MHD_LEAVE_JURISDICTIONS = [
  'FEDERAL',
  'CA',
  'COMPANY',
  'OTHER',
] as const satisfies readonly MhdLeaveJurisdiction[];

export const MHD_LEAVE_MEASUREMENT_METHODS = [
  'CALENDAR_YEAR',
  'FIXED_YEAR',
  'ROLLING_FORWARD',
  'ROLLING_BACKWARD',
  'PER_EVENT',
  'NONE',
] as const satisfies readonly MhdLeaveMeasurementMethod[];

export const MHD_LEAVE_CASE_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'ACTIVE',
  'COMPLETED',
  'DENIED',
  'CANCELLED',
] as const satisfies readonly MhdLeaveCaseStatus[];

export const MHD_LEAVE_CERTIFICATION_TYPES = [
  'INITIAL',
  'RECERTIFICATION',
  'FITNESS_FOR_DUTY',
  'SECOND_OPINION',
  'THIRD_OPINION',
] as const satisfies readonly MhdLeaveCertificationType[];

export const MHD_LEAVE_LEDGER_ENTRY_TYPES = [
  'DESIGNATION',
  'ADJUSTMENT',
  'RESTORATION',
  'REVERSAL',
] as const satisfies readonly MhdLeaveLedgerEntryType[];

/** Statuses that require a recorded reason at the RPC (denial / cancellation). */
export const MHD_LEAVE_TERMINAL_REASON_STATUSES = [
  'DENIED',
  'CANCELLED',
] as const satisfies readonly MhdLeaveCaseStatus[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

/**
 * One legal basis (FMLA, CFRA, PDL, a company policy…). Config, never a
 * constant: the entitlement amount and its citation are data with provenance,
 * so a company adopts a global row and may adjust its own. `entitlementHours`
 * is kept `null`-distinct from `0` — null means "no fixed cap recorded" (e.g. a
 * PER_EVENT or NONE basis), which reads differently from a zero entitlement.
 */
export interface MhdLeaveType {
  id: MhdLeaveTypeId;
  /** Null = a global seeded basis, readable by every company. */
  companyId: string | null;
  typeKey: string;
  typeName: string;
  jurisdiction: MhdLeaveJurisdiction;
  entitlementHours: number | null;
  measurementMethod: MhdLeaveMeasurementMethod;
  measurementMonths: number | null;
  requiresCertification: boolean;
  citation: string | null;
  isGlobal: boolean;
}

export interface MhdLeaveCaseSummary {
  id: MhdLeaveCaseId;
  referenceId: MhdLeaveCaseReferenceId;
  personId: string;
  personDisplayName: string;
  reasonCategory: string;
  status: MhdLeaveCaseStatus;
  requestedStart: string | null;
  requestedEnd: string | null;
  /** How many legal bases the case is designated against — the concurrency width. */
  basisCount: number;
}

export interface MhdLeaveLedgerEntry {
  id: MhdLeaveLedgerEntryId;
  referenceId: MhdLeaveLedgerEntryReferenceId;
  leaveTypeId: MhdLeaveTypeId;
  typeName: string;
  leaveCaseId: MhdLeaveCaseId | null;
  entryType: MhdLeaveLedgerEntryType;
  /** Signed. A DESIGNATION is negative (hours taken); a RESTORATION positive. */
  hoursDelta: number;
  effectiveDate: string;
  reason: string | null;
  createdAt: string;
}

/**
 * Remaining balance for ONE legal basis, as of a date. This is intentionally a
 * per-basis value and is NEVER summed with another basis's — see
 * `MhdLeaveBalancePanel` for why summing erases the concurrency model.
 */
export interface MhdLeaveBalanceRow {
  leaveType: MhdLeaveType;
  /** entitlement − windowed sum of decrements, from `mhd_leave_balance`. */
  remainingHours: number;
}

export interface MhdLeaveCertification {
  id: MhdLeaveCertificationId;
  certificationType: MhdLeaveCertificationType;
  dueDate: string | null;
  receivedAt: string | null;
  sufficient: boolean | null;
  /**
   * Restricted medical free text. NULL whenever the viewer is not PA/HRP — do
   * not read this as "no note", read it against `canSeeMedical` from the route.
   */
  providerNote: string | null;
  /** Restricted document link, masked to NULL for non-PA/HRP callers. */
  driveFileId: string | null;
}

// ---------------------------------------------------------------------------
// Leave types Studio (0185) — administrative config only, never legal rule
// text. `leave_rule_sets` (the actual FMLA/CFRA/PDL content) stays behind the
// separate counsel/compliance review gate and gets no write path here.
// ---------------------------------------------------------------------------

/**
 * Author a leave type. `companyId: null` publishes a platform-global (library)
 * row — server-enforced Platform Admin/HR Partner only
 * (`mhd_can_manage_leave_type`); a real company id creates a company-owned
 * row, writable by that company's Client Admin/HR Partner (or Platform
 * Admin). `sourceTypeId` records fork lineage; the page's own "Fork to My
 * Company" action goes through `forkLeaveType` instead, which sets this
 * server-side — a caller building a type from scratch leaves it unset.
 */
export interface MhdCreateLeaveTypeInput {
  companyId: string | null;
  typeKey: string;
  typeName: string;
  jurisdiction?: MhdLeaveJurisdiction;
  entitlementHours?: number | null;
  measurementMethod?: MhdLeaveMeasurementMethod;
  measurementMonths?: number | null;
  requiresCertification?: boolean;
  citation?: string | null;
  sourceTypeId?: string | null;
}

/**
 * Edit a leave type's administrative config. `typeKey`, `jurisdiction`, and
 * global-vs-company ownership are fixed at creation and are not in
 * `mhd_update_leave_type`'s argument list — editing any of those would be a
 * different type, not a revision of this one. Every field the RPC does accept
 * is `coalesce`d against the existing row server-side, so an omitted field is
 * "leave as-is," not "clear it" — there is currently no way to blank out a
 * previously set `entitlementHours`/`measurementMonths`/`citation` through
 * this endpoint; only ever setting a new value.
 */
export interface MhdUpdateLeaveTypeInput {
  typeId: MhdLeaveTypeId;
  typeName?: string;
  entitlementHours?: number | null;
  measurementMethod?: MhdLeaveMeasurementMethod;
  measurementMonths?: number | null;
  requiresCertification?: boolean;
  citation?: string | null;
}

/**
 * Clone a global basis type (`sourceTypeId`, `company_id is null`) into a
 * company-owned, editable copy. `mhd_fork_leave_type` refuses a source that is
 * not itself a global row.
 */
export interface MhdForkLeaveTypeInput {
  sourceTypeId: MhdLeaveTypeId;
  companyId: string;
}

// ---------------------------------------------------------------------------
// Inputs and filters
// ---------------------------------------------------------------------------

export interface MhdCreateLeaveCaseInput {
  companyId: string;
  personId: string;
  reasonCategory: string;
  requestedStart?: string | null;
  requestedEnd?: string | null;
  isIntermittent?: boolean;
}

/**
 * Self-service leave request (mhd_leave_case_create_self, migration 0203):
 * no companyId/personId — both are derived server-side from the caller's
 * own linked person, never client-supplied, so this is deliberately a
 * narrower shape than MhdCreateLeaveCaseInput above, not the same input
 * with fields omitted.
 */
export interface MhdCreateLeaveCaseSelfInput {
  reasonCategory: string;
  requestedStart?: string | null;
  requestedEnd?: string | null;
  isIntermittent?: boolean;
}

/**
 * Form-driven Leaves intake (migration 0188): calls
 * `mhd_create_leave_case_from_submission`, which re-derives the same case
 * fields `mhd_leave_case_create` takes directly, out of a completed
 * submission's own `values` — and then delegates to that same RPC, so a
 * form-opened case and a directly-opened case are behaviorally identical.
 * `values` must be the SAME object the submit flow already holds right after
 * `mhdFormService.submitForm` resolves (its `MhdFormSubmission.values`) —
 * never re-fetched or re-derived, per the RPC's own header comment. The RPC
 * also requires the caller to be the submission's own submitter
 * (`submitter_id = current actor`), so this can only be invoked by the same
 * authenticated user who just submitted the form.
 */
export interface MhdCreateLeaveCaseFromSubmissionInput {
  submissionId: string;
  values: Json;
}

/**
 * The designation set — where concurrency is committed. In v1 the administrator
 * chooses which legal bases the case counts against; the qualification engine
 * that would derive them is v2.
 */
export interface MhdSetLeaveCaseBasesInput {
  caseId: MhdLeaveCaseId;
  leaveTypeIds: MhdLeaveTypeId[];
}

export interface MhdTransitionLeaveCaseInput {
  caseId: MhdLeaveCaseId;
  newStatus: MhdLeaveCaseStatus;
  /** Required by the RPC and schema when the new status is DENIED or CANCELLED. */
  decisionReason?: string | null;
}

/**
 * Designate hours against the case's whole basis set. One call writes one
 * DESIGNATION ledger row per designated basis — which is how a concurrent
 * FMLA+PDL interval decrements both clocks at once.
 */
export interface MhdDesignateLeaveInput {
  caseId: MhdLeaveCaseId;
  hours: number;
  effectiveDate: string;
}

export interface MhdAdjustLeaveInput {
  personId: string;
  leaveTypeId: MhdLeaveTypeId;
  /** Signed; may be negative (correct an over-credit) or positive (restore). */
  hoursDelta: number;
  reason: string;
  effectiveDate?: string | null;
}

export interface MhdRecordCertificationInput {
  caseId: MhdLeaveCaseId;
  certificationType: MhdLeaveCertificationType;
  dueDate?: string | null;
}

export interface MhdMarkCertificationInput {
  certId: MhdLeaveCertificationId;
  sufficient: boolean;
  receivedAt?: string | null;
  /** Restricted medical detail — only ever supplied by a PA/HRP caller. */
  providerNote?: string | null;
}

export interface MhdLeaveCaseFilters {
  companyId: string | null;
  personId?: string | null;
  status?: MhdLeaveCaseStatus | 'ALL' | null;
}

// ---------------------------------------------------------------------------
// Display + rule helpers
// ---------------------------------------------------------------------------

const JURISDICTION_LABELS: Record<MhdLeaveJurisdiction, string> = {
  FEDERAL: 'Federal',
  CA: 'California',
  COMPANY: 'Company policy',
  OTHER: 'Other',
};

const MEASUREMENT_METHOD_LABELS: Record<MhdLeaveMeasurementMethod, string> = {
  CALENDAR_YEAR: 'Calendar year',
  FIXED_YEAR: 'Fixed leave year',
  ROLLING_FORWARD: 'Rolling forward',
  ROLLING_BACKWARD: 'Rolling backward (look-back)',
  PER_EVENT: 'Per event',
  NONE: 'No measurement window',
};

const CASE_STATUS_LABELS: Record<MhdLeaveCaseStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  DENIED: 'Denied',
  CANCELLED: 'Cancelled',
};

const CERTIFICATION_TYPE_LABELS: Record<MhdLeaveCertificationType, string> = {
  INITIAL: 'Initial certification',
  RECERTIFICATION: 'Recertification',
  FITNESS_FOR_DUTY: 'Fitness for duty',
  SECOND_OPINION: 'Second opinion',
  THIRD_OPINION: 'Third opinion',
};

const LEDGER_ENTRY_TYPE_LABELS: Record<MhdLeaveLedgerEntryType, string> = {
  DESIGNATION: 'Designation',
  ADJUSTMENT: 'Adjustment',
  RESTORATION: 'Restoration',
  REVERSAL: 'Reversal',
};

export function mhdFormatLeaveJurisdiction(value: MhdLeaveJurisdiction | string): string {
  return JURISDICTION_LABELS[value as MhdLeaveJurisdiction] ?? value;
}

export function mhdFormatLeaveMeasurementMethod(value: MhdLeaveMeasurementMethod | string): string {
  return MEASUREMENT_METHOD_LABELS[value as MhdLeaveMeasurementMethod] ?? value;
}

export function mhdFormatLeaveCaseStatus(value: MhdLeaveCaseStatus | string): string {
  return CASE_STATUS_LABELS[value as MhdLeaveCaseStatus] ?? value;
}

export function mhdFormatLeaveCertificationType(value: MhdLeaveCertificationType | string): string {
  return CERTIFICATION_TYPE_LABELS[value as MhdLeaveCertificationType] ?? value;
}

export function mhdFormatLeaveLedgerEntryType(value: MhdLeaveLedgerEntryType | string): string {
  return LEDGER_ENTRY_TYPE_LABELS[value as MhdLeaveLedgerEntryType] ?? value;
}

/**
 * Hours rendered as both hours and their week-equivalent, because leave law is
 * written in weeks (FMLA 12wk, CFRA 12wk) while the ledger stores hours to
 * support intermittent leave. Uses a 40-hour week — the same convention the
 * seeded entitlements assume (PDL 693hr ≈ 17⅓wk). Presentation only; the
 * database never divides.
 */
export function mhdFormatLeaveHours(hours: number | null): string {
  if (hours == null) return 'No fixed cap';
  const weeks = hours / 40;
  const roundedWeeks = Math.round(weeks * 10) / 10;
  return `${hours} h (~${roundedWeeks} wk)`;
}

/** PostgREST serialises `numeric` as a string; normalise before any arithmetic. */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
