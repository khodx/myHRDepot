// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// Deliberately hand-maintained, not generated (checked 2026-08-06, migration
// 0042 has long since shipped): gen:types marks every column on a
// table-returning RPC function as non-null regardless of the underlying
// table's real schema, and collapses PostgREST's numeric-as-string
// serialization down to plain `number` — losing exactly the fact this
// file's own comment below warns about. Adopting the generated type here
// would silently reintroduce both.
//
// The numeric business fields — `headcount`, `open_application_count`
// (requisition list) and `applicant_count` (EEO report) — are typed
// `number | string | null` because PostgREST can serialise an integer column as
// a JSON string. Every mapper below runs them through `mhdToNumber()`; never
// compare or arithmetic a raw row value. `desired_pay_rate` is a numeric too,
// but note NO read RPC returns it — the applicant supplies it write-only via the
// tokenized submit — so it is normalised only if a future read path surfaces it.
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_recruiting_stage_list`. */
export interface MhdRecruitingStageRpcRow {
  id: string;
  company_id: string | null;
  stage_key: string;
  stage_name: string;
  category: string;
  sort_order: number | string | null;
  is_active: boolean;
  // `company_id is null` computed server-side. A global stage is platform-owned
  // and shared by every tenant; the config UI marks it read-only.
  is_global: boolean;
}

/** Row shape returned by `mhd_recruiting_reason_list`. */
export interface MhdRecruitingReasonRpcRow {
  id: string;
  reason_key: string;
  reason_text: string;
  sort_order: number | string | null;
  is_global: boolean;
}

/** Row shape returned by `mhd_recruiting_requisition_list`. */
export interface MhdRecruitingRequisitionRpcRow {
  id: string;
  reference_id: string;
  job_id: string | null;
  title: string;
  hiring_manager_person_id: string | null;
  hiring_manager_name: string | null;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  headcount: number | string | null;
  status: string;
  requires_approval: boolean;
  // Server-computed count of ACTIVE-lifecycle applications on this req.
  open_application_count: number | string | null;
  opened_at: string | null;
  created_at: string;
}

/** Row shape returned by `mhd_recruiting_application_list`. */
export interface MhdRecruitingApplicationRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  lifecycle: string;
  current_stage_id: string | null;
  stage_name: string | null;
  source: string | null;
  submitted_at: string | null;
  created_at: string;
}

/**
 * Row shape returned by `mhd_recruiting_application_get` (single row). Carries the
 * structured applicant fields — `desired_pay_rate` is a numeric PostgREST may
 * serialise as a string, so it is typed `number | string | null` and normalised
 * by the mapper. This is a recruiter/HM read; it carries NO EEO data (that
 * partition is write-only from the app's perspective).
 */
export interface MhdRecruitingApplicationDetailRpcRow {
  id: string;
  reference_id: string;
  requisition_id: string;
  requisition_title: string;
  person_id: string;
  person_display_name: string;
  lifecycle: string;
  current_stage_id: string | null;
  stage_name: string | null;
  source: string | null;
  invited_at: string | null;
  submitted_at: string | null;
  desired_pay_rate: number | string | null;
  availability_date: string | null;
  employment_type_desired: string | null;
  cover_note: string | null;
  rejection_reason_id: string | null;
  rejection_reason_text: string | null;
  rejection_note: string | null;
  created_at: string;
}

/** Row shape returned by `mhd_recruiting_application_history` (append-only trail). */
export interface MhdRecruitingApplicationHistoryRpcRow {
  id: string;
  from_stage_id: string | null;
  from_stage_name: string | null;
  to_stage_id: string | null;
  to_stage_name: string | null;
  note: string | null;
  moved_at: string;
  moved_by: string | null;
}

/** Row shape returned by a create RPC that mints a reference: `(id, reference_id)`. */
export interface MhdRecruitingMutationRpcRow {
  id: string;
  reference_id: string;
}

/** Row shape returned by `mhd_recruiting_application_invite`: `(id, reference_id, invite_token)`. */
export interface MhdRecruitingInviteRpcRow {
  id: string;
  reference_id: string;
  // The single-use invite token — returned ONCE, embedded in the applicant's
  // link. Never listed back by any read RPC.
  invite_token: string;
}

/** Row shape returned by `mhd_recruiting_eeo_report`: aggregate counts only. */
export interface MhdRecruitingEeoReportRpcRow {
  dimension: string;
  bucket: string;
  applicant_count: number | string | null;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdRecruitingRequisitionId = string;
export type MhdRecruitingApplicationId = string;
export type MhdRecruitingStageId = string;
export type MhdRecruitingReasonId = string;

export type MhdRecruitingRequisitionReferenceId = `REQ-${string}`;
export type MhdRecruitingApplicationReferenceId = `APP-${string}`;

/** Requisition lifecycle. Transitioned server-side; the UI renders and offers moves. */
export type MhdRecruitingRequisitionStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'OPEN' | 'ON_HOLD' | 'FILLED' | 'CLOSED' | 'CANCELLED';

/** Pipeline-stage category. Drives the application lifecycle when a stage is entered. */
export type MhdRecruitingStageCategory = 'ACTIVE' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

/**
 * The application lifecycle. `INVITED` is the pre-submission state (link sent);
 * once submitted it is `ACTIVE` and thereafter MIRRORS the current stage's
 * category. Synced server-side by `move_stage` / `reject`; never computed client-side.
 */
export type MhdRecruitingApplicationLifecycle =
  'INVITED' | 'ACTIVE' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

export const MHD_RECRUITING_REQUISITION_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'OPEN',
  'ON_HOLD',
  'FILLED',
  'CLOSED',
  'CANCELLED',
] as const satisfies readonly MhdRecruitingRequisitionStatus[];

export const MHD_RECRUITING_STAGE_CATEGORIES = [
  'ACTIVE',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
] as const satisfies readonly MhdRecruitingStageCategory[];

export const MHD_RECRUITING_APPLICATION_LIFECYCLES = [
  'INVITED',
  'ACTIVE',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
] as const satisfies readonly MhdRecruitingApplicationLifecycle[];

// ---------------------------------------------------------------------------
// EEO self-identification vocabularies (apply-page dropdowns only)
//
// The columns are free `text` in the DB; these `as const` option lists shape the
// applicant's VOLUNTARY self-id form and give the aggregate report stable
// buckets. They exist ONLY on the public apply page — EEO values are never read
// back onto any recruiter/HM surface. Standard EEO-1 / VEVRAA / Section 503
// categories, plus an explicit decline.
// ---------------------------------------------------------------------------

export const MHD_RECRUITING_EEO_RACE_ETHNICITIES = [
  'HISPANIC_OR_LATINO',
  'WHITE',
  'BLACK_OR_AFRICAN_AMERICAN',
  'NATIVE_HAWAIIAN_OR_PACIFIC_ISLANDER',
  'ASIAN',
  'AMERICAN_INDIAN_OR_ALASKA_NATIVE',
  'TWO_OR_MORE_RACES',
  'DECLINE',
] as const;
export type MhdRecruitingEeoRaceEthnicity = (typeof MHD_RECRUITING_EEO_RACE_ETHNICITIES)[number];

export const MHD_RECRUITING_EEO_GENDERS = ['FEMALE', 'MALE', 'NON_BINARY', 'DECLINE'] as const;
export type MhdRecruitingEeoGender = (typeof MHD_RECRUITING_EEO_GENDERS)[number];

export const MHD_RECRUITING_EEO_VETERAN_STATUSES = [
  'PROTECTED_VETERAN',
  'NOT_A_PROTECTED_VETERAN',
  'DECLINE',
] as const;
export type MhdRecruitingEeoVeteranStatus = (typeof MHD_RECRUITING_EEO_VETERAN_STATUSES)[number];

export const MHD_RECRUITING_EEO_DISABILITY_STATUSES = [
  'YES_DISABILITY',
  'NO_DISABILITY',
  'DECLINE',
] as const;
export type MhdRecruitingEeoDisabilityStatus =
  (typeof MHD_RECRUITING_EEO_DISABILITY_STATUSES)[number];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

/**
 * A pipeline stage, from `stage_list`. `isGlobal` (`company_id IS NULL`) marks a
 * platform-seeded stage shared by every tenant. `category` drives the lifecycle
 * an application takes when moved into this stage.
 */
export interface MhdRecruitingStage {
  id: MhdRecruitingStageId;
  companyId: string | null;
  stageKey: string;
  stageName: string;
  category: MhdRecruitingStageCategory;
  sortOrder: number;
  isActive: boolean;
  isGlobal: boolean;
}

/** A rejection reason, from `reason_list`. `isGlobal` marks a platform-seeded one. */
export interface MhdRecruitingReason {
  id: MhdRecruitingReasonId;
  reasonKey: string;
  reasonText: string;
  sortOrder: number;
  isGlobal: boolean;
}

/**
 * One requisition row from `requisition_list`. `openApplicationCount` is the
 * server-computed count of ACTIVE applications. `headcount` is normalised from a
 * possibly-stringified integer.
 */
export interface MhdRecruitingRequisition {
  id: MhdRecruitingRequisitionId;
  referenceId: MhdRecruitingRequisitionReferenceId;
  jobId: string | null;
  title: string;
  hiringManagerPersonId: string | null;
  hiringManagerName: string | null;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  headcount: number;
  status: MhdRecruitingRequisitionStatus;
  requiresApproval: boolean;
  openApplicationCount: number;
  openedAt: string | null;
  createdAt: string;
}

/**
 * One application row from `application_list`. Carries the SERVER-SYNCED
 * `lifecycle` and the current stage — render them; do not recompute lifecycle
 * from the stage category on the client. This is the board/list projection; the
 * full structured record is `MhdRecruitingApplicationDetail` (`application_get`).
 */
export interface MhdRecruitingApplication {
  id: MhdRecruitingApplicationId;
  referenceId: MhdRecruitingApplicationReferenceId;
  personId: string;
  personDisplayName: string;
  lifecycle: MhdRecruitingApplicationLifecycle;
  currentStageId: string | null;
  stageName: string | null;
  source: string | null;
  submittedAt: string | null;
  createdAt: string;
}

/**
 * The full single application, from `application_get`. Adds the structured
 * applicant fields captured at submit and the resolved rejection reason.
 * `desiredPayRate` is normalised from a possibly-stringified numeric; it is
 * `null` when the applicant left it blank (not 0). Carries NO EEO data.
 */
export interface MhdRecruitingApplicationDetail {
  id: MhdRecruitingApplicationId;
  referenceId: MhdRecruitingApplicationReferenceId;
  requisitionId: MhdRecruitingRequisitionId;
  requisitionTitle: string;
  personId: string;
  personDisplayName: string;
  lifecycle: MhdRecruitingApplicationLifecycle;
  currentStageId: string | null;
  stageName: string | null;
  source: string | null;
  invitedAt: string | null;
  submittedAt: string | null;
  desiredPayRate: number | null;
  availabilityDate: string | null;
  employmentTypeDesired: string | null;
  coverNote: string | null;
  rejectionReasonId: string | null;
  rejectionReasonText: string | null;
  rejectionNote: string | null;
  createdAt: string;
}

/**
 * One entry of an application's append-only stage trail, from
 * `application_history`. `fromStageId` is `null` for the first row (submission).
 */
export interface MhdRecruitingApplicationHistoryEntry {
  id: string;
  fromStageId: string | null;
  fromStageName: string | null;
  toStageId: string | null;
  toStageName: string | null;
  note: string | null;
  movedAt: string;
  movedBy: string | null;
}

/** Mapped result of a create RPC that mints a reference. */
export interface MhdRecruitingMutationResult {
  id: string;
  referenceId: string;
}

/**
 * Mapped result of `application_invite` — carries the invite token returned ONCE.
 * The recruiter UI turns this into a copyable apply link and never persists /
 * re-lists the token.
 */
export interface MhdRecruitingInviteResult {
  id: string;
  referenceId: string;
  inviteToken: string;
}

/** One aggregate row of the EEO report — a bucket count within a dimension. */
export interface MhdRecruitingEeoReportRow {
  dimension: string;
  bucket: string;
  applicantCount: number;
}

// ---------------------------------------------------------------------------
// Inputs and filters
// ---------------------------------------------------------------------------

export interface MhdCreateRequisitionInput {
  companyId: string;
  title: string;
  jobId?: string | null;
  hiringManagerPersonId?: string | null;
  department?: string | null;
  location?: string | null;
  employmentType?: string | null;
  headcount?: number | null;
  requiresApproval?: boolean;
}

export interface MhdTransitionRequisitionInput {
  reqId: MhdRecruitingRequisitionId;
  newStatus: MhdRecruitingRequisitionStatus;
}

export interface MhdStageUpsertInput {
  companyId: string;
  stageKey: string;
  stageName: string;
  category?: MhdRecruitingStageCategory;
  sortOrder?: number | null;
}

export interface MhdInviteApplicationInput {
  requisitionId: MhdRecruitingRequisitionId;
  personId: string;
  source?: string | null;
}

/**
 * The applicant's tokenized submission. Reached UNAUTHENTICATED through the apply
 * link — the token is the only credential. `desiredPayRate` is the numeric field.
 */
export interface MhdSubmitApplicationInput {
  inviteToken: string;
  desiredPayRate?: number | null;
  availabilityDate?: string | null;
  employmentTypeDesired?: string | null;
  coverNote?: string | null;
}

export interface MhdMoveApplicationStageInput {
  applicationId: MhdRecruitingApplicationId;
  toStageId: MhdRecruitingStageId;
  note?: string | null;
}

export interface MhdRejectApplicationInput {
  applicationId: MhdRecruitingApplicationId;
  reasonId?: string | null;
  note?: string | null;
}

/**
 * The applicant's VOLUNTARY EEO self-id, tokenized like submit. Writes ONLY to
 * the hard-restricted partition; never surfaced back to a recruiter. `declined`
 * records an explicit decline-to-state.
 */
export interface MhdSubmitEeoInput {
  inviteToken: string;
  raceEthnicity?: string | null;
  gender?: string | null;
  veteranStatus?: string | null;
  disabilityStatus?: string | null;
  declined?: boolean;
}

export interface MhdRequisitionFilters {
  companyId: string | null;
  status?: MhdRecruitingRequisitionStatus | 'ALL' | null;
}

export interface MhdApplicationFilters {
  requisitionId: string | null;
  stageId?: string | null;
  lifecycle?: MhdRecruitingApplicationLifecycle | 'ALL' | null;
}

export interface MhdEeoReportFilters {
  companyId: string | null;
  requisitionId?: string | null;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const REQUISITION_STATUS_LABELS: Record<MhdRecruitingRequisitionStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  OPEN: 'Open',
  ON_HOLD: 'On hold',
  FILLED: 'Filled',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

const STAGE_CATEGORY_LABELS: Record<MhdRecruitingStageCategory, string> = {
  ACTIVE: 'Active',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const APPLICATION_LIFECYCLE_LABELS: Record<MhdRecruitingApplicationLifecycle, string> = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const EEO_RACE_ETHNICITY_LABELS: Record<MhdRecruitingEeoRaceEthnicity, string> = {
  HISPANIC_OR_LATINO: 'Hispanic or Latino',
  WHITE: 'White',
  BLACK_OR_AFRICAN_AMERICAN: 'Black or African American',
  NATIVE_HAWAIIAN_OR_PACIFIC_ISLANDER: 'Native Hawaiian or Other Pacific Islander',
  ASIAN: 'Asian',
  AMERICAN_INDIAN_OR_ALASKA_NATIVE: 'American Indian or Alaska Native',
  TWO_OR_MORE_RACES: 'Two or more races',
  DECLINE: 'Decline to self-identify',
};

const EEO_GENDER_LABELS: Record<MhdRecruitingEeoGender, string> = {
  FEMALE: 'Female',
  MALE: 'Male',
  NON_BINARY: 'Non-binary',
  DECLINE: 'Decline to self-identify',
};

const EEO_VETERAN_STATUS_LABELS: Record<MhdRecruitingEeoVeteranStatus, string> = {
  PROTECTED_VETERAN: 'I identify as one or more classifications of protected veteran',
  NOT_A_PROTECTED_VETERAN: 'I am not a protected veteran',
  DECLINE: 'Decline to self-identify',
};

const EEO_DISABILITY_STATUS_LABELS: Record<MhdRecruitingEeoDisabilityStatus, string> = {
  YES_DISABILITY: 'Yes, I have a disability (or previously had one)',
  NO_DISABILITY: 'No, I do not have a disability',
  DECLINE: 'Decline to self-identify',
};

export function mhdFormatRequisitionStatus(value: MhdRecruitingRequisitionStatus | string): string {
  return REQUISITION_STATUS_LABELS[value as MhdRecruitingRequisitionStatus] ?? value;
}

export function mhdFormatStageCategory(value: MhdRecruitingStageCategory | string): string {
  return STAGE_CATEGORY_LABELS[value as MhdRecruitingStageCategory] ?? value;
}

export function mhdFormatApplicationLifecycle(
  value: MhdRecruitingApplicationLifecycle | string,
): string {
  return APPLICATION_LIFECYCLE_LABELS[value as MhdRecruitingApplicationLifecycle] ?? value;
}

export function mhdFormatEeoRaceEthnicity(value: string): string {
  return EEO_RACE_ETHNICITY_LABELS[value as MhdRecruitingEeoRaceEthnicity] ?? value;
}

export function mhdFormatEeoGender(value: string): string {
  return EEO_GENDER_LABELS[value as MhdRecruitingEeoGender] ?? value;
}

export function mhdFormatEeoVeteranStatus(value: string): string {
  return EEO_VETERAN_STATUS_LABELS[value as MhdRecruitingEeoVeteranStatus] ?? value;
}

export function mhdFormatEeoDisabilityStatus(value: string): string {
  return EEO_DISABILITY_STATUS_LABELS[value as MhdRecruitingEeoDisabilityStatus] ?? value;
}

/** Human label for an EEO report dimension key. */
export function mhdFormatEeoDimension(value: string): string {
  switch (value) {
    case 'race_ethnicity':
      return 'Race / ethnicity';
    case 'gender':
      return 'Gender';
    case 'veteran_status':
      return 'Veteran status';
    case 'disability_status':
      return 'Disability status';
    default:
      return value;
  }
}

/**
 * Human label for an EEO report bucket. The report coalesces a missing value to
 * `UNSPECIFIED`; buckets otherwise carry the stored code, which we map back
 * through the per-dimension label maps (falling through to the raw value).
 */
export function mhdFormatEeoBucket(value: string): string {
  if (value === 'UNSPECIFIED') return 'Not specified';
  return (
    EEO_RACE_ETHNICITY_LABELS[value as MhdRecruitingEeoRaceEthnicity] ??
    EEO_GENDER_LABELS[value as MhdRecruitingEeoGender] ??
    EEO_VETERAN_STATUS_LABELS[value as MhdRecruitingEeoVeteranStatus] ??
    EEO_DISABILITY_STATUS_LABELS[value as MhdRecruitingEeoDisabilityStatus] ??
    value
  );
}

/**
 * PostgREST serialises a numeric/integer column as a string in some paths;
 * normalise before any arithmetic or comparison. Copied verbatim from the house
 * pattern (Training / Investigations / Leaves). Used here by the requisition
 * mapper for `headcount` / `open_application_count` and the EEO mapper for
 * `applicant_count`.
 */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
