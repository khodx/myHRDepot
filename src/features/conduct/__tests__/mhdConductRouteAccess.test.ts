import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute, mhdCanMutateConduct } from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Conduct module. The router guard
 * (MhdRoleGuardedRoute) enforces exactly this predicate, so proving it here is
 * proving the enforcement.
 *
 * Conduct is the strictest module: Platform Admin / HR Partner / Client Admin
 * only. Two boundaries matter most:
 * - Client User AND Viewer are BOTH excluded from /conduct and /conduct/:caseId.
 *   Unlike the employee-facing modules, there is no subject-facing surface — the
 *   subject reaches their issued corrective-action document only through the
 *   E-Signature signing link, never a /conduct route.
 * - /conduct/:caseId inherits the /conduct rule via the guard's prefix match, so
 *   the detail route cannot be reached by a role refused the board.
 */
describe('conduct route access', () => {
  it('excludes BOTH Client User and Viewer from /conduct and /conduct/:caseId', () => {
    for (const role of ['Employee', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/conduct', [role])).toBe(false);
      expect(mhdCanAccessRoute('/conduct/some-case-id', [role])).toBe(false);
    }
  });

  it('admits every privileged role to /conduct and its detail sub-route', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/conduct', [role])).toBe(true);
      expect(mhdCanAccessRoute('/conduct/some-case-id', [role])).toBe(true);
    }
  });

  it('mhdCanMutateConduct is Platform Admin / HR Partner / Client Admin only', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanMutateConduct([role])).toBe(true);
    }
    for (const role of ['Employee', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanMutateConduct([role])).toBe(false);
    }
  });
});
