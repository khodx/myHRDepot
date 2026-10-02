import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  open: vi.fn(),
  launch: vi.fn(),
  plan: null as Record<string, unknown> | null,
  planInputs: [] as unknown[],
  obligations: null as Record<string, unknown> | null,
  property: [] as Array<{ id: string; itemName: string; quantity: number }>,
  ceremonySteps: [] as Array<{
    key: string;
    label: string;
    status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  }>,
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    profile: { companyId: 'company-north', userId: 'user-operator' },
    roles: [],
  }),
}));

vi.mock('@/utils/useMhdModuleComplianceReadiness', () => ({
  useMhdModuleComplianceReadiness: () => ({ data: null }),
}));

vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: { templateKey: string; entityType: string; entityId: string }) => (
    <p>
      Document step: {props.templateKey} for {props.entityType} {props.entityId}
    </p>
  ),
}));

vi.mock('../Hook', () => ({
  useMhdOffboardingPeople: () => ({
    data: [
      { id: 'person-maria', displayName: 'Maria Alvarez' },
      { id: 'person-devon', displayName: 'Devon Brooks' },
    ],
  }),
  useMhdOffboardingUsers: () => ({ data: [{ id: 'user-sam', displayName: 'Samir Patel' }] }),
  useMhdOffboardingOutstandingProperty: () => ({ data: state.property, isLoading: false }),
  useMhdOffboardingNoticePlan: (input: unknown) => {
    state.planInputs.push(input);
    return {
      data: input ? state.plan : undefined,
      isLoading: false,
      isError: false,
    };
  },
  useMhdOffboardingObligations: () => ({
    data: state.obligations,
    isLoading: false,
    isError: false,
  }),
  useMhdOpenOffboardingFromIntake: () => ({ mutateAsync: state.open }),
  useMhdExitDocumentCeremony: () => ({
    launch: state.launch,
    isLaunching: false,
    steps: state.ceremonySteps,
  }),
}));

const { MhdOffboardingWizard } = await import('../components/MhdOffboardingWizard');

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/offboarding/new']}>
      <Routes>
        <Route path="/offboarding/new" element={<MhdOffboardingWizard />} />
        <Route path="/offboarding/:caseId" element={<p>Case opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}
function choosePerson() {
  fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'person-maria' } });
}
function chooseDate(label: string, value = '06/01/2026') {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
  state.open.mockReset().mockResolvedValue({ id: 'case-off-204', referenceId: 'OFFC-204' });
  state.launch.mockReset().mockResolvedValue({});
  state.planInputs = [];
  state.plan = {
    advisories: ['Rules are recommendations only.'],
    items: [
      {
        noticeKey: 'FINAL_PAY',
        jurisdiction: 'Federal',
        ruleId: 'rule-final-pay',
        recommendedDue: '2026-06-01',
        applies: true,
        notApplicableReason: null,
        citation: '29 CFR 1',
        summary: 'Final pay notice',
      },
      {
        noticeKey: 'WARN_NOTICE',
        jurisdiction: 'Federal',
        ruleId: 'rule-warn',
        recommendedDue: '2026-06-01',
        applies: true,
        notApplicableReason: null,
        citation: '29 USC 1',
        summary: 'WARN notice',
      },
    ],
  };
  state.obligations = {
    leaveVisible: true,
    leaveCases: [],
    accommodationVisible: true,
    accommodationCases: [],
    conductCases: [],
  };
  state.property = [];
  state.ceremonySteps = [];
});

