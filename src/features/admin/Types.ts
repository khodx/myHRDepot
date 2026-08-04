// Admin Settings feature — Platform Admin only (see mhdRouteAccess.ts '/admin').
// User & role management and Company management deliberately have NO types
// here: they reuse the existing /users and /companies features rather than
// duplicating those lists (see MhdAdminOverviewSection).

/** One row from mhd_compliance_release_blockers() — content not yet cleared
 *  for production per the pre-live counsel/compliance gate (Leaves v2 /
 *  Reasonable Accommodations, migrations 0051-0056). */
export interface MhdComplianceReleaseBlocker {
  moduleKey: string;
  contentKey: string;
  version: number;
  reviewStatus: string;
  productionEnabled: boolean;
  blocker: string | null;
}

/** One row from mhd_list_impersonation_sessions(). */
export interface MhdImpersonationSessionRecord {
  id: string;
  adminUserId: string;
  adminDisplayName: string;
  impersonatedRole: string;
  impersonatedCompanyId: string | null;
  impersonatedCompanyName: string | null;
  startedAt: string;
  endedAt: string | null;
}
