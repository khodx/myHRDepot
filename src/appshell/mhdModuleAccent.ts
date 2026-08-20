/**
 * Route → category-theme mapping (myHRDepot Category Theme Specification, FINAL).
 *
 * Exactly six category themes exist; a module never owns a seventh color.
 * Every child, detail, edit, tab, drawer, modal, and alias route inherits the
 * category of its parent navigation entry via exact-or-descendant prefix
 * matching (longest prefix wins). This resolver is the single source of truth:
 * feature components must never guess a theme from pathname fragments.
 *
 * The returned key must match a `[data-mhd-theme='…']` block in global.css.
 */
export type MhdCategoryTheme =
  'dashboard' | 'people-org' | 'time-leave' | 'talent' | 'employee-relations' | 'work-tools';

/** All six theme keys — kept in sync with the CSS blocks by a completeness test. */
export const MHD_CATEGORY_THEMES: readonly MhdCategoryTheme[] = [
  'dashboard',
  'people-org',
  'time-leave',
  'talent',
  'employee-relations',
  'work-tools',
];

const MHD_CATEGORY_PREFIX_ENTRIES = [
  ['/dashboard', 'dashboard'],
  ['/people', 'people-org'],
  ['/employees', 'people-org'],
  ['/companies', 'people-org'],
  ['/jobs', 'people-org'],
  ['/my-job', 'people-org'],
  ['/schedule', 'time-leave'],
  ['/attendance', 'time-leave'],
  ['/leaves', 'time-leave'],
  ['/accommodations', 'time-leave'],
  ['/mileage', 'time-leave'],
  ['/performance', 'talent'], // includes /performance/invitations
  ['/recruiting', 'talent'], // includes /recruiting/eeo
  ['/training', 'talent'],
  ['/my-training', 'talent'],
  ['/checklists', 'talent'],
  ['/my-checklists', 'talent'],
  ['/handbooks', 'talent'],
  ['/my-handbooks', 'talent'],
  ['/policies', 'talent'],
  ['/my-policies', 'talent'],
  ['/memorandums', 'work-tools'],
  ['/my-memorandums', 'work-tools'],
  ['/conduct', 'employee-relations'],
  ['/investigations', 'employee-relations'],
  ['/offboarding', 'employee-relations'],
  ['/audit-reports', 'employee-relations'],
  ['/tasks', 'work-tools'],
  ['/activities', 'work-tools'],
  ['/calendar', 'work-tools'],
  ['/forms', 'work-tools'],
  ['/approvals', 'work-tools'],
  ['/property', 'work-tools'],
  ['/esignature', 'work-tools'],
  ['/communications', 'work-tools'],
  ['/automations', 'work-tools'],
  ['/admin', 'work-tools'],
  ['/lab', 'work-tools'],
  ['/payroll', 'work-tools'], // non-nav compatibility route
] as const satisfies ReadonlyArray<readonly [string, MhdCategoryTheme]>;

/* Longest prefix wins, so a longer specific path can never be shadowed by a
   shorter parent listed earlier. */
const MHD_CATEGORY_BY_PREFIX: ReadonlyArray<readonly [string, MhdCategoryTheme]> = [
  ...MHD_CATEGORY_PREFIX_ENTRIES,
].sort(([a], [b]) => b.length - a.length);

/**
 * Category theme for a pathname, or undefined outside any mapped HR route
 * (the neutral :root fallback tokens then apply).
 */
export function mhdCategoryThemeForPath(pathname: string): MhdCategoryTheme | undefined {
  return MHD_CATEGORY_BY_PREFIX.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )?.[1];
}