describe('MhdOffboardingWizard', () => {
  it('walks every step, opens once, renders output, and opens the case', async () => {
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    next();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Offboarding Case Opened')).toBeInTheDocument();
    expect(state.open).toHaveBeenCalledTimes(1);
    expect(state.open).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-north',
        personId: 'person-maria',
        separationType: 'RESIGNATION',
        separationDate: '2026-06-01',
      }),
    );
    expect(
      screen.getByText('Document step: OFFBOARDING_SUMMARY for OFFBOARDING_CASE case-off-204'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Case' }));
    expect(await screen.findByText('Case opened')).toBeInTheDocument();
  });

  it('validates employee, separation date, and working-day order', () => {
    renderWizard();
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an employee.');
    choosePerson();
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the separation date.');
    chooseDate('Separation date');
    chooseDate('Last working day', '05/01/2026');
    next();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The last working day cannot be before the separation date.',
    );
  });

  it('passes the state and the type-specific inputs to the plan, and shows only the fields that type needs', () => {
    renderWizard();
    expect(state.planInputs.at(-1)).toBeNull();
    choosePerson();
    chooseDate('Separation date');
    fireEvent.change(screen.getByLabelText('Governing state'), { target: { value: 'CA' } });
    fireEvent.change(screen.getByLabelText('Notice given (days)'), { target: { value: '14' } });
    expect(state.planInputs.at(-1)).toMatchObject({
      companyId: 'company-north',
      personId: 'person-maria',
      separationType: 'RESIGNATION',
      separationDate: '2026-06-01',
      stateCode: 'CA',
      noticeGivenDays: 14,
    });
    expect(screen.queryByLabelText('Employees affected')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Separation type'), { target: { value: 'LAYOFF' } });
    expect(screen.queryByLabelText('Notice given (days)')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Employees affected'), { target: { value: '60' } });
    const layoff = state.planInputs.at(-1) as Record<string, unknown>;
    expect(layoff).toMatchObject({ separationType: 'LAYOFF', layoffCount: 60 });
    expect(layoff).not.toHaveProperty('noticeGivenDays');
  });

  it('requires and sends a later-date deviation, and omits unchecked notices', async () => {
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    fireEvent.change(screen.getAllByLabelText('Planned date')[0], {
      target: { value: '06/03/2026' },
    });
    next();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Record why the Final Pay is planned after its recommended date.',
    );
    fireEvent.change(screen.getByLabelText('Why is this later than recommended?'), {
      target: { value: 'Payroll cutoff.' },
    });
    fireEvent.click(screen.getAllByLabelText('Plan this notice')[0]);
    next();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.open).toHaveBeenCalled());
    expect(state.open.mock.calls[0][0].notices).toEqual([
      { noticeKey: 'WARN_NOTICE', plannedDue: '2026-06-01', deviationReason: null },
    ]);
  });

  it('sends the reason with a later date, and drops it when the date is put back', async () => {
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    fireEvent.change(screen.getAllByLabelText('Planned date')[0], {
      target: { value: '06/03/2026' },
    });
    fireEvent.change(screen.getByLabelText('Why is this later than recommended?'), {
      target: { value: 'Payroll cutoff.' },
    });
    next();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.open).toHaveBeenCalledTimes(1));
    expect(state.open.mock.calls[0][0].notices[0]).toEqual({
      noticeKey: 'FINAL_PAY',
      plannedDue: '2026-06-03',
      deviationReason: 'Payroll cutoff.',
    });
  });

  it('shows the reason for a notice that does not apply and cannot plan it', () => {
    state.plan = {
      advisories: [],
      items: [
        {
          noticeKey: 'WARN_NOTICE',
          jurisdiction: 'California',
          ruleId: 'warn-ca',
          recommendedDue: '2026-04-02',
          applies: false,
          notApplicableReason: 'Fewer than 50 employees are affected',
          citation: 'Cal. Lab. Code 1400-1408',
          summary: 'Cal-WARN',
        },
      ],
    };
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    expect(screen.getByText('Fewer than 50 employees are affected')).toBeInTheDocument();
    expect(screen.queryByLabelText('Plan this notice')).not.toBeInTheDocument();
  });

  it('explains non-applicable and not-yet-evaluable notices', () => {
    state.plan = {
      advisories: [],
      items: [
        {
          noticeKey: 'WARN_NOTICE',
          jurisdiction: 'Federal',
          ruleId: 'warn',
          recommendedDue: '2026-06-01',
          applies: null,
          notApplicableReason: null,
          citation: 'citation',
          summary: 'WARN',
        },
      ],
    };
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    expect(screen.getByText(/Enter the number of employees affected/)).toBeInTheDocument();
  });

  it('validates checklist titles and sends checklist items', async () => {
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Add Checklist Item' }));
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('Give each checklist item a title.');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Collect badge' } });
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.open).toHaveBeenCalled());
    expect(state.open.mock.calls[0][0].customItems[0]).toMatchObject({ title: 'Collect badge' });
  });

  it('requires review of open matters and hides invisible leave details', () => {
    state.obligations = {
      leaveVisible: false,
      leaveCases: [{ referenceId: 'LEAVE-18', status: 'OPEN' }],
      accommodationVisible: true,
      accommodationCases: [],
      conductCases: [{ referenceId: 'COND-7', status: 'OPEN' }],
    };
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    next();
    next();
    expect(screen.getByText('Leave matters are not visible to your role.')).toBeInTheDocument();
    expect(screen.queryByText(/diagnos|medical|reason/i)).not.toBeInTheDocument();
    next();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Confirm you have reviewed the open matters.',
    );
  });

  it('shows a server refusal on review and retries without a second successful local creation', async () => {
    state.open
      .mockRejectedValueOnce(new Error('The employee already has an active case.'))
      .mockResolvedValueOnce({ id: 'case-off-205', referenceId: 'OFFC-205' });
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    next();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The employee already has an active case.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Offboarding Case Opened')).toBeInTheDocument();
    expect(state.open).toHaveBeenCalledTimes(2);
  });

  it('runs the exit acknowledgment ceremony and allows retry after failure', async () => {
    renderWizard();
    choosePerson();
    chooseDate('Separation date');
    next();
    next();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await screen.findByText('Offboarding Case Opened');
    fireEvent.click(
      screen.getByRole('button', { name: 'Issue Exit Acknowledgment For Signature' }),
    );
    await waitFor(() =>
      expect(state.launch).toHaveBeenCalledWith('case-off-204', { actorUserId: 'user-operator' }),
    );
    state.launch.mockRejectedValueOnce(new Error('Signature service failed.'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Issue Exit Acknowledgment For Signature' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Signature service failed.');
  });
});
