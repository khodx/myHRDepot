import { supabaseClient } from '@/lib/supabase/supabaseClient';

export interface MhdRole {
  id: string;
  companyId: string | null;
  roleName: string;
  description: string | null;
  createdAt: string;
}

type MhdRoleRow = {
  id: string;
  company_id: string | null;
  role_name: string;
  description: string | null;
  created_at: string;
};

function mapRoleRow(row: MhdRoleRow): MhdRole {
  return {
    id: row.id,
    companyId: row.company_id,
    roleName: row.role_name,
    description: row.description,
    createdAt: row.created_at,
  };
}

export const mhdRoleService = {
  async listRoles(companyId: string | null = null): Promise<MhdRole[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_roles', {
      p_company_id: companyId ?? undefined,
    });

    if (error) {
      throw new Error(`Unable to load roles: ${error.message}`);
    }

    return (data ?? []).map(mapRoleRow);
  },
};
