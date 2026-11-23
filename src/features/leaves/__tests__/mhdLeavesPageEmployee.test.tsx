import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdLeaveCaseFilters, MhdLeaveCaseSummary } from '../Types';

const EMPLOYEE_PERSON_ID = crypto.randomUUID();
const COMPANY_ID = crypto.randomUUID();

const { rolesRef, casesRef, casesHookMock } = vi.hoisted(() => ({
  rolesRef: { current: [] as MhdAuthRoleName[] },
  casesRef: { current: [] as unknown[] },
  casesHookMock: vi.fn(),
}));

const draftController = vi.hoisted(() => ({
  current: {
    draft: null as null | {
      payload: Record<string, unknown>;
      stepKey: string | null;
      updatedAt: string;
    },
    isLoading: false,
    isSaving: false,
    savedAt: null as string | null,
    saveError: null as string | null,
    save: vi.fn(),
    discard: vi.fn(),
  },
}));
vi.mock('@/features/drafts/Hook', () => ({ useMhdDraft: () => draftController.current }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    roles: rolesRef.current,
    profile: { companyId: COMPANY_ID, personId: EMPLOYEE_PERSON_ID },
  }),
}));

vi.mock('../Hook', () => ({
  useMhdLeaveCases: (filters: MhdLeaveCaseFilters) => {
    casesHookMock(filters);
    return { data: casesRef.current, isLoading: false };
  },
}));

vi.mock('@/features/people/Hook', () => ({
  useMhdPeoplePicker: () => ({
    data: [{ id: 'person-9', firstName: 'Tobias', lastName: 'Lindqvist' }],
  }),
}));

vi.mock('@/features/benefit-intake/Hook', () => ({
  useMhdBenefitIntakeDrafts: () => ({ data: [] }),
}));

vi.mock('@/components/ui/MhdBenefitIntakeButton', () => ({
  MhdBenefitIntakeButton: () => <button type="button">Start Request</button>,
  default: () => <button type="button">Start Request</button>,
}));

vi.mock('@/components/ui/MhdDocumentMergeBatchLauncher', () => ({
  MhdDocumentMergeBatchLauncher: () => null,
}));

const { MhdLeavesPage } = await import('../components/MhdLeavesPage');

function leaveCase(overrides: Partial<MhdLeaveCaseSummary>): MhdLeaveCaseSummary {
  return {
    id: crypto.randomUUID(),
    referenceId: 'LV-004127',
    personId: EMPLOYEE_PERSON_ID,
    personDisplayName: 'Ingrid Valdivia',
    reasonCategory: 'MEDICAL',
    fileCategory: 'hr',
    status: 'APPROVED',
    requestedStart: '2026-09-14',
    requestedEnd: '2026-10-23',
    basisCount: 2,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/leaves']}>
      <MhdLeavesPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  casesRef.current = [];
  draftController.current.draft = null;
  draftController.current.savedAt = null;
  draftController.current.save.mockResolvedValue(undefined);
  draftController.current.discard.mockResolvedValue(undefined);
});

describe('MhdLeavesPage as an Employee', () => {
  beforeEach(() => {
    rolesRef.current = ['Employee'];
  });

  it('asks the service for their own person only and lists exactly what comes back', () => {
    casesRef.current = [
      leaveCase({ referenceId: 'LV-004127' }),
      leaveCase({ referenceId: 'LV-004390', reasonCategory: 'FAMILY', status: 'REQUESTED' }),
    ];
    renderPage();

    expect(casesHookMock).toHaveBeenCalledWith(
      expect.objectContaining({ personId: EMPLOYEE_PERSON_ID, companyId: COMPANY_ID }),
    );
    expect(screen.getByText('LV-004127')).toBeInTheDocument();
    expect(screen.getByText('LV-004390')).toBeInTheDocument();
    expect(screen.getByText('Your leave cases and their status.')).toBeInTheDocument();
  });

  it('shows no Employee column, employee filter or administrator actions', () => {
    casesRef.current = [leaveCase({})];
    renderPage();

    expect(screen.queryByRole('columnheader', { name: 'Employee' })).not.toBeInTheDocument();
    expect(screen.queryByText('Ingrid Valdivia')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Employee')).not.toBeInTheDocument();
    for (const name of [
      'Open Leave Case',
      'Request Leave',
      'Submit Via Form',
      'Start guided intake',
      'Policy Library',
      'Leave Policy',
      'New Leave Case (via Form)',
    ]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
    }
    // The one way in for everyone is the intake modal.
    expect(screen.getAllByRole('button', { name: 'Start Request' })).toHaveLength(1);
  });

  it('links each case to its detail page and offers no edit link', () => {
    const own = leaveCase({ referenceId: 'LV-005218' });
    casesRef.current = [own];
    renderPage();

    const row = screen.getByText('LV-005218').closest('tr');
    expect(row).not.toBeNull();
    const hrefs = within(row as HTMLElement)
      .queryAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(hrefs.every((href) => href === `/leaves/${own.id}`)).toBe(true);
    expect(within(row as HTMLElement).queryByRole('link', { name: /edit/i })).toBeNull();
  });

  it('says so when the service returns no cases', () => {
    renderPage();
    expect(screen.getByText('No leave cases on record.')).toBeInTheDocument();
  });
});

describe('MhdLeavesPage as an administrator', () => {
  it('asks for the whole company and shows the Employee column and actions', () => {
    rolesRef.current = ['HR Partner'];
    casesRef.current = [leaveCase({ personDisplayName: 'Tobias Lindqvist' })];
    renderPage();

    expect(casesHookMock).toHaveBeenCalledWith(expect.objectContaining({ personId: null }));
    expect(screen.getByRole('columnheader', { name: 'Employee' })).toBeInTheDocument();
    expect(screen.getAllByText('Tobias Lindqvist').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Start Request' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Open Leave Case' })).not.toBeInTheDocument();
  });
});
