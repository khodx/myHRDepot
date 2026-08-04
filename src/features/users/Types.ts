// Matches the `public.users` schema (see ACR-002 / this module's Database.sql
// notes). `users.id` IS the Supabase Auth user id (auth.uid()) — there is no
// separate `auth_user_id` column. Deactivation is tracked with nullable
// `deactivated_at` / `deactivated_by` fields. RLS scopes
// SELECT to `mhd_can_access_company(company_id)` (own company, or any company
// when `is_admin = true`); INSERT/UPDATE/DELETE additionally require the
// caller to hold 'Client Admin' (or be an admin, which implicitly holds every
// role) via `mhd_user_has_role`.
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdCompanyId } from '@/features/companies/Types';
import type { MhdPersonId } from '@/features/people/Types';

export type MhdPlatformUserId = string;

export interface MhdPlatformUser {
  id: MhdPlatformUserId;
  email: string;
  companyId: MhdCompanyId;
  companyName: string | null;
  isAdmin: boolean;
  personId: MhdPersonId | null;
  personDisplayName: string | null;
  deactivatedAt: string | null;
  deactivatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MhdUsersListFilters {
  companyId: MhdCompanyId | 'ALL';
  searchTerm: string;
}

// `email` is intentionally absent — the auth identity's email is not editable
// from here (it lives on the Supabase Auth user, not just `public.users`).
export interface MhdUpdatePlatformUserInput {
  companyId: MhdCompanyId;
  personId: MhdPersonId | null;
  isAdmin: boolean;
}

export interface MhdInvitePlatformUserInput {
  email: string;
  companyId: MhdCompanyId;
  personId: MhdPersonId | null;
  isAdmin: boolean;
  /** Initial role assignment (user_role_assignments), granted by the
   *  invite-user Edge Function against the matching GLOBAL role row.
   *  Assigning 'Platform Admin' is further restricted server-side to a
   *  caller who is themselves is_admin. Null = no role granted (the invited
   *  account has none until an admin assigns one). */
  roleName: MhdAuthRoleName | null;
}

export interface MhdPlatformUserMutationContext {
  actorUserId: string;
}
