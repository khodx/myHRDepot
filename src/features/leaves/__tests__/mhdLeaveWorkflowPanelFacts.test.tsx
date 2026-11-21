import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MHD_LEAVE_FAMILY_RELATIONSHIPS, type MhdLeaveWorkflow } from '../WorkflowTypes';
import { mhdTestLeaveWorkflow } from './leaveWorkflowFixture';

const CASE_ID = 'd4b91e60-2c73-4a58-9e1f-6a0c8d35b27e';

const { evaluateAsync, bondingAsync, designateAsync, workflowData } = vi.hoisted(() => ({
  evaluateAsync: vi.fn(),
  bondingAsync: vi.fn(),
  designateAsync: vi.fn(),
  workflowData: { current: null as unknown },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ authUserId: 'user-1', profile: { companyId: null }, roles: ['HR Partner'] }),
}));

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: { listTemplates: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../WorkflowHook', async () => {
  const { mhdIdleLeaveWorkflowHooks } = await import('./leaveWorkflowFixture');
  return {
    ...mhdIdleLeaveWorkflowHooks(),
    useMhdLeaveWorkflow: () => ({ isLoading: false, data: workflowData.current }),
    useMhdLeaveEligibility: () => ({ mutateAsync: evaluateAsync, isPending: false }),
    useMhdLeaveBondingEvent: () => ({ mutateAsync: bondingAsync, isPending: false }),
    useMhdLeaveDesignatedPerson: () => ({ mutateAsync: designateAsync, isPending: false }),
  };
});

const { MhdLeaveWorkflowPanel } = await import('../components/MhdLeaveWorkflowPanel');

const LABELS = {
  weekly: 'Scheduled weekly hours',
  employer: 'Employer employee count',
  worksite: 'FMLA worksite count within 75 miles',
  months: 'Months of service',
  hours: 'Hours worked in prior 12 months',
};

function setWorkflow(
  overrides: Partial<MhdLeaveWorkflow> = {},
  caseOverrides: Partial<MhdLeaveWorkflow['case']> = {},
) {
  workflowData.current = mhdTestLeaveWorkflow(CASE_ID, overrides, caseOverrides);
}

function renderPanel(privileged = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MhdLeaveWorkflowPanel caseId={CASE_ID} privileged={privileged} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function enterFacts() {
  fireEvent.change(screen.getByLabelText(LABELS.weekly), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText(LABELS.employer), { target: { value: '62' } });
  fireEvent.change(screen.getByLabelText(LABELS.worksite), { target: { value: '58' } });
  fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '19' } });
  fireEvent.change(screen.getByLabelText(LABELS.hours), { target: { value: '1310' } });
}

beforeEach(() => {
  vi.clearAllMocks();
  setWorkflow();
  evaluateAsync.mockResolvedValue([]);
  bondingAsync.mockResolvedValue(undefined);
  designateAsync.mockResolvedValue('designation-1');
});

describe('MhdLeaveWorkflowPanel eligibility facts', () => {
  it('assumes no employer or service fact and cannot evaluate until each is entered', () => {
    renderPanel();
    for (const label of Object.values(LABELS)) {
      expect(screen.getByLabelText(label)).toHaveValue(null);
    }
    expect(screen.getByText(/none are assumed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Evaluate All Bases' })).toBeDisabled();
  });

  it('stays disabled for a negative count or zero weekly hours', () => {
    renderPanel();
    enterFacts();
    expect(screen.getByRole('button', { name: 'Evaluate All Bases' })).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '-1' } });
    expect(screen.getByRole('button', { name: 'Evaluate All Bases' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '19' } });
    fireEvent.change(screen.getByLabelText(LABELS.weekly), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Evaluate All Bases' })).toBeDisabled();
  });

  it('sends exactly the facts that were entered', async () => {
    renderPanel();
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate All Bases' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    expect(evaluateAsync.mock.calls[0][0]).toMatchObject({
      caseId: CASE_ID,
      employerEmployeeCount: 62,
      worksiteEmployeeCount75: 58,
      monthsOfService: 19,
      hoursWorked12Months: 1310,
      scheduledWeeklyHours: 30,
    });
  });
});

