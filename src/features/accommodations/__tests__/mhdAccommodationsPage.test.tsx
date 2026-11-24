import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdComplianceReadiness } from '@/types/mhdCompliance';
import type { MhdAccommodationSummary } from '../Types';

const EMPLOYEE_PERSON_ID = crypto.randomUUID();
const COMPANY_ID = crypto.randomUUID();

const { rolesRef, casesRef, readinessRef, casesHookMock } = vi.hoisted(() => ({
  rolesRef: { current: [] as MhdAuthRoleName[] },
  casesRef: { current: [] as unknown[] },
  readinessRef: { current: null as unknown },
  casesHookMock: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    roles: rolesRef.current,
    profile: { companyId: COMPANY_ID, personId: EMPLOYEE_PERSON_ID },
  }),
}));

vi.mock('../Hook', () => ({
  useMhdAccommodationCases: (companyId: string | null, status: string, personId: string | null) => {
    casesHookMock(companyId, status, personId);
    return { data: casesRef.current, isLoading: false };
  },
  useMhdAccommodationPeople: () => ({
    data: [{ id: 'person-9', firstName: 'Tobias', lastName: 'Lindqvist', displayName: 'Toby' }],
  }),
  useMhdAccommodationReadiness: () => ({ data: readinessRef.current }),
}));

vi.mock('../components/MhdAccommodationTeamPanel', () => ({
  MhdAccommodationTeamPanel: () => null,
}));

vi.mock('@/features/benefit-intake/Hook', () => ({
  useMhdBenefitIntakeDrafts: () => ({ data: [] }),
}));

vi.mock('@/components/ui/MhdBenefitIntakeButton', () => ({
  MhdBenefitIntakeButton: () => <button type="button">Start Request</button>,
  default: () => <button type="button">Start Request</button>,
}));

const { MhdAccommodationsPage } = await import('../components/MhdAccommodationsPage');

function summary(overrides: Partial<MhdAccommodationSummary>): MhdAccommodationSummary {
  return {
    id: crypto.randomUUID(),
    referenceId: 'RA-0341',
    personId: EMPLOYEE_PERSON_ID,
    personDisplayName: 'Odalys Brennan',
    requestSource: 'SELF',
    requestChannel: 'VERBAL',
    requestedAt: '2026-10-05T14:00:00.000Z',
    status: 'INTERACTIVE_PROCESS',
    ownerUserId: null,
    leaveCaseId: null,
    currentDecision: null,
    reviewDueDate: null,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/accommodations']}>
      <MhdAccommodationsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  casesRef.current = [];
  readinessRef.current = null;
});

describe('MhdAccommodationsPage compliance gate', () => {
  beforeEach(() => {
    rolesRef.current = ['HR Partner'];
  });

  it('shows the pending pre-live banner while the registry reports blockers', () => {
    readinessRef.current = {
      module_key: 'ACCOMMODATIONS',
      release_ready: false,
      blocker_count: 2,
      blockers: [],
    } satisfies MhdComplianceReadiness;
    renderPage();
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Pre-live compliance gate is active');
    expect(banner).toHaveTextContent('2 regulated content items');
  });

  it('shows no banner when the module is release-ready', () => {
    readinessRef.current = {
      module_key: 'ACCOMMODATIONS',
      release_ready: true,
      blocker_count: 0,
      blockers: [],
    } satisfies MhdComplianceReadiness;
    renderPage();
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('MhdAccommodationsPage person filter', () => {
  it('names people by their display name, as the intake picker does', () => {
    rolesRef.current = ['HR Partner'];
    renderPage();
    expect(screen.getByRole('option', { name: 'Toby' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Tobias Lindqvist' })).not.toBeInTheDocument();
  });
});

describe('MhdAccommodationsPage scope by role', () => {
  it('asks for an Employee own cases only and hides the person filter', () => {
    rolesRef.current = ['Employee'];
    casesRef.current = [summary({ referenceId: 'RA-0341' })];
    renderPage();

    expect(casesHookMock).toHaveBeenCalledWith(COMPANY_ID, 'ALL', EMPLOYEE_PERSON_ID);
    expect(screen.getByText('RA-0341')).toBeInTheDocument();
    expect(screen.queryByLabelText('Person')).toBeNull();
  });

  it('asks an administrator for the whole company and offers the person filter', () => {
    rolesRef.current = ['Client Admin'];
    casesRef.current = [summary({ personDisplayName: 'Yusuf Adeyemi' })];
    renderPage();

    expect(casesHookMock).toHaveBeenCalledWith(COMPANY_ID, 'ALL', null);
    expect(screen.getByLabelText('Person')).toBeInTheDocument();
    expect(screen.getByText('Yusuf Adeyemi')).toBeInTheDocument();
  });
});
