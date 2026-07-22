// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// TODO(build-wave): retype from database.types.ts after 0034 gen:types —
// replace these local interfaces with
// `Database['public']['Functions']['mhd_mileage_list_trips']['Returns'][number]`
// et al. once the migration has shipped and types are regenerated.
//
// Numeric RPC columns (miles, rates, amounts) are typed `number | string`
// because PostgREST serialises `numeric` as a string. Every mapper below runs
// them through `toNumber()` — never compare a raw row value arithmetically.
// This module pays people money, so a string that silently concatenates where
// it should have added is not a cosmetic bug.
//
// NO STATUTORY FIGURE APPEARS IN THIS FILE, and none may be added. Rates are
// data rows in the global registry with their own provenance; a default, a
// constant or a validation bound written here would be a second, undocumented
// source of truth that nobody confirms and nobody supersedes.
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_mileage_list_rates`. */
export interface MhdMileageRateRpcRow {
  id: string;
  reference_id: string;
  category: string;
  rate_per_mile: number | string;
  effective_from: string;
  /** Null means the row is open-ended — the rate currently in force. */
  effective_to: string | null;
  status: string;
  source_url: string | null;
  notice_number: string | null;
  source_document_date: string | null;
  retrieved_at: string | null;
  confirmed_at: string | null;
  fetch_source: string;
  notes: string | null;
}

/** Row shape returned by `mhd_mileage_resolve_rate_for_date`. Empty when no ACTIVE rate covers the date. */
export interface MhdMileageResolvedRateRpcRow {
  rate_id: string;
  rate_per_mile: number | string;
}

/**
 * Row shape returned by `mhd_mileage_get_effective_rate`. `policy_id` is null
 * when the company has configured nothing — absence of a policy means it tracks
 * the IRS business rate, which is the accountable-plan safe harbour, not that
 * there is no rate.
 */
export interface MhdMileageEffectiveRateRpcRow {
  company_rate: number | string | null;
  irs_rate: number | string | null;
  irs_rate_id: string | null;
  policy_id: string | null;
  rate_mode: string;
}

/** Row shape returned by `mhd_mileage_list_trips`. */
export interface MhdMileageTripRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  trip_date: string;
  miles: number | string;
  /** miles less any commute deduction — what a claim line would actually carry. */
  reimbursable_miles: number | string;
  origin: string;
  destination: string;
  business_purpose: string;
  recorded_on_behalf: boolean;
  /** Present when the trip already sits on a non-cancelled claim. */
  claim_id: string | null;
  claim_status: string | null;
  voided_at: string | null;
}

/** Row shape returned by `mhd_mileage_list_claims`. */
export interface MhdMileageClaimRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  period_start: string;
  period_end: string;
  status: string;
  line_count: number | string;
  /** Null until approval — before that no total is stored, only computed. */
  total_company_amount: number | string | null;
}

/** One element of the `lines` jsonb aggregate returned by `mhd_mileage_get_claim`. */
export interface MhdMileageClaimLineJson {
  line_number: number;
  trip_date: string;
  miles: number | string;
  /** Null on an unstamped line — a claim still in draft carries no rate. */
  irs_rate: number | string | null;
  company_rate: number | string | null;
  company_amount: number | string | null;
  /** The registry row the IRS figure came from, so the line cites its own source. */
  rate_reference: string | null;
  notice_number: string | null;
}

/** Row shape returned by `mhd_mileage_get_claim`. Lines arrive as jsonb. */
export interface MhdMileageClaimDetailRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  period_start: string;
  period_end: string;
  status: string;
  total_miles: number | string | null;
  total_company_amount: number | string | null;
  total_irs_amount: number | string | null;
  /**
   * Reimbursement above the IRS business rate is reportable wages. The server
   * derives it so payroll never has to; it is zero, never negative.
   */
  taxable_excess: number | string | null;
  decision_note: string | null;
  exported_at: string | null;
  lines: MhdMileageClaimLineJson[];
}

/** Row shape returned by the create RPCs that mint a reference: `(id, reference_id)`. */
export interface MhdMileageMutationRpcRow {
  id: string;
  reference_id: string;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdMileageRateId = string;
export type MhdMileageRateReferenceId = `MRTE-${string}`;
export type MhdMileageTripId = string;
export type MhdMileageTripReferenceId = `TRIP-${string}`;
export type MhdMileageClaimId = string;
export type MhdMileageClaimReferenceId = `MCLM-${string}`;
export type MhdMileageRatePolicyId = string;

/**
 * The registry carries all three federal categories. Only BUSINESS is wired to
 * claims in v1 (`mileage_claim_lines_category_allowed` permits nothing else);
 * the other two exist so the registry can hold the full published set without a
 * later migration.
 */
export type MhdMileageRateCategory = 'BUSINESS' | 'MEDICAL_MOVING' | 'CHARITABLE';

/**
 * A rate is PROPOSED until a human confirms it, and the confirmation is what
 * makes it authoritative. Nothing PROPOSED can ever price a claim — the
 * resolver filters to ACTIVE. SUPERSEDED rows stay readable forever because a
 * claim paid under one must remain explicable.
 */
export type MhdMileageRateStatus = 'PROPOSED' | 'ACTIVE' | 'SUPERSEDED';

/** MANUAL today; SCHEDULED_FETCH is reserved for the v2 fetcher and ships unused. */
export type MhdMileageFetchSource = 'MANUAL' | 'SCHEDULED_FETCH';

/**
 * TRACK_IRS_BUSINESS is the default and the safe harbour. FIXED is lawful but
 * consequential: anything paid above the IRS business rate is reportable wages,
 * which is why the editor states the implication rather than blocking it.
 */
export type MhdMileageRateMode = 'TRACK_IRS_BUSINESS' | 'FIXED';

/**
 * CANCELLED and REJECTED both release their trips back to the unclaimed pool —
 * a rejected claim is meant to be rebuilt and a cancelled one was abandoned, so
 * neither may hold a trip hostage. EXPORTED is terminal.
 */
export type MhdMileageClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPORTED';

/** The two outcomes `mhd_mileage_decide_claim` accepts. */
export type MhdMileageClaimDecision = 'APPROVED' | 'REJECTED';

export const MHD_MILEAGE_RATE_CATEGORIES = [
  'BUSINESS',
  'MEDICAL_MOVING',
  'CHARITABLE',
] as const satisfies readonly MhdMileageRateCategory[];

export const MHD_MILEAGE_RATE_STATUSES = [
  'PROPOSED',
  'ACTIVE',
  'SUPERSEDED',
] as const satisfies readonly MhdMileageRateStatus[];

export const MHD_MILEAGE_FETCH_SOURCES = [
  'MANUAL',
  'SCHEDULED_FETCH',
] as const satisfies readonly MhdMileageFetchSource[];

export const MHD_MILEAGE_RATE_MODES = [
  'TRACK_IRS_BUSINESS',
  'FIXED',
] as const satisfies readonly MhdMileageRateMode[];

export const MHD_MILEAGE_CLAIM_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPORTED',
] as const satisfies readonly MhdMileageClaimStatus[];

export const MHD_MILEAGE_CLAIM_DECISIONS = [
  'APPROVED',
  'REJECTED',
] as const satisfies readonly MhdMileageClaimDecision[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

export interface MhdMileageRate {
  id: MhdMileageRateId;
  referenceId: MhdMileageRateReferenceId;
  category: MhdMileageRateCategory;
  ratePerMile: number;
  effectiveFrom: string;
  /** Null means open-ended. Rates are ranges, never annual rows — see rule 2. */
  effectiveTo: string | null;
  status: MhdMileageRateStatus;
  /** Provenance. Complete on every ACTIVE row, by CHECK constraint. */
  sourceUrl: string | null;
  noticeNumber: string | null;
  sourceDocumentDate: string | null;
  retrievedAt: string | null;
  confirmedAt: string | null;
  fetchSource: MhdMileageFetchSource;
  notes: string | null;
}

/** The single resolution point's answer: which registry row prices a given date. */
export interface MhdMileageResolvedRate {
  rateId: MhdMileageRateId;
  ratePerMile: number;
}

export interface MhdMileageEffectiveRate {
  /** What the company pays. Equals the IRS rate under a tracking policy. */
  companyRate: number | null;
  /** The federal figure, always returned alongside — the excess is derived from the pair. */
  irsRate: number | null;
  irsRateId: MhdMileageRateId | null;
  /** Null when the company has configured no policy and therefore tracks IRS. */
  policyId: MhdMileageRatePolicyId | null;
  rateMode: MhdMileageRateMode;
}

export interface MhdMileageTrip {
  id: MhdMileageTripId;
  referenceId: MhdMileageTripReferenceId;
  personId: string;
  personDisplayName: string;
  tripDate: string;
  miles: number;
  /** Miles net of the commute deduction — what a claim line carries. */
  reimbursableMiles: number;
  origin: string;
  destination: string;
  /** Mandatory substantiation. A blank one makes the record worth nothing in an audit. */
  businessPurpose: string;
  /** True when somebody other than the traveller logged it. */
  recordedOnBehalf: boolean;
  claimId: MhdMileageClaimId | null;
  claimStatus: MhdMileageClaimStatus | null;
  voidedAt: string | null;
}

export interface MhdMileageClaimSummary {
  id: MhdMileageClaimId;
  referenceId: MhdMileageClaimReferenceId;
  personId: string;
  personDisplayName: string;
  periodStart: string;
  periodEnd: string;
  status: MhdMileageClaimStatus;
  lineCount: number;
  /** Null before approval: pre-approval totals are indicative and computed, not stored. */
  totalCompanyAmount: number | null;
}

export interface MhdMileageClaimLine {
  lineNumber: number;
  tripDate: string;
  miles: number;
  /** Null while unstamped. Stamped fields arrive together or not at all. */
  irsRate: number | null;
  companyRate: number | null;
  companyAmount: number | null;
  /** The registry row this line cites, so the figure can be traced to its notice. */
  rateReference: string | null;
  noticeNumber: string | null;
}

export interface MhdMileageClaimDetail {
  id: MhdMileageClaimId;
  referenceId: MhdMileageClaimReferenceId;
  personId: string;
  personDisplayName: string;
  periodStart: string;
  periodEnd: string;
  status: MhdMileageClaimStatus;
  /** All three totals are null until approval stamps them (rule 4). */
  totalMiles: number | null;
  totalCompanyAmount: number | null;
  totalIrsAmount: number | null;
  /** Company amount above the IRS amount — reportable wages. Never negative. */
  taxableExcess: number;
  decisionNote: string | null;
  exportedAt: string | null;
  lines: MhdMileageClaimLine[];
  // No approvalRequestId, deliberately and permanently. The claim holds NO
  // approval column; public.approvals points here via entity_type =
  // 'MILEAGE_CLAIM' / entity_id. A field here would invert that direction and
  // couple this module to another service's tables.
}

// ---------------------------------------------------------------------------
// Inputs and filters
// ---------------------------------------------------------------------------

/**
 * Proposing a registry row. The source URL and notice number are required at
 * proposal time rather than at confirmation: a candidate without its citation
 * is just a number somebody typed, and the confirmer would have nothing to
 * check it against.
 */
export interface MhdProposeRateInput {
  category: MhdMileageRateCategory;
  ratePerMile: number;
  effectiveFrom: string;
  sourceUrl: string;
  noticeNumber: string;
  sourceDocumentDate?: string | null;
  notes?: string | null;
}

export interface MhdSetCompanyRatePolicyInput {
  companyId: string;
  effectiveFrom: string;
  rateMode: MhdMileageRateMode;
  /** Required iff rateMode is FIXED, forbidden otherwise — a CHECK in both directions. */
  fixedRatePerMile?: number | null;
  policyNote?: string | null;
}

/**
 * `notOrdinaryCommuting` is an affirmation, not a preference. Commuting mileage
 * is not reimbursable, and the RPC refuses the trip outright when it is false —
 * a system that let it through would build a defective record silently.
 */
export interface MhdRecordTripInput {
  personId: string;
  tripDate: string;
  miles: number;
  origin: string;
  destination: string;
  businessPurpose: string;
  notOrdinaryCommuting: boolean;
  isRoundTrip?: boolean;
  odometerStart?: number | null;
  odometerEnd?: number | null;
  commuteDeductionMiles?: number | null;
  vehicleDescription?: string | null;
  notes?: string | null;
}

export interface MhdVoidTripInput {
  tripId: MhdMileageTripId;
  reason: string;
}

export interface MhdCreateClaimInput {
  personId: string;
  periodStart: string;
  periodEnd: string;
}

export interface MhdAddTripToClaimInput {
  claimId: MhdMileageClaimId;
  tripId: MhdMileageTripId;
}

/** `decisionNote` is required on REJECTED and optional on APPROVED. */
export interface MhdDecideClaimInput {
  claimId: MhdMileageClaimId;
  decision: MhdMileageClaimDecision;
  decisionNote?: string | null;
}

export interface MhdMarkClaimExportedInput {
  claimId: MhdMileageClaimId;
  batchReference: string;
}

export interface MhdMileageTripFilters {
  companyId: string | null;
  personId?: string | null;
  from?: string | null;
  to?: string | null;
  /** Restricts to trips not yet on any claim — the claim builder's source list. */
  unclaimedOnly?: boolean;
  includeVoided?: boolean;
}

export interface MhdMileageClaimFilters {
  companyId: string | null;
  personId?: string | null;
  status?: MhdMileageClaimStatus | 'ALL' | null;
}

export interface MhdMileageRateFilters {
  category?: MhdMileageRateCategory | 'ALL' | null;
  status?: MhdMileageRateStatus | 'ALL' | null;
}

// ---------------------------------------------------------------------------
// Display + rule helpers
// ---------------------------------------------------------------------------

const RATE_CATEGORY_LABELS: Record<MhdMileageRateCategory, string> = {
  BUSINESS: 'Business',
  MEDICAL_MOVING: 'Medical / moving',
  CHARITABLE: 'Charitable',
};

const RATE_STATUS_LABELS: Record<MhdMileageRateStatus, string> = {
  PROPOSED: 'Proposed — awaiting confirmation',
  ACTIVE: 'Active',
  SUPERSEDED: 'Superseded',
};

const RATE_MODE_LABELS: Record<MhdMileageRateMode, string> = {
  TRACK_IRS_BUSINESS: 'Track the IRS business rate',
  FIXED: 'Fixed company rate',
};

const CLAIM_STATUS_LABELS: Record<MhdMileageClaimStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  EXPORTED: 'Exported',
};

const FETCH_SOURCE_LABELS: Record<MhdMileageFetchSource, string> = {
  MANUAL: 'Entered by hand',
  SCHEDULED_FETCH: 'Scheduled fetch',
};

export function mhdFormatRateCategory(value: MhdMileageRateCategory | string): string {
  return RATE_CATEGORY_LABELS[value as MhdMileageRateCategory] ?? value;
}

export function mhdFormatRateStatus(value: MhdMileageRateStatus | string): string {
  return RATE_STATUS_LABELS[value as MhdMileageRateStatus] ?? value;
}

export function mhdFormatRateMode(value: MhdMileageRateMode | string): string {
  return RATE_MODE_LABELS[value as MhdMileageRateMode] ?? value;
}

export function mhdFormatClaimStatus(value: MhdMileageClaimStatus | string): string {
  return CLAIM_STATUS_LABELS[value as MhdMileageClaimStatus] ?? value;
}

export function mhdFormatFetchSource(value: MhdMileageFetchSource | string): string {
  return FETCH_SOURCE_LABELS[value as MhdMileageFetchSource] ?? value;
}

/**
 * A rate is current when it is ACTIVE and today falls inside its range. Derived,
 * never stored: "the current rate" changes with the calendar, and a stored flag
 * would go stale the morning a mid-year revision takes effect.
 */
export function mhdIsRateCurrent(rate: MhdMileageRate, onDate?: string): boolean {
  if (rate.status !== 'ACTIVE') return false;
  const on = onDate ?? new Date().toISOString().slice(0, 10);
  return rate.effectiveFrom <= on && (rate.effectiveTo == null || rate.effectiveTo >= on);
}

/**
 * A trip can go on a claim only while it is neither voided nor already sitting
 * on a live claim. The database guarantees the one-live-claim rule with a unique
 * index; this exists so the claim builder can grey the row out rather than let
 * the user discover the rule as a save error.
 */
export function mhdIsTripClaimable(trip: MhdMileageTrip): boolean {
  if (trip.voidedAt != null) return false;
  if (trip.claimId == null) return true;
  return trip.claimStatus === 'REJECTED' || trip.claimStatus === 'CANCELLED';
}

/**
 * The excess of company reimbursement over the IRS figure. That excess is
 * reportable wages under an accountable plan, so it is surfaced rather than
 * hidden — the system's job is to make the consequence computable, not to
 * overrule a lawful decision to pay above the federal rate.
 *
 * Clamped at zero: paying BELOW the IRS rate creates no negative wage item, it
 * simply leaves an unreimbursed cost with the employee.
 */
export function mhdTaxableExcess(companyAmount: number, irsAmount: number): number {
  return Math.max(companyAmount - irsAmount, 0);
}

/**
 * Indicative value of a set of trips at a given rate, for the claim builder.
 * Explicitly NOT the stored total: at approval the server prices each line
 * against the rate in force on that line's own trip date, so a claim spanning a
 * mid-year revision will settle differently from any single-rate preview. Label
 * this output as indicative wherever it is shown.
 */
export function mhdIndicativeAmount(reimbursableMiles: number, ratePerMile: number): number {
  return Math.round(reimbursableMiles * ratePerMile * 100) / 100;
}

/** PostgREST serialises `numeric` as a string; normalise before any arithmetic. */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
