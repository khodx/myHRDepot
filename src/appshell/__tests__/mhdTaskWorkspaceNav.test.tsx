import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

/**
 * Coverage for the persistent nav bar shared across the three sibling
 * top-level routes /tasks, /reports, /audit-reports (plain sibling <Route>
 * entries in AppRouter.tsx with no shared parent/layout route — see
 * MhdTaskWorkspaceNav's own doc comment for why active state has to be
 * computed per-mount from the pathname rather than lifted into any one
 * page's local state).
 */

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({ roles });
}

function renderNav(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MhdTaskWorkspaceNav />
    </MemoryRouter>,
  );
}

const { MhdTaskWorkspaceNav } = await import('../components/MhdTaskWorkspaceNav');

describe('MhdTaskWorkspaceNav — Audit Reports role gating', () => {
  it.each(['Platform Admin', 'HR Partner'] as MhdAuthRoleName[])(
    'shows the Audit Reports link, linked to /audit-reports, for %s',
    (role) => {
      mockAuth([role]);
      renderNav('/tasks');

      const auditReports = screen.getByRole('link', { name: /Audit Reports/ });
      expect(auditReports).toBeInTheDocument();
      expect(auditReports).toHaveAttribute('href', '/audit-reports');
    },
  );

  it.each(['Client Admin', 'Client User', 'Viewer'] as MhdAuthRoleName[])(
    'omits the Audit Reports link for %s',
    (role) => {
      mockAuth([role]);
      renderNav('/tasks');

      expect(screen.queryByRole('link', { name: /Audit Reports/ })).not.toBeInTheDocument();
    },
  );

  it('always renders the Tasks and Task Reports links regardless of role', () => {
    mockAuth(['Viewer']);
    renderNav('/tasks');

    expect(screen.getByRole('link', { name: /^Tasks$/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Task Reports/ })).toBeInTheDocument();
  });
});

describe('MhdTaskWorkspaceNav — active state', () => {
  it('marks Tasks active with aria-current and primary styling on /tasks', () => {
    mockAuth(['Platform Admin']);
    renderNav('/tasks');

    const tasksLink = screen.getByRole('link', { name: /^Tasks$/ });
    expect(tasksLink).toHaveAttribute('aria-current', 'page');

    const reportsLink = screen.getByRole('link', { name: /Task Reports/ });
    expect(reportsLink).not.toHaveAttribute('aria-current');
  });

  it('marks Task Reports active with aria-current on /reports', () => {
    mockAuth(['Platform Admin']);
    renderNav('/reports');

    const reportsLink = screen.getByRole('link', { name: /Task Reports/ });
    expect(reportsLink).toHaveAttribute('aria-current', 'page');

    const tasksLink = screen.getByRole('link', { name: /^Tasks$/ });
    expect(tasksLink).not.toHaveAttribute('aria-current');
  });

  it('marks Audit Reports active with aria-current on /audit-reports', () => {
    mockAuth(['Platform Admin']);
    renderNav('/audit-reports');

    const auditReports = screen.getByRole('link', { name: /Audit Reports/ });
    expect(auditReports).toHaveAttribute('aria-current', 'page');

    const tasksLink = screen.getByRole('link', { name: /^Tasks$/ });
    expect(tasksLink).not.toHaveAttribute('aria-current');
  });
});
