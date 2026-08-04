import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  mhdCanAccessRoute,
  mhdCanReadEeoReport,
  mhdIsRouteComingSoon,
  mhdRecruitingIsPrivileged,
  mhdRouteStatus,
} from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Recruiting / ATS module. The router guard
 * (MhdRoleGuardedRoute) enforces exactly `mhdCanAccessRoute`, so proving the
 * predicate here is proving the enforcement.
 *
 * The module has three authenticated surfaces gated at three widths plus a public
 * apply route (outside the guard entirely, so it is not covered by this predicate):
 * - /recruiting (+ its detail sub-routes) — Platform Admin / HR Partner / Client
 *   Admin (admin + hiring managers). Viewer excluded.
 * - /recruiting/interviews/:id — the interviewer worksheet, any authenticated
 *   non-Viewer (server RLS scopes the actual read).
 * - /recruiting/eeo — Platform Admin ONLY (the sole EEO read path).
 */
describe('recruiting route access', () => {
  const ALL_ROLES: MhdAuthRoleName[] = [
    'Platform Admin',
    'HR Partner',
    'Client Admin',
    'Client User',
    'Viewer',
  ];

  it('admits only Platform Admin / HR Partner / Client Admin to /recruiting and its detail sub-routes', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/recruiting', [role])).toBe(true);
      expect(mhdCanAccessRoute('/recruiting/requisitions/req-1', [role])).toBe(true);
      expect(mhdCanAccessRoute('/recruiting/applications/app-1', [role])).toBe(true);
      expect(mhdCanAccessRoute('/recruiting/questions', [role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/recruiting', [role])).toBe(false);
      expect(mhdCanAccessRoute('/recruiting/requisitions/req-1', [role])).toBe(false);
      expect(mhdCanAccessRoute('/recruiting/applications/app-1', [role])).toBe(false);
    }
  });

  it('admits any authenticated non-Viewer to the interviewer worksheet route', () => {
    for (const role of [
      'Platform Admin',
      'HR Partner',
      'Client Admin',
      'Client User',
    ] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/recruiting/interviews/iv-1', [role])).toBe(true);
    }
    // The worksheet rule must precede /recruiting so Client User is not captured by
    // the narrower /recruiting rule. Viewer is still excluded.
    expect(mhdCanAccessRoute('/recruiting/interviews/iv-1', ['Viewer'])).toBe(false);
  });

  it('restricts the EEO report route to Platform Admin ONLY — every other role is rejected', () => {
    expect(mhdCanAccessRoute('/recruiting/eeo', ['Platform Admin'])).toBe(true);
    for (const role of [
      'HR Partner',
      'Client Admin',
      'Client User',
      'Viewer',
    ] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/recruiting/eeo', [role])).toBe(false);
    }
    // The /recruiting/eeo rule must precede /recruiting: an HR Partner / Client
    // Admin can reach /recruiting but must NOT inherit it for the EEO report.
    expect(mhdCanAccessRoute('/recruiting/eeo', ['HR Partner'])).toBe(false);
    expect(mhdCanAccessRoute('/recruiting/eeo', ['Client Admin'])).toBe(false);
  });

  it('mhdCanReadEeoReport is Platform Admin only', () => {
    expect(mhdCanReadEeoReport(['Platform Admin'])).toBe(true);
    for (const role of [
      'HR Partner',
      'Client Admin',
      'Client User',
      'Viewer',
    ] as MhdAuthRoleName[]) {
      expect(mhdCanReadEeoReport([role])).toBe(false);
    }
  });

  it('mhdRecruitingIsPrivileged is Platform Admin / HR Partner / Client Admin only', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdRecruitingIsPrivileged([role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdRecruitingIsPrivileged([role])).toBe(false);
    }
  });

  it('never grants a recruiting surface to a role outside its rule (exhaustive sweep)', () => {
    for (const role of ALL_ROLES) {
      const single: MhdAuthRoleName[] = [role];
      // EEO is the tightest gate.
      if (role !== 'Platform Admin') {
        expect(mhdCanAccessRoute('/recruiting/eeo', single)).toBe(false);
      }
    }
  });

  it('marks authenticated recruiting surfaces as coming soon for non-Platform Admins', () => {
    for (const path of [
      '/recruiting',
      '/recruiting/eeo',
      '/recruiting/interviews',
    ] as const) {
      expect(mhdRouteStatus(path)).toBe('comingSoon');
      expect(mhdIsRouteComingSoon(path, ['Platform Admin'])).toBe(false);
    }

    expect(mhdIsRouteComingSoon('/recruiting', ['HR Partner'])).toBe(true);
    expect(mhdIsRouteComingSoon('/recruiting', ['Client Admin'])).toBe(true);
    expect(mhdIsRouteComingSoon('/recruiting/interviews/iv-1', ['Client User'])).toBe(true);
  });
});
