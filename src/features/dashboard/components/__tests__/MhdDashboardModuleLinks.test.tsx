import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const mockUseMhdDashboard = vi.fn();
vi.mock('../../Hook', () => ({
  useMhdDashboard: () => mockUseMhdDashboard(),
}));

function mockModuleAlerts(
  alerts: { tasksNeedsAttention: number; approvalsNeedsAttention: number; leavesNeedsAttention: number } | null,
) {
  mockUseMhdDashboard.mockReturnValue({ moduleAlerts: alerts });
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
  mockModuleAlerts(null);
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
    expect(within(card as HTMLElement).getByRole('link', { name: 'My Checklists' })).toBe(myChecklistsLink);
    expect(card?.querySelectorAll('a')).toHaveLength(2);
  });

  it('keeps a child reachable when its parent is inaccessible', async () => {
    mockAuth(['Employee']);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'My Checklists' })).toHaveAttribute('href', '/my-checklists');
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

  it('hides comingSoon modules for Platform Admin while showing live modules', async () => {
    mockAuth(['Platform Admin']);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('href', '/tasks');
    expect(screen.queryByRole('link', { name: 'Onboarding' })).not.toBeInTheDocument();
  });

  it('hides inaccessible and comingSoon modules for a Client User', async () => {
    mockAuth(['Employee']);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Onboarding' })).not.toBeInTheDocument();
  });

  it('renders nothing when no live modules are visible', async () => {
    vi.doMock('@/appshell/MhdSidebar', async () => {
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
                roles: 'ALL',
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
    vi.doUnmock('@/appshell/MhdSidebar');
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

  it('search reaches comingSoon modules the default view hides, without bypassing role', async () => {
    mockAuth(['Platform Admin']);
    const user = userEvent.setup();

    await renderModuleLinks();

    expect(screen.queryByRole('link', { name: 'Onboarding' })).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search modules' }), 'onboarding');

    const onboardingLink = screen.getByRole('link', { name: 'Onboarding' });
    expect(onboardingLink).toBeInTheDocument();
    expect(onboardingLink).toHaveTextContent('Coming Soon');
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

  it('clearing the search restores the default live-only view', async () => {
    mockAuth(['Platform Admin']);
    const user = userEvent.setup();

    await renderModuleLinks();
    await user.type(screen.getByRole('textbox', { name: 'Search modules' }), 'onboarding');
    expect(screen.getByRole('link', { name: 'Onboarding' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.queryByRole('link', { name: 'Onboarding' })).not.toBeInTheDocument();
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
    mockModuleAlerts({ tasksNeedsAttention: 3, approvalsNeedsAttention: 0, leavesNeedsAttention: 0 });

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks, 3 need attention' })).toBeInTheDocument();
  });

  it('uses singular phrasing for a count of exactly one', async () => {
    mockAuth(['Platform Admin']);
    mockModuleAlerts({ tasksNeedsAttention: 0, approvalsNeedsAttention: 1, leavesNeedsAttention: 0 });

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Approvals, 1 needs attention' })).toBeInTheDocument();
  });

  it('shows no badge and the plain label when every count is zero or alerts have not loaded yet', async () => {
    mockAuth(['Platform Admin']);
    mockModuleAlerts(null);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Approvals' })).toBeInTheDocument();
  });

  it('never badges a module with no attention-count concept, even if it were somehow present in the map', async () => {
    mockAuth(['Platform Admin']);
    mockModuleAlerts({ tasksNeedsAttention: 5, approvalsNeedsAttention: 5, leavesNeedsAttention: 5 });

    await renderModuleLinks();

    // People has no entry in ALERT_ROUTE_KEYS, so it must render with its
    // plain label regardless of what the alerts payload contains.
    expect(screen.getByRole('link', { name: 'People' })).toBeInTheDocument();
  });
});
