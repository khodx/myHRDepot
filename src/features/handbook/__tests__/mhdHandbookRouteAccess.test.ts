import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute, mhdHandbookIsPrivileged } from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Handbook Engine. The router guard
 * (MhdRoleGuardedRoute) enforces exactly this predicate, so proving it here is
 * proving the enforcement.
 *
 * Handbooks split into two SEPARATE routes:
 * - /handbooks — the admin wizard + acknowledgment board: Platform Admin / HR
 *   Partner / Client Admin. Client User AND Viewer are both refused.
 * - /my-handbooks — the employee's own acknowledgment surface: Client User only.
 * Viewer is excluded from BOTH. The two are distinct prefixes, so the first-match
 * prefix scan never lets /handbooks capture /my-handbooks.
 */
describe('handbook route access', () => {
  it('excludes Viewer from BOTH /handbooks and /my-handbooks', () => {
    expect(mhdCanAccessRoute('/handbooks', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/my-handbooks', ['Viewer'])).toBe(false);
  });

  it('rejects Viewer AND Client User from the admin /handbooks', () => {
    expect(mhdCanAccessRoute('/handbooks', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/handbooks', ['Client User'])).toBe(false);
  });

  it('admits Platform Admin / HR Partner / Client Admin to /handbooks, but NOT Client User', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/handbooks', [role])).toBe(true);
    }
    expect(mhdCanAccessRoute('/handbooks', ['Client User'])).toBe(false);
  });

  it('lets the privileged set reach the wizard sub-route /handbooks/:handbookId via the prefix match', () => {
    expect(mhdCanAccessRoute('/handbooks/HBK-0001', ['HR Partner'])).toBe(true);
    // ...but never a Client User or Viewer, who are refused the whole /handbooks tree.
    expect(mhdCanAccessRoute('/handbooks/HBK-0001', ['Client User'])).toBe(false);
    expect(mhdCanAccessRoute('/handbooks/HBK-0001', ['Viewer'])).toBe(false);
  });

  it('admits ONLY Client User to /my-handbooks — not the privileged admin set, not Viewer', () => {
    expect(mhdCanAccessRoute('/my-handbooks', ['Client User'])).toBe(true);
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/my-handbooks', [role])).toBe(false);
    }
  });

  it('does not let the /handbooks rule capture /my-handbooks via the prefix scan', () => {
    // /my-handbooks must resolve to its OWN rule (Client User), never inherit
    // /handbooks's admin rule. A Client User reaching /my-handbooks is admitted; a
    // Platform Admin is not.
    expect(mhdCanAccessRoute('/my-handbooks', ['Client User'])).toBe(true);
    expect(mhdCanAccessRoute('/my-handbooks', ['Platform Admin'])).toBe(false);
  });

  it('mhdHandbookIsPrivileged gates the manage affordances — PA/HRP/CA, never Client User/Viewer', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdHandbookIsPrivileged([role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdHandbookIsPrivileged([role])).toBe(false);
    }
  });
});
