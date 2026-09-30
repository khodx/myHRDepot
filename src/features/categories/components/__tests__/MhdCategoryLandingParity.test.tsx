import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute } from '@/appshell/mhdRouteAccess';

/**
 * Parity contract between every left-nav category, its landing page, and the
 * router: a landing page lists exactly the modules (and sub-pages) the rail
 * lists for the same role, never links a role to a route the guard refuses,
 * and never links to a route the router does not define.
 */

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const ALL_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'Executive Leadership',
  'Director',
  'HR Partner',
  'HR Admin',
  'HR Specialist',
  'HR Coordinator',
  'Client Admin',
  'Manager',
  'Supervisor',
  'Lead',
  'Employee',
  '3rd Party',
  'Viewer',
];

const routerSource = readFileSync(resolve(__dirname, '../../../../routes/AppRouter.tsx'), 'utf8');

beforeEach(() => {
  vi.resetModules();
});

describe('category landing pages', () => {
  it('every category with a landing route has a unique slug, label and description', async () => {
    const { NAV_SECTIONS } = await import('@/appshell/mhdNavSections');
    const landed = NAV_SECTIONS.filter((section) => section.route);

    expect(landed.length).toBeGreaterThan(0);
    expect(new Set(landed.map((s) => s.route)).size).toBe(landed.length);
    for (const section of landed) {
      expect(section.route, section.label).toMatch(/^\/categories\/[a-z-]+$/);
      expect(section.description?.trim(), `${section.label} description`).toBeTruthy();
    }
  });

  it('every landing route and every card route is defined by the router', async () => {
    const { NAV_SECTIONS } = await import('@/appshell/mhdNavSections');
    expect(routerSource).toContain('path="/categories/:categorySlug"');

    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        for (const nav of [item, ...(item.children ?? [])]) {
          expect(routerSource, `${section.label} > ${nav.label} (${nav.route})`).toContain(
            `path="${nav.route}"`,
          );
        }
      }
    }
  });

  it.each(ALL_ROLES)('lists exactly what the rail lists, all reachable, for %s', async (role) => {
    mockUseMhdAuth.mockReturnValue({ isAuthenticated: true, roles: [role], profile: null });
    const { NAV_SECTIONS, mhdVisibleNavItems } = await import('@/appshell/mhdNavSections');
    const { MhdCategoryLandingPage } = await import('../MhdCategoryLandingPage');

    for (const section of NAV_SECTIONS.filter((s) => s.route)) {
      const railRoutes = mhdVisibleNavItems(section.items, [role])
        .flatMap((item) => [item, ...(item.children ?? [])])
        .map((nav) => nav.route);

      const { container, unmount } = render(
        <MemoryRouter initialEntries={[section.route as string]}>
          <Routes>
            <Route path="/categories/:categorySlug" element={<MhdCategoryLandingPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Card links are the page's <h2> links; each module appears exactly once.
      const cardRoutes = Array.from(container.querySelectorAll('h2 a')).map((a) =>
        a.getAttribute('href'),
      );
      expect(cardRoutes, `${role} / ${section.label}`).toEqual(railRoutes);
      expect(new Set(cardRoutes).size, `${role} / ${section.label} duplicates`).toBe(
        cardRoutes.length,
      );

      // A card must never advertise a route the role's guard would refuse.
      for (const route of railRoutes) {
        expect(mhdCanAccessRoute(route, [role]), `${role} -> ${route}`).toBe(true);
      }
      unmount();
    }
  });
});
