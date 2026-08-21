import type { Database } from '@/types/database.types';

// ---------------------------------------------------------------------------
// RPC row shapes
//
// The flat rows are aliased directly from the generated 0033 types (the live
// schema is truth). PostgREST serialises `numeric` as a string at runtime and
// null-masks pay for an unprivileged caller, neither of which the generated
// types reflect — so every numeric row value goes through `mhdToNumber()` /
// `mhdToNullableNumber()` before it is compared or formatted, never raw.
//
// PAY IS NULL-MASKED SERVER-SIDE. pay_min / pay_max / pay_period arrive as null
// for any caller who is not Platform Admin or HR Partner. That is the RPC doing
// its job, not missing data — see `mhdCanSeePayFromRow`.
// ---------------------------------------------------------------------------

type MhdJobFunctions = Database['public']['Functions'];

/** Row shape returned by `mhd_job_list_jobs`. */
export type MhdJobRpcRow = MhdJobFunctions['mhd_job_list_jobs']['Returns'][number];

/** Row shape returned by `mhd_job_assignment_list_for_person`. */
export type MhdJobAssignmentRpcRow =
  MhdJobFunctions['mhd_job_assignment_list_for_person']['Returns'][number];

/** Row shape returned by `mhd_competency_list`. */
export type MhdCompetencyRpcRow = MhdJobFunctions['mhd_competency_list']['Returns'][number];

/** Row shape returned by the create RPCs that mint a reference: `(id, reference_id)`. */
export type MhdJobsMutationRpcRow = MhdJobFunctions['mhd_job_create_job']['Returns'][number];

/**
 * Row shape returned by `mhd_job_get_published_for_person` — THE consumer
 * contract. Performance v2 and a future ATS read this and nothing else. The
 * generated types serialise the child collections as opaque `Json`, so the
 * structured shape is spelled out here and the service casts through it.
 */
export interface MhdPublishedJobRpcRow {
  job_id: string;
  job_title: string;
  flsa_classification: string | null;
  is_safety_sensitive: boolean;
  industry: string;
  description_id: string;
  description_reference: string;
  version_number: number | string;
  effective_from: string;
  summary: string | null;
  essential_functions: Array<{ text: string }>;
  marginal_functions: Array<{ text: string }>;
  qualifications: Array<{ text: string; type: string; required: boolean }>;
  competencies: Array<{
    competency_id: string;
    name: string;
    category: string | null;
    is_regulated: boolean;
    weight: number | string | null;
  }>;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdJobId = string;
export type MhdJobReferenceId = `JOB-${string}`;
export type MhdJobDescriptionId = string;
export type MhdJobDescriptionReferenceId = `JBDS-${string}`;
export type MhdCompetencyId = string;
export type MhdCompetencyReferenceId = `COMP-${string}`;

/**
 * Exempt status is a property of the JOB, not of the person holding it — and it
 * is what Time & Attendance v2 accrual needs. Nothing else in the platform
 * records it.
 */
export type MhdFlsaClassification = 'EXEMPT' | 'NON_EXEMPT';

export type MhdEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'SEASONAL' | 'CONTRACT';

/** Drives competency-pack filtering. `GENERAL` applies everywhere. */
export type MhdIndustry = 'GENERAL' | 'HEALTHCARE' | 'TRANSPORTATION' | 'OTHER';

export type MhdCaWageOrderClassification =
  | 'MANUFACTURING'
  | 'PERSONAL_SERVICE'
  | 'CANNING_FREEZING_PRESERVING'
  | 'PROFESSIONAL_TECHNICAL_CLERICAL_MECHANICAL'
  | 'PUBLIC_HOUSEKEEPING'
  | 'LAUNDRY_LINEN_DRY_CLEANING'
  | 'MERCANTILE'
  | 'PRODUCTS_AFTER_HARVEST'
  | 'TRANSPORTATION'
  | 'AMUSEMENT_RECREATION'
  | 'BROADCASTING'
  | 'MOTION_PICTURE'
  | 'AGRICULTURAL_ON_FARM_PREP'
  | 'AGRICULTURAL_OCCUPATIONS'
  | 'HOUSEHOLD'
  | 'CONSTRUCTION_DRILLING_LOGGING_MINING'
  | 'MISCELLANEOUS';

/**
 * `PUBLISHED` and `ARCHIVED` are immutable server-side. A correction creates a
 * new version rather than editing one, because a review stamps the version it
 * was written against and that stamp must keep meaning what it meant.
 */
export type MhdJobDescriptionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type MhdQualificationType =
  'EDUCATION' | 'EXPERIENCE' | 'CERTIFICATION' | 'LICENSE' | 'SKILL';

export type MhdPayPeriod = 'HOURLY' | 'ANNUAL';

export const MHD_FLSA_CLASSIFICATIONS = [
  'EXEMPT',
  'NON_EXEMPT',
] as const satisfies readonly MhdFlsaClassification[];

export const MHD_EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'TEMPORARY',
  'SEASONAL',
  'CONTRACT',
] as const satisfies readonly MhdEmploymentType[];

