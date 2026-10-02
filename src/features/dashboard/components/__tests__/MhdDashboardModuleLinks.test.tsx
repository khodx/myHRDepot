import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const mockUseMhdModuleAlerts = vi.fn();
vi.mock('@/features/module-alerts/Hook', () => ({
  useMhdModuleAlerts: () => mockUseMhdModuleAlerts(),
}));

// Counts are keyed by module route — the same string the tile links to.
function mockModuleAlerts(counts: Record<string, number>) {
  mockUseMhdModuleAlerts.mockReturnValue({ counts, isLoading: false });
}

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'user@myhrdepot.com',
    authUserId: 'auth-user-1',
    profile: {
      userId: 'user-1',
      companyId: 'company-1',
      companyName: 'Acme Co',
      isAdmin: false,
      personId: 'person-1',
      displayName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      email: 'user@myhrdepot.com',
      roleNames: roles,
    },
    roles,
  });
}

async function renderModuleLinks() {
  const { MhdDashboardModuleLinks } = await import('../MhdDashboardModuleLinks');
  return render(
    <MemoryRouter>
      <MhdDashboardModuleLinks />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mockModuleAlerts({});
});

describe('MhdDashboardModuleLinks', () => {
  it('renders Checklists and My Checklists together in one card', async () => {
    mockAuth(['Platform Admin']);

    await renderModuleLinks();

    const checklistsLink = screen.getByRole('link', { name: 'Checklists' });
    const myChecklistsLink = screen.getByRole('link', { name: 'My Checklists' });
    expect(checklistsLink).toHaveAttribute('href', '/checklists');
    expect(myChecklistsLink).toHaveAttribute('href', '/my-checklists');

    const card = checklistsLink.closest('.mhd-module-card');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByRole('link', { name: 'My Checklists' })).toBe(
      myChecklistsLink,
    );
    expect(card?.querySelectorAll('a')).toHaveLength(2);
  });

  it('keeps a child reachable when its parent is inaccessible', async () => {
    mockAuth(['Employee']);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'My Checklists' })).toHaveAttribute(
      'href',
      '/my-checklists',
    );
    expect(screen.queryByRole('link', { name: 'Checklists' })).not.toBeInTheDocument();
  });

  it('finds nested children in search results', async () => {
    mockAuth(['Platform Admin']);
    const user = userEvent.setup();

    await renderModuleLinks();
    await user.type(screen.getByRole('textbox', { name: 'Search modules' }), 'my checklists');

    expect(screen.getByRole('link', { name: 'My Checklists' })).toHaveAttribute(
      'href',
      '/my-checklists',
    );
  });

  it('shows comingSoon modules with a badge alongside live modules', async () => {
    mockAuth(['Platform Admin']);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: 'Tasks' })).not.toHaveTextContent('Coming Soon');
    const propertyLink = screen.getByRole('link', { name: 'Property' });
    expect(propertyLink).toHaveAttribute('href', '/property');
    expect(propertyLink).toHaveTextContent('Coming Soon');
    const onboardingLink = screen.getByRole('link', { name: 'Onboarding' });
    expect(onboardingLink).toHaveAttribute('href', '/onboarding');
    expect(onboardingLink).not.toHaveTextContent('Coming Soon');
  });

  it('shows a live child chip inside its parent card without a badge', async () => {
    mockAuth(['Platform Admin']);

    await renderModuleLinks();

    const feedbackLink = screen.getByRole('link', { name: 'Feedback Requests' });
    expect(feedbackLink).not.toHaveTextContent('Coming Soon');
    expect(feedbackLink.closest('.mhd-module-card')).toBe(
      screen.getByRole('link', { name: 'Performance' }).closest('.mhd-module-card'),
    );
  });

  it('shows a role-appropriate mix of live and comingSoon modules for a Client User, never an inaccessible one', async () => {
    mockAuth(['Employee']);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Property' })).toHaveTextContent('Coming Soon');
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Onboarding' })).not.toBeInTheDocument();
  });

  it('represents every nav item the role can open, top-level or nested', async () => {
    mockAuth(['Platform Admin']);
    const { NAV_SECTIONS } = await import('@/appshell/mhdNavSections');

    await renderModuleLinks();

    const rendered = new Set(screen.getAllByRole('link').map((link) => link.getAttribute('href')));
    const expected = NAV_SECTIONS.flatMap((section) =>
      section.items.flatMap((item) => [item, ...(item.children ?? [])]),
    )
      .filter((item) => item.roles === 'ALL' || item.roles.includes('Platform Admin'))
      .map((item) => item.route);

    expect(expected.length).toBeGreaterThan(48);
    expect(expected.filter((route) => !rendered.has(route))).toEqual([]);
  });

  it('lists sub-pages as chips inside the module card', async () => {
    mockAuth(['Platform Admin']);

    await renderModuleLinks();

    const card = screen
      .getByRole('link', { name: 'Learning Management (LMS)' })
      .closest('.mhd-module-card');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByRole('link', { name: 'Curricula' })).toHaveAttribute(
      'href',
      '/training/curricula',
    );
    expect(within(card as HTMLElement).getByRole('link', { name: 'Leaderboard' })).toHaveAttribute(
      'href',
      '/training/leaderboard',
    );
  });

  it('gives Compensation its own tile for a role the route admits', async () => {
    mockAuth(['HR Admin']);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Compensation' })).toHaveAttribute(
      'href',
      '/compensation',
    );
  });

  it('does not advertise a sub-page whose inherited route rule excludes the role', async () => {
    mockAuth(['HR Specialist']);

    await renderModuleLinks();

    // /communications/routing is Platform Admin only; /communications itself is open.
    expect(screen.getByRole('link', { name: 'Communications' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Correspondence Routing' })).not.toBeInTheDocument();
  });

  it('renders nothing when no modules are visible to the role', async () => {
    vi.doMock('@/appshell/mhdNavSections', async () => {
      const { Circle } = await import('lucide-react');
      return {
        NAV_SECTIONS: [
          {
            label: 'Hidden',
            items: [
              {
                label: 'Hidden Admin',
                route: '/hidden-admin',
                icon: Circle,
                roles: ['Platform Admin'],
              },
              {
                label: 'Hidden Future',
                route: '/hidden-future',
                icon: Circle,
                roles: ['Platform Admin'],
                status: 'comingSoon',
              },
            ],
          },
        ],
      };
    });
    mockAuth(['Employee']);

    const { container } = await renderModuleLinks();

    expect(container.firstChild).toBeNull();

    // vi.doMock registers past this test's own module cache reset — neither
    // resetModules() nor clearAllMocks() in beforeEach undoes it — so without
    // this, every test after this one in file order would silently import
    // this fake, description-less NAV_SECTIONS instead of the real module.
    vi.doUnmock('@/appshell/mhdNavSections');
  });

  it('filters the grid to modules matching the search query', async () => {
    mockAuth(['Platform Admin']);
    const user = userEvent.setup();

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'People' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search modules' }), 'task');

    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'People' })).not.toBeInTheDocument();
  });

  it('search finds comingSoon modules, still badged', async () => {
    mockAuth(['Platform Admin']);
    const user = userEvent.setup();

    await renderModuleLinks();

    await user.type(screen.getByRole('textbox', { name: 'Search modules' }), 'property');

    const propertyLink = screen.getByRole('link', { name: 'Property' });
    expect(propertyLink).toBeInTheDocument();
    expect(propertyLink).toHaveTextContent('Coming Soon');
  });

  it('shows an empty state when nothing matches, with no module cards', async () => {
    mockAuth(['Platform Admin']);
    const user = userEvent.setup();

    await renderModuleLinks();
    await user.type(
      screen.getByRole('textbox', { name: 'Search modules' }),
      'zzz-nonexistent-module',
    );

    expect(screen.getByText('No modules match “zzz-nonexistent-module”.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('clearing the search restores the full default view', async () => {
    mockAuth(['Platform Admin']);
    const user = userEvent.setup();

    await renderModuleLinks();
    await user.type(screen.getByRole('textbox', { name: 'Search modules' }), 'onboarding');
    expect(screen.getByRole('link', { name: 'Onboarding' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByRole('link', { name: 'Onboarding' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
  });

  it('never surfaces a module the role cannot access, even when the query matches', async () => {
    mockAuth(['Employee']);
    const user = userEvent.setup();

    await renderModuleLinks();
    await user.type(screen.getByRole('textbox', { name: 'Search modules' }), 'user');

    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('shows an alert badge on a tile whose module has a nonzero attention count', async () => {
    mockAuth(['Platform Admin']);
    mockModuleAlerts({ '/tasks': 3, '/approvals': 0 });

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks, 3 need attention' })).toBeInTheDocument();
  });

  it('uses singular phrasing for a count of exactly one', async () => {
    mockAuth(['Platform Admin']);
    mockModuleAlerts({ '/tasks': 0, '/approvals': 1 });

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Approvals, 1 needs attention' })).toBeInTheDocument();
  });

  it('shows no badge and the plain label when every count is zero or alerts have not loaded yet', async () => {
    mockAuth(['Platform Admin']);
    mockModuleAlerts({});

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Approvals' })).toBeInTheDocument();
  });

  it('badges any module that has a count — not a fixed subset — and its sub-page chips too', async () => {
    mockAuth(['Platform Admin']);
    mockModuleAlerts({ '/people': 4, '/forms/library': 2 });

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'People, 4 need attention' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Form Library, 2 need attention' }),
    ).toBeInTheDocument();
  });
});
