import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  mhdCanAccessRoute,
  mhdIsRouteComingSoon,
  mhdRouteStatus,
} from '@/appshell/mhdRouteAccess';

/**
 * /performance access rules.
 *
 * The role predicate remains the router guard's authorization source of truth;
 * comingSoon is layered above it as presentation state for non-Platform Admins.
 */
describe('performance route access', () => {
  it('preserves existing role access for the performance surfaces', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/performance', [role])).toBe(true);
      expect(mhdCanAccessRoute('/performance/templates', [role])).toBe(true);
      expect(mhdCanAccessRoute('/performance/settings', [role])).toBe(true);
    }

    expect(mhdCanAccessRoute('/performance', ['Employee'])).toBe(true);
    expect(mhdCanAccessRoute('/performance/invitations', ['Employee'])).toBe(true);
    expect(mhdCanAccessRoute('/performance/templates', ['Employee'])).toBe(false);
    expect(mhdCanAccessRoute('/performance/settings', ['Employee'])).toBe(false);
    expect(mhdCanAccessRoute('/performance', ['Viewer'])).toBe(false);
  });

  it('marks performance surfaces as coming soon for non-Platform Admins', () => {
    for (const path of [
      '/performance',
      '/performance/templates',
      '/performance/settings',
      '/performance/invitations',
    ] as const) {
      expect(mhdRouteStatus(path)).toBe('comingSoon');
      expect(mhdIsRouteComingSoon(path, ['Platform Admin'])).toBe(false);
      expect(mhdIsRouteComingSoon(path, ['HR Partner'])).toBe(true);
      expect(mhdIsRouteComingSoon(path, ['Client Admin'])).toBe(true);
    }
  });
});
