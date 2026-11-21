import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdLeavePolicy, MhdLeavePolicySetInput } from './WorkflowTypes';
import { mhdValidateLeavePolicySet } from './WorkflowValidation';

// The company's election of the 12-month leave-year method (migration 0381). Elections are
// append-only history; a change of method needs 60 days' notice, enforced by the database.

export const mhdLeavePolicyService = {
  async get(companyId: string, asOf?: string | null): Promise<MhdLeavePolicy> {
    const { data, error } = await supabaseClient.rpc('mhd_leave_policy_get', {
      p_company_id: companyId,
      p_as_of: asOf || undefined,
    });
    if (error) throw error;
    return data as unknown as MhdLeavePolicy;
  },

  async set(input: MhdLeavePolicySetInput): Promise<string> {
    const invalid = mhdValidateLeavePolicySet(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabaseClient.rpc('mhd_leave_policy_set', {
      p_company_id: input.companyId,
      p_year_method: input.yearMethod,
      p_anchor_month: input.anchorMonth ?? undefined,
      p_anchor_day: input.anchorDay ?? undefined,
      p_effective_from: input.effectiveFrom || undefined,
      p_limit_designated_person: input.limitDesignatedPerson ?? undefined,
      p_reason: input.reason?.trim() || undefined,
      p_rtw_certification_uniform: input.rtwCertificationUniform ?? undefined,
    });
    if (error) throw error;
    return data as string;
  },
};
