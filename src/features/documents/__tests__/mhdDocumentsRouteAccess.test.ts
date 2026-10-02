import { describe, expect, it } from 'vitest';
import {
  MHD_DOCUMENT_CONTENT_MANAGER_ROLES,
  mhdCanAccessRoute,
  mhdCanManageDocumentContent,
} from '@/appshell/mhdRouteAccess';
import { mhdCategoryThemeForPath } from '@/appshell/mhdModuleAccent';

describe('document output routes', () => {
  it('opens Documents To Generate to anyone who can run a wizard, but not to a Viewer', () => {
    for (const role of [
      'Platform Admin',
      'HR Partner',
      'HR Admin',
      'HR Specialist',
      'Client Admin',
      'Manager',
      'Employee',
    ] as const) {
      expect(mhdCanAccessRoute('/reports/queue', [role])).toBe(true);
    }
    expect(mhdCanAccessRoute('/reports/queue', ['Viewer'])).toBe(false);
  });

  it('opens the letterhead page to HR and leadership roles only', () => {
    for (const role of [
      'Platform Admin',
      'HR Partner',
      'HR Admin',
      'HR Specialist',
      'Client Admin',
      'Executive Leadership',
      'Director',
    ] as const) {
      expect(mhdCanAccessRoute('/reports/letterhead', [role])).toBe(true);
    }
    for (const role of ['Manager', 'Supervisor', 'Lead', 'Employee', 'Viewer'] as const) {
      expect(mhdCanAccessRoute('/reports/letterhead', [role])).toBe(false);
    }
  });

  it('leaves the main reports page open to its existing audience', () => {
    expect(mhdCanAccessRoute('/reports', ['Viewer'])).toBe(true);
    expect(mhdCanAccessRoute('/reports', ['Employee'])).toBe(true);
  });

  it('lets only the roles the server accepts change company document content', () => {
    expect([...MHD_DOCUMENT_CONTENT_MANAGER_ROLES].sort()).toEqual(
      ['Client Admin', 'HR Partner', 'Platform Admin'].sort(),
    );
    expect(mhdCanManageDocumentContent(['Client Admin'])).toBe(true);
    expect(mhdCanManageDocumentContent(['HR Partner'])).toBe(true);
    expect(mhdCanManageDocumentContent(['Platform Admin'])).toBe(true);
    for (const role of [
      'HR Admin',
      'Executive Leadership',
      'Director',
      'Manager',
      'Viewer',
    ] as const) {
      expect(mhdCanManageDocumentContent([role])).toBe(false);
    }
  });

  it('gives the new pages the same category theme as the reports page', () => {
    expect(mhdCategoryThemeForPath('/reports/queue')).toBe(mhdCategoryThemeForPath('/reports'));
    expect(mhdCategoryThemeForPath('/reports/letterhead')).toBe(
      mhdCategoryThemeForPath('/reports'),
    );
  });
});
