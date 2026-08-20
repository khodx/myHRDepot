import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdOrgChartNode } from '../Types';

const { mockUseMhdAuth, mockUseMhdCompanies, mockUseMhdOrgChart } = vi.hoisted(() => ({
  mockUseMhdAuth: vi.fn(),
  mockUseMhdCompanies: vi.fn(),
  mockUseMhdOrgChart: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

vi.mock('@/features/companies/Hook', () => ({
  useMhdCompanies: (...args: unknown[]) => mockUseMhdCompanies(...args),
}));

vi.mock('@/features/people/Hook', () => ({
  useMhdOrgChart: (...args: unknown[]) => mockUseMhdOrgChart(...args),
}));

const { MhdOrgChartPage } = await import('../components/MhdOrgChartPage');

function orgNode(
  personId: string,
  displayName: string,
  managerId: string | null,
): MhdOrgChartNode {
  return {
    personId,
    referenceId: `PERS-${personId}`,
    displayName,
    jobTitle: null,
    managerId,
    companyId: 'company-1',
    children: [],
  };
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
      displayName: 'Vera Viewer',
      firstName: 'Vera',
      lastName: 'Viewer',
      email: 'user@myhrdepot.com',
      roleNames: roles,
    },
    roles,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MhdOrgChartPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdCompanies.mockReturnValue({
    data: [
      { id: 'company-1', companyName: 'Acme Co' },
      { id: 'company-2', companyName: 'Globex' },
    ],
    isLoading: false,
    error: null,
  });
  mockUseMhdOrgChart.mockReturnValue({
    data: [
      orgNode('person-1', 'Ari Executive', null),
      orgNode('person-2', 'Blair Manager', 'person-1'),
      orgNode('person-3', 'Casey Lead', 'person-2'),
    ],
    isLoading: false,
    error: null,
  });
});

describe('MhdOrgChartPage access-aware filters', () => {
  it('shows the company filter with All companies for a Platform Admin', () => {
    mockAuth(['Platform Admin']);

    renderPage();

    expect(screen.getByText('Filter by company')).toBeInTheDocument();
    expect(screen.getByText('All companies')).toBeInTheDocument();
  });

  it('hides the company filter for an HR Partner', () => {
    mockAuth(['HR Partner']);

    renderPage();

    expect(screen.queryByText('Filter by company')).not.toBeInTheDocument();
    expect(screen.queryByText('All companies')).not.toBeInTheDocument();
  });

  it('renders the org chart tree when visible nodes include reporting relationships', () => {
    mockAuth(['Employee']);

    renderPage();

    expect(screen.getByText('Blair Manager')).toBeInTheDocument();
  });

  it('shows the self-only empty state for exactly one visible node with no reports', () => {
    mockAuth(['Employee']);
    mockUseMhdOrgChart.mockReturnValue({
      data: [orgNode('person-1', 'Ari Executive', null)],
      isLoading: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText('You have no reports.')).toBeInTheDocument();
    expect(screen.queryByText('No people are visible in this org chart.')).not.toBeInTheDocument();
  });

  it('shows the genuinely empty org chart message for zero visible nodes', () => {
    mockAuth(['Employee']);
    mockUseMhdOrgChart.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText('No people are visible in this org chart.')).toBeInTheDocument();
    expect(screen.queryByText('You have no reports.')).not.toBeInTheDocument();
  });
});
