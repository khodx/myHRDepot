import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

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
});

describe('MhdDashboardModuleLinks', () => {
  it('hides comingSoon modules for Platform Admin while showing live modules', async () => {
    mockAuth(['Platform Admin']);

    await renderModuleLinks();

    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('href', '/tasks');
    expect(screen.queryByRole('link', { name: 'Onboarding' })).not.toBeInTheDocument();
  });

  it('hides inaccessible and comingSoon modules for a Client User', async () => {
    mockAuth(['Client User']);

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
    mockAuth(['Client User']);

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
    mockAuth(['Client User']);
    const user = userEvent.setup();

    await renderModuleLinks();
    await user.type(screen.getByRole('textbox', { name: 'Search modules' }), 'user');

    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });
});
