/**
 * Route → module-accent mapping (MHD Design System §4).
 *
 * Each module owns exactly one accent color and every child page inherits it,
 * so the mapping works on path prefixes with longest-prefix-wins. The two
 * routes that live under another module's path but ARE their own nav module
 * (/performance/invitations = Feedback Requests) or deliberately inherit the
 * parent (/recruiting/eeo) fall out of the same rule: list the longer prefix
 * only when its module differs from the parent's.
 *
 * The returned token must match a `[data-module='…']` block in global.css.
 */
const MHD_MODULE_BY_PREFIX: ReadonlyArray<readonly [prefix: string, module: string]> = [
  ['/performance/invitations', 'feedback'],
  ['/dashboard', 'dashboard'],
  ['/people', 'people'],
  ['/companies', 'companies'],
  ['/jobs', 'jobs'],
  ['/my-job', 'jobs'],
  ['/schedule', 'schedule'],
  ['/attendance', 'attendance'],
  ['/leaves', 'leaves'],
  ['/mileage', 'mileage'],
  ['/performance', 'performance'],
  ['/recruiting', 'recruiting'], // includes /recruiting/eeo
  ['/training', 'training'],
  ['/my-training', 'training'],
  ['/handbooks', 'handbooks'],
  ['/my-handbooks', 'handbooks'],
  ['/conduct', 'conduct'],
  ['/investigations', 'investigations'],
  ['/offboarding', 'offboarding'],
  ['/tasks', 'tasks'],
  ['/activities', 'activities'],
  ['/forms', 'forms'],
  ['/approvals', 'approvals'],
  ['/property', 'property'],
  ['/esignature', 'esignature'],
  ['/payroll', 'payroll'],
];

/** Module token for a pathname, or undefined outside any module (fallback accent applies). */
export function mhdModuleForPath(pathname: string): string | undefined {
  return MHD_MODULE_BY_PREFIX.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )?.[1];
}
