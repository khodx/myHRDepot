import { describe, expect, it } from 'vitest';
import { mhdCanAccessRoute, mhdResolvedRouteRoles } from '@/appshell/mhdRouteAccess';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const MEDICAL_ADMINISTRATORS: MhdAuthRoleName[] = ['Platform Admin', 'HR Partner', 'HR Admin'];
const EXCLUDED: MhdAuthRoleName[] = ['Client Admin', 'Manager', 'Employee', 'Viewer'];

describe('/employees/requirements route access', () => {
  it('inherits the Employee Files rule, so it is never wider than the cabinet it reports on', () => {
    expect(mhdResolvedRouteRoles('/employees/requirements')).toEqual(
      mhdResolvedRouteRoles('/employees'),
    );
  });

  it.each(MEDICAL_ADMINISTRATORS)('admits %s', (role) => {
    expect(mhdCanAccessRoute('/employees/requirements', [role])).toBe(true);
  });

  it.each(EXCLUDED)('refuses %s', (role) => {
    expect(mhdCanAccessRoute('/employees/requirements', [role])).toBe(false);
  });
});
