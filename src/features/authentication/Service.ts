import type { Session, User } from '@supabase/supabase-js';
import { appConfig } from '@/config/appConfig';
import { supabaseClient as mhdSupabase } from '@/lib/supabase/supabaseClient';
import type {
  MhdAuthRoleName,
  MhdCompleteProfileInput,
  MhdCurrentUserProfile,
  MhdForgotPasswordInput,
  MhdLoginInput,
  MhdResetPasswordInput,
} from './Types';

export interface MhdAuthSessionResult {
  session: Session | null;
  user: User | null;
}

export async function mhdGetCurrentAuthSession(): Promise<MhdAuthSessionResult> {
  const { data, error } = await mhdSupabase.auth.getSession();
  if (error) throw error;
  return {
    session: data.session,
    user: data.session?.user ?? null,
  };
}

export async function mhdSignInWithPassword(input: MhdLoginInput): Promise<MhdAuthSessionResult> {
  const { data, error } = await mhdSupabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) throw error;

  return {
    session: data.session,
    user: data.user,
  };
}

export async function mhdSignOut(): Promise<void> {
  const { error } = await mhdSupabase.auth.signOut();
  if (error) throw error;
}

export async function mhdSendPasswordReset(input: MhdForgotPasswordInput): Promise<void> {
  const redirectTo = `${appConfig.appUrl.replace(/\/$/, '')}/reset-password`;
  const { error } = await mhdSupabase.auth.resetPasswordForEmail(input.email, { redirectTo });
  if (error) throw error;
}

export async function mhdUpdatePassword(input: MhdResetPasswordInput): Promise<void> {
  const { error } = await mhdSupabase.auth.updateUser({ password: input.password });
  if (error) throw error;
}

/**
 * Loads the full identity context for the signed-in user.
 *
 * There is no `public.mhd_current_user_profile` view (see ACR-002 and this
 * module's Database.sql). The auth bridge is `public.users.id === auth.uid()`
 * directly — there is no `auth_user_id` column to join on. This function
 * composes the profile from a direct query plus the
 * `mhd_current_user_roles()` RPC, and requires the caller's auth user id
 * (typically `session.user.id`) since there is no view already scoped to
 * `auth.uid()`.
 */
export async function mhdLoadCurrentUserProfile(
  authUserId: string,
): Promise<MhdCurrentUserProfile | null> {
  const { data: userRow, error: userError } = await mhdSupabase
    .from('users')
    .select(
      `
      id,
      email,
      company_id,
      is_admin,
      person_id,
      companies:company_id ( company_name, is_platform_org ),
      people:person_id ( first_name, last_name, display_name )
    `,
    )
    .eq('id', authUserId)
    .maybeSingle();

  if (userError) throw userError;
  if (!userRow) return null;

  const { data: roleNames, error: roleError } = await mhdSupabase.rpc('mhd_current_user_roles');
  if (roleError) throw roleError;

  return {
    userId: userRow.id,
    email: userRow.email,
    companyId: userRow.company_id,
    companyName: userRow.companies?.company_name ?? null,
    companyIsPlatformOrg: userRow.companies?.is_platform_org ?? false,
    isAdmin: userRow.is_admin ?? false,
    personId: userRow.person_id,
    displayName: userRow.people?.display_name ?? null,
    firstName: userRow.people?.first_name ?? null,
    lastName: userRow.people?.last_name ?? null,
    roleNames: (roleNames ?? []) as MhdAuthRoleName[],
  };
}

/**
 * Self-service "complete your profile" step (mhd_self_complete_profile) for
 * a user invited with no linked person. Throws if the account is already
 * linked — the RPC only allows this once. Caller must call refreshProfile()
 * (useMhdAuth) afterward so profile.personId picks up the new link; this
 * function only performs the write.
 */
export async function mhdCompleteOwnProfile(input: MhdCompleteProfileInput): Promise<void> {
  const { error } = await mhdSupabase.rpc('mhd_self_complete_profile', {
    p_first_name: input.firstName.trim(),
    p_last_name: input.lastName.trim(),
    p_middle_name: input.middleName.trim().length > 0 ? input.middleName.trim() : undefined,
    p_preferred_name:
      input.preferredName.trim().length > 0 ? input.preferredName.trim() : undefined,
    p_phone: input.phone.trim().length > 0 ? input.phone.trim() : undefined,
    p_mobile: input.mobile.trim().length > 0 ? input.mobile.trim() : undefined,
  });

  if (error) {
    throw new Error(`Unable to complete profile: ${error.message}`);
  }
}
