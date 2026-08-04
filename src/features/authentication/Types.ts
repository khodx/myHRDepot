// Matches the schema per ACR-002. `public.users` has no `auth_user_id` or
// `is_active` column — the auth bridge is `users.id === auth.uid()` directly.
// There is no `public.mhd_current_user_profile` view, so the profile shape
// below is composed client-side (see Service.ts: mhdLoadCurrentUserProfile)
// from public.users + public.companies + public.people + the
// mhd_current_user_roles() RPC, not read from a single view row.

export type MhdAuthRoleName =
  'Platform Admin' | 'HR Partner' | 'Client Admin' | 'Client User' | 'Viewer';

export interface MhdCurrentUserProfile {
  userId: string;
  email: string;
  companyId: string;
  companyName: string | null;
  /** companies.is_platform_org for this user's own company — true for a
   *  user belonging to the platform's own operating org (e.g. "SimplyHR"),
   *  who may act across every tenant. Not the same as isAdmin, which is a
   *  per-company "this user is that company's admin" flag (see Database.sql
   *  notes on mhd_user_has_role's is_admin bypass semantics). */
  companyIsPlatformOrg: boolean;
  isAdmin: boolean;
  personId: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  /** From the mhd_current_user_roles() RPC. Does not include an implicit
   *  "Platform Admin" role for every is_admin=true user beyond what that
   *  function itself returns — see Database.sql for the exact semantics. */
  roleNames: MhdAuthRoleName[];
}

export interface MhdAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  /** The Supabase Auth user id (auth.uid()). This is also public.users.id —
   *  there is no separate auth_user_id column to distinguish them. */
  authUserId: string | null;
  profile: MhdCurrentUserProfile | null;
  roles: MhdAuthRoleName[];
}

export interface MhdLoginInput {
  email: string;
  password: string;
}

export interface MhdForgotPasswordInput {
  email: string;
}

export interface MhdResetPasswordInput {
  password: string;
  confirmPassword: string;
}

// The self-service "complete your profile" step for a user invited with no
// linked person (users.person_id null) — see mhd_self_complete_profile.
// No email field: the primary email contact method is seeded server-side
// from the caller's own login email, not retyped here.
export interface MhdCompleteProfileInput {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  phone: string;
  mobile: string;
}
