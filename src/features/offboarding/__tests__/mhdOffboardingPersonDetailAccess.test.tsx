import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const { listCasesMock, rolesRef } = vi.hoisted(() => ({
  listCasesMock: vi.fn(),
  rolesRef: { current: [] as MhdAuthRoleName[] },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      id: 'person-1',
      companyId: 'company-1',
      companyName: 'Acme',
      displayName: 'Pat Person',
      firstName: 'Pat',
      lastName: 'Person',
      preferredName: null,
      referenceId: 'PERS-000001',
      primaryEmail: 'pat@example.test',
      primaryPhone: null,
      primaryMobile: null,
      createdAt: '2026-07-19T00:00:00Z',
      updatedAt: '2026-07-19T00:00:00Z',
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: rolesRef.current }),
}));
vi.mock('@/features/onboarding/Hook', () => ({
  useMhdOnboardingPacket: () => ({
    items: [],
    completedCount: 0,
    requiredItems: [],
    isFullyOnboarded: false,
    isLoading: false,
    errorMessage: null,
  }),
}));
vi.mock('@/features/onboarding/components/MhdOnboardingChecklistPage', () => ({
  MhdOnboardingChecklistPage: () => <div>Onboarding summary</div>,
}));
vi.mock('@/features/activities/Hook', () => ({
  useMhdActivities: () => ({ data: [], isLoading: false, error: null }),
}));
vi.mock('@/features/activities/components/MhdActivityList', () => ({
  MhdActivityList: () => <div>Activity history</div>,
}));
vi.mock('@/features/performance/Hook', () => ({
  useMhdPerformanceReviews: () => ({ data: [], isLoading: false, error: null }),
}));
vi.mock('../Hook', () => ({
  useMhdOffboardingCases: (filters: unknown) => {
    listCasesMock(filters);
    return { data: [], isLoading: false, error: null };
  },
}));

const { MhdPersonDetailPage } = await import('@/appshell/components/MhdPersonDetailPage');

function renderPersonDetail() {
  render(
    <MemoryRouter initialEntries={['/people/person-1']}>
      <Routes>
        <Route path="/people/:personId" element={<MhdPersonDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('person-detail Offboarding section access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the section and enables its person-scoped query for a Client Admin', () => {
    rolesRef.current = ['Client Admin'];
    renderPersonDetail();

    expect(screen.getByRole('heading', { name: 'Offboarding' })).toBeInTheDocument();
    expect(listCasesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        personId: 'person-1',
      }),
    );
  });

  it.each<MhdAuthRoleName>(['Client User', 'Viewer'])(
    'does not render or enable the section for a %s',
    (role) => {
      rolesRef.current = [role];
      renderPersonDetail();

      expect(screen.queryByRole('heading', { name: 'Offboarding' })).not.toBeInTheDocument();
      expect(listCasesMock).toHaveBeenCalledWith(expect.objectContaining({ companyId: '' }));
    },
  );
});
