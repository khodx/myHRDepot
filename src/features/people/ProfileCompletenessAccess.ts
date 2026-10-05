import type { MhdAuthRoleName } from '@/features/authentication/Types';

/** Page size of the Incomplete Profiles worklist (server-side limit/offset). */
export const MHD_INCOMPLETE_PROFILES_PAGE_SIZE = 50;

/**
 * Roles allowed to use the profile-completeness worklist and requirement rules.
 * Mirrors the server gate in migration 0378 (HR administrators and Client
 * Admin); the RPCs remain the authority.
 */
const PROFILE_COMPLETENESS_ADMIN_ROLES: ReadonlyArray<MhdAuthRoleName> = [
  'Platform Admin',
  'HR Partner',
  'HR Admin',
  'Client Admin',
];

export function mhdCanManageProfileCompleteness(roles: ReadonlyArray<MhdAuthRoleName>): boolean {
  return roles.some((role) => PROFILE_COMPLETENESS_ADMIN_ROLES.includes(role));
}

/** "FORMER_EMPLOYEE" -> "Former Employee". Relationship states are enum-style keys. */
export function mhdFormatRelationshipState(state: string): string {
  return state
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
