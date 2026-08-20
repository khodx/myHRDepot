import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  mhdCanAccessRoute,
  mhdLeavesCanSeeMedical,
  mhdLeavesIsPrivileged,
} from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Leaves module. The router guard
 * (MhdRoleGuardedRoute) enforces exactly `mhdCanAccessRoute`, so proving the
 * predicate here is proving the enforcement.
 *
 * Leaves admits the privileged set PLUS Client User (the subject reaches their
 * OWN cases — the RPCs scope reads by mhd_can_view_leave_person). Two boundaries
 * matter:
 * - Viewer is excluded from /leaves and /leaves/:caseId.
 * - The medical-certification partition is narrower than general leave access:
 *   Platform Admin + HR Partner ONLY, Client Admin included in the exclusion.
 */
describe('leaves route access', () => {
  it('excludes Viewer from /leaves and /leaves/:caseId', () => {
    expect(mhdCanAccessRoute('/leaves', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/leaves/some-case-id', ['Viewer'])).toBe(false);
  });

  it('admits the privileged roles and Client User to /leaves and its detail sub-route', () => {
    for (const role of [
      'Platform Admin',
      'HR Partner',
      'Client Admin',
      'Employee',
    ] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/leaves', [role])).toBe(true);
      // /leaves/:caseId inherits the /leaves rule via the guard's prefix match.
      expect(mhdCanAccessRoute('/leaves/some-case-id', [role])).toBe(true);
    }
  });

  it('mhdLeavesIsPrivileged is Platform Admin / HR Partner / Client Admin only', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdLeavesIsPrivileged([role])).toBe(true);
    }
    for (const role of ['Employee', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdLeavesIsPrivileged([role])).toBe(false);
    }
  });

  it('mhdLeavesCanSeeMedical is Platform Admin / HR Partner ONLY — Client Admin excluded', () => {
    for (const role of ['Platform Admin', 'HR Partner'] as MhdAuthRoleName[]) {
      expect(mhdLeavesCanSeeMedical([role])).toBe(true);
    }
    // The 825.500(g) boundary: a Client Admin is privileged for leave
    // administration but must NOT see medical certification content.
    for (const role of ['Client Admin', 'Employee', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdLeavesCanSeeMedical([role])).toBe(false);
    }
  });
});
