// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// These local interfaces mirror the generated
// `Database['public']['Functions']['mhd_handbook_*']['Returns'][number]` shapes
// (0041 gen:types). They are kept as hand-written interfaces so the mappers below
// read clearly; the Service casts the generated return rows to them.
//
// The one numeric business field here is `version_number`; it is typed
// `number | string` because PostgREST can serialise an integer column as a JSON
// string. The version mappers run it through `mhdToNumber()`; never compare or
// arithmetic a raw row value.
//
// SHELL NOTICE: every section `body` / `body_placeholder` returned by these RPCs
// is an ATTORNEY-FLAGGED PLACEHOLDER (`[ATTORNEY-DRAFTED CONTENT — PLACEHOLDER]`).
// None of it is legal content. The components must render it as placeholder text
// and visibly mark the content as attorney-pending — never present it as policy.
// ---------------------------------------------------------------------------

/**
 * Row shape returned by `mhd_handbook_section_list` (0184: gained
 * `company_id` / `source_section_id` / `is_library`, and the RPC gained the
 * required leading `p_company_id` argument — before 0184 it had none, and
 * quietly leaked every company's private sections to every other company).
 * `company_id` and `source_section_id` are typed `string | null` here even
 * though gen:types renders them as plain `string` — the same
 * generated-vs-actual nullability gap already documented above for
 * `document_generation_id` on `mhd_handbook_version_get`. `company_id` is
 * `null` for a GLOBAL library clause; `source_section_id` is `null` unless the
 * row was minted via `mhd_fork_handbook_section` (or created pointing at a
 * source manually).
 */
export interface MhdHandbookSectionRpcRow {
  id: string;
  company_id: string | null;
  handbook_type: string;
  jurisdiction: string;
  section_key: string;
  title: string;
  // ATTORNEY-FLAGGED PLACEHOLDER — never real legal content in v1.
  body_placeholder: string;
  is_required: boolean;
  sort_order: number | string;
  is_active: boolean;
  is_library: boolean;
  source_section_id: string | null;
}

/** Row shape returned by `mhd_handbook_list`. */
export interface MhdHandbookRpcRow {
  id: string;
  reference_id: string;
  handbook_type: string;
  title: string;
  jurisdictions: string[];
  status: string;
  current_version_id: string | null;
  effective_date: string | null;
  created_at: string;
}

/** Row shape returned by `mhd_handbook_preview` — one included section, in order. */
export interface MhdHandbookPreviewRowRpcRow {
  section_id: string;
  jurisdiction: string;
  section_key: string;
  title: string;
  // ATTORNEY-FLAGGED PLACEHOLDER.
  body_placeholder: string;
  is_required: boolean;
  sort_order: number | string;
}

/**
 * One element of a frozen version's `assembled_content` jsonb array. Note the
 * key is `body` here (already snapshotted), not `body_placeholder` — but the
 * value is still the attorney-flagged placeholder text frozen at publish time.
 */
export interface MhdHandbookAssembledSectionRpcRow {
  jurisdiction: string;
  section_key: string;
  title: string;
  body: string;
}

/** Row shape returned by `mhd_handbook_version_get`. */
export interface MhdHandbookVersionRpcRow {
  id: string;
  reference_id: string;
  handbook_id: string;
  version_number: number | string;
  assembled_content: MhdHandbookAssembledSectionRpcRow[];
  content_hash: string;
  effective_date: string | null;
  document_generation_id: string | null;
  published_at: string;
}

/** Row shape returned by `mhd_handbook_ack_status` (the admin board). */
export interface MhdHandbookAckStatusRpcRow {
  id: string;
  person_id: string;
  person_display_name: string;
  status: string;
  acknowledged_at: string | null;
}

/** Row shape returned by `mhd_handbook_my_acknowledgments`. */
export interface MhdMyAcknowledgmentRpcRow {
  id: string;
  handbook_version_id: string;
  handbook_title: string;
  handbook_type: string;
  version_number: number | string;
  status: string;
  esignature_request_id: string | null;
  acknowledged_at: string | null;
}

/** Row shape returned by a create/assign RPC that mints a reference: `(id, reference_id)`. */
export interface MhdHandbookMutationRpcRow {
  id: string;
  reference_id: string;
}

