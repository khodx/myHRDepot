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
// The person-detail page also renders a privileged-only Conduct section (CND
// wave). This suite is about the Offboarding section, so the conduct cases hook
// is stubbed to a benign empty result here — unrelated to the assertions below.
vi.mock('@/features/conduct/Hook', () => ({
  useMhdConductCases: () => ({ data: [], isLoading: false, error: null }),
}));
// The person-detail page also renders a privileged-only Leaves section (LOA
// wave). This suite is about the Offboarding section, so the leaves cases hook
// is stubbed to a benign empty result here — unrelated to the assertions below.
vi.mock('@/features/leaves/Hook', () => ({
  useMhdLeaveCases: () => ({ data: [], isLoading: false, error: null }),
}));
// The person-detail page also renders a privileged-only Attendance section
// (Time & Attendance wave). This suite is about the Offboarding section, so the
// attendance hooks are stubbed to benign values here.
vi.mock('@/features/timeattendance/Hook', () => ({
  useMhdPointBalance: () => ({ data: 0, isLoading: false }),
  useMhdPointLedger: () => ({ data: [], isLoading: false }),
  useMhdAttendancePolicy: () => ({ data: null, isLoading: false }),
}));
// Likewise the privileged-only Job section (Job Descriptions wave). Its panel
// uses react-query mutations this suite's minimal react-query mock does not
// provide, so it is stubbed to a benign element — unrelated to the Offboarding
// assertions here.
vi.mock('@/features/jobs/components/MhdJobAssignmentPanel', () => ({
  MhdJobAssignmentPanel: () => <div>Job assignment</div>,
}));
// The person-detail page also renders an always-visible Direct Reports
// section (Org Chart wave). Its hook calls useQuery internally, which would
// otherwise pick up this suite's blanket react-query mock (person data, not
// an array) — unrelated to the Offboarding assertions here.
vi.mock('@/features/people/Hook', () => ({
  useMhdDirectReports: () => ({ data: [], isLoading: false, error: null }),
  useMhdPersonPhotoUrl: () => ({ data: null, isLoading: false, error: null }),
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

  it.each<MhdAuthRoleName>(['Employee', 'Viewer'])(
    'does not render or enable the section for a %s',
    (role) => {
      rolesRef.current = [role];
      renderPersonDetail();

      expect(screen.queryByRole('heading', { name: 'Offboarding' })).not.toBeInTheDocument();
      expect(listCasesMock).toHaveBeenCalledWith(expect.objectContaining({ companyId: '' }));
    },
  );
});
