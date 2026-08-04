import { supabaseClient as mhdSupabase } from '@/lib/supabase/supabaseClient';
import type { MhdComplianceReleaseBlocker, MhdImpersonationSessionRecord } from './Types';

/** mhd_compliance_release_blockers() — every row is content NOT yet cleared
 *  for production; an empty result means the gate is fully clear. */
export async function mhdGetComplianceReleaseBlockers(): Promise<MhdComplianceReleaseBlocker[]> {
  const { data, error } = await mhdSupabase.rpc('mhd_compliance_release_blockers');
  if (error) throw new Error(`Unable to load compliance status: ${error.message}`);

  return (data ?? []).map((row) => ({
    moduleKey: row.module_key,
    contentKey: row.content_key,
    version: row.version,
    reviewStatus: row.review_status,
    productionEnabled: row.production_enabled,
    blocker: row.blocker,
  }));
}

/** mhd_list_impersonation_sessions() — real Platform Admin only, enforced
 *  server-side. */
export async function mhdListImpersonationSessions(
  limit = 50,
): Promise<MhdImpersonationSessionRecord[]> {
  const { data, error } = await mhdSupabase.rpc('mhd_list_impersonation_sessions', {
    p_limit: limit,
  });
  if (error) throw new Error(`Unable to load impersonation history: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    adminUserId: row.admin_user_id,
    adminDisplayName: row.admin_display_name,
    impersonatedRole: row.impersonated_role,
    impersonatedCompanyId: row.impersonated_company_id,
    impersonatedCompanyName: row.impersonated_company_name,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  }));
}