/**
 * Row shape returned by `mhd_create_handbook_section` / `mhd_fork_handbook_section`
 * — these mint a section id but not a human reference id, unlike the handbook/
 * acknowledgment mutation RPCs above.
 */
export interface MhdHandbookSectionMutationRpcRow {
  id: string;
}

/** Row shape returned by `mhd_handbook_publish`: `(id, reference_id, version_number, content_hash)`. */
export interface MhdHandbookPublishResultRpcRow {
  id: string;
  reference_id: string;
  version_number: number | string;
  content_hash: string;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdHandbookId = string;
export type MhdHandbookVersionId = string;
export type MhdHandbookAcknowledgmentId = string;

export type MhdHandbookReferenceId = `HBK-${string}`;
export type MhdHandbookVersionReferenceId = `HBV-${string}`;
export type MhdHandbookAcknowledgmentReferenceId = `HBA-${string}`;

export type MhdHandbookType = 'EMPLOYEE' | 'SAFETY';

export type MhdHandbookJurisdiction =
  'FEDERAL' | 'CA' | 'TX' | 'OH' | 'WA' | 'FED_OSHA' | 'CAL_OSHA';

export type MhdHandbookStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type MhdHandbookAckStatus = 'PENDING' | 'ACKNOWLEDGED';

export const MHD_HANDBOOK_TYPES = [
  'EMPLOYEE',
  'SAFETY',
] as const satisfies readonly MhdHandbookType[];

export const MHD_HANDBOOK_JURISDICTIONS = [
  'FEDERAL',
  'CA',
  'TX',
  'OH',
  'WA',
  'FED_OSHA',
  'CAL_OSHA',
] as const satisfies readonly MhdHandbookJurisdiction[];

export const MHD_HANDBOOK_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
] as const satisfies readonly MhdHandbookStatus[];

export const MHD_HANDBOOK_ACK_STATUSES = [
  'PENDING',
  'ACKNOWLEDGED',
] as const satisfies readonly MhdHandbookAckStatus[];

/**
 * The jurisdictions each content pack offers. Assembly is jurisdiction-driven:
 * an EMPLOYEE handbook draws from FEDERAL + the chosen states; a SAFETY handbook
 * from the OSHA scopes. The wizard offers only the pack's own jurisdictions.
 * This mirrors the seed in Database.sql, but the server remains the authority —
 * a section not present for a jurisdiction simply does not assemble.
 */
export const MHD_HANDBOOK_JURISDICTIONS_BY_TYPE: Record<
  MhdHandbookType,
  readonly MhdHandbookJurisdiction[]
> = {
  EMPLOYEE: ['FEDERAL', 'CA', 'TX', 'OH', 'WA'],
  SAFETY: ['FED_OSHA', 'CAL_OSHA'],
};

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

/**
 * A clause-library section, from `section_list`. This is the CONTENT PACK, not a
 * company's selection — `bodyPlaceholder` is attorney-flagged placeholder text.
 * A required section auto-includes on assembly and cannot be excluded.
 *
 * `companyId: null` / `isLibrary: true` marks a GLOBAL clause, visible to every
 * company and editable only by Platform Admin / HR Partner. A non-null
 * `companyId` is a company-owned clause (either authored directly or forked from
 * a library clause — `sourceSectionId` records that lineage when present).
 */
export interface MhdHandbookSection {
  id: string;
  companyId: string | null;
  handbookType: MhdHandbookType;
  jurisdiction: MhdHandbookJurisdiction;
  sectionKey: string;
  title: string;
  // ATTORNEY-FLAGGED PLACEHOLDER — render as placeholder, never as policy.
  bodyPlaceholder: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  isLibrary: boolean;
  sourceSectionId: string | null;
}

/**
 * A company handbook instance from `list`. Only a DRAFT is editable (sections can
 * be toggled); a PUBLISHED handbook has a live `currentVersionId` and shows its
 * frozen version, not editable selections; an ARCHIVED one is retired.
 */
export interface MhdHandbook {
  id: MhdHandbookId;
  referenceId: MhdHandbookReferenceId;
  handbookType: MhdHandbookType;
  title: string;
  jurisdictions: MhdHandbookJurisdiction[];
  status: MhdHandbookStatus;
  currentVersionId: string | null;
  effectiveDate: string | null;
  createdAt: string;
}

