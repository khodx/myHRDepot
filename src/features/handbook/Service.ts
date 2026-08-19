import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdToNumber } from './Types';
import type {
  MhdAcknowledgeInput,
  MhdAssignAcknowledgmentInput,
  MhdCreateHandbookInput,
  MhdCreateHandbookSectionInput,
  MhdForkHandbookSectionInput,
  MhdHandbook,
  MhdHandbookAckStatusRow,
  MhdHandbookAckStatusRpcRow,
  MhdHandbookAssembledSection,
  MhdHandbookAssembledSectionRpcRow,
  MhdHandbookListFilters,
  MhdHandbookMutationResult,
  MhdHandbookMutationRpcRow,
  MhdHandbookPreviewRow,
  MhdHandbookPreviewRowRpcRow,
  MhdHandbookPublishResult,
  MhdHandbookPublishResultRpcRow,
  MhdHandbookRpcRow,
  MhdHandbookSection,
  MhdHandbookSectionFilters,
  MhdHandbookSectionMutationResult,
  MhdHandbookSectionMutationRpcRow,
  MhdHandbookSectionRpcRow,
  MhdHandbookVersion,
  MhdHandbookVersionRpcRow,
  MhdMyAcknowledgment,
  MhdMyAcknowledgmentRpcRow,
  MhdPublishHandbookInput,
  MhdToggleSectionInput,
  MhdUpdateHandbookSectionInput,
} from './Types';

// Contract-only access. Every method below calls `.rpc()` and nothing else —
// there is not a single `supabaseClient.from('handbook_*')` select in this
// service. The whole surface is security-definer RPCs; RLS carries a
// `using(false) with check(false)` no-direct-write policy on every table, so a
// direct insert/update is refused even for an admin. The library read
// (handbook_sections) is likewise reached through `section_list`, never a
// direct select.
// supabaseClient.rpc is called directly rather than bound to a local alias.
// Binding instantiates the whole generated rpc overload set at once, which now
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema size.
// A direct call instantiates only the matching overload, so argument and return
// types remain fully checked.

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapSection(row: MhdHandbookSectionRpcRow): MhdHandbookSection {
  return {
    id: row.id,
    companyId: row.company_id,
    handbookType: row.handbook_type as MhdHandbookSection['handbookType'],
    jurisdiction: row.jurisdiction as MhdHandbookSection['jurisdiction'],
    sectionKey: row.section_key,
    title: row.title,
    // Attorney-flagged placeholder; rendered as placeholder, never as policy.
    bodyPlaceholder: row.body_placeholder,
    isRequired: row.is_required,
    // PostgREST may serialise the integer as a string; normalise before use.
    sortOrder: mhdToNumber(row.sort_order),
    isActive: row.is_active,
    isLibrary: row.is_library,
    sourceSectionId: row.source_section_id,
  };
}

function mapHandbook(row: MhdHandbookRpcRow): MhdHandbook {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdHandbook['referenceId'],
    handbookType: row.handbook_type as MhdHandbook['handbookType'],
    title: row.title,
    jurisdictions: (row.jurisdictions ?? []) as MhdHandbook['jurisdictions'],
    status: row.status as MhdHandbook['status'],
    currentVersionId: row.current_version_id,
    effectiveDate: row.effective_date,
    createdAt: row.created_at,
  };
}

function mapPreviewRow(row: MhdHandbookPreviewRowRpcRow): MhdHandbookPreviewRow {
  return {
    sectionId: row.section_id,
    jurisdiction: row.jurisdiction as MhdHandbookPreviewRow['jurisdiction'],
    sectionKey: row.section_key,
    title: row.title,
    // Attorney-flagged placeholder.
    bodyPlaceholder: row.body_placeholder,
    isRequired: row.is_required,
    sortOrder: mhdToNumber(row.sort_order),
  };
}

function mapAssembledSection(row: MhdHandbookAssembledSectionRpcRow): MhdHandbookAssembledSection {
  return {
    jurisdiction: row.jurisdiction as MhdHandbookAssembledSection['jurisdiction'],
    sectionKey: row.section_key,
    title: row.title,
    // Attorney-flagged placeholder, frozen at publish time — rendered read-only.
    body: row.body,
  };
}

