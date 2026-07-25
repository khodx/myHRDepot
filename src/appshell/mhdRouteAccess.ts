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
  {
    path: '/activities',
    roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'],
  },
  {
    path: '/forms',
    roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'],
  },
  {
    path: '/property',
    roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'],
  },
  {
    path: '/esignature',
    roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'],
  },
  {
    path: '/communications',
    roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User', 'Viewer'],
  },
  { path: '/automations', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  // Performance. The specific /performance/* sub-routes precede the general
  // /performance rule because mhdCanAccessRoute returns the FIRST matching rule
  // via prefix match, so /performance would otherwise capture them all (the same
  // ordering discipline as /attendance/policy before /attendance).
  // /performance/templates and /performance/settings are privileged config
  // (no Client User). /performance/invitations is the rater-facing surface — any
  // employee who can be asked for feedback reaches it, so it carries the same
  // audience as /performance. The review and coaching detail sub-routes
  // (/performance/reviews/:id, /performance/coaching/:id) deliberately inherit
  // the general /performance rule below.
  { path: '/performance/templates', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  { path: '/performance/settings', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  {
    path: '/performance/invitations',
    roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'],
  },
  { path: '/performance', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  { path: '/offboarding', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  // Conduct — the strictest module. Corrective-action cases carry RESTRICTED-tier
  // discipline narratives, so only Platform Admin / HR Partner / Client Admin
  // reach /conduct and /conduct/:caseId (the latter inherits this rule via the
  // prefix match). There is deliberately NO subject-facing Conduct route: the
  // subject employee reaches their issued corrective-action document only through
  // the E-Signature signing link, never a /conduct page. Client User and Viewer
  // are both excluded.
  { path: '/conduct', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  // Time & Attendance. /schedule and /attendance are the platform's first
  // employee-facing surfaces — Client User reaches them for their own record;
  // Viewer is excluded. /attendance/policy is privileged-only, so it must
  // precede /attendance here: mhdCanAccessRoute returns the first matching rule
  // and /attendance/policy would otherwise inherit the broader /attendance rule
  // via the prefix match.
  { path: '/schedule', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  { path: '/attendance/policy', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  { path: '/attendance', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  // Employee Files. Initial route is PA/HRP only because the existing
  // attachment engine is company-scoped, not file-type scoped. Medical,
  // confidential, and private employee file cabinets must not be exposed to
  // Client Admin until a backend per-file-type policy layer exists.
  { path: '/employees', roles: ['Platform Admin', 'HR Partner'] },
  { path: '/people', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  { path: '/companies', roles: ['Platform Admin', 'HR Partner'] },
  { path: '/approvals', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  // Job Descriptions. /jobs (and its sub-routes /jobs/:jobId, /jobs/competencies)
  // are the privileged Organization surface — Platform Admin / HR Partner /
  // Client Admin. /my-job is the employee's OWN published description and admits
  // Client User only; it is a SEPARATE route, never a filtered /jobs, so a bug in
  // the privileged list can never become a disclosure. Viewer is excluded from
  // both. Pay is masked server-side in the RPC (null to anyone who is not
  // Platform Admin / HR Partner, Client Admin included) — see MHD_JOB_PAY_ROLES.
  { path: '/jobs', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  { path: '/my-job', roles: ['Client User'] },
  // Mileage & Reimbursement. A single tabbed route: Platform Admin / HR Partner /
  // Client Admin see the whole company plus the rate registry and company-rate
  // tabs; a Client User reaches /mileage for their OWN trips and claims only
  // (the RPCs refuse anybody else's rows), and the registry/policy tabs never
  // render for them. Viewer is excluded entirely. The rate registry is global
  // and writable only by Platform Admin (mhdCanManageMileageRates) — enforced
  // server-side; the helper only decides whether to render the write affordance.
  { path: '/mileage', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  // Leaves of Absence. /leaves (and /leaves/:caseId via the guard's prefix match)
  // admits the privileged set plus Client User — the subject reaches their OWN
  // cases (the RPCs scope reads by mhd_can_view_leave_person, so a Client User
  // never sees another person's case). Viewer is excluded entirely. The
  // medical-certification partition is narrower still: mhd_leave_cert_list masks
  // provider_note / drive_file_id to null below Platform Admin / HR Partner
  // (Client Admin included) — see MHD_LEAVES_MEDICAL_ROLES.
  { path: '/leaves', roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'] },
  // Investigations — the strictest access model in the platform. Route access
  // does NOT grant case visibility: reaching /investigations (and
  // /investigations/:caseId via the guard's prefix match) only lets a user
  // NAVIGATE to the module; what they can actually SEE is decided entirely by
  // per-case grants server-side (the list RPC is grant-filtered, `get` denies an
  // ungranted caller with an identical non-disclosing error). The route is
  // restricted to Platform Admin / HR Partner / Client Admin so those roles can
  // reach the board — but an ungranted admin sees an empty list and can open
  // nothing. Client User and Viewer are excluded from the route entirely; there
  // is deliberately NO subject-facing Investigations route. The sidebar entry is
  // gated separately, on the grant-filtered list returning ≥1 row (never on a
  // role) — see MhdSidebar.
  { path: '/investigations', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  // Training & Development. Two separate routes, never one filtered surface.
  // /training is the admin catalog + company compliance board — Platform Admin /
  // HR Partner / Client Admin. /my-training is the employee's OWN assignments and
  // completion history and admits Client User only (the same one-route-per-audience
  // discipline as /jobs vs /my-job). Viewer is excluded from BOTH. /my-training is
  // listed first, and is a distinct prefix from /training (it does not start with
  // "/training/"), so mhdCanAccessRoute's first-match prefix scan never lets the
  // /training rule capture /my-training. Both entries are ROLE-gated in the
  // sidebar's Employee Development group, independent of the data-gated
  // Investigations entry.
  { path: '/my-training', roles: ['Client User'] },
  { path: '/training', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  // Handbook Engine. Two SEPARATE routes, never one filtered surface — the same
  // one-route-per-audience discipline as /training vs /my-training. /handbooks is
  // the admin wizard + acknowledgment board (Platform Admin / HR Partner / Client
  // Admin); /handbooks/:handbookId inherits that rule via the guard's prefix
  // match. /my-handbooks is the employee's OWN acknowledgment surface (Client User
  // only). Viewer is excluded from BOTH; Client User is excluded from the admin
  // /handbooks. /my-handbooks is listed first and is a DISTINCT prefix from
  // /handbooks (it does not start with "/handbooks/"), so the first-match prefix
  // scan never lets the /handbooks rule capture /my-handbooks. Both entries are
  // ROLE-gated in the sidebar's Employee Development group, independent of the
  // data-gated Investigations entry and the Training entries.
  { path: '/my-handbooks', roles: ['Client User'] },
  { path: '/handbooks', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
  // Recruiting / ATS. Four surfaces, gated at three different widths — the more
  // specific rules MUST precede the general /recruiting rule because
  // mhdCanAccessRoute returns the FIRST matching rule via prefix match (the same
  // ordering discipline as /attendance/policy before /attendance).
  //
  // - /recruiting/eeo is the aggregate EEO report and is Platform Admin ONLY. The
  //   EEO self-identification partition is readable by NO one row-wise (RLS
  //   using(false)); this aggregate report is the SOLE read path, so it is the
  //   most tightly gated route in the module. No recruiter/HM/interviewer surface
  //   ever renders EEO — the public /apply page collects it write-only.
  // - /recruiting/interviews/:interviewId is the interviewer worksheet. An
  //   assigned interviewer may be ANY authenticated role, so the route is gated
  //   only to authenticated non-Viewer; the worksheet RPC gates the actual read
  //   on mhd_interview_can_access_interview (assigned interviewer OR recruiter),
  //   so a non-assigned caller who reaches the route simply loads nothing.
  // - /recruiting (and /recruiting/requisitions, /recruiting/applications,
  //   /recruiting/questions via the prefix match) is the admin + hiring-manager
  //   surface: Platform Admin / HR Partner / Client Admin. A hiring manager sees
  //   only their own requisitions (RLS). Viewer is excluded from every
  //   authenticated recruiting surface.
  { path: '/recruiting/eeo', roles: ['Platform Admin'] },
  {
    path: '/recruiting/interviews',
    roles: ['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'],
  },
  { path: '/recruiting', roles: ['Platform Admin', 'HR Partner', 'Client Admin'] },
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

export const MHD_PERFORMANCE_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
  'Client User',
];
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
 * Roles that may open, edit, issue, and resolve corrective actions — the same
 * privileged set that reaches the /conduct surface. Conduct is admin-only: there
 * is no subject-facing route, so this is both the "can reach" and the "can
 * mutate" set (Client User and Viewer are excluded from the module entirely).
 * The conduct RPCs re-check `mhd_conduct_is_privileged` server-side (42501 on a
 * non-privileged write); this helper only decides whether the mutating
 * affordances render.
 */
export const MHD_CONDUCT_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdCanMutateConduct(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_CONDUCT_MUTATING_ROLES.some((role) => userRoles.includes(role));
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
export const MHD_SENSITIVE_REVEAL_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdCanRevealEncryptedFields(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_SENSITIVE_REVEAL_ROLES.some((role) => userRoles.includes(role));
}

/**
 * Roles that may administer Job Descriptions — create and edit jobs, author and
 * publish description versions, maintain the competency library and assign
 * people to jobs. This is the same privileged set that renders the /jobs
 * surface; a Client User reaches only /my-job (their own published description,
 * read-only) and Viewer is excluded entirely. The RPCs enforce the same set
 * server-side (42501 on a non-privileged write).
 */
export const MHD_JOBS_MUTATING_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdCanMutateJobs(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_JOBS_MUTATING_ROLES.some((role) => userRoles.includes(role));
}

/**
 * Roles that may see job pay figures. Narrower than MHD_JOBS_MUTATING_ROLES:
 * Platform Admin and HR Partner only — Client Admin is deliberately excluded.
 * This mirrors the RPC's server-side masking (mhd_job_can_see_pay), which nulls
 * pay_min / pay_max / pay_period for anyone outside this set. The list only
 * decides how the pay field words itself ("Not available to your role" vs a
 * range); the data genuinely never reaches an unprivileged client.
 */
export const MHD_JOB_PAY_ROLES: MhdAuthRoleName[] = ['Platform Admin', 'HR Partner'];

export function mhdCanSeeJobPay(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_JOB_PAY_ROLES.some((role) => userRoles.includes(role));
}

/**
 * The privileged Mileage set — the roles that see the whole company's trips and
 * claims, the rate registry, the company-rate policy tabs, and the claim
 * decision controls. A Client User falls outside this set and sees only their
 * own trips and claims (the RPCs enforce that scope with a 42501 on anybody
 * else's rows); Viewer is excluded from /mileage entirely. Mirrors the
 * privileged set used across the employee-facing modules.
 */
export const MHD_MILEAGE_PRIVILEGED_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdMileageIsPrivileged(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_MILEAGE_PRIVILEGED_ROLES.some((role) => userRoles.includes(role));
}

/**
 * Narrower than the privileged set: only Platform Admin may write the IRS rate
 * registry. The registry is GLOBAL — one authoritative figure per date across
 * every tenant — so an HR Partner or Client Admin at one customer must not be
 * able to change a rate every other customer resolves against. The mutation
 * RPCs assert `mhd_user_has_role('Platform Admin')` server-side; this list only
 * decides whether the propose/confirm affordances render at all.
 */
export const MHD_MILEAGE_RATE_ADMIN_ROLES: MhdAuthRoleName[] = ['Platform Admin'];

export function mhdCanManageMileageRates(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_MILEAGE_RATE_ADMIN_ROLES.some((role) => userRoles.includes(role));
}

/**
 * The privileged Leaves set — Platform Admin / HR Partner / Client Admin. These
 * roles administer leave cases (open cases, edit the designation set, designate
 * hours, adjust a basis, transition status) and see the whole company's board. A
 * Client User falls outside this set and reaches /leaves for their OWN cases only
 * (the RPCs enforce that scope); Viewer is excluded from /leaves entirely. The
 * leave RPCs re-check `mhd_leaves_is_privileged` server-side; this helper only
 * decides whether the administrative affordances render.
 */
export const MHD_LEAVES_PRIVILEGED_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdLeavesIsPrivileged(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_LEAVES_PRIVILEGED_ROLES.some((role) => userRoles.includes(role));
}

/**
 * Roles that may see leave medical-certification content. Narrower than
 * MHD_LEAVES_PRIVILEGED_ROLES: Platform Admin and HR Partner ONLY — Client Admin
 * is deliberately excluded (29 CFR 825.500(g), the certification confidentiality
 * partition). This mirrors the RPC's server-side masking (mhd_leave_cert_list via
 * mhd_leaves_can_see_medical), which nulls provider_note / drive_file_id for
 * anyone outside this set — the medical content genuinely never reaches an
 * unprivileged client. The list only decides how the certification panel words
 * the null ("Restricted" vs a real note); it is not the enforcement.
 */
export const MHD_LEAVES_MEDICAL_ROLES: MhdAuthRoleName[] = ['Platform Admin', 'HR Partner'];

export function mhdLeavesCanSeeMedical(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_LEAVES_MEDICAL_ROLES.some((role) => userRoles.includes(role));
}

/**
 * Roles that may OPEN an investigation case — the privileged set that reaches the
 * /investigations route. This gates ONLY the "New investigation" affordance on
 * the board; it does NOT, and must not, widen case visibility, which is decided
 * entirely by per-case grants server-side (the list RPC is grant-filtered, so a
 * privileged admin with no grants still sees an empty board). The create RPC
 * re-checks the privileged set server-side; this helper only decides whether the
 * create button renders. There is deliberately no "can view" role helper — the
 * whole point of the module is that no role grants visibility.
 */
export const MHD_INVESTIGATIONS_OPEN_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdCanOpenInvestigation(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_INVESTIGATIONS_OPEN_ROLES.some((role) => userRoles.includes(role));
}

/**
 * The privileged Training set — Platform Admin / HR Partner / Client Admin. These
 * roles reach the admin `/training` surface, where they author and retire company
 * courses, assign training, and read the company compliance board. A Client User
 * falls outside this set and reaches only `/my-training` (their OWN assignments
 * and completions); Viewer is excluded from both routes. The training RPCs
 * re-check `mhd_training_is_privileged` server-side (and refuse a global course to
 * any tenant admin regardless); this helper only decides whether the
 * course-authoring / assign / retire affordances render — it maps to the
 * `canManage` prop on the catalog page.
 */
export const MHD_TRAINING_PRIVILEGED_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdTrainingIsPrivileged(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_TRAINING_PRIVILEGED_ROLES.some((role) => userRoles.includes(role));
}

/**
 * The privileged Handbook set — Platform Admin / HR Partner / Client Admin. These
 * roles reach the admin `/handbooks` surface, where they create draft handbooks,
 * toggle optional sections, publish frozen versions, and run the acknowledgment
 * board. A Client User falls outside this set and reaches only `/my-handbooks`
 * (their OWN acknowledgments); Viewer is excluded from both routes. The handbook
 * RPCs re-check `mhd_handbook_is_privileged` server-side (42501 on a
 * non-privileged write); this helper only decides whether the create / manage
 * affordances render — it maps to the `canManage` prop on the list page and wizard.
 */
export const MHD_HANDBOOK_PRIVILEGED_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdHandbookIsPrivileged(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_HANDBOOK_PRIVILEGED_ROLES.some((role) => userRoles.includes(role));
}

/**
 * The privileged Recruiting set — Platform Admin / HR Partner / Client Admin.
 * These roles reach the admin `/recruiting` surface: they create and manage
 * requisitions, invite applicants, build interview guides, schedule interviews,
 * finalize evaluations, and extend/accept offers. A hiring manager is one of
 * these roles and sees only their own requisitions (RLS); Viewer is excluded
 * entirely. Every recruiting RPC re-checks `mhd_recruiting_is_privileged`
 * server-side (42501 on a non-privileged write); this helper only decides whether
 * the managing affordances render — it maps to the `canManage` / `canFinalize`
 * props the package surfaces expose.
 */
export const MHD_RECRUITING_PRIVILEGED_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
];

export function mhdRecruitingIsPrivileged(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_RECRUITING_PRIVILEGED_ROLES.some((role) => userRoles.includes(role));
}

/**
 * Narrower than the privileged set: only Platform Admin may read the aggregate
 * EEO report. The `recruiting_eeo_self_identification` partition is readable by
 * NO one row-wise (RLS using(false)); `mhd_recruiting_eeo_report` is the sole
 * read path and is Platform-Admin-gated server-side, returning aggregate COUNTS
 * only (never an individual row). This helper only decides whether the report
 * page even attempts the call, so a non-admin sees the gate message rather than a
 * thrown error — the data genuinely never reaches a non-Platform-Admin client.
 */
export const MHD_RECRUITING_EEO_REPORT_ROLES: MhdAuthRoleName[] = ['Platform Admin'];

export function mhdCanReadEeoReport(userRoles: MhdAuthRoleName[]): boolean {
  return MHD_RECRUITING_EEO_REPORT_ROLES.some((role) => userRoles.includes(role));
}
