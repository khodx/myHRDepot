import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute, mhdTrainingIsPrivileged } from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Training module. The router guard
 * (MhdRoleGuardedRoute) enforces exactly this predicate, so proving it here is
 * proving the enforcement.
 *
 * Training splits into two SEPARATE routes:
 * - /training — the admin catalog + compliance board: Platform Admin / HR
 *   Partner / Client Admin.
 * - /my-training — the employee's own assignments: Client User only.
 * Viewer is excluded from BOTH. The two are distinct prefixes, so the first-match
 * prefix scan never lets /training capture /my-training.
 */
describe('training route access', () => {
  it('excludes Viewer from BOTH /training and /my-training', () => {
    expect(mhdCanAccessRoute('/training', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/my-training', ['Viewer'])).toBe(false);
  });

  it('admits Platform Admin / HR Partner / Client Admin to /training, but NOT Client User', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/training', [role])).toBe(true);
    }
    expect(mhdCanAccessRoute('/training', ['Client User'])).toBe(false);
  });

  it('admits ONLY Client User to /my-training — not the privileged admin set, not Viewer', () => {
    expect(mhdCanAccessRoute('/my-training', ['Client User'])).toBe(true);
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/my-training', [role])).toBe(false);
    }
  });

  it('does not let the /training rule capture /my-training via the prefix scan', () => {
    // /my-training must resolve to its OWN rule (Client User), never inherit
    // /training's admin rule. A Client User reaching /my-training is admitted; a
    // Platform Admin is not.
    expect(mhdCanAccessRoute('/my-training', ['Client User'])).toBe(true);
    expect(mhdCanAccessRoute('/my-training', ['Platform Admin'])).toBe(false);
  });

  it('mhdTrainingIsPrivileged gates the manage affordances — PA/HRP/CA, never Client User/Viewer', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdTrainingIsPrivileged([role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdTrainingIsPrivileged([role])).toBe(false);
    }
  });
});
