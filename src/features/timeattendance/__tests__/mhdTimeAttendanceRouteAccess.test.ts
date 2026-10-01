import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  MHD_ATTENDANCE_MUTATING_ROLES,
  MHD_ATTENDANCE_READ_ALL_ROLES,
  mhdCanAccessRoute,
  mhdCanMutateAttendance,
  mhdCanReadAllAttendance,
} from '@/appshell/mhdRouteAccess';

/**
 * Route coverage for the Time & Attendance surfaces. The router guard
 * (MhdRoleGuardedRoute) enforces exactly these predicates, so proving them here is
 * proving the enforcement. What a role may SEE inside an admitted route is decided
 * by the database (migration 0335); these tests pin who gets through the door and
 * who is offered mutation controls.
 */
const PRIVILEGED: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'HR Admin',
  'HR Specialist',
  'Client Admin',
  'Executive Leadership',
  'Director',
];
const SELF_OR_TEAM: MhdAuthRoleName[] = ['Manager', 'Supervisor', 'Lead', 'Employee'];

describe('time & attendance route access', () => {
  it('excludes Viewer from every Time & Attendance route', () => {
    for (const path of ['/schedule', '/schedule/templates', '/attendance', '/attendance/policy']) {
      expect(mhdCanAccessRoute(path, ['Viewer'])).toBe(false);
    }
  });

  it('admits every role that is not Viewer to /schedule and /attendance', () => {
    for (const role of [...PRIVILEGED, 'HR Coordinator', ...SELF_OR_TEAM] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/schedule', [role])).toBe(true);
      expect(mhdCanAccessRoute('/attendance', [role])).toBe(true);
    }
  });

  it('admits HR Coordinator, who reads company-wide but never mutates', () => {
    expect(mhdCanAccessRoute('/attendance', ['HR Coordinator'])).toBe(true);
    expect(mhdCanAccessRoute('/schedule', ['HR Coordinator'])).toBe(true);
    expect(mhdCanMutateAttendance(['HR Coordinator'])).toBe(false);
    expect(mhdCanReadAllAttendance(['HR Coordinator'])).toBe(true);
  });

  it('publishes /attendance/policy to everyone who can open /attendance (read-only for non-mutators)', () => {
    for (const role of [...PRIVILEGED, 'HR Coordinator', ...SELF_OR_TEAM] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/attendance/policy', [role])).toBe(true);
    }
  });

  it('keeps pattern management privileged-only; /schedule/templates must not inherit the /schedule rule', () => {
    for (const path of [
      '/schedule/templates',
      '/schedule/templates/new',
      '/schedule/templates/any-id',
      '/schedule/templates/any-id/edit',
    ]) {
      for (const role of PRIVILEGED) {
        expect(mhdCanAccessRoute(path, [role])).toBe(true);
      }
      for (const role of ['HR Coordinator', ...SELF_OR_TEAM] as MhdAuthRoleName[]) {
        expect(mhdCanAccessRoute(path, [role])).toBe(false);
      }
    }
  });

  it('mhdCanMutateAttendance is exactly the privileged set', () => {
    for (const role of PRIVILEGED) {
      expect(mhdCanMutateAttendance([role])).toBe(true);
    }
    for (const role of ['HR Coordinator', 'Viewer', ...SELF_OR_TEAM] as MhdAuthRoleName[]) {
      expect(mhdCanMutateAttendance([role])).toBe(false);
    }
    expect([...MHD_ATTENDANCE_MUTATING_ROLES].sort()).toEqual([...PRIVILEGED].sort());
  });

  it('mhdCanReadAllAttendance is the privileged set plus HR Coordinator, and nobody else', () => {
    expect([...MHD_ATTENDANCE_READ_ALL_ROLES].sort()).toEqual(
      [...PRIVILEGED, 'HR Coordinator'].sort(),
    );
    for (const role of ['Viewer', ...SELF_OR_TEAM] as MhdAuthRoleName[]) {
      // A manager's read scope is their reports, decided by the database; it is never
      // company-wide, and never includes the discipline queues.
      expect(mhdCanReadAllAttendance([role])).toBe(false);
    }
  });

  it('a user holding several roles gets the broadest applicable access', () => {
    expect(mhdCanMutateAttendance(['Employee', 'HR Specialist'])).toBe(true);
    expect(mhdCanReadAllAttendance(['Manager', 'HR Coordinator'])).toBe(true);
  });
});
