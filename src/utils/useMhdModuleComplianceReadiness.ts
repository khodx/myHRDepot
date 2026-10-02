import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdComplianceReadiness } from '@/types/mhdCompliance';

/**
 * The pre-live compliance release gate for one module, as `mhd_compliance_module_readiness` reports it.
 *
 * Shared by every wizard whose decisive step is gated (Conduct, Investigations, Offboarding, Onboarding,
 * Recruiting, Workplace Safety) so none re-implements the read. A null result means UNKNOWN and is never
 * treated as approval — `MhdComplianceGateBanner` renders nothing for it, and the server enforces the gate
 * regardless of what the banner shows.
 */
export function useMhdModuleComplianceReadiness(moduleKey: string) {
  return useQuery({
    queryKey: ['mhd-compliance', 'module-readiness', moduleKey],
    queryFn: async (): Promise<MhdComplianceReadiness | null> => {
      const { data, error } = await supabaseClient.rpc('mhd_compliance_module_readiness', {
        p_module_key: moduleKey,
      });
      if (error) throw error;
      return ((data ?? []) as MhdComplianceReadiness[])[0] ?? null;
    },
  });
}
