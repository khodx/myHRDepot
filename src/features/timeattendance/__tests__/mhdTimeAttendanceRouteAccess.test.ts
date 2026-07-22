import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  mhdCanAccessRoute,
  mhdCanMutateAttendance,
} from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Time & Attendance surfaces. The router guard
 * (MhdRoleGuardedRoute) enforces exactly these predicates, so proving them here
 * is proving the enforcement — the app-router suite exercises the same rules at
 * render level.
 */
describe('time & attendance route access', () => {
  it('excludes Viewer from /schedule and /attendance', () => {
    expect(mhdCanAccessRoute('/schedule', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/attendance', ['Viewer'])).toBe(false);
  });

  it('admits Client User to /schedule and /attendance — the own-record surface', () => {
    expect(mhdCanAccessRoute('/schedule', ['Client User'])).toBe(true);
    expect(mhdCanAccessRoute('/attendance', ['Client User'])).toBe(true);
  });

  it('keeps /attendance/policy privileged-only; Client User must not inherit the /attendance rule', () => {
    expect(mhdCanAccessRoute('/attendance/policy', ['Client User'])).toBe(false);
    expect(mhdCanAccessRoute('/attendance/policy', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/attendance/policy', ['Client Admin'])).toBe(true);
    expect(mhdCanAccessRoute('/attendance/policy', ['HR Partner'])).toBe(true);
    expect(mhdCanAccessRoute('/attendance/policy', ['Platform Admin'])).toBe(true);
  });

  it('admits every privileged role to /schedule and /attendance', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/schedule', [role])).toBe(true);
      expect(mhdCanAccessRoute('/attendance', [role])).toBe(true);
    }
  });

  it('mhdCanMutateAttendance is Platform Admin / HR Partner / Client Admin only', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanMutateAttendance([role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanMutateAttendance([role])).toBe(false);
    }
  });
});