function mapVersion(row: MhdHandbookVersionRpcRow): MhdHandbookVersion {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdHandbookVersion['referenceId'],
    handbookId: row.handbook_id,
    versionNumber: mhdToNumber(row.version_number),
    // The FROZEN snapshot — rendered read-only, never edited. Each body is the
    // attorney-flagged placeholder as it stood at publish.
    assembledContent: (row.assembled_content ?? []).map(mapAssembledSection),
    contentHash: row.content_hash,
    effectiveDate: row.effective_date,
    documentGenerationId: row.document_generation_id,
    publishedAt: row.published_at,
  };
}

function mapAckStatusRow(row: MhdHandbookAckStatusRpcRow): MhdHandbookAckStatusRow {
  return {
    id: row.id,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    status: row.status as MhdHandbookAckStatusRow['status'],
    acknowledgedAt: row.acknowledged_at,
  };
}

function mapMyAcknowledgment(row: MhdMyAcknowledgmentRpcRow): MhdMyAcknowledgment {
  return {
    id: row.id,
    handbookVersionId: row.handbook_version_id,
    handbookTitle: row.handbook_title,
    handbookType: row.handbook_type as MhdMyAcknowledgment['handbookType'],
    versionNumber: mhdToNumber(row.version_number),
    status: row.status as MhdMyAcknowledgment['status'],
    esignatureRequestId: row.esignature_request_id,
    acknowledgedAt: row.acknowledged_at,
  };
}

function mapMutationResult(row: MhdHandbookMutationRpcRow): MhdHandbookMutationResult {
  return { id: row.id, referenceId: row.reference_id };
}