/** One assembled row of a DRAFT preview (`preview`). `body` is a placeholder. */
export interface MhdHandbookPreviewRow {
  sectionId: string;
  jurisdiction: MhdHandbookJurisdiction;
  sectionKey: string;
  title: string;
  // ATTORNEY-FLAGGED PLACEHOLDER.
  bodyPlaceholder: string;
  isRequired: boolean;
  sortOrder: number;
}

/**
 * One section of a FROZEN published version's assembled content. Read-only: the
 * version is immutable, so this is rendered, never edited. `body` is the
 * attorney-flagged placeholder frozen at publish time.
 */
export interface MhdHandbookAssembledSection {
  jurisdiction: MhdHandbookJurisdiction;
  sectionKey: string;
  title: string;
  // ATTORNEY-FLAGGED PLACEHOLDER, frozen at publish.
  body: string;
}

/**
 * A frozen published version (`version_get`). `assembledContent` is the immutable
 * snapshot an acknowledgment points at; `contentHash` is its sha256. Rendered
 * read-only — a correction is a NEW version, never an edit to this one.
 */
export interface MhdHandbookVersion {
  id: MhdHandbookVersionId;
  referenceId: MhdHandbookVersionReferenceId;
  handbookId: MhdHandbookId;
  versionNumber: number;
  assembledContent: MhdHandbookAssembledSection[];
  contentHash: string;
  effectiveDate: string | null;
  documentGenerationId: string | null;
  publishedAt: string;
}

/** One row of the acknowledgment board (`ack_status`) — who has / has not signed. */
export interface MhdHandbookAckStatusRow {
  id: MhdHandbookAcknowledgmentId;
  personId: string;
  personDisplayName: string;
  status: MhdHandbookAckStatus;
  acknowledgedAt: string | null;
}

/** One row of the employee's own acknowledgment surface (`my_acknowledgments`). */
export interface MhdMyAcknowledgment {
  id: MhdHandbookAcknowledgmentId;
  handbookVersionId: MhdHandbookVersionId;
  handbookTitle: string;
  handbookType: MhdHandbookType;
  versionNumber: number;
  status: MhdHandbookAckStatus;
  // Soft link — the acknowledgment signature request (app-layer). When set, the
  // server GATES `acknowledge` on that request completing.
  esignatureRequestId: string | null;
  acknowledgedAt: string | null;
}

/** Mapped result of a create / assign RPC that mints a reference. */
export interface MhdHandbookMutationResult {
  id: string;
  referenceId: string;
}

/** Mapped result of `createSection` / `forkSection` — no human reference id. */
export interface MhdHandbookSectionMutationResult {
  id: string;
}

/** Mapped result of `publish` — the newly frozen version's identity + hash. */
export interface MhdHandbookPublishResult {
  id: MhdHandbookVersionId;
  referenceId: MhdHandbookVersionReferenceId;
  versionNumber: number;
  contentHash: string;
}

// ---------------------------------------------------------------------------
// Inputs and filters
// ---------------------------------------------------------------------------

export interface MhdCreateHandbookInput {
  companyId: string;
  handbookType: MhdHandbookType;
  title: string;
  jurisdictions: MhdHandbookJurisdiction[];
}

export interface MhdToggleSectionInput {
  handbookId: MhdHandbookId;
  sectionId: string;
  included: boolean;
}

/**
 * Publishing a draft. `effectiveDate` is optional. `documentGenerationId` is the
 * APP-LAYER soft link — the host route renders the handbook document (doc-gen)
 * and passes the id here; the service only forwards it. This module never
 * invents a doc-gen RPC.
 */
export interface MhdPublishHandbookInput {
  handbookId: MhdHandbookId;
  effectiveDate?: string | null;
  documentGenerationId?: string | null;
}

/**
 * Assigning an acknowledgment to a person against a specific version.
 * `esignatureRequestId` is the APP-LAYER soft link — the host route creates the
 * e-sign request and passes its id; the service only forwards it.
 */
export interface MhdAssignAcknowledgmentInput {
  versionId: MhdHandbookVersionId;
  personId: string;
  esignatureRequestId?: string | null;
}

/**
 * Marking an acknowledgment ACKNOWLEDGED. The server GATES this on the e-sign
 * request completing — pass the completed request's id (or rely on the one stored
 * at assignment). Do NOT pre-empt the gate; surface the server's
 * "signature not yet complete" error.
 */
