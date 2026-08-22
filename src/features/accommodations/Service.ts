import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import type {
  MhdAccommodationDetail,
  MhdAccommodationManagerInstruction,
  MhdAccommodationMedicalReveal,
  MhdAccommodationOptionCatalogEntry,
  MhdAccommodationOptionCatalogEntryRpcRow,
  MhdAccommodationReviewEffectiveness,
  MhdAccommodationStatus,
  MhdAccommodationSummary,
  MhdAccommodationSummaryRpcRow,
  MhdComplianceReadiness,
  MhdCreateAccommodationInput,
  MhdCreateAccommodationOptionCatalogEntryInput,
  MhdRecordAccommodationMedicalInput,
  MhdUpdateAccommodationOptionCatalogEntryInput,
} from './Types';

// supabaseClient.rpc is called directly rather than bound to a local alias.
// Binding instantiates the whole generated rpc overload set at once, which now
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema size.
// A direct call instantiates only the matching overload, so argument and return
// types remain fully checked.

interface MhdAccommodationManagerProjectionRpcRow {
  implementation_id: string;
  option_type: string;
  manager_instruction: string;
  start_date: string;
  end_date: string | null;
  review_due_date: string | null;
}

function mapOptionCatalogEntry(
  row: MhdAccommodationOptionCatalogEntryRpcRow,
): MhdAccommodationOptionCatalogEntry {
  return {
    id: row.id,
    companyId: row.company_id,
    optionType: row.option_type,
    descriptionTemplate: row.description_template,
    category: row.category,
    functionalLimitationTags: row.functional_limitation_tags ?? [],
    typicalCostRange: row.typical_cost_range,
    sourceOptionId: row.source_option_id,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    isLibrary: row.is_library,
  };
}

function mapSummary(row: MhdAccommodationSummaryRpcRow): MhdAccommodationSummary {
  return {
    id: row.id,
    referenceId: row.reference_id,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    requestSource: row.request_source,
    requestChannel: row.request_channel,
    requestedAt: row.requested_at,
    status: row.status,
    ownerUserId: row.owner_user_id,
    leaveCaseId: row.leave_case_id,
    currentDecision: row.current_decision,
    reviewDueDate: row.review_due_date,
  };
}

