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
  // 0337: the section this one nests under; null for a top-level section.
  parent_section_id: string | null;
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
  // 0342: days an employee has to acknowledge a newly assigned version.
  acknowledgment_due_days: number | string;
  // 0345: whether an employee must sign a receipt to acknowledge.
  requires_signature: boolean;
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
  // 0337: outline position. Rows arrive in outline (pre-order) order.
  parent_section_id: string | null;
  parent_section_key: string | null;
  depth: number | string;
  outline_number: string;
  position: number | string;
}

/**
 * One element of a frozen version's `assembled_content` jsonb array. Note the
 * key is `body` here (already snapshotted), not `body_placeholder` — but the
 * value is still the attorney-flagged placeholder text frozen at publish time.
 * The outline fields (0337) are absent on versions published before 0337, which
 * are flat: treat a missing `depth` as 0 and a missing `outline_number` as unnumbered.
 */
export interface MhdHandbookAssembledSectionRpcRow {
  jurisdiction: string;
  section_key: string;
  title: string;
  body: string;
  parent_section_key?: string | null;
  depth?: number | string | null;
  outline_number?: string | null;
  position?: number | string | null;
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
  due_at: string | null;
  // 0345: the receipt's signature request and its live status.
  esignature_request_id: string | null;
  esignature_status: string | null;
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
  due_at: string | null;
  requires_signature: boolean;
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
  /** The section this one nests under; null for a top-level section. */
  parentSectionId: string | null;
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
  /** Days an employee has to acknowledge a newly assigned version. */
  acknowledgmentDueDays: number;
  /** When true an employee cannot acknowledge without signing the receipt. */
  requiresSignature: boolean;
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
  parentSectionId: string | null;
  parentSectionKey: string | null;
  /** Zero-based nesting level (0 = top-level section). */
  depth: number;
  /** Dotted outline number, e.g. "2.1.3". */
  outlineNumber: string;
  /** One-based position in the outline (pre-order) sequence. */
  position: number;
}

/**
 * One section of a FROZEN published version's assembled content. Read-only: the
 * version is immutable, so this is rendered, never edited. `body` is the
 * attorney-flagged placeholder frozen at publish time.
 *
 * Versions published before 0337 are flat: `depth` is 0 and `outlineNumber` /
 * `parentSectionKey` are null for them.
 */