export interface MhdAcknowledgeInput {
  ackId: MhdHandbookAcknowledgmentId;
  esignatureRequestId?: string | null;
}

/**
 * `companyId` is REQUIRED at the RPC as of 0184 — `mhd_handbook_section_list`
 * gained a mandatory leading `p_company_id` argument, fixing a real bug where
 * the prior signature returned every company's private sections to every
 * caller. `listSections` (Service.ts) refuses to call the RPC without one, same
 * as it already refused without a `handbookType`.
 */
export interface MhdHandbookSectionFilters {
  companyId: string | null;
  handbookType: MhdHandbookType | null;
  jurisdiction?: MhdHandbookJurisdiction | null;
}

/**
 * Creating a section (`mhd_create_handbook_section`). `companyId: null` targets
 * the GLOBAL library — server-enforced Platform Admin / HR Partner only, refused
 * for any other caller regardless of what the UI offers. `sourceSectionId` is an
 * optional fork-lineage stamp for a section authored FROM a library clause's
 * content by hand; use `forkSection` instead to clone one directly.
 */
export interface MhdCreateHandbookSectionInput {
  companyId: string | null;
  handbookType: MhdHandbookType;
  jurisdiction: MhdHandbookJurisdiction;
  sectionKey: string;
  title: string;
  bodyPlaceholder: string;
  isRequired: boolean;
  sortOrder: number;
  sourceSectionId?: string | null;
}

/**
 * Updating a section's editable fields (`mhd_update_handbook_section`). Every
 * field but `sectionId` is optional — an omitted field is left unchanged at the
 * RPC (partial update), so callers should only set the fields they intend to
 * change rather than sending the full record back.
 */
export interface MhdUpdateHandbookSectionInput {
  sectionId: string;
  title?: string;
  bodyPlaceholder?: string;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Forking a GLOBAL library section into a company-owned editable copy
 * (`mhd_fork_handbook_section`). Only a section with `company_id is null`
 * (`isLibrary: true`) may be the source — the RPC refuses otherwise.
 */
export interface MhdForkHandbookSectionInput {
  sourceSectionId: string;
  companyId: string;
}

export interface MhdHandbookListFilters {
  companyId: string | null;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const HANDBOOK_TYPE_LABELS: Record<MhdHandbookType, string> = {
  EMPLOYEE: 'Employee handbook',
  SAFETY: 'Safety handbook',
};

const JURISDICTION_LABELS: Record<MhdHandbookJurisdiction, string> = {
  FEDERAL: 'Federal',
  CA: 'California',
  TX: 'Texas',
  OH: 'Ohio',
  WA: 'Washington',
  FED_OSHA: 'Federal OSHA',
  CAL_OSHA: 'Cal/OSHA',
};

const STATUS_LABELS: Record<MhdHandbookStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const ACK_STATUS_LABELS: Record<MhdHandbookAckStatus, string> = {
  PENDING: 'Pending',
  ACKNOWLEDGED: 'Acknowledged',
};

export function mhdFormatHandbookType(value: MhdHandbookType | string): string {
  return HANDBOOK_TYPE_LABELS[value as MhdHandbookType] ?? value;
}

export function mhdFormatHandbookJurisdiction(value: MhdHandbookJurisdiction | string): string {
  return JURISDICTION_LABELS[value as MhdHandbookJurisdiction] ?? value;
}

export function mhdFormatHandbookStatus(value: MhdHandbookStatus | string): string {
  return STATUS_LABELS[value as MhdHandbookStatus] ?? value;
}

export function mhdFormatHandbookAckStatus(value: MhdHandbookAckStatus | string): string {
  return ACK_STATUS_LABELS[value as MhdHandbookAckStatus] ?? value;
}

/**
 * The sentinel every clause body carries in v1. Exported so components can both
 * detect a raw placeholder and render the attorney-pending affordance. This is
 * the load-bearing SHELL marker: NO body returned by this module is legal content.
 */
export const MHD_HANDBOOK_ATTORNEY_PLACEHOLDER = '[ATTORNEY-DRAFTED CONTENT — PLACEHOLDER]';

/**
 * PostgREST serialises a numeric/integer column as a string in some paths;
 * normalise before any arithmetic or comparison. Copied verbatim from the house
 * pattern (Training / Investigations / Leaves). Used here by the version and
 * section mappers for `version_number` and `sort_order`.
 */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
