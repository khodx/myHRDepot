// Matches the schema per ACR-002. `public.users` has no `auth_user_id` or
// `is_active` column — the auth bridge is `users.id === auth.uid()` directly.
// There is no `public.mhd_current_user_profile` view, so the profile shape
// below is composed client-side (see Service.ts: mhdLoadCurrentUserProfile)
// from public.users + public.companies + public.people + the
// mhd_current_user_roles() RPC, not read from a single view row.

// 14-name vocabulary (migration 0197). 'Client User' was retired and
// replaced by 'Employee' — existing assignments were migrated, not left
// dangling. Seniority tiers (used throughout mhdRouteAccess.ts's derived
// role arrays): Platform Admin > {Executive Leadership, Director, Client
// Admin} > HR Partner (external/consultant, cross-company) >
// {HR Admin > HR Specialist > HR Coordinator} > {Manager > Supervisor >
// Lead} > Employee > 3rd Party (scoped per-record grants only, never part
// of tiered inheritance) > Viewer.
export type MhdAuthRoleName =
  | 'Platform Admin'
  | 'Executive Leadership'
  | 'Director'
  | 'HR Partner'
  | 'HR Admin'
  | 'HR Specialist'
  | 'HR Coordinator'
  | 'Client Admin'
  | 'Manager'
  | 'Supervisor'
  | 'Lead'
  | 'Employee'
  | '3rd Party'
  | 'Viewer';

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
  /** people.preferred_name — the name a person goes by, distinct from the
   *  legal firstName. Null when the person hasn't set one (display name and
   *  greetings should fall back to firstName in that case). */
  preferredName: string | null;
  /** people.photo_path — an object path (not a URL) in the private
   *  person-photos Storage bucket, or null. Resolve with
   *  useMhdPersonPhotoUrl (people feature's Hook.ts), never render directly. */
  photoPath: string | null;
  /** From the mhd_current_user_roles() RPC. Does not include an implicit
   *  "Platform Admin" role for every is_admin=true user beyond what that
   *  function itself returns — see Database.sql for the exact semantics.
   *  While impersonating, this (and every other field above except
   *  `realIsAdmin`) reflects the IMPERSONATED identity, not the real one —
   *  that's what makes route access / RLS actually behave like that role. */
  roleNames: MhdAuthRoleName[];
  /** users.is_admin for the REAL signed-in account, never overridden by an
   *  active impersonation session. Use this (not `isAdmin`) to decide
   *  whether to show impersonation controls themselves — otherwise a
   *  Platform Admin impersonating a lower role would lose the ability to
   *  see the "View As" menu / exit banner while using it. */
  realIsAdmin: boolean;
  /** REAL role assignments for the signed-in account, never overridden by an
   *  active impersonation session (unlike `roleNames`). Use this alongside
   *  `realIsAdmin` to decide whether to show impersonation controls and
   *  which roles this account is actually permitted to impersonate — the
   *  server (mhd_start_impersonation) is still the real authority, this is
   *  only for deciding what the UI offers. */
  realRoleNames: MhdAuthRoleName[];
  impersonation: MhdImpersonationStatus;
}

/** Mirrors mhd_get_impersonation_status(). `role`/`companyId`/`companyName`/
 *  `startedAt`/`sessionId` are all null when `isImpersonating` is false. */
export interface MhdImpersonationStatus {
  isImpersonating: boolean;
  sessionId: string | null;
  role: MhdAuthRoleName | null;
  companyId: string | null;
  companyName: string | null;
  startedAt: string | null;
}

/** One row from mhd_list_companies_for_impersonation() — the company picker
 *  shown in the "View As" menu for company-scoped roles. */
export interface MhdImpersonationCompanyOption {
  id: string;
  companyName: string;
  referenceId: string;
  isPlatformOrg: boolean;
}

export interface MhdTotpEnrollment {
  factorId: string;
  qrCodeSvg: string;
  secret: string;
}

export interface MhdMfaFactor {
  id: string;
  status: 'verified' | 'unverified';
  friendlyName: string | null;
}

export interface MhdTrustedDevice {
  id: string;
  label: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
}

export interface MhdAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  /** The Supabase Auth user id (auth.uid()). This is also public.users.id —
   *  there is no separate auth_user_id column to distinguish them. */
  authUserId: string | null;
  profile: MhdCurrentUserProfile | null;
  /** The EFFECTIVE role set nav/route-access consume — already filtered by
   *  `actingAsRoles` (a pure client-side preference, see below) when one
   *  is set, and always falls back to the full `profile.roleNames` while
   *  impersonation is active (acting-as never applies during "View As" —
   *  the two mechanisms are deliberately kept from combining). This is
   *  purely a UI/UX narrowing: the server always independently re-derives
   *  real permissions from auth.uid() on every RPC, so this can never
   *  under- or over-privilege an actual write — see `setActingAsRoles`. */
  roles: MhdAuthRoleName[];
  /** The user's own chosen subset of `profile.realRoleNames` to act as
   *  right now (e.g. an HR Admin choosing to act as just "Employee" for
   *  self-service), or null when no filter is applied (full role set
   *  active). Persisted client-side only (localStorage, keyed per user) —
   *  never sent to or trusted by the server. Ignored while impersonating. */
  actingAsRoles: MhdAuthRoleName[] | null;
}

export interface MhdLoginInput {
  email: string;
  password: string;
}

export interface MhdForgotPasswordInput {
  email: string;
}

export interface MhdMagicLinkInput {
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
}
