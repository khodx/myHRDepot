import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
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
  });
});