export const MHD_INDUSTRIES = [
  'GENERAL',
  'HEALTHCARE',
  'TRANSPORTATION',
  'OTHER',
] as const satisfies readonly MhdIndustry[];

export const MHD_CA_WAGE_ORDER_CLASSIFICATIONS = [
  'MANUFACTURING',
  'PERSONAL_SERVICE',
  'CANNING_FREEZING_PRESERVING',
  'PROFESSIONAL_TECHNICAL_CLERICAL_MECHANICAL',
  'PUBLIC_HOUSEKEEPING',
  'LAUNDRY_LINEN_DRY_CLEANING',
  'MERCANTILE',
  'PRODUCTS_AFTER_HARVEST',
  'TRANSPORTATION',
  'AMUSEMENT_RECREATION',
  'BROADCASTING',
  'MOTION_PICTURE',
  'AGRICULTURAL_ON_FARM_PREP',
  'AGRICULTURAL_OCCUPATIONS',
  'HOUSEHOLD',
  'CONSTRUCTION_DRILLING_LOGGING_MINING',
  'MISCELLANEOUS',
] as const satisfies readonly MhdCaWageOrderClassification[];

export const MHD_JOB_DESCRIPTION_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
] as const satisfies readonly MhdJobDescriptionStatus[];

export const MHD_QUALIFICATION_TYPES = [
  'EDUCATION',
  'EXPERIENCE',
  'CERTIFICATION',
  'LICENSE',
  'SKILL',
] as const satisfies readonly MhdQualificationType[];

