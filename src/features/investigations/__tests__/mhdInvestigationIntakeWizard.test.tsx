import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Finding = {
  code: string;
  severity: 'BLOCKING' | 'ADVISORY';
  personId: string;
  message: string;
};

const { openMock, conflictsRef, grievanceRef, authRef } = vi.hoisted(() => ({
  openMock: vi.fn(),
  conflictsRef: {
    current: { data: [] as Finding[], isLoading: false, isError: false },
  },
  grievanceRef: {
    current: {
      data: undefined as { grievanceWhat: string; disagreementExplanation: string } | undefined,
    },
  },
  authRef: { current: { profile: { companyId: 'company-investigations' } } },
}));

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => authRef.current }));
vi.mock('@/utils/useMhdModuleComplianceReadiness', () => ({
  useMhdModuleComplianceReadiness: () => ({ data: undefined }),
}));
vi.mock('@/features/grievances/Hook', () => ({ useMhdGrievance: () => grievanceRef.current }));
vi.mock('../Hook', () => ({
  useMhdInvestigationPeople: () => ({
    data: [
      { id: 'person-ana', displayName: 'Ana Morales' },
      { id: 'person-ben', displayName: 'Benjamin Okafor' },
    ],
  }),
  useMhdInvestigationUsers: () => ({
    data: [{ id: 'user-riley', displayName: 'Riley Chen' }],
  }),
  useMhdInvestigationConflicts: () => conflictsRef.current,
  useMhdOpenInvestigationFromIntake: () => ({ mutateAsync: openMock }),
}));
vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: {
    templateKey: string;
    entityType: string;
    entityId: string;
    allowEmployeeFile?: boolean;
  }) => (
    <p>{`Document step: ${props.templateKey} for ${props.entityType} ${props.entityId} filing=${props.allowEmployeeFile}`}</p>
  ),
}));

const { MhdInvestigationIntakeWizard } = await import('../components/MhdInvestigationIntakeWizard');

