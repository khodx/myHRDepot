import { describe, expect, it } from 'vitest';
import { mhdCanAccessRoute } from '../mhdRouteAccess';

describe('Knowledge Center company guidance route access', () => {
  it('allows Platform Admin and Client Admin without shadowing', () => {
    expect(mhdCanAccessRoute('/knowledge-center/company', ['Platform Admin'])).toBe(true);
    expect(mhdCanAccessRoute('/knowledge-center/company', ['Client Admin'])).toBe(true);
  });

  it('denies non-authoring roles and keeps admin Platform Admin-only', () => {
    for (const role of ['HR Partner', 'Employee', 'Manager', 'Viewer'] as const) {
      expect(mhdCanAccessRoute('/knowledge-center/company', [role])).toBe(false);
    }
    expect(mhdCanAccessRoute('/knowledge-center/admin', ['Client Admin'])).toBe(false);
  });
});
