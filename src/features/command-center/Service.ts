import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Database } from '@/types/database.types';
import type { MhdCommandCenterFilters, MhdCommandCenterItem } from './Types';

type MhdCommandCenterRow =
  Database['public']['Functions']['mhd_command_center_list']['Returns'][number];

function mapRow(row: MhdCommandCenterRow): MhdCommandCenterItem {
  return {
    itemId: row.item_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    referenceId: row.reference_id,
    title: row.title,
    statusRaw: row.status_raw,
    statusCategory: row.status_category,
    isAlert: row.is_alert,
    personId: row.person_id,
    personName: row.person_name,
    companyId: row.company_id,
    primaryDate: row.primary_date,
    linkPath: row.link_path,
    isSensitiveCategoryOnly: row.is_sensitive_category_only,
  };
}

export const mhdCommandCenterService = {
  async list(filters: MhdCommandCenterFilters): Promise<MhdCommandCenterItem[]> {
    const { data, error } = await supabaseClient.rpc('mhd_command_center_list', {
      // gen:types omits null from optional RPC arguments even though the
      // function accepts it at runtime (same gap documented in forms/Service.ts).
      p_company_id: filters.companyId ?? null,
      p_entity_types: filters.entityTypes ?? null,
      p_status_categories: filters.statusCategories ?? null,
      p_alert_only: filters.alertOnly ?? false,
      p_date_from: filters.dateFrom ?? null,
      p_date_to: filters.dateTo ?? null,
      p_search_text: filters.searchText ?? null,
      p_scope: filters.scope ?? 'downline',
      p_limit: filters.limit ?? 200,
      p_offset: filters.offset ?? 0,
    } as never);

    if (error) throw new Error(`Unable to load command center items: ${error.message}`);
    return (data ?? []).map(mapRow);
  },
};