export const mhdAccommodationsService = {
  async list(companyId: string, status?: string | null, personId?: string | null) {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_case_list', {
      p_company_id: companyId,
      p_status: !status || status === 'ALL' ? undefined : status,
      p_person_id: personId ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdAccommodationSummaryRpcRow[]).map(mapSummary);
  },

  async get(caseId: string): Promise<MhdAccommodationDetail> {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_case_get', { p_case_id: caseId });
    if (error) throw error;
    return data as unknown as MhdAccommodationDetail;
  },

  async create(input: MhdCreateAccommodationInput): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_case_create', {
      p_company_id: input.companyId,
      p_person_id: input.personId,
      p_request_source: input.requestSource,
      p_request_channel: input.requestChannel,
      p_requested_at: input.requestedAt,
      p_request_summary: input.requestSummary.trim(),
      p_leave_case_id: input.leaveCaseId ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Accommodation creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  async createCaseFromSubmission(
    submissionId: string,
    values: Json
  ): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await supabaseClient.rpc('mhd_create_accommodation_case_from_submission', {
      p_submission_id: submissionId,
      p_values: values,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Accommodation case creation from submission returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  async transition(caseId: string, status: MhdAccommodationStatus, reason?: string | null) {
    const { error } = await supabaseClient.rpc('mhd_accommodation_transition', {
      p_case_id: caseId,
      p_new_status: status,
      p_reason: reason?.trim() || undefined,
    });
    if (error) throw error;
  },

  async addInteraction(input: {
    caseId: string;
    occurredAt: string;
    channel: string;
    summary: string;
    nextStep?: string | null;
    nextStepDue?: string | null;
    employeeVisible: boolean;
  }) {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_add_interaction', {
      p_case_id: input.caseId,
      p_occurred_at: input.occurredAt,
      p_channel: input.channel,
      p_participants: [],
      p_summary: input.summary.trim(),
      p_next_step: input.nextStep?.trim() || undefined,
      p_next_step_due: input.nextStepDue || undefined,
      p_employee_visible: input.employeeVisible,
    });
    if (error) throw error;
    return data as string;
  },

  async addOption(input: {
    caseId: string;
    optionType: string;
    description: string;
    expectedEffectiveness: string;
    essentialFunctionIds: string[];
    employeePreference: boolean;
    estimatedCost?: number | null;
  }) {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_add_option', {
      p_case_id: input.caseId,
      p_option_type: input.optionType,
      p_description: input.description.trim(),
      p_expected_effectiveness: input.expectedEffectiveness.trim(),
      p_essential_function_ids: input.essentialFunctionIds,
      p_employee_preference: input.employeePreference,
      p_removes_essential_function: false,
      p_estimated_cost: input.estimatedCost ?? undefined,
      p_operational_factors: {},
    });
    if (error) throw error;
    return data as string;
  },

  async decide(input: {
    caseId: string;
    outcome: 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED';
    decisionSummary: string;
    selectedOptionId?: string | null;
    denialReasonCode?: string | null;
    individualizedAnalysis?: string | null;
    alternativesConsidered: boolean;
    interactiveProcessContinues: boolean;
  }) {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_decide', {
      p_case_id: input.caseId,
      p_outcome: input.outcome,
      p_decision_summary: input.decisionSummary.trim(),
      p_selected_option_id: input.selectedOptionId || undefined,
      p_denial_reason_code: input.denialReasonCode || undefined,
      p_individualized_analysis: input.individualizedAnalysis?.trim()
        ? { analysis: input.individualizedAnalysis.trim() }
        : {},
      p_alternatives_considered: input.alternativesConsidered,
      p_interactive_process_continues: input.interactiveProcessContinues,
    });
    if (error) throw error;
    return data as string;
  },

  async implement(input: {
    caseId: string;
    optionId: string;
    startDate: string;
    endDate?: string | null;
    managerInstruction: string;
    reviewDueDate?: string | null;
  }) {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_implement', {
      p_case_id: input.caseId,
      p_option_id: input.optionId,
      p_start_date: input.startDate,
      p_end_date: input.endDate || undefined,
      p_manager_instruction: input.managerInstruction.trim(),
      p_review_due_date: input.reviewDueDate || undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async completeReview(input: {
    reviewId: string;
    effectiveness: MhdAccommodationReviewEffectiveness;
    summary: string;
    reengageRequired: boolean;
  }) {
    const { error } = await supabaseClient.rpc('mhd_accommodation_complete_review', {
      p_review_id: input.reviewId,
      p_effectiveness: input.effectiveness,
      p_summary: input.summary.trim(),
      p_reengage_required: input.reengageRequired,
    });
    if (error) throw error;
  },

  /**
   * Writes the restricted medical record. The RPC re-checks
   * `mhd_accommodation_can_see_medical` (Platform Admin / HR Partner only) and
   * refuses with 23514 when documentation is requested for an obvious need, so
   * a Client Admin never reaches this path even if the affordance were rendered.
   * Only functional limitation and accommodation need are sent — both are
   * encrypted server-side and never returned by the case read.
   */
  async recordMedical(input: MhdRecordAccommodationMedicalInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_medical_record', {
      p_case_id: input.caseId,
      p_documentation_type: input.documentationType,
      p_status: input.status,
      p_need_is_obvious: input.needIsObvious,
      p_documentation_requested: input.documentationRequested,
      p_requested_at: input.requestedAt || undefined,
      p_due_date: input.dueDate || undefined,
      p_received_at: input.receivedAt || undefined,
      p_functional_limitation: input.functionalLimitation?.trim() || undefined,
      p_accommodation_need: input.accommodationNeed?.trim() || undefined,
    });
    if (error) throw error;
    return data as string;
  },

  /**
   * The sole read path for the two encrypted medical fields. Every call writes a
   * SENSITIVE_FIELD_REVEAL audit event server-side, so a reveal is never silent.
   */
  async revealMedical(documentationId: string): Promise<MhdAccommodationMedicalReveal> {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_medical_reveal', {
      p_documentation_id: documentationId,
    });
    if (error) throw error;
    return data as unknown as MhdAccommodationMedicalReveal;
  },

  /** Manager-safe projection: instructions and dates only, never medical facts. */
  async managerProjection(personId: string): Promise<MhdAccommodationManagerInstruction[]> {
    const { data, error } = await supabaseClient.rpc('mhd_accommodation_manager_projection', {
      p_person_id: personId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdAccommodationManagerProjectionRpcRow[]).map((row) => ({
      implementationId: row.implementation_id,
      optionType: row.option_type,
      managerInstruction: row.manager_instruction,
      startDate: row.start_date,
      endDate: row.end_date,
      reviewDueDate: row.review_due_date,
    }));
  },

  async readiness(): Promise<MhdComplianceReadiness | null> {
    const { data, error } = await supabaseClient.rpc('mhd_compliance_module_readiness', {
      p_module_key: 'ACCOMMODATIONS',
    });
    if (error) throw error;
    return ((data ?? []) as MhdComplianceReadiness[])[0] ?? null;
  },

  /**
   * Reads the option catalog — global (company_id null) entries plus the
   * caller's own company entries, global first. `0186_accommodation_option_
   * catalog.sql`'s RLS/RPC already scopes visibility to companies the caller
   * can access; this is purely a read.
   */
  async listOptionCatalog(
    companyId: string,
    category?: string | null,
  ): Promise<MhdAccommodationOptionCatalogEntry[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_accommodation_option_catalog', {
      p_company_id: companyId,
      p_category: category && category !== 'ALL' ? category : undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdAccommodationOptionCatalogEntryRpcRow[]).map(mapOptionCatalogEntry);
  },

  /**
   * `companyId: null` writes a global/platform library entry — the RPC
   * re-checks `mhd_can_manage_accommodation_option_catalog` server-side
   * (Platform Admin/HR Partner for a null company, +Client Admin for their
   * own company), so this affordance being hidden from other roles is a UI
   * convenience only, never the enforcement.
   */
  async createOptionCatalogEntry(
    input: MhdCreateAccommodationOptionCatalogEntryInput,
  ): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_create_accommodation_option_catalog_entry',
      {
        p_company_id: input.companyId,
        p_option_type: input.optionType.trim(),
        p_description_template: input.descriptionTemplate.trim(),
        p_category: input.category ?? 'OTHER',
        p_typical_cost_range: input.typicalCostRange?.trim() || undefined,
        p_sort_order: input.sortOrder ?? 100,
        p_source_option_id: input.sourceOptionId ?? undefined,
        // p_company_id has no SQL default (a genuine NULL means "global entry"
        // and must be sent explicitly), so gen:types marks it required/non-null
        // even though the RPC accepts NULL at runtime — same compatibility gap
        // documented in forms/Service.ts createForm/updateForm.
      } as never,
    );
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string }>)[0];
    if (!row) throw new Error('Catalog entry creation returned no row.');
    return { id: row.id };
  },

  async updateOptionCatalogEntry(
    input: MhdUpdateAccommodationOptionCatalogEntryInput,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_accommodation_option_catalog_entry', {
      p_entry_id: input.entryId,
      p_description_template: input.descriptionTemplate?.trim() || undefined,
      p_category: input.category ?? undefined,
      p_typical_cost_range: input.typicalCostRange?.trim() || undefined,
      p_sort_order: input.sortOrder ?? undefined,
      p_is_active: input.isActive ?? undefined,
    });
    if (error) throw error;
  },

  /** Clones a global catalog entry into a company-owned, independently editable copy. */
  async forkOptionCatalogEntry(sourceOptionId: string, companyId: string): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_fork_accommodation_option_catalog_entry',
      {
        p_source_option_id: sourceOptionId,
        p_company_id: companyId,
      },
    );
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string }>)[0];
    if (!row) throw new Error('Catalog fork returned no row.');
    return { id: row.id };
  },
};