export interface MhdHandbookAssembledSection {
  jurisdiction: MhdHandbookJurisdiction;
  sectionKey: string;
  title: string;
  // ATTORNEY-FLAGGED PLACEHOLDER, frozen at publish.
  body: string;
  parentSectionKey: string | null;
  depth: number;
  outlineNumber: string | null;
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
  dueAt: string | null;
  /** The receipt's signature request, if one has been sent. */
  esignatureRequestId: string | null;
  /** PENDING / IN_PROGRESS / COMPLETED / DECLINED / VOIDED / EXPIRED, when a request exists. */
  esignatureStatus: string | null;
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
  dueAt: string | null;
  /** True when this handbook requires a signed receipt before the employee can acknowledge. */
  requiresSignature: boolean;
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

/**
 * Changing how long employees have to acknowledge a newly assigned version
 * (`mhd_handbook_set_ack_policy`). It applies to future assignments only; an
 * acknowledgment already assigned keeps the deadline it was given.
 */
export interface MhdSetHandbookAckPolicyInput {
  handbookId: MhdHandbookId;
  dueDays: number;
  /** Omit to leave the signature requirement as it is. */
  requiresSignature?: boolean;
}

/** The document target and system template of the per-person acknowledgment receipt (0345). */
export const MHD_HANDBOOK_ACK_ENTITY_TYPE = 'HANDBOOK_ACK';
export const MHD_HANDBOOK_ACK_TEMPLATE_KEY = 'HANDBOOK_ACKNOWLEDGMENT';

/**
 * Sending an employee the signature request for their acknowledgment receipt. An
 * administrator does this (creating a request is an administrator act in the
 * e-signature engine); the employee signs from the emailed link and then acknowledges.
 */
export interface MhdRequestAcknowledgmentSignatureInput {
  ackId: MhdHandbookAcknowledgmentId;
  companyId: string;
  personId: string;
  /** The administrator creating the request. */
  actorUserId: string;
}

export interface MhdRequestAcknowledgmentSignatureResult {
  esignatureRequestId: string;
  /** Per-signer email failures; the request exists even when an invitation failed. */
  invitationErrors: string[];
}

/** A pending acknowledgment that still needs a signature request sent (none yet, or the last one ended unsigned). */
export function mhdNeedsSignatureRequest(row: {
  status: string;
  esignatureRequestId: string | null;
  esignatureStatus: string | null;
}): boolean {
  if (row.status !== 'PENDING') return false;
  if (!row.esignatureRequestId) return true;
  return ['DECLINED', 'VOIDED', 'EXPIRED'].includes(row.esignatureStatus ?? '');
}

/** Bounds of the acknowledgment deadline; mirrors the database CHECK (0342). */
export const MHD_HANDBOOK_ACK_DUE_DAYS_MIN = 1;
export const MHD_HANDBOOK_ACK_DUE_DAYS_MAX = 365;

/** True when an assignment is still pending and its deadline has passed. */
export function mhdIsAcknowledgmentOverdue(
  dueAt: string | null,
  status: string,
  now: Date = new Date(),
): boolean {
  if (status !== 'PENDING' || !dueAt) return false;
  const due = new Date(dueAt);
  return !Number.isNaN(due.getTime()) && due.getTime() <= now.getTime();
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
  /** Nest the new section under this one (same type and jurisdiction, max four levels). */
  parentSectionId?: string | null;
}

/**
 * Re-parenting and/or reordering a section (`mhd_move_handbook_section`).
 * `parentSectionId: null` moves it to the top level. The server refuses cycles,
 * a mismatched type/jurisdiction and a nesting depth beyond four levels.
 */
export interface MhdMoveHandbookSectionInput {
  sectionId: string;
  parentSectionId: string | null;
  sortOrder?: number;
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
  /**
   * Copy the section's active subsections too, each re-parented under the copy of its
   * parent. Without it only the one section is copied and its children stay under the
   * library original.
   */
  includeDescendants?: boolean;
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

// ---------------------------------------------------------------------------
// Export (0337)
// ---------------------------------------------------------------------------

/** The document-generation target a published handbook version is exported as. */
export const MHD_HANDBOOK_EXPORT_ENTITY_TYPE = 'HANDBOOK_VERSION';

/**
 * The system template the full handbook is rendered with (company override by key,
 * per 0031). The server refuses any other template for a handbook version, and only
 * handbook administrators may request the Word (DOCX) format — enforced in
 * `mhd_request_document_generation`, not by this UI.
 */
export const MHD_HANDBOOK_EXPORT_TEMPLATE_KEY = 'HANDBOOK_FULL';

// ---------------------------------------------------------------------------
// Outline helpers (0337) — one definition so the picker, preview, version view
// and library nest sections identically.
// ---------------------------------------------------------------------------

/** Left indent applied per outline level. Mirrors the 18px per level the exported document uses. */
export const MHD_HANDBOOK_INDENT_REM_PER_LEVEL = 1.25;

/** Inline style that indents a row to its outline depth (Tailwind cannot build this class dynamically). */
export function mhdHandbookIndentStyle(depth: number): { marginLeft: string } {
  return { marginLeft: `${Math.max(0, depth) * MHD_HANDBOOK_INDENT_REM_PER_LEVEL}rem` };
}

/**
 * Deepest zero-based outline level a section may sit at (four levels in all).
 * Mirrors the cap enforced by the `trg_handbook_sections_hierarchy` trigger (0337) —
 * the database is the authority; this only stops the form offering a parent that
 * would be refused.
 */
export const MHD_HANDBOOK_MAX_DEPTH_INDEX = 3;

/** A library section together with its nesting level, in outline (pre-order) order. */
export interface MhdHandbookOutlineEntry {
  section: MhdHandbookSection;
  depth: number;
}

/**
 * Orders a flat list of library sections as an outline: each section is followed by
 * its subsections, siblings by `sortOrder` then title. A section whose parent is not
 * in the supplied list (filtered out, or inactive) is treated as top-level rather than
 * dropped, so a filtered view never hides content.
 */
export function mhdOrderSectionsAsOutline(
  sections: MhdHandbookSection[],
): MhdHandbookOutlineEntry[] {
  const known = new Set(sections.map((section) => section.id));
  const children = new Map<string | null, MhdHandbookSection[]>();
  for (const section of sections) {
    const key =
      section.parentSectionId && known.has(section.parentSectionId)
        ? section.parentSectionId
        : null;
    const siblings = children.get(key) ?? [];
    siblings.push(section);
    children.set(key, siblings);
  }
  for (const siblings of children.values()) {
    siblings.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }

  const ordered: MhdHandbookOutlineEntry[] = [];
  const visited = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    for (const section of children.get(parentId) ?? []) {
      // The database refuses cycles; the guard only protects against malformed input.
      if (visited.has(section.id)) continue;
      visited.add(section.id);
      ordered.push({ section, depth });
      walk(section.id, depth + 1);
    }
  };
  walk(null, 0);
  return ordered;
}

/**
 * The sections a given section may be nested under, in outline order. Mirrors the
 * trigger's rules so the form only offers parents the server will accept: same
 * handbook type and jurisdiction, active, a library section only under a library
 * section (a company section may sit under a library one or its own company's),
 * never the section itself or anything beneath it, and only parents that still
 * leave room for the section (and its own subsections) within the depth cap.
 *
 * `scopeCompanyId: null` is the global library scope.
 */
export function mhdHandbookParentCandidates(
  sections: MhdHandbookSection[],
  target: {
    handbookType: MhdHandbookType;
    jurisdiction: MhdHandbookJurisdiction;
    scopeCompanyId: string | null;
    /** The section being edited, if any — it and its descendants are never offered. */
    excludeSectionId?: string | null;
  },
): MhdHandbookOutlineEntry[] {
  const outline = mhdOrderSectionsAsOutline(sections);

  // Height of the subtree beneath the section being moved (0 when it has no subsections).
  const excluded = new Set<string>();
  let subtreeHeight = 0;
  if (target.excludeSectionId) {
    const own = outline.find((entry) => entry.section.id === target.excludeSectionId);
    if (own) {
      excluded.add(own.section.id);
      for (const entry of outline) {
        if (entry.depth > own.depth && isDescendantOf(entry.section, own.section.id, sections)) {
          excluded.add(entry.section.id);
          subtreeHeight = Math.max(subtreeHeight, entry.depth - own.depth);
        }
      }
    }
  }

  return outline.filter(({ section, depth }) => {
    if (excluded.has(section.id)) return false;
    if (!section.isActive) return false;
    if (section.handbookType !== target.handbookType) return false;
    if (section.jurisdiction !== target.jurisdiction) return false;
    if (target.scopeCompanyId === null) {
      if (!section.isLibrary) return false;
    } else if (!section.isLibrary && section.companyId !== target.scopeCompanyId) {
      return false;
    }
    // The section would sit one level below its parent, with its subtree beneath it.
    return depth + 1 + subtreeHeight <= MHD_HANDBOOK_MAX_DEPTH_INDEX;
  });
}

function isDescendantOf(
  section: MhdHandbookSection,
  ancestorId: string,
  sections: MhdHandbookSection[],
): boolean {
  const byId = new Map(sections.map((item) => [item.id, item]));
  let cursor = section.parentSectionId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    if (cursor === ancestorId) return true;
    seen.add(cursor);
    cursor = byId.get(cursor)?.parentSectionId ?? null;
  }
  return false;
}
