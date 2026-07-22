import type { MhdAuthRoleName } from '@/features/authentication/Types';

export interface MhdRouteAccessRule {
  path: string;
  roles: MhdAuthRoleName[] | 'ALL';
}

/**
 * Single source of truth for which roles may reach which top-level app routes.
 * MhdSidebar reads this to decide which nav links to render, and
 * MhdRoleGuardedRoute reads it to enforce the same rule at the router level —
 * hiding a link is not access control, only the router guard is.
 */
export const MHD_ROUTE_ACCESS: MhdRouteAccessRule[] = [
  { path: '/dashboard', roles: 'ALL' },
  { path: '/tasks', roles: 'ALL' },
  { path: '/activities', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'] },
  { path: '/forms', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'] },
  { path: '/property', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'] },
  { path: '/esignature', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'] },
  { path: '/performance', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  { path: '/offboarding', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  // Time & Attendance. /schedule and /attendance are the platform's first
  // employee-facing surfaces — Client User reaches them for their own record;
  // Viewer is excluded. /attendance/policy is privileged-only, so it must
  // precede /attendance here: mhdCanAccessRoute returns the first matching rule
  // and /attendance/policy would otherwise inherit the broader /attendance rule
  // via the prefix match.
  { path: '/schedule', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  { path: '/attendance/policy', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  { path: '/attendance', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  { path: '/people', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  { path: '/companies', roles: ['Platform Admin', 'HR Partner'] },
  { path: '/approvals', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
];

export function mhdRouteRoles(path: string): MhdAuthRoleName[] | 'ALL' {
  const rule = MHD_ROUTE_ACCESS.find((r) => r.path === path);
  return rule ? rule.roles : 'ALL';
}

/**
 * Matches `path` against the longest applicable rule (exact match or a
 * `/parent/child` route under a guarded parent, e.g. `/companies/:companyId`
 * inherits the `/companies` rule) and checks it against `userRoles`.
 * Routes with no matching rule are treated as accessible to any
 * authenticated user — MhdProtectedRoute already gates authentication.
 */
export function mhdCanAccessRoute(path: string, userRoles: MhdAuthRoleName[]): boolean {
  const rule = MHD_ROUTE_ACCESS.find((r) => path === r.path || path.startsWith(`${r.path}/`));

  if (!rule || rule.roles === 'ALL') {
    return true;
  }

  return rule.roles.some((requiredRole) => userRoles.includes(requiredRole));
}

/**
 * Roles that may create, edit, publish, archive, or submit forms. 'Viewer' is
 * deliberately absent: Viewers can reach /forms routes (see MHD_ROUTE_ACCESS)
 * but every mutating affordance — New Form, builder editing, publish/archive,
 * draft save, and renderer submit — is gated on this list. Kept next to
 * MHD_ROUTE_ACCESS so route reachability and in-page capability stay in one
 * source of truth.
 */
export const MHD_FORMS_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
  'Client User',
];

export function mhdCanMutateForms(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_FORMS_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

export const MHD_PROPERTY_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdCanMutateProperty(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_PROPERTY_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

export const MHD_ESIGNATURE_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
  'Client User',
];

export function mhdCanMutateEsignature(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_ESIGNATURE_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

export const MHD_WORKFLOW_APPROVAL_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
  'Client User',
];

export function mhdCanMutateWorkflowApprovals(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_WORKFLOW_APPROVAL_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

export const MHD_ACTIVITY_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
  'Client User',
];

export function mhdCanMutateActivities(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_ACTIVITY_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

export const MHD_PERFORMANCE_MUTATING_ROLES: MhdAuthRoleName[] = ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'];
export function mhdCanMutatePerformance(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_PERFORMANCE_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

export const MHD_OFFBOARDING_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdCanMutateOffboarding(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_OFFBOARDING_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

/**
 * Roles that may mutate Time & Attendance — record/void occurrences, adjust
 * points, edit schedules, publish policy versions, and resolve threshold and
 * reassessment items. This is the same set that renders the privileged surface;
 * a Client User reaches /schedule and /attendance for their OWN record only
 * (read), and threshold/reassessment items are never exposed to them (the RPCs
 * refuse a non-privileged caller with 42501). Viewer is excluded entirely.
 */
export const MHD_ATTENDANCE_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdCanMutateAttendance(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_ATTENDANCE_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

/**
 * Roles that may reveal encrypted (field_encryption_required) submission
 * values. Mirrors the database-side gate in mhd_reveal_submission_field —
 * this list only controls whether the "Reveal" affordance renders; the RPC
 * enforces the same roles server-side and audits every reveal.
 */
export const MHD_SENSITIVE_REVEAL_ROLES: MhdAuthRoleName[] = ['Platform Admin', 'HR Partner', 'Client Admin'];

export function mhdCanRevealEncryptedFields(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_SENSITIVE_REVEAL_ROLES.some((role) => userRoles.includes(role));
}
