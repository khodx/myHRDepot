import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  MHD_HANDBOOK_ACKNOWLEDGER_ROLES,
  MHD_HANDBOOK_PRIVILEGED_ROLES,
  mhdCanAccessRoute,
  mhdHandbookIsPrivileged,
} from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Handbook Engine. The router guard
 * (MhdRoleGuardedRoute) enforces exactly this predicate, so proving it here is
 * proving the enforcement.
 *
 * Handbooks split into two SEPARATE routes:
 * - /handbooks — the admin wizard + acknowledgment board: the privileged handbook
 *   set (the same roles the database's mhd_handbook_is_privileged admits). An
 *   Employee, a Manager and a Viewer are all refused.
 * - /my-handbooks — each person's own acknowledgment surface: every INTERNAL role,
 *   because anyone — HR and leadership included — can be assigned a handbook.
 *   Viewer and 3rd Party are excluded from BOTH. The two are distinct prefixes, so
 *   the first-match prefix scan never lets /handbooks capture /my-handbooks.
 */
describe('handbook route access', () => {
  it('excludes Viewer and 3rd Party from BOTH /handbooks and /my-handbooks', () => {
    for (const role of ['Viewer', '3rd Party'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/handbooks', [role])).toBe(false);
      expect(mhdCanAccessRoute('/my-handbooks', [role])).toBe(false);
    }
  });

  it('refuses the non-privileged internal roles the admin /handbooks', () => {
    for (const role of ['Employee', 'Manager', 'Supervisor', 'Lead'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/handbooks', [role])).toBe(false);
    }
  });

  it('admits every privileged handbook role to /handbooks', () => {
    for (const role of MHD_HANDBOOK_PRIVILEGED_ROLES) {
      expect(mhdCanAccessRoute('/handbooks', [role])).toBe(true);
    }
  });

  it('lets the privileged set reach the wizard sub-route /handbooks/:handbookId via the prefix match', () => {
    expect(mhdCanAccessRoute('/handbooks/HBK-0001', ['HR Partner'])).toBe(true);
    // ...but never an Employee or Viewer, who are refused the whole /handbooks tree.
    expect(mhdCanAccessRoute('/handbooks/HBK-0001', ['Employee'])).toBe(false);
    expect(mhdCanAccessRoute('/handbooks/HBK-0001', ['Viewer'])).toBe(false);
  });

  it('admits every internal role to /my-handbooks, so no one an automation assigns is locked out', () => {
    for (const role of MHD_HANDBOOK_ACKNOWLEDGER_ROLES) {
      expect(mhdCanAccessRoute('/my-handbooks', [role])).toBe(true);
    }
    // HR and leadership roles in particular: the ASSIGN_HANDBOOK_ACKNOWLEDGMENTS action
    // assigns to everyone active, and they need somewhere to acknowledge.
    for (const role of [
      'Platform Admin',
      'HR Partner',
      'HR Admin',
      'HR Specialist',
      'HR Coordinator',
      'Executive Leadership',
      'Director',
      'Client Admin',
    ] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/my-handbooks', [role])).toBe(true);
    }
  });

  it('every privileged handbook role can also acknowledge their own assignments', () => {
    for (const role of MHD_HANDBOOK_PRIVILEGED_ROLES) {
      expect(MHD_HANDBOOK_ACKNOWLEDGER_ROLES).toContain(role);
    }
  });

  it('does not let the /handbooks rule capture /my-handbooks via the prefix scan', () => {
    // /my-handbooks must resolve to its OWN rule, never inherit /handbooks's admin
    // rule: an Employee reaching /my-handbooks is admitted and refused /handbooks.
    expect(mhdCanAccessRoute('/my-handbooks', ['Employee'])).toBe(true);
    expect(mhdCanAccessRoute('/handbooks', ['Employee'])).toBe(false);
  });

  it('mhdHandbookIsPrivileged gates the manage affordances — the privileged set, never Employee/Viewer', () => {
    for (const role of MHD_HANDBOOK_PRIVILEGED_ROLES) {
      expect(mhdHandbookIsPrivileged([role])).toBe(true);
    }
    for (const role of ['Employee', 'Manager', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdHandbookIsPrivileged([role])).toBe(false);
    }
  });
});

describe('handbook wizard route access', () => {
  it('keeps /handbooks/new inside the admin audience', () => {
    expect(mhdCanAccessRoute('/handbooks/new', ['HR Partner'])).toBe(true);
    expect(mhdCanAccessRoute('/handbooks/new', ['Employee'])).toBe(false);
    expect(mhdCanAccessRoute('/handbooks/new', ['Viewer'])).toBe(false);
  });
});
