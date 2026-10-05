import { supabaseClient } from '@/lib/supabase/supabaseClient';
import {
  mhdIsEmployeeFileTypeKey,
  type MhdEmployeeFileCategoryDefault,
  type MhdEmployeeFileCategoryDefaultTarget,
  type MhdEmployeeFileCompletenessItem,
  type MhdEmployeeFileRequirement,
  type MhdEmployeeFileRequirementGap,
  type MhdEmployeeFileRequirementKind,
  type MhdEmployeeFileRequirementState,
  type MhdEmployeeFileRequirementStatus,
  type MhdEmployeeFileTypeKey,
} from './Types';

// supabaseClient.rpc is called directly rather than bound to a local alias.
// Binding instantiates the whole generated rpc overload set at once, which now
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema size.
// A direct call instantiates only the matching overload, so argument and return
// types remain fully checked. (Same rationale as accommodations/Service.ts.)

interface MhdEmployeeFileCategoryDefaultRpcRow {
  category: string;
  form_id: string;
  form_name: string;
  form_status: string;
}

/** Input for upserting a requirement; `label` is the rule's identity within a company. */
export interface MhdUpsertEmployeeFileRequirementInput {
  label: string;
  category: MhdEmployeeFileTypeKey;
  satisfiedByKind: MhdEmployeeFileRequirementKind;
  formId: string | null;
  templateKey: string | null;
  appliesToStates: MhdEmployeeFileRequirementState[];
  dueDaysAfterHire: number | null;
  isActive: boolean;
}

function requireCategory(value: string): MhdEmployeeFileTypeKey {
  if (!mhdIsEmployeeFileTypeKey(value)) {
    throw new Error(`Unexpected employee file category "${value}".`);
  }
  return value;
}

export const mhdEmployeeFilesService = {
  /**
   * Zero-or-one lookup used by the New Record flow to decide whether it can
   * skip the manual form picker for this company + category.
   */
  async getCategoryDefault(
    companyId: string,
    category: MhdEmployeeFileTypeKey,
  ): Promise<MhdEmployeeFileCategoryDefaultTarget | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_employee_file_category_default', {
      p_company_id: companyId,
      p_category: category,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ form_id: string; form_name: string }>)[0];
    return row ? { formId: row.form_id, formName: row.form_name } : null;
  },

  /** Platform Admin / HR Partner only — enforced server-side by the RPC. */
  async listCategoryDefaults(companyId: string): Promise<MhdEmployeeFileCategoryDefault[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_employee_file_category_defaults', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdEmployeeFileCategoryDefaultRpcRow[])
      .filter((row) => mhdIsEmployeeFileTypeKey(row.category))
      .map((row) => ({
        category: row.category as MhdEmployeeFileTypeKey,
        formId: row.form_id,
        formName: row.form_name,
        formStatus: row.form_status,
      }));
  },

  /**
   * Upserts the default. The RPC re-validates server-side that the form is
   * ACTIVE and tagged with this exact category, so a stale client-side form
   * list can never set a mismatched default.
   */
  async setCategoryDefault(
    companyId: string,
    category: MhdEmployeeFileTypeKey,
    formId: string,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_set_employee_file_category_default', {
      p_company_id: companyId,
      p_category: category,
      p_form_id: formId,
    });
    if (error) throw error;
  },

  async clearCategoryDefault(companyId: string, category: MhdEmployeeFileTypeKey): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_clear_employee_file_category_default', {
      p_company_id: companyId,
      p_category: category,
    });
    if (error) throw error;
  },

  /** Unmet requirements across a company; access is enforced by the RPC. */
  async listRequirementGaps(companyId: string): Promise<MhdEmployeeFileRequirementGap[]> {
    const { data, error } = await supabaseClient.rpc('mhd_employee_file_requirement_gaps', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      personId: row.person_id,
      personName: row.person_name,
      requirementId: row.requirement_id,
      label: row.label,
      category: requireCategory(row.category),
      dueDate: row.due_date,
      status: row.status as MhdEmployeeFileRequirementGap['status'],
    }));
  },

  /** One person's requirement checklist; the RPC refuses callers without file access. */
  async getPersonCompleteness(personId: string): Promise<MhdEmployeeFileCompletenessItem[]> {
    const { data, error } = await supabaseClient.rpc('mhd_employee_file_completeness', {
      p_person_id: personId,
    });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      requirementId: row.requirement_id,
      label: row.label,
      category: requireCategory(row.category),
      dueDate: row.due_date,
      status: row.status as MhdEmployeeFileRequirementStatus,
    }));
  },

  async listRequirements(companyId: string): Promise<MhdEmployeeFileRequirement[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_employee_file_requirements', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      requirementId: row.requirement_id,
      companyId: row.company_id,
      category: requireCategory(row.category),
      label: row.label,
      satisfiedByKind: row.satisfied_by_kind as MhdEmployeeFileRequirementKind,
      formId: row.form_id,
      templateKey: row.template_key,
      appliesToStates: (row.applies_to_states ?? []) as MhdEmployeeFileRequirementState[],
      dueDaysAfterHire: row.due_days_after_hire,
      isActive: row.is_active,
      isOverride: row.is_override,
    }));
  },

  /**
   * Upserts the company's rule for `label`; a default is switched off by
   * saving the override with `isActive: false`. Returns the rule id.
   */
  async upsertRequirement(
    companyId: string,
    input: MhdUpsertEmployeeFileRequirementInput,
  ): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_upsert_employee_file_requirement', {
      p_company_id: companyId,
      p_label: input.label,
      p_category: input.category,
      p_satisfied_by_kind: input.satisfiedByKind,
      p_form_id: input.formId ?? undefined,
      p_template_key: input.templateKey ?? undefined,
      p_applies_to_states: input.appliesToStates,
      p_due_days_after_hire: input.dueDaysAfterHire ?? undefined,
      p_is_active: input.isActive,
    });
    if (error) throw error;
    return data;
  },
};
