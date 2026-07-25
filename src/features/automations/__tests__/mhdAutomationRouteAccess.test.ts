import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute, mhdCanArmAutomations } from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Automation Engine. The router guard
 * (MhdRoleGuardedRoute) enforces exactly `mhdCanAccessRoute`, so proving the
 * predicate here is proving the enforcement.
 *
 * Two boundaries matter and they are deliberately different widths:
 * - REACHING /automations is Platform Admin / HR Partner / Client Admin. Client
 *   User and Viewer are excluded; run history exposes what the engine did across
 *   the whole company.
 * - ARMING a rule is Platform Admin ONLY. Arming is what lets a rule act on live
 *   tenant data, and the rule's author becomes the privilege basis for every
 *   action it subsequently takes, so it is narrower than the review audience.
 */
describe('automations route access', () => {
  it('excludes Client User and Viewer from /automations', () => {
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/automations', [role])).toBe(false);
    }
  });

  it('admits Platform Admin, HR Partner and Client Admin to /automations', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/automations', [role])).toBe(true);
    }
  });

  it('applies the same rule to the rule and run detail sub-routes via prefix match', () => {
    expect(mhdCanAccessRoute('/automations/rules/rule-1', ['HR Partner'])).toBe(true);
    expect(mhdCanAccessRoute('/automations/runs/run-1', ['Client Admin'])).toBe(true);
    expect(mhdCanAccessRoute('/automations/rules/rule-1', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/automations/runs/run-1', ['Client User'])).toBe(false);
  });

  it('restricts arming to Platform Admin, narrower than route access', () => {
    expect(mhdCanArmAutomations(['Platform Admin'])).toBe(true);

    // HR Partner and Client Admin can review the surface but must not arm.
    for (const role of [
      'HR Partner',
      'Client Admin',
      'Client User',
      'Viewer',
    ] as MhdAuthRoleName[]) {
      expect(mhdCanArmAutomations([role])).toBe(false);
    }
  });
});
