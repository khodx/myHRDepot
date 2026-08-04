import type { Session, User } from '@supabase/supabase-js';
import { appConfig } from '@/config/appConfig';
import { supabaseClient as mhdSupabase } from '@/lib/supabase/supabaseClient';
import type {
  MhdAuthRoleName,
  MhdCompleteProfileInput,
  MhdCurrentUserProfile,
  MhdForgotPasswordInput,
  MhdImpersonationCompanyOption,
  MhdImpersonationStatus,
  MhdLoginInput,
  MhdMagicLinkInput,
  MhdMfaFactor,
  MhdResetPasswordInput,
  MhdTotpEnrollment,
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

// Supabase detects the session from the redirect URL client-side
// (detectSessionInUrl), and MhdAuthProvider's listener picks it up.
export async function mhdSignInWithMagicLink(input: MhdMagicLinkInput): Promise<void> {
  const emailRedirectTo = `${appConfig.appUrl.replace(/\/$/, '')}/`;
  const { error } = await mhdSupabase.auth.signInWithOtp({
    email: input.email,
    options: { emailRedirectTo },
  });
  if (error) throw error;
}

export async function mhdUpdatePassword(input: MhdResetPasswordInput): Promise<void> {
  const { error } = await mhdSupabase.auth.updateUser({ password: input.password });
  if (error) throw error;
}

export async function mhdEnrollTotpFactor(): Promise<MhdTotpEnrollment> {
  const { data, error } = await mhdSupabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error) throw error;
  if (!data?.id || !data.totp?.qr_code || !data.totp.secret) {
    throw new Error('Unable to enroll authenticator app.');
  }

  return {
    factorId: data.id,
    qrCodeSvg: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function mhdVerifyTotpFactor(factorId: string, code: string): Promise<void> {
  const { error } = await mhdSupabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) throw error;
}

export async function mhdListMfaFactors(): Promise<MhdMfaFactor[]> {
  const { data, error } = await mhdSupabase.auth.mfa.listFactors();
  if (error) throw error;

  return (data?.totp ?? []).map((factor) => ({
    id: factor.id,
    status: factor.status,
    friendlyName: factor.friendly_name ?? null,
  }));
}

export async function mhdUnenrollMfaFactor(factorId: string): Promise<void> {
  const { error } = await mhdSupabase.auth.mfa.unenroll({ factorId });
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

  const [{ data: roleNames, error: roleError }, impersonation] = await Promise.all([
    mhdSupabase.rpc('mhd_current_user_roles'),
    mhdGetImpersonationStatus(),
  ]);
  if (roleError) throw roleError;

  // While impersonating, present the impersonated identity everywhere a
  // component reads `profile.*` for role/company/admin gating — that's what
  // makes "View As" a real functional test rather than a cosmetic label.
  // realIsAdmin is the one field deliberately never overridden (see Types.ts).
  const effectiveCompanyId = impersonation.isImpersonating
    ? (impersonation.companyId ?? userRow.company_id)
    : userRow.company_id;
  const effectiveCompanyName = impersonation.isImpersonating
    ? (impersonation.companyName ?? userRow.companies?.company_name ?? null)
    : (userRow.companies?.company_name ?? null);
  const effectiveIsAdmin = impersonation.isImpersonating
    ? impersonation.role === 'Platform Admin'
    : (userRow.is_admin ?? false);
  const effectiveCompanyIsPlatformOrg = impersonation.isImpersonating
    ? impersonation.role === 'Platform Admin'
    : (userRow.companies?.is_platform_org ?? false);

  return {
    userId: userRow.id,
    email: userRow.email,
    companyId: effectiveCompanyId,
    companyName: effectiveCompanyName,
    companyIsPlatformOrg: effectiveCompanyIsPlatformOrg,
    isAdmin: effectiveIsAdmin,
    personId: userRow.person_id,
    displayName: userRow.people?.display_name ?? null,
    firstName: userRow.people?.first_name ?? null,
    lastName: userRow.people?.last_name ?? null,
    roleNames: (roleNames ?? []) as MhdAuthRoleName[],
    realIsAdmin: userRow.is_admin ?? false,
    impersonation,
  };
}

const mhdEmptyImpersonationStatus: MhdImpersonationStatus = {
  isImpersonating: false,
  sessionId: null,
  role: null,
  companyId: null,
  companyName: null,
  startedAt: null,
};

/** Reads mhd_get_impersonation_status(). Always resolves — an unauthenticated
 *  or non-impersonating caller just gets the empty/false shape back. */
export async function mhdGetImpersonationStatus(): Promise<MhdImpersonationStatus> {
  const { data, error } = await mhdSupabase.rpc('mhd_get_impersonation_status');
  if (error) throw error;

  const row = data?.[0];
  if (!row || !row.is_impersonating) return mhdEmptyImpersonationStatus;

  return {
    isImpersonating: true,
    sessionId: row.session_id,
    role: row.impersonated_role as MhdAuthRoleName,
    companyId: row.impersonated_company_id,
    companyName: row.impersonated_company_name,
    startedAt: row.started_at,
  };
}

/**
 * Starts a "View As" session (Platform Admin only, enforced server-side by
 * mhd_start_impersonation). `companyId` is required for every role except
 * Platform Admin. Caller must call refreshProfile() (useMhdAuth) afterward —
 * this only performs the write, same convention as mhdCompleteOwnProfile.
 */
export async function mhdStartImpersonation(
  role: MhdAuthRoleName,
  companyId: string | null,
): Promise<void> {
  const { error } = await mhdSupabase.rpc('mhd_start_impersonation', {
    p_role: role,
    p_company_id: companyId ?? undefined,
  });
  if (error) throw new Error(`Unable to start impersonation: ${error.message}`);
}

/** Ends the caller's own active impersonation session, if any. */
export async function mhdEndImpersonation(): Promise<void> {
  const { error } = await mhdSupabase.rpc('mhd_end_impersonation');
  if (error) throw new Error(`Unable to end impersonation: ${error.message}`);
}

/** Company picker for the "View As" menu — real Platform Admins only,
 *  works regardless of any currently active impersonation session. */
export async function mhdListCompaniesForImpersonation(): Promise<
  MhdImpersonationCompanyOption[]
> {
  const { data, error } = await mhdSupabase.rpc('mhd_list_companies_for_impersonation');
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    companyName: row.company_name,
    referenceId: row.reference_id,
    isPlatformOrg: row.is_platform_org,
  }));
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
