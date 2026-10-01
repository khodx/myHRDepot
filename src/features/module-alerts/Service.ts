import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdModuleAlertCounts } from './Types';

export const mhdModuleAlertsService = {
  async getCounts(): Promise<MhdModuleAlertCounts> {
    const { data, error } = await supabaseClient.rpc('mhd_module_attention_counts');
    if (error) throw new Error(`Module alerts query failed: ${error.message}`);

    // An empty result means nothing needs attention anywhere — never an error.
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[String(row.module_route)] = Number(row.needs_attention);
    }
    return counts;
  },
};
