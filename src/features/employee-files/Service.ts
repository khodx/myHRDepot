import { supabaseClient } from '@/lib/supabase/supabaseClient';
import {
  mhdIsEmployeeFileTypeKey,
  type MhdEmployeeFileCategoryDefault,
  type MhdEmployeeFileCategoryDefaultTarget,
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
    const { data, error } = await supabaseClient.rpc(
      'mhd_list_employee_file_category_defaults',
      { p_company_id: companyId },
    );
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
};
