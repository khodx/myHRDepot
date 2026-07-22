import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute, mhdCanOpenInvestigation } from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Investigations module. The router guard
 * (MhdRoleGuardedRoute) enforces exactly this predicate, so proving it here is
 * proving the enforcement.
 *
 * Investigations restricts the ROUTE to Platform Admin / HR Partner / Client
 * Admin — but reaching the route grants no case visibility: that is per-case and
 * grant-based server-side. The two boundaries that matter most:
 * - Client User AND Viewer are BOTH excluded from /investigations and
 *   /investigations/:caseId. There is no subject-facing surface.
 * - /investigations/:caseId inherits the /investigations rule via the guard's
 *   prefix match, so the detail route cannot be reached by a role refused the
 *   board.
 */
describe('investigations route access', () => {
  it('excludes BOTH Client User and Viewer from /investigations and /investigations/:caseId', () => {
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/investigations', [role])).toBe(false);
      expect(mhdCanAccessRoute('/investigations/some-case-id', [role])).toBe(false);
    }
  });

  it('admits Platform Admin / HR Partner / Client Admin to the board and its detail sub-route', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/investigations', [role])).toBe(true);
      expect(mhdCanAccessRoute('/investigations/some-case-id', [role])).toBe(true);
    }
  });

  it('mhdCanOpenInvestigation gates ONLY the create affordance — PA/HRP/CA, never Client User/Viewer', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanOpenInvestigation([role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanOpenInvestigation([role])).toBe(false);
    }
  });
});