function renderWizard(entry = '/investigations/new') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/investigations/new" element={<MhdInvestigationIntakeWizard />} />
        <Route path="/investigations/:caseId" element={<p>Case opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

function alertText() {
  return screen
    .getAllByRole('alert')
    .map((node) => node.textContent)
    .join(' ');
}

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function fillIntake(concern = 'A concern about inappropriate workplace conduct.') {
  fireEvent.change(screen.getByLabelText('Allegation / concern'), { target: { value: concern } });
}

/** Intake -> Parties (none) -> Investigator -> Deadlines. */
function walkToDeadlines() {
  fillIntake();
  next();
  next();
  next();
}

beforeEach(() => {
  vi.clearAllMocks();
  conflictsRef.current = { data: [], isLoading: false, isError: false };
  grievanceRef.current = { data: undefined };
  openMock.mockResolvedValue({ id: 'case-new', referenceId: 'INV-2026-0004' });
});

describe('MhdInvestigationIntakeWizard', () => {
  it('opens once with the complete atomic intake and offers the unfiled output step', async () => {
    renderWizard();
    fillIntake();
    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'HIGH' } });
    next();

    fireEvent.click(screen.getByRole('button', { name: 'Add Party' }));
    fireEvent.change(screen.getByLabelText('Person'), { target: { value: 'person-ben' } });
    next();

    fireEvent.change(screen.getByLabelText('Investigator'), { target: { value: 'user-riley' } });
    expect(screen.getByText('No independence concerns found.')).toBeInTheDocument();
    next();

    fireEvent.change(screen.getByLabelText('Target completion date'), {
      target: { value: '12/31/2099' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Interim Measure' }));
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Keep the parties on separate schedules.' },
    });
    next();

    expect(screen.getByText(/Riley Chen/)).toBeInTheDocument();
    expect(screen.getByText(/Benjamin Okafor/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(openMock).toHaveBeenCalledTimes(1));
    expect(openMock).toHaveBeenCalledWith({
      companyId: 'company-investigations',
      caseType: 'OTHER',
      allegation: 'A concern about inappropriate workplace conduct.',
      severity: 'HIGH',
      confidentiality: 'STANDARD',
      assignedInvestigatorUserId: 'user-riley',
      parties: [
        {
          partyRole: 'COMPLAINANT',
          personId: 'person-ben',
          externalName: null,
          isConfidential: false,
          statement: null,
        },
      ],
      sourceType: null,
      sourceId: null,
      targetCompletionDate: '2099-12-31',
      interimMeasures: [
        {
          measureType: 'SEPARATION_OF_PARTIES',
          description: 'Keep the parties on separate schedules.',
          effectiveFrom: localToday(),
          reviewBy: null,
        },
      ],
    });
    expect(await screen.findByText('Investigation Opened')).toBeInTheDocument();
    expect(screen.getByText(/INV-2026-0004/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Document step: INVESTIGATION_OPENING_NOTICE for INVESTIGATION_CASE case-new filing=false',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Case' }));
    expect(await screen.findByText('Case opened')).toBeInTheDocument();
  });

  it('blocks a missing concern and a party with neither a person nor a name', () => {
    renderWizard();
    next();
    expect(alertText()).toContain('Describe the concern.');

    fillIntake();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Add Party' }));
    next();
    expect(alertText()).toContain('Each party needs a person or a name.');

    fireEvent.change(screen.getByLabelText('External name'), { target: { value: 'Morgan Lee' } });
    next();
    expect(screen.getByLabelText('Investigator')).toBeInTheDocument();
  });

  it('blocks a past target date, a measure with no description, and a review date before the start', () => {
    renderWizard();
    walkToDeadlines();

    fireEvent.change(screen.getByLabelText('Target completion date'), {
      target: { value: '01/01/2000' },
    });
    next();
    expect(alertText()).toContain('The target date cannot be in the past.');

    fireEvent.change(screen.getByLabelText('Target completion date'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Interim Measure' }));
    next();
    expect(alertText()).toContain('Describe each interim measure.');

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Temporary separation.' },
    });
    fireEvent.change(screen.getByLabelText('Review by'), { target: { value: '01/01/2000' } });
    next();
    expect(alertText()).toContain('Review date cannot be before the effective date.');
  });

  it('requires a reason for a blocking independence finding, and sends it as the acknowledgment', async () => {
    conflictsRef.current = {
      data: [
        {
          code: 'INVESTIGATOR_MANAGES_RESPONDENT',
          severity: 'BLOCKING',
          personId: 'person-ben',
          message: 'The investigator is in the respondent’s reporting line',
        },
      ],
      isLoading: false,
      isError: false,
    };
    renderWizard();
    fillIntake();
    next();
    next();
    fireEvent.change(screen.getByLabelText('Investigator'), { target: { value: 'user-riley' } });
    expect(alertText()).toContain('reporting line');
    expect(screen.getByText('Benjamin Okafor')).toBeInTheDocument();

    next();
    expect(alertText()).toContain('Record why this investigator should proceed');

    fireEvent.change(screen.getByLabelText('Why this investigator should proceed'), {
      target: { value: 'No other qualified investigator is available this month.' },
    });
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(openMock).toHaveBeenCalledTimes(1));
    expect(openMock.mock.calls[0][0].conflictAcknowledgment).toBe(
      'No other qualified investigator is available this month.',
    );
  });

  it('shows an advisory finding without blocking, and sends no acknowledgment', async () => {
    conflictsRef.current = {
      data: [
        {
          code: 'INVESTIGATOR_MANAGES_PARTY',
          severity: 'ADVISORY',
          personId: 'person-ana',
          message: 'The investigator is in a party’s reporting line',
        },
      ],
      isLoading: false,
      isError: false,
    };
    renderWizard();
    fillIntake();
    next();
    next();
    fireEvent.change(screen.getByLabelText('Investigator'), { target: { value: 'user-riley' } });
    expect(screen.getByRole('status')).toHaveTextContent('reporting line');
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(openMock).toHaveBeenCalledTimes(1));
    expect(openMock.mock.calls[0][0]).not.toHaveProperty('conflictAcknowledgment');
  });

  it('shows a failed independence check and lets the person continue', () => {
    conflictsRef.current = { data: [], isLoading: false, isError: true };
    renderWizard();
    fillIntake();
    next();
    next();
    fireEvent.change(screen.getByLabelText('Investigator'), { target: { value: 'user-riley' } });
    expect(screen.getByText(/Unable to check the investigator/)).toBeInTheDocument();
    next();
    expect(screen.getByLabelText('Target completion date')).toBeInTheDocument();
  });

  it('prefills from a grievance and links it, and ignores an unknown source type', async () => {
    grievanceRef.current = {
      data: {
        grievanceWhat: 'A grievance concern.',
        disagreementExplanation: 'The employee disagrees with the decision.',
      },
    };
    const first = renderWizard('/investigations/new?sourceType=GRIEVANCE&sourceId=grievance-7');
    expect(screen.getByText('Prompted by: Grievance')).toBeInTheDocument();
    expect(screen.getByLabelText('Case type')).toHaveValue('GRIEVANCE');
    expect(screen.getByLabelText('Allegation / concern')).toHaveValue(
      'A grievance concern.\n\nThe employee disagrees with the decision.',
    );
    next();
    next();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(openMock).toHaveBeenCalledTimes(1));
    expect(openMock.mock.calls[0][0]).toMatchObject({
      caseType: 'GRIEVANCE',
      sourceType: 'GRIEVANCE',
      sourceId: 'grievance-7',
    });
    first.unmount();

    renderWizard('/investigations/new?sourceType=PAYROLL&sourceId=anything');
    expect(screen.queryByText(/Prompted by/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Case type')).toHaveValue('OTHER');
  });

  it('shows a server refusal on Review and opens only when the retry succeeds', async () => {
    openMock.mockRejectedValueOnce(new Error('Independence check: choose another investigator.'));
    renderWizard();
    fillIntake();
    next();
    next();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Independence check');
    expect(screen.queryByText('Investigation Opened')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Investigation Opened')).toBeInTheDocument();
    expect(openMock).toHaveBeenCalledTimes(2);
  });
});
