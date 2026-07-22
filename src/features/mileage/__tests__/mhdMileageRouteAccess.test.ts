import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  mhdCanAccessRoute,
  mhdCanManageMileageRates,
  mhdMileageIsPrivileged,
} from '@/appshell/mhdRouteAccess';

const PRIVILEGED: MhdAuthRoleName[] = ['Platform Admin', 'HR Partner', 'Client Admin'];

describe('mileage route access', () => {
  it('excludes Viewer from /mileage', () => {
    expect(mhdCanAccessRoute('/mileage', ['Viewer'])).toBe(false);
  });

  it('admits every privileged role to /mileage', () => {
    for (const role of PRIVILEGED) {
      expect(mhdCanAccessRoute('/mileage', [role])).toBe(true);
    }
  });

  it('admits a Client User to /mileage (their own trips and claims)', () => {
    expect(mhdCanAccessRoute('/mileage', ['Client User'])).toBe(true);
  });

  it('mhdMileageIsPrivileged is Platform Admin / HR Partner / Client Admin only', () => {
    for (const role of PRIVILEGED) {
      expect(mhdMileageIsPrivileged([role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdMileageIsPrivileged([role])).toBe(false);
    }
  });

  it('mhdCanManageMileageRates is Platform Admin only — the registry is global', () => {
    expect(mhdCanManageMileageRates(['Platform Admin'])).toBe(true);
    // HR Partner and Client Admin are privileged for the module but must NOT be
    // able to write the global IRS registry; a Client User and Viewer even less.
    for (const role of ['HR Partner', 'Client Admin', 'Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanManageMileageRates([role])).toBe(false);
    }
  });
});
