// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// These local interfaces mirror the generated
// `Database['public']['Functions']['mhd_investigation_*']['Returns']` shapes
// (0039). They are kept local (rather than aliasing the generated types) so the
// mappers can treat the nullable business fields as `T | null` — the generated
// Returns type widens every column to non-null, but the RPCs genuinely return
// nulls for severity/disposition/etc.
//
// Investigations has NO numeric business fields — everything is text, uuid,
// boolean or timestamptz — so `mhdToNumber()` is exported for parity with the
// house pattern but is not called by any mapper here. The one thing this module
// adds over Leaves is the two ciphertext fields that never appear in a row shape
// at all: the allegation and party statements reach a component ONLY through the
// gated reveal RPCs (scalar text), never as a column on `get` or `list_parties`.
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_investigation_list`. */
export interface MhdInvestigationCaseRpcRow {
  id: string;
  reference_id: string;
  case_type: string;
  status: string;
  severity: string | null;
  confidentiality_level: string;
  disposition: string | null;
  assigned_investigator_user_id: string | null;
  created_at: string;
}

/**
 * Row shape returned by `mhd_investigation_get` — the full case record MINUS the
 * ciphertext. `get` deliberately omits `allegation_ciphertext` entirely; the
 * allegation is never a column read and only ever arrives through
 * `mhd_investigation_reveal_allegation` (scalar text, separately audited).
 */
export interface MhdInvestigationCaseDetailRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  case_type: string;
  status: string;
  severity: string | null;
  confidentiality_level: string;
  disposition: string | null;
  assigned_investigator_user_id: string | null;
  finding_summary: string | null;
  opened_by: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape returned by `mhd_investigation_list_grants`. */
export interface MhdInvestigationGrantRpcRow {
  user_id: string;
  granted_at: string;
  granted_by: string | null;
}

/**
 * Row shape returned by `mhd_investigation_list_parties`.
 *
 * `person_id` arrives as NULL and `display_name` as `(confidential)` for a
 * confidential party — the mask is applied SERVER-SIDE in the RPC, to everyone,
 * including a grant-holder who happens to be the respondent. The row is already
 * the safe shape; nothing downstream re-derives identity from it. `has_statement`
 * is a boolean presence flag only — the statement text is reveal-gated.
 */
export interface MhdInvestigationPartyRpcRow {
  id: string;
  party_role: string;
  person_id: string | null;
  display_name: string;
  is_confidential: boolean;
  has_statement: boolean;
}

/** Row shape returned by the create RPC that mints a reference: `(id, reference_id)`. */
export interface MhdInvestigationMutationRpcRow {
  id: string;
  reference_id: string;
}

/** Mapped result of a create RPC that mints a reference. */
export interface MhdMutationResult {
  id: string;
  referenceId: string;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdInvestigationCaseId = string;
export type MhdInvestigationCaseReferenceId = `INVC-${string}`;
export type MhdInvestigationPartyId = string;

export type MhdInvestigationCaseType =
  | 'HARASSMENT'
  | 'DISCRIMINATION'
  | 'HOSTILE_WORK'
  | 'GRIEVANCE'
  | 'COMPLAINT'
  | 'ACCIDENT'
  | 'SAFETY'
  | 'OTHER';

/**
 * The case lifecycle. A linear progression `INTAKE → OPEN → INVESTIGATING →
 * PENDING_REVIEW → CLOSED`; closing requires a disposition (the transition RPC
 * refuses a blank close). Kept as a flat vocabulary — the server is the
 * authority on which transitions are legal.
 */
export type MhdInvestigationStatus =
  | 'INTAKE'
  | 'OPEN'
  | 'INVESTIGATING'
  | 'PENDING_REVIEW'
  | 'CLOSED';

export type MhdInvestigationConfidentiality = 'STANDARD' | 'HIGH' | 'RESTRICTED';

export type MhdInvestigationDisposition =
  | 'SUBSTANTIATED'
  | 'UNSUBSTANTIATED'
  | 'INCONCLUSIVE'
  | 'UNFOUNDED'
  | 'WITHDRAWN';

export type MhdInvestigationPartyRole = 'COMPLAINANT' | 'RESPONDENT' | 'WITNESS' | 'OTHER';

export const MHD_INVESTIGATION_CASE_TYPES = [
  'HARASSMENT',
  'DISCRIMINATION',
  'HOSTILE_WORK',
  'GRIEVANCE',
  'COMPLAINT',
  'ACCIDENT',
  'SAFETY',
  'OTHER',
] as const satisfies readonly MhdInvestigationCaseType[];

export const MHD_INVESTIGATION_STATUSES = [
  'INTAKE',
  'OPEN',
  'INVESTIGATING',
  'PENDING_REVIEW',
  'CLOSED',
] as const satisfies readonly MhdInvestigationStatus[];

export const MHD_INVESTIGATION_CONFIDENTIALITIES = [
  'STANDARD',
  'HIGH',
  'RESTRICTED',
] as const satisfies readonly MhdInvestigationConfidentiality[];

export const MHD_INVESTIGATION_DISPOSITIONS = [
  'SUBSTANTIATED',
  'UNSUBSTANTIATED',
  'INCONCLUSIVE',
  'UNFOUNDED',
  'WITHDRAWN',
] as const satisfies readonly MhdInvestigationDisposition[];

export const MHD_INVESTIGATION_PARTY_ROLES = [
  'COMPLAINANT',
  'RESPONDENT',
  'WITNESS',
  'OTHER',
] as const satisfies readonly MhdInvestigationPartyRole[];

/**
 * Statuses that require a disposition at the RPC. Closing a case cannot leave the
 * disposition blank — `mhd_investigation_transition` raises otherwise — so the UI
 * makes the disposition mandatory when the target status is CLOSED.
 */
export const MHD_INVESTIGATION_DISPOSITION_REQUIRED_STATUSES = [
  'CLOSED',
] as const satisfies readonly MhdInvestigationStatus[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

/**
 * A case as it appears in the grant-filtered list. Note there is no allegation
 * here and no complainant on the summary — the board is intentionally sparse:
 * the reference, type, status, severity, confidentiality and disposition. The
 * existence of the row already means the caller holds a grant on it.
 */
export interface MhdInvestigationCaseSummary {
  id: MhdInvestigationCaseId;
  referenceId: MhdInvestigationCaseReferenceId;
  caseType: MhdInvestigationCaseType;
  status: MhdInvestigationStatus;
  severity: string | null;
  confidentialityLevel: MhdInvestigationConfidentiality;
  disposition: MhdInvestigationDisposition | null;
  assignedInvestigatorUserId: string | null;
  createdAt: string;
}

/**
 * The full case record for the detail page — everything `get` returns, which is
 * everything EXCEPT the allegation ciphertext. The allegation is never on this
 * object; it is fetched separately, on an explicit user action, through the
 * reveal RPC (see `MhdInvestigationCaseDetailPage`).
 */
export interface MhdInvestigationCaseDetail {
  id: MhdInvestigationCaseId;
  referenceId: MhdInvestigationCaseReferenceId;
  companyId: string;
  caseType: MhdInvestigationCaseType;
  status: MhdInvestigationStatus;
  severity: string | null;
  confidentialityLevel: MhdInvestigationConfidentiality;
  disposition: MhdInvestigationDisposition | null;
  assignedInvestigatorUserId: string | null;
  findingSummary: string | null;
  openedBy: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One active access grant on a case — who can see it, and who let them in. */
export interface MhdInvestigationGrant {
  userId: string;
  grantedAt: string;
  grantedBy: string | null;
}

/**
 * A party on a case, already in its safe (masked) read shape. For a confidential
 * party `personId` is `null` and `displayName` is `(confidential)` — rendered
 * verbatim, never re-derived. `hasStatement` says only THAT a statement exists;
 * the text is reveal-gated through `mhd_investigation_reveal_statement`.
 */
export interface MhdInvestigationParty {
  id: MhdInvestigationPartyId;
  partyRole: MhdInvestigationPartyRole;
  personId: string | null;
  displayName: string;
  isConfidential: boolean;
  hasStatement: boolean;
}

// ---------------------------------------------------------------------------
// Inputs and filters
// ---------------------------------------------------------------------------

export interface MhdCreateInvestigationInput {
  companyId: string;
  caseType: MhdInvestigationCaseType;
  /** Free-text allegation narrative. Encrypted at rest server-side on create. */
  allegation: string;
  assignedInvestigator?: string | null;
  severity?: string | null;
  confidentiality?: MhdInvestigationConfidentiality;
}

export interface MhdTransitionInvestigationInput {
  caseId: MhdInvestigationCaseId;
  newStatus: MhdInvestigationStatus;
  /** Required by the RPC when the new status is CLOSED. */
  disposition?: MhdInvestigationDisposition | null;
  finding?: string | null;
}

export interface MhdAssignInvestigatorInput {
  caseId: MhdInvestigationCaseId;
  investigator: string;
}

export interface MhdInvestigationGrantInput {
  caseId: MhdInvestigationCaseId;
  userId: string;
}

export interface MhdAddPartyInput {
  caseId: MhdInvestigationCaseId;
  partyRole: MhdInvestigationPartyRole;
  personId?: string | null;
  externalName?: string | null;
  isConfidential?: boolean;
  /** Free-text statement. Encrypted at rest server-side if supplied. */
  statement?: string | null;
}

export interface MhdInvestigationCaseFilters {
  companyId: string | null;
  status?: MhdInvestigationStatus | 'ALL' | null;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const CASE_TYPE_LABELS: Record<MhdInvestigationCaseType, string> = {
  HARASSMENT: 'Harassment',
  DISCRIMINATION: 'Discrimination',
  HOSTILE_WORK: 'Hostile work environment',
  GRIEVANCE: 'Grievance',
  COMPLAINT: 'Complaint',
  ACCIDENT: 'Workplace accident',
  SAFETY: 'Safety violation',
  OTHER: 'Other',
};

const STATUS_LABELS: Record<MhdInvestigationStatus, string> = {
  INTAKE: 'Intake',
  OPEN: 'Open',
  INVESTIGATING: 'Investigating',
  PENDING_REVIEW: 'Pending review',
  CLOSED: 'Closed',
};

const CONFIDENTIALITY_LABELS: Record<MhdInvestigationConfidentiality, string> = {
  STANDARD: 'Standard',
  HIGH: 'High',
  RESTRICTED: 'Restricted',
};

const DISPOSITION_LABELS: Record<MhdInvestigationDisposition, string> = {
  SUBSTANTIATED: 'Substantiated',
  UNSUBSTANTIATED: 'Unsubstantiated',
  INCONCLUSIVE: 'Inconclusive',
  UNFOUNDED: 'Unfounded',
  WITHDRAWN: 'Withdrawn',
};

const PARTY_ROLE_LABELS: Record<MhdInvestigationPartyRole, string> = {
  COMPLAINANT: 'Complainant',
  RESPONDENT: 'Respondent',
  WITNESS: 'Witness',
  OTHER: 'Other',
};

export function mhdFormatInvestigationCaseType(value: MhdInvestigationCaseType | string): string {
  return CASE_TYPE_LABELS[value as MhdInvestigationCaseType] ?? value;
}

export function mhdFormatInvestigationStatus(value: MhdInvestigationStatus | string): string {
  return STATUS_LABELS[value as MhdInvestigationStatus] ?? value;
}

export function mhdFormatInvestigationConfidentiality(
  value: MhdInvestigationConfidentiality | string,
): string {
  return CONFIDENTIALITY_LABELS[value as MhdInvestigationConfidentiality] ?? value;
}

export function mhdFormatInvestigationDisposition(
  value: MhdInvestigationDisposition | string | null,
): string {
  if (value == null) return 'Not yet dispositioned';
  return DISPOSITION_LABELS[value as MhdInvestigationDisposition] ?? value;
}

export function mhdFormatInvestigationPartyRole(value: MhdInvestigationPartyRole | string): string {
  return PARTY_ROLE_LABELS[value as MhdInvestigationPartyRole] ?? value;
}

/**
 * PostgREST serialises `numeric` as a string; normalise before any arithmetic.
 * Kept for parity with the house pattern (copied verbatim from Leaves). This
 * module has no numeric business fields, so nothing here actually calls it — the
 * export exists so the surface matches every other module's Types.ts.
 */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
