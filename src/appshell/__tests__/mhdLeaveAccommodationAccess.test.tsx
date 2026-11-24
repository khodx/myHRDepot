import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import routerSource from '@/routes/AppRouter.tsx?raw';
import { MHD_ROUTE_ACCESS, mhdCanAccessRoute } from '../mhdRouteAccess';
import { mhdCategoryThemeForPath } from '../mhdModuleAccent';

/**
 * Role matrix for the Leaves and Accommodations route family, the shared
 * `time-leave` category theme, and the rail's Time & Leave entry. The router
 * guard enforces exactly `mhdCanAccessRoute`, so the predicate is the contract.
 */

const BLOCKED_PATHS = [
  '/leaves',
  '/leaves/settings',
  '/accommodations',
  `/accommodations/${crypto.randomUUID()}`,
] as const;

describe('Leaves and Accommodations route access by role', () => {
  it.each(BLOCKED_PATHS)('denies Viewer on %s', (path) => {
    expect(mhdCanAccessRoute(path, ['Viewer'])).toBe(false);
  });

  it('lets an HR Coordinator open the Leaves board and a case', () => {
    expect(mhdCanAccessRoute('/leaves', ['HR Coordinator'])).toBe(true);
    expect(mhdCanAccessRoute(`/leaves/${crypto.randomUUID()}`, ['HR Coordinator'])).toBe(true);
  });

  it('keeps the leave policy settings away from an HR Coordinator', () => {
    expect(mhdCanAccessRoute('/leaves/settings', ['HR Coordinator'])).toBe(false);
  });

  it('lets an Employee open Leaves and Accommodations but not the policy settings', () => {
    expect(mhdCanAccessRoute('/leaves', ['Employee'])).toBe(true);
    expect(mhdCanAccessRoute('/accommodations', ['Employee'])).toBe(true);
    expect(mhdCanAccessRoute('/leaves/settings', ['Employee'])).toBe(false);
  });

  it('lets a Client Admin reach the leave policy settings', () => {
    expect(mhdCanAccessRoute('/leaves/settings', ['Client Admin'])).toBe(true);
  });

  it('has no access rule for the retired single-entry routes', () => {
    const retired = ['/leaves/new/intake', '/leaves/:caseId/intake', '/accommodations/new'];
    const paths = MHD_ROUTE_ACCESS.map((rule) => rule.path);
    for (const path of retired) expect(paths).not.toContain(path);
  });

  it('defines none of the retired single-entry routes in the router', () => {
    expect(routerSource).not.toMatch(/path="\/leaves\/new\/intake"/);
    expect(routerSource).not.toMatch(/path="\/leaves\/:caseId\/intake"/);
    expect(routerSource).not.toMatch(/path="\/accommodations\/new"/);
  });
});

describe('time-leave theme for the Leaves and Accommodations family', () => {
  it.each([
    '/leaves',
    '/leaves/settings',
    '/leaves/policy-library',
    `/leaves/${crypto.randomUUID()}`,
    '/accommodations',
    '/accommodations/option-library',
    `/accommodations/${crypto.randomUUID()}`,
  ])('carries the time-leave accent on %s', (path) => {
    expect(mhdCategoryThemeForPath(path)).toBe('time-leave');
  });
});

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'renata.okonkwo@harborline-health.example',
    authUserId: crypto.randomUUID(),
    roles,
    profile: {
      companyName: 'Harborline Health Partners',
      displayName: 'Renata Okonkwo',
      firstName: 'Renata',
      lastName: 'Okonkwo',
      roleNames: roles,
    },
    signOut: vi.fn(),
  });
}

function installLocalStorageStub() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}

describe('rail entry for the time-leave category', () => {
  beforeEach(() => {
    vi.resetModules();
    installLocalStorageStub();
  });

  it.each([
    ['/accommodations', 'Platform Admin'],
    ['/leaves/settings', 'HR Partner'],
  ] as Array<[string, MhdAuthRoleName]>)(
    'lights Time & Leave on %s for %s and no other category',
    async (path, role) => {
      mockAuth([role]);
      const { MhdSidebar } = await import('../MhdSidebar');
      render(
        <MemoryRouter initialEntries={[path]}>
          <MhdSidebar />
        </MemoryRouter>,
      );
      expect(screen.getByRole('link', { name: 'Time & Leave' }).className).toContain(
        'bg-rail-selected',
      );
      expect(screen.getByRole('link', { name: 'Work Tools' }).className).not.toContain(
        'bg-rail-selected',
      );
    },
  );

  it('offers Time & Leave to an Employee', async () => {
    mockAuth(['Employee']);
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MhdSidebar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Time & Leave' })).toBeInTheDocument();
  });

  it('withholds Time & Leave from a Viewer, who may open none of its modules', async () => {
    mockAuth(['Viewer']);
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MhdSidebar />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: 'Time & Leave' })).not.toBeInTheDocument();
  });
});
