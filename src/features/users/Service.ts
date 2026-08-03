import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdInvitePlatformUserInput,
  MhdPlatformUser,
  MhdPlatformUserMutationContext,
  MhdUpdatePlatformUserInput,
  MhdUsersListFilters,
} from './Types';

type MhdPlatformUserRow = {
  id: string;
  email: string;
  company_id: string;
  is_admin: boolean | null;
  person_id: string | null;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
  deactivated_by: string | null;
  companies: { company_name: string } | null;
  people: { display_name: string } | null;
};

type MhdUserFunctionResponse =
  | { success: true; user: MhdPlatformUserRow }
  | { success: false; error: string };

const USER_SELECT = `
  id,
  email,
  company_id,
  is_admin,
  person_id,
  created_at,
  updated_at,
  deactivated_at,
  deactivated_by,
  companies:company_id ( company_name ),
  people:person_id ( display_name )
`;

function mapUserRow(row: MhdPlatformUserRow): MhdPlatformUser {
  return {
    id: row.id,
    email: row.email,
    companyId: row.company_id,
    companyName: row.companies?.company_name ?? null,
    isAdmin: row.is_admin ?? false,
    personId: row.person_id,
    personDisplayName: row.people?.display_name ?? null,
    deactivatedAt: row.deactivated_at,
    deactivatedBy: row.deactivated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserFunctionResponse(
  data: MhdUserFunctionResponse | null,
  sdkError: { message: string } | null,
  actionLabel: string,
): MhdPlatformUser {
  if (sdkError) {
    throw new Error(`Unable to ${actionLabel}: ${sdkError.message}`);
  }

  if (!data) {
    throw new Error(`Unable to ${actionLabel}: no response returned.`);
  }

  if (!data.success) {
    throw new Error(`Unable to ${actionLabel}: ${data.error}`);
  }

  return mapUserRow(data.user);
}

export const mhdPlatformUserService = {
  async listUsers(filters: MhdUsersListFilters): Promise<MhdPlatformUser[]> {
    let query = supabaseClient
      .from('users')
      .select(USER_SELECT)
      .order('email', { ascending: true });

    if (filters.companyId !== 'ALL') {
      query = query.eq('company_id', filters.companyId);
    }

    const searchTerm = filters.searchTerm.trim();
    if (searchTerm.length > 0) {
      const escaped = searchTerm.replaceAll('%', '').replaceAll('_', '');
      query = query.ilike('email', `%${escaped}%`);
    }

    const { data, error } = await query.returns<MhdPlatformUserRow[]>();

    if (error) {
      throw new Error(`Unable to load users: ${error.message}`);
    }

    return (data ?? []).map(mapUserRow);
  },

  async getUserById(userId: string): Promise<MhdPlatformUser> {
    const { data, error } = await supabaseClient
      .from('users')
      .select(USER_SELECT)
      .eq('id', userId)
      .single<MhdPlatformUserRow>();

    if (error) {
      throw new Error(`Unable to load user: ${error.message}`);
    }

    return mapUserRow(data);
  },

  // `_context` is threaded through for symmetry with the rest of the app's
  // mutation calls (see mhdPersonService/mhdCompanyService) even though
  // `users` carries no created_by/updated_by columns to stamp — kept so a
  // future audit-event insert here doesn't require an API change.
  async updateUser(
    userId: string,
    input: MhdUpdatePlatformUserInput,
    _context: MhdPlatformUserMutationContext,
  ): Promise<MhdPlatformUser> {
    const { data, error } = await supabaseClient
      .from('users')
      .update({
        company_id: input.companyId,
        person_id: input.personId,
        is_admin: input.isAdmin,
      })
      .eq('id', userId)
      .select(USER_SELECT)
      .single<MhdPlatformUserRow>();

    if (error) {
      throw new Error(`Unable to update user: ${error.message}`);
    }

    return mapUserRow(data);
  },

  // Removes the `public.users` row only. It does NOT delete the underlying
  // Supabase Auth account (no Auth Admin API is wired up client-side), so a
  // deleted user's login credentials remain valid even though they lose
  // their company/person link and every RLS grant that depends on it.
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabaseClient.from('users').delete().eq('id', userId);

    if (error) {
      throw new Error(`Unable to delete user: ${error.message}`);
    }
  },

  async deactivateUser(userId: string): Promise<MhdPlatformUser> {
    const { data, error } = await supabaseClient.functions.invoke<MhdUserFunctionResponse>(
      'deactivate-user',
      { body: { userId, action: 'deactivate' } },
    );

    return mapUserFunctionResponse(data, error, 'deactivate user');
  },

  async reactivateUser(userId: string): Promise<MhdPlatformUser> {
    const { data, error } = await supabaseClient.functions.invoke<MhdUserFunctionResponse>(
      'deactivate-user',
      { body: { userId, action: 'reactivate' } },
    );

    return mapUserFunctionResponse(data, error, 'reactivate user');
  },

  async inviteUser(input: MhdInvitePlatformUserInput): Promise<MhdPlatformUser> {
    const { data, error } = await supabaseClient.functions.invoke<MhdUserFunctionResponse>(
      'invite-user',
      {
        body: {
          email: input.email.trim(),
          companyId: input.companyId,
          personId: input.personId,
          isAdmin: input.isAdmin,
        },
      },
    );

    return mapUserFunctionResponse(data, error, 'invite user');
  },
};
