import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdCommandCenterItem } from '../Types';

const { mockUseMhdAuth, mockUseMhdCommandCenterList } = vi.hoisted(() => ({
  mockUseMhdAuth: vi.fn(),
  mockUseMhdCommandCenterList: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

vi.mock('../Hook', () => ({
  useMhdCommandCenterList: (...args: unknown[]) => mockUseMhdCommandCenterList(...args),
}));

vi.mock('../components/MhdCommandCenterLogActivityModal', () => ({
  MhdCommandCenterLogActivityModal: () => null,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

const { MhdCommandCenterPage } = await import('../components/MhdCommandCenterPage');

const baseItem: MhdCommandCenterItem = {
  itemId: 'item-1',
  entityType: 'TASK',
  entityId: 'task-1',
  referenceId: 'TASK-000001',
  title: 'Review handbook',
  statusRaw: 'OPEN',
  statusCategory: 'OPEN',
  isAlert: false,
  personId: 'person-1',
  personName: 'Pat Person',
  companyId: 'company-1',
  primaryDate: '2026-07-18T15:00:00.000Z',
  linkPath: '/tasks/task-1',
  isSensitiveCategoryOnly: false,
};

function mockAuth(roles: MhdAuthRoleName[], companyId = 'company-1') {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'user@myhrdepot.com',
    authUserId: 'auth-user-1',
    profile: companyId
      ? {
          userId: 'user-1',
          companyId,
          companyName: 'Acme Co',
          isAdmin: false,
          personId: 'person-1',
          displayName: 'Pat Person',
          firstName: 'Pat',
          lastName: 'Person',
          email: 'user@myhrdepot.com',
          roleNames: roles,
        }
      : null,
    roles,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdCommandCenterList.mockReturnValue({ data: [], isLoading: false, error: null });
});

describe('MhdCommandCenterPage role gating', () => {
  it.each([['Platform Admin'], ['HR Partner'], ['Client Admin']])(
    'shows the scope selector for %s', (role) => {
      mockAuth([role as MhdAuthRoleName]);

      render(<MemoryRouter><MhdCommandCenterPage /></MemoryRouter>);

      expect(screen.getByText('Scope')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
    },
  );

  it('hides the scope selector for an Employee', () => {
    mockAuth(['Employee']);

    render(<MemoryRouter><MhdCommandCenterPage /></MemoryRouter>);

    expect(screen.queryByText('Scope')).not.toBeInTheDocument();
    expect(screen.queryByText('Company')).not.toBeInTheDocument();
  });

  it('shows Log Activity for a mutating role with a company profile', () => {
    mockAuth(['Employee']);

    render(<MemoryRouter><MhdCommandCenterPage /></MemoryRouter>);

    expect(screen.getByText('Log Activity')).toBeInTheDocument();
  });

  it('hides Log Activity for a non-mutating role', () => {
    mockAuth(['Viewer']);

    render(<MemoryRouter><MhdCommandCenterPage /></MemoryRouter>);

    expect(screen.queryByText('Log Activity')).not.toBeInTheDocument();
  });

  it('renders the empty state when the list has no rows', () => {
    mockAuth(['Employee']);

    render(<MemoryRouter><MhdCommandCenterPage /></MemoryRouter>);

    expect(screen.getByText('No command center items')).toBeInTheDocument();
  });

  it('renders a returned row in the table', () => {
    mockAuth(['Employee']);
    mockUseMhdCommandCenterList.mockReturnValue({ data: [baseItem], isLoading: false, error: null });

    render(<MemoryRouter><MhdCommandCenterPage /></MemoryRouter>);

    expect(screen.getByText('Review handbook')).toBeInTheDocument();
  });
});