export const MHD_PAY_PERIODS = ['HOURLY', 'ANNUAL'] as const satisfies readonly MhdPayPeriod[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

export interface MhdJob {
  id: MhdJobId;
  referenceId: MhdJobReferenceId;
  jobTitle: string;
  jobCode: string | null;
  jobFamily: string | null;
  jobLevel: string | null;
  department: string | null;
  flsaClassification: MhdFlsaClassification | null;
  employmentType: MhdEmploymentType;
  isSafetySensitive: boolean;
  industry: MhdIndustry;
  onetSocCode: string | null;
  caWageOrderClassification: MhdCaWageOrderClassification | null;
  /** Null when the caller is not permitted to see pay — not "unset". */
  payMin: number | null;
  payMax: number | null;
  payPeriod: MhdPayPeriod | null;
  isActive: boolean;
  incumbentCount: number;
  publishedDescriptionId: MhdJobDescriptionId | null;
}

export interface MhdJobAssignment {
  id: string;
  jobId: MhdJobId;
  jobTitle: string;
  jobReference: string;
  flsaClassification: MhdFlsaClassification | null;
  isSafetySensitive: boolean;
  effectiveFrom: string;
  /** Null means this is the assignment currently in force. */
  effectiveTo: string | null;
  managerPersonId: string | null;
  assignmentNote: string | null;
}

export interface MhdCompetency {
  id: MhdCompetencyId;
  referenceId: MhdCompetencyReferenceId;
  companyId: string | null;
  competencyName: string;
  description: string | null;
  category: string | null;
  industry: MhdIndustry;
  /** Tied to a regulatory expectation — healthcare and transportation especially. */
  isRegulated: boolean;
  isActive: boolean;
  /** Global rows are seeded and read-only to companies. */
  isGlobal: boolean;
}

export interface MhdJobFunction {
  text: string;
}

export interface MhdJobQualification {
  text: string;
  type: MhdQualificationType;
  required: boolean;
}

export interface MhdJobCompetencyRef {
  competencyId: MhdCompetencyId;
  name: string;
  category: string | null;
  isRegulated: boolean;
  weight: number | null;
}

/**
 * What a consumer gets from `mhd_job_get_published_for_person`. Stamp
 * `descriptionId` onto whatever record you build from this — that stamp is what
 * makes the record reproducible after the description moves on.
 */
export interface MhdPublishedJobDescription {
  jobId: MhdJobId;
  jobTitle: string;
  flsaClassification: MhdFlsaClassification | null;
  isSafetySensitive: boolean;
  industry: MhdIndustry;
  descriptionId: MhdJobDescriptionId;
  descriptionReference: string;
  versionNumber: number;
  effectiveFrom: string;
  summary: string | null;
  essentialFunctions: MhdJobFunction[];
  marginalFunctions: MhdJobFunction[];
  qualifications: MhdJobQualification[];
  competencies: MhdJobCompetencyRef[];
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface MhdCreateJobInput {
  companyId: string;
  jobTitle: string;
  jobCode?: string | null;
  jobFamily?: string | null;
  jobLevel?: string | null;
  department?: string | null;
  flsaClassification?: MhdFlsaClassification | null;
  employmentType?: MhdEmploymentType;
  isSafetySensitive?: boolean;
  industry?: MhdIndustry;
  onetSocCode?: string | null;
  caWageOrderClassification?: MhdCaWageOrderClassification | null;
  payMin?: number | null;
  payMax?: number | null;
  payPeriod?: MhdPayPeriod | null;
}

export interface MhdUpdateJobInput {
  jobId: MhdJobId;
  jobTitle?: string | null;
  jobCode?: string | null;
  jobFamily?: string | null;
  jobLevel?: string | null;
  department?: string | null;
  flsaClassification?: MhdFlsaClassification | null;
  employmentType?: MhdEmploymentType | null;
  isSafetySensitive?: boolean | null;
  industry?: MhdIndustry | null;
  onetSocCode?: string | null;
  caWageOrderClassification?: MhdCaWageOrderClassification | null;
  isActive?: boolean | null;
}

/** Pay moves through its own RPC so the authorisation is stated once. */
export interface MhdSetPayRangeInput {
  jobId: MhdJobId;
  payMin: number;
  payMax: number;
  payPeriod: MhdPayPeriod;
}

export interface MhdUpdateDescriptionDraftInput {
  descriptionId: MhdJobDescriptionId;
  summary?: string | null;
  scopeOfRole?: string | null;
  supervisoryResponsibility?: string | null;
  travelRequirement?: string | null;
  workEnvironment?: string | null;
  physicalRequirements?: string | null;
}

export interface MhdAssignJobInput {
  personId: string;
  jobId: MhdJobId;
  effectiveFrom: string;
  managerPersonId?: string | null;
  note?: string | null;
}

export interface MhdUpsertCompetencyInput {
  /** Null creates a GLOBAL competency — Platform Admin only. */
  companyId: string | null;
  competencyName: string;
  description?: string | null;
  category?: string | null;
  industry?: MhdIndustry;
  isRegulated?: boolean;
  competencyId?: MhdCompetencyId | null;
}

// ---------------------------------------------------------------------------
// Display + rule helpers
// ---------------------------------------------------------------------------

const FLSA_LABELS: Record<MhdFlsaClassification, string> = {
  EXEMPT: 'Exempt',
  NON_EXEMPT: 'Non-exempt',
};

const EMPLOYMENT_TYPE_LABELS: Record<MhdEmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  TEMPORARY: 'Temporary',
  SEASONAL: 'Seasonal',
  CONTRACT: 'Contract',
};

const INDUSTRY_LABELS: Record<MhdIndustry, string> = {
  GENERAL: 'General',
  HEALTHCARE: 'Healthcare',
  TRANSPORTATION: 'Transportation',
  OTHER: 'Other',
};

const CA_WAGE_ORDER_LABELS: Record<MhdCaWageOrderClassification, string> = {
  MANUFACTURING: 'Manufacturing',
  PERSONAL_SERVICE: 'Personal Services',
  CANNING_FREEZING_PRESERVING: 'Canning, Freezing & Preserving',
  PROFESSIONAL_TECHNICAL_CLERICAL_MECHANICAL:
    'Professional, Technical, Clerical, Mechanical & Similar Occupations',
  PUBLIC_HOUSEKEEPING: 'Public Housekeeping',
  LAUNDRY_LINEN_DRY_CLEANING: 'Laundry, Linen Supply, Dry Cleaning & Dyeing',
  MERCANTILE: 'Mercantile',
  PRODUCTS_AFTER_HARVEST: 'Industries Handling Products After Harvest',
  TRANSPORTATION: 'Transportation',
  AMUSEMENT_RECREATION: 'Amusement & Recreation',
  BROADCASTING: 'Broadcasting',
  MOTION_PICTURE: 'Motion Picture',
  AGRICULTURAL_ON_FARM_PREP: 'Industries Preparing Agricultural Products for Market, on the Farm',
  AGRICULTURAL_OCCUPATIONS: 'Agricultural Occupations',
  HOUSEHOLD: 'Household Occupations',
  CONSTRUCTION_DRILLING_LOGGING_MINING: 'Construction, Drilling, Logging & Mining (On-Site)',
  MISCELLANEOUS: 'Miscellaneous Employees',
};

const QUALIFICATION_TYPE_LABELS: Record<MhdQualificationType, string> = {
  EDUCATION: 'Education',
  EXPERIENCE: 'Experience',
  CERTIFICATION: 'Certification',
  LICENSE: 'Licence',
  SKILL: 'Skill',
};

const STATUS_LABELS: Record<MhdJobDescriptionStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export function mhdFormatFlsa(value: MhdFlsaClassification | string | null): string {
  if (!value) return 'Unclassified';
  return FLSA_LABELS[value as MhdFlsaClassification] ?? value;
}

export function mhdFormatEmploymentType(value: MhdEmploymentType | string): string {
  return EMPLOYMENT_TYPE_LABELS[value as MhdEmploymentType] ?? value;
}

export function mhdFormatIndustry(value: MhdIndustry | string): string {
  return INDUSTRY_LABELS[value as MhdIndustry] ?? value;
}

export function mhdFormatCaWageOrderClassification(
  value: MhdCaWageOrderClassification | string | null,
): string {
  if (!value) return 'Unclassified';
  return CA_WAGE_ORDER_LABELS[value as MhdCaWageOrderClassification] ?? value;
}

export function mhdFormatQualificationType(value: MhdQualificationType | string): string {
  return QUALIFICATION_TYPE_LABELS[value as MhdQualificationType] ?? value;
}

export function mhdFormatDescriptionStatus(value: MhdJobDescriptionStatus | string): string {
  return STATUS_LABELS[value as MhdJobDescriptionStatus] ?? value;
}

/**
 * Whether the caller was permitted to see pay, inferred from the row.
 *
 * The server nulls all three columns together for an unprivileged caller, so
 * "all three null" is indistinguishable from "a job with no range set". That
 * ambiguity is deliberate and cheap to live with: a component should render
 * "not available" either way rather than claiming a range does not exist.
 * Do NOT use this to decide whether to *send* a pay update — the RPC refuses
 * that independently.
 */
export function mhdCanSeePayFromRow(job: Pick<MhdJob, 'payMin' | 'payMax' | 'payPeriod'>): boolean {
  return job.payMin !== null || job.payMax !== null || job.payPeriod !== null;
}

/** Formats a pay range for display, or null when there is nothing to show. */
export function mhdFormatPayRange(
  job: Pick<MhdJob, 'payMin' | 'payMax' | 'payPeriod'>,
): string | null {
  if (job.payMin === null && job.payMax === null) return null;
  const suffix = job.payPeriod === 'HOURLY' ? '/hr' : job.payPeriod === 'ANNUAL' ? '/yr' : '';
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (job.payMin !== null && job.payMax !== null) {
    return `${fmt(job.payMin)} – ${fmt(job.payMax)}${suffix}`;
  }
  return `${fmt((job.payMin ?? job.payMax)!)}${suffix}`;
}

/**
 * A description is publishable only with a summary and at least one essential
 * function. Mirrors the server gate so the button can explain itself before the
 * user presses it; the RPC remains the authority.
 */
export function mhdCanPublishDescription(
  summary: string | null | undefined,
  essentialFunctionCount: number,
): { ok: boolean; reason: string | null } {
  if (!summary || summary.trim().length === 0) {
    return { ok: false, reason: 'Add a summary before publishing.' };
  }
  if (essentialFunctionCount === 0) {
    return {
      ok: false,
      reason:
        'Add at least one essential function. Essential functions are the basis of any accommodation analysis.',
    };
  }
  return { ok: true, reason: null };
}

/**
 * Audit metadata for a pay-range change, mirroring the server contract: the
 * period is recorded and the figures deliberately are NOT. `audit_events` has a
 * wider readership than the pay columns, so writing the band there would defeat
 * the RPC-level masking. Anything the client contributes to that trail (an
 * optimistic entry, telemetry) must carry the period only — this is the single
 * place that shape is defined, and the schema test pins it.
 */
export function mhdPayChangeAuditMetadata(input: Pick<MhdSetPayRangeInput, 'payPeriod'>): {
  pay_period: MhdPayPeriod;
} {
  return { pay_period: input.payPeriod };
}

/** PostgREST serialises `numeric` as a string; normalise before any arithmetic. */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Same, but preserves null rather than collapsing it to 0 — required for pay. */
export function mhdToNullableNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
