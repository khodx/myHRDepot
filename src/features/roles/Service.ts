import { supabaseClient } from '@/lib/supabase/supabaseClient';

export interface MhdRole {
  id: string;
  companyId: string | null;
  roleName: string;
  description: string | null;
  createdAt: string;
}

export interface MhdUserRoleAssignment {
  assignmentId: string;
  roleId: string;
  roleName: string;
  createdAt: string;
}

type MhdRoleRow = {
  id: string;
  company_id: string | null;
  role_name: string;
  description: string | null;
  created_at: string;
};

type MhdUserRoleAssignmentRow = {
  assignment_id: string;
  role_id: string;
  role_name: string;
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

function mapUserRoleAssignmentRow(row: MhdUserRoleAssignmentRow): MhdUserRoleAssignment {
  return {
    assignmentId: row.assignment_id,
    roleId: row.role_id,
    roleName: row.role_name,
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

  async listUserRoleAssignments(userId: string): Promise<MhdUserRoleAssignment[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_user_role_assignments', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Unable to load this user's roles: ${error.message}`);
    }

    return (data ?? []).map(mapUserRoleAssignmentRow);
  },

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_assign_user_role', {
      p_user_id: userId,
      p_role_id: roleId,
    });

    if (error) {
      throw new Error(`Unable to assign role: ${error.message}`);
    }
  },

  async revokeUserRole(userId: string, roleId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_revoke_user_role', {
      p_user_id: userId,
      p_role_id: roleId,
    });

    if (error) {
      throw new Error(`Unable to revoke role: ${error.message}`);
    }
  },
};
