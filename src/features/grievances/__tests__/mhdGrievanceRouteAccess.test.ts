import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute } from '@/appshell/mhdRouteAccess';

describe('grievance route access', () => {
  it('lets the roles that file grievances reach the intake wizard through /my-grievances', () => {
    for (const role of ['Employee', 'Manager', 'Supervisor', 'Lead'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/my-grievances', [role])).toBe(true);
      expect(mhdCanAccessRoute('/my-grievances/new', [role])).toBe(true);
    }
    expect(mhdCanAccessRoute('/my-grievances/new', ['Viewer'])).toBe(false);
  });

  it('keeps the HR list and detail to Platform Admin and HR Partner', () => {
    for (const role of ['Platform Admin', 'HR Partner'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/grievances', [role])).toBe(true);
      expect(mhdCanAccessRoute('/grievances/some-id', [role])).toBe(true);
    }
    for (const role of ['Employee', 'Manager', 'Client Admin', 'HR Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/grievances', [role])).toBe(false);
    }
  });
});