function mapPublishResult(row: MhdHandbookPublishResultRpcRow): MhdHandbookPublishResult {
  return {
    id: row.id as MhdHandbookPublishResult['id'],
    referenceId: row.reference_id as MhdHandbookPublishResult['referenceId'],
    versionNumber: mhdToNumber(row.version_number),
    contentHash: row.content_hash,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdHandbookService = {
  // ----- Route gate -----

  /**
   * The privileged-role gate (`mhd_handbook_is_privileged`). Usually surfaced as
   * a route-gating prop for the admin surfaces rather than a data call — the
   * mutating RPCs re-check the role regardless, so this only governs affordances.
   */
  async isPrivileged(): Promise<boolean> {
    const { data, error } = await supabaseClient.rpc('mhd_handbook_is_privileged', undefined);
    if (error) throw error;
    return Boolean(data);
  },

  // ----- Library / assembly -----

  /**
   * The clause library for a content pack, optionally narrowed to one
   * jurisdiction. Bodies are attorney-flagged placeholders. Any authenticated
   * user may read it (it gates on company access, not the privileged role).
   *
   * `p_company_id` is REQUIRED as of 0184 — the RPC returns the GLOBAL library
   * plus that company's own sections (`is_library` distinguishes the two); the
   * prior signature had no company argument at all and leaked every company's
   * private sections to every caller. Refuse the call without one, same as
   * without a `handbookType`.
   */
  async listSections(filters: MhdHandbookSectionFilters): Promise<MhdHandbookSection[]> {
    if (!filters.companyId || !filters.handbookType) return [];
    const { data, error } = await supabaseClient.rpc('mhd_handbook_section_list', {
      p_company_id: filters.companyId,
      p_handbook_type: filters.handbookType,
      p_jurisdiction: trimmedOrUndefined(filters.jurisdiction),
    });
    if (error) throw error;
    return ((data ?? []) as MhdHandbookSectionRpcRow[]).map(mapSection);
  },

  /**
   * Create a section. `p_company_id: null` mints a GLOBAL library clause —
   * server-enforced Platform Admin / HR Partner only, refused for any other
   * caller regardless of the UI affordance. A non-null id mints a company-owned
   * clause. `p_source_section_id` is an optional fork-lineage stamp; pass it only
   * when hand-authoring a section FROM a library clause's content — `forkSection`
   * is the direct clone path.
   */
  async createSection(
    input: MhdCreateHandbookSectionInput,
  ): Promise<MhdHandbookSectionMutationResult> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_handbook_section', {
        p_company_id: input.companyId,
        p_handbook_type: input.handbookType,
        p_jurisdiction: input.jurisdiction,
        p_section_key: input.sectionKey.trim(),
        p_title: input.title.trim(),
        p_body_placeholder: input.bodyPlaceholder,
        p_is_required: input.isRequired,
        p_sort_order: input.sortOrder,
        p_source_section_id: input.sourceSectionId ?? undefined,
        // gen:types requires p_company_id: string even though the RPC accepts
        // NULL to mean "global library section" — the same gen:types limitation
        // already worked around at the Forms / Calendar / Companies call sites.
      } as never)
      .returns<MhdHandbookSectionMutationRpcRow[]>();
    if (error) throw error;
    const row = (data ?? [])[0];
    if (!row) throw new Error('Section creation returned no row.');
    return { id: row.id };
  },

  /**
   * Update a section's editable fields (`mhd_update_handbook_section`). Only the
   * fields present on `input` are sent — an omitted field is left unchanged at
   * the RPC (partial update), so this never overwrites a field the caller did
   * not intend to touch.
   */
  async updateSection(input: MhdUpdateHandbookSectionInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_handbook_section', {
      p_section_id: input.sectionId,
      ...(input.title !== undefined ? { p_title: input.title.trim() } : {}),
      ...(input.bodyPlaceholder !== undefined ? { p_body_placeholder: input.bodyPlaceholder } : {}),
      ...(input.isRequired !== undefined ? { p_is_required: input.isRequired } : {}),
      ...(input.sortOrder !== undefined ? { p_sort_order: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { p_is_active: input.isActive } : {}),
    });
    if (error) throw error;
  },

  /**
   * Fork a GLOBAL library section into a company-owned editable copy. Only a
   * section with `company_id is null` (`isLibrary: true`) may be forked — the
   * RPC refuses a company-owned source. The returned id is the new
   * company-owned section; its `sourceSectionId` points back at the library
   * original.
   */
  async forkSection(
    input: MhdForkHandbookSectionInput,
  ): Promise<MhdHandbookSectionMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_fork_handbook_section', {
      p_source_section_id: input.sourceSectionId,
      p_company_id: input.companyId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdHandbookSectionMutationRpcRow[])[0];
    if (!row) throw new Error('Section fork returned no row.');
    return { id: row.id };
  },

  /**
   * Create a draft handbook. The RPC assembles the draft: required sections for
   * the chosen jurisdictions auto-included, optional ones offered (off). Admin
   * only at the RPC; the caller sees the minted `(id, reference_id)`.
   */
  async create(input: MhdCreateHandbookInput): Promise<MhdHandbookMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_handbook_create', {
      p_company_id: input.companyId,
      p_handbook_type: input.handbookType,
      p_title: input.title.trim(),
      p_jurisdictions: input.jurisdictions,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdHandbookMutationRpcRow[])[0];
    if (!row) throw new Error('Handbook creation returned no row.');
    return mapMutationResult(row);
  },

  /** A company's handbooks, newest first per type. Gates on company access. */
  async list(filters: MhdHandbookListFilters): Promise<MhdHandbook[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_handbook_list', {
      p_company_id: filters.companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdHandbookRpcRow[]).map(mapHandbook);
  },

  /**
   * Toggle an optional section in a DRAFT. A required section refuses exclusion
   * and a non-DRAFT handbook refuses any edit — both enforced at the RPC. Surface
   * the server's error rather than pre-empting it.
   */
  async toggleSection(input: MhdToggleSectionInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_handbook_toggle_section', {
      p_handbook_id: input.handbookId,
      p_section_id: input.sectionId,
      p_included: input.included,
    });
    if (error) throw error;
  },

  /**
   * The assembled DRAFT preview — ordered included sections with their
   * (placeholder) bodies. This is a SHELL: the bodies are attorney-pending
   * placeholders and the preview UI marks them as such.
   */
  async preview(handbookId: string): Promise<MhdHandbookPreviewRow[]> {
    const { data, error } = await supabaseClient.rpc('mhd_handbook_preview', {
      p_handbook_id: handbookId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdHandbookPreviewRowRpcRow[]).map(mapPreviewRow);
  },

  // ----- Publish / versions -----

  /**
   * Publish a draft — freezes an immutable version + content hash, archives the
   * prior one, and sets `current_version_id`. `p_document_generation_id` is the
   * app-layer doc-gen soft link, forwarded from the host route if it rendered the
   * document; the service never invents a doc-gen call.
   */
  async publish(input: MhdPublishHandbookInput): Promise<MhdHandbookPublishResult> {
    const { data, error } = await supabaseClient.rpc('mhd_handbook_publish', {
      p_handbook_id: input.handbookId,
      p_effective_date: trimmedOrUndefined(input.effectiveDate),
      p_document_generation_id: trimmedOrUndefined(input.documentGenerationId),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdHandbookPublishResultRpcRow[])[0];
    if (!row) throw new Error('Handbook publish returned no row.');
    return mapPublishResult(row);
  },

  /**
   * A frozen version's content (`version_get`). `assembledContent` is immutable —
   * render it read-only. Correction is a new version, never an edit to this one.
   */
  async versionGet(versionId: string): Promise<MhdHandbookVersion | null> {
    const { data, error } = await supabaseClient.rpc('mhd_handbook_version_get', {
      p_version_id: versionId,
    });
    if (error) throw error;
    // `assembled_content` is generated as `Json` (the jsonb column); at runtime it
    // is the assembled-section array. Cast through `unknown` to adopt the concrete
    // row shape — the mapper reads it as MhdHandbookAssembledSectionRpcRow[].
    const row = ((data ?? []) as unknown as MhdHandbookVersionRpcRow[])[0];
    return row ? mapVersion(row) : null;
  },

  /** Archive a handbook. Admin only at the RPC. */
  async archive(handbookId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_handbook_archive', {
      p_handbook_id: handbookId,
    });
    if (error) throw error;
  },

  // ----- Acknowledgment ceremony -----

  /**
   * Assign an acknowledgment of a published version to a person. Fans out a
   * notification server-side (only when the person has a user account); the
   * caller sees the minted `(id, reference_id)`. `p_esignature_request_id` is the
   * app-layer e-sign soft link, forwarded from the host route if it created a
   * signature request.
   */
  async assignAcknowledgment(
    input: MhdAssignAcknowledgmentInput,
  ): Promise<MhdHandbookMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_handbook_assign_acknowledgment', {
      p_version_id: input.versionId,
      p_person_id: input.personId,
      p_esignature_request_id: trimmedOrUndefined(input.esignatureRequestId),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdHandbookMutationRpcRow[])[0];
    if (!row) throw new Error('Acknowledgment assignment returned no row.');
    return mapMutationResult(row);
  },

  /**
   * Mark an acknowledgment ACKNOWLEDGED. GATED server-side on the e-sign request
   * completing: if a request is attached, the RPC refuses while its status is not
   * COMPLETED, raising "The acknowledgment signature is not yet complete". Do not
   * pre-empt that gate — surface the server's error. With no signature request
   * (the shell path) it succeeds directly.
   */
  async acknowledge(input: MhdAcknowledgeInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_handbook_acknowledge', {
      p_ack_id: input.ackId,
      p_esignature_request_id: trimmedOrUndefined(input.esignatureRequestId),
    });
    if (error) throw error;
  },

  /**
   * The acknowledgment board for a version — who has / has not acknowledged.
   * Admin only at the RPC.
   */
  async ackStatus(versionId: string): Promise<MhdHandbookAckStatusRow[]> {
    const { data, error } = await supabaseClient.rpc('mhd_handbook_ack_status', {
      p_version_id: versionId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdHandbookAckStatusRpcRow[]).map(mapAckStatusRow);
  },

  /**
   * The employee's own acknowledgments (`my_acknowledgments`). Any authenticated
   * employee reaches this; RLS narrows it to their own rows via `auth.uid()`.
   */
  async myAcknowledgments(): Promise<MhdMyAcknowledgment[]> {
    const { data, error } = await supabaseClient.rpc('mhd_handbook_my_acknowledgments', undefined);
    if (error) throw error;
    return ((data ?? []) as MhdMyAcknowledgmentRpcRow[]).map(mapMyAcknowledgment);
  },
};