describe('MhdLeaveWorkflowPanel relationships and bonding', () => {
  it('offers exactly the shared family-relationship vocabulary, labelled in words', () => {
    renderPanel();
    const options = Array.from(
      screen.getByLabelText('Family relationship').querySelectorAll('option'),
    );
    expect(options.map((option) => option.value)).toEqual(['', ...MHD_LEAVE_FAMILY_RELATIONSHIPS]);
    expect(options.find((option) => option.value === 'PARENT_IN_LAW')).toHaveTextContent(
      'Parent In Law',
    );
  });

  it('asks the adult-child self-care question only for CHILD_ADULT and sends the answer', async () => {
    renderPanel();
    expect(screen.queryByLabelText('Incapable Of Self-Care')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Family relationship'), {
      target: { value: 'CHILD_ADULT' },
    });
    const question = screen.getByLabelText('Incapable Of Self-Care');
    expect(question).toHaveValue('UNKNOWN');
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate All Bases' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    expect(evaluateAsync.mock.calls[0][0]).not.toHaveProperty('incapableOfSelfCare');

    fireEvent.change(question, { target: { value: 'YES' } });
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate All Bases' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(2));
    expect(evaluateAsync.mock.calls[1][0]).toMatchObject({
      familyRelationship: 'CHILD_ADULT',
      incapableOfSelfCare: true,
    });

    fireEvent.change(question, { target: { value: 'NO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate All Bases' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(3));
    expect(evaluateAsync.mock.calls[2][0]).toMatchObject({ incapableOfSelfCare: false });
  });

  it('records the bonding event and sends employer agreement for intermittent bonding', async () => {
    setWorkflow({}, { reason_code: 'BONDING', is_intermittent: true });
    renderPanel();
    expect(screen.getByRole('button', { name: 'Save Bonding Event' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Bonding event date'), {
      target: { value: '07/14/2026' },
    });
    fireEvent.blur(screen.getByLabelText('Bonding event date'));
    fireEvent.change(screen.getByLabelText('Bonding event type'), {
      target: { value: 'ADOPTION' },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save Bonding Event' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save Bonding Event' }));
    await waitFor(() =>
      expect(bondingAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        eventDate: '2026-07-14',
        eventType: 'ADOPTION',
      }),
    );

    fireEvent.click(screen.getByLabelText('Employer Agrees To Intermittent Bonding'));
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate All Bases' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    expect(evaluateAsync.mock.calls[0][0]).toMatchObject({
      reasonCode: 'BONDING',
      employerAgreedIntermittentBonding: true,
    });
  });

  it('does not offer the intermittent-bonding agreement for continuous bonding leave', () => {
    setWorkflow({}, { reason_code: 'BONDING' });
    renderPanel();
    expect(screen.getByRole('button', { name: 'Save Bonding Event' })).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Employer Agrees To Intermittent Bonding'),
    ).not.toBeInTheDocument();
  });

  it('replaces the designated-person checkbox with the designated-person record', async () => {
    renderPanel();
    expect(screen.queryByLabelText(/designated person selected/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Designated Person' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Family relationship'), {
      target: { value: 'DESIGNATED_PERSON' },
    });
    expect(screen.getByRole('heading', { name: 'Designated Person' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Designated person name'), {
      target: { value: 'Rosalind Okafor' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record Designated Person' }));
    await waitFor(() =>
      expect(designateAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        designatedName: 'Rosalind Okafor',
        relationshipNote: null,
        pflAttestedOn: null,
      }),
    );
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate All Bases' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    expect(evaluateAsync.mock.calls[0][0]).not.toHaveProperty('designatedPersonSelected');
  });

  it('renders a readable line per finding and the raw code for an unknown one', () => {
    setWorkflow({
      eligibility: [
        {
          id: 'det-1',
          snapshot_id: 'snap-1',
          leave_type_id: 'type-1',
          type_key: 'FMLA',
          evaluated_outcome: 'UNDETERMINED',
          effective_outcome: 'UNDETERMINED',
          findings: [
            { code: 'ADULT_CHILD_INCAPABLE_OF_SELF_CARE_UNKNOWN' },
            { code: 'BONDING_WINDOW_EXPIRED' },
            { code: 'SOME_FUTURE_CODE' },
          ],
          entitlement_hours: null,
          override_reason: null,
          confirmed_at: null,
        },
      ],
    });
    renderPanel();
    expect(
      screen.getByText(/adult child is incapable of self-care is not yet known/),
    ).toBeInTheDocument();
    expect(screen.getByText(/within 12 months of the birth or placement/)).toBeInTheDocument();
    expect(screen.getByText('SOME_FUTURE_CODE')).toBeInTheDocument();
  });
});
