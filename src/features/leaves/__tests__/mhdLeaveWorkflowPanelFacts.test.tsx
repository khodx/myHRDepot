import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MHD_LEAVE_FAMILY_RELATIONSHIPS, type MhdLeaveWorkflow } from '../WorkflowTypes';
import {
  mhdLeaveDraftServiceMock as drafts,
  mhdResetLeaveDraftService,
  mhdTestLeaveDraft,
} from './leaveDraftTestKit';
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

vi.mock('@/features/drafts/Service', async () => ({
  mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
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

function openEvaluate() {
  fireEvent.click(screen.getByRole('button', { name: 'Evaluate Eligibility' }));
  return screen.getByRole('dialog');
}

function enterFacts() {
  fireEvent.change(screen.getByLabelText(LABELS.weekly), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText(LABELS.employer), { target: { value: '62' } });
  fireEvent.change(screen.getByLabelText(LABELS.worksite), { target: { value: '58' } });
  fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '19' } });
  fireEvent.change(screen.getByLabelText(LABELS.hours), { target: { value: '1310' } });
}

async function evaluateAndWaitForClose(calls: number) {
  fireEvent.click(screen.getByRole('button', { name: 'Evaluate All Bases' }));
  await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(calls));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

beforeEach(() => {
  vi.clearAllMocks();
  mhdResetLeaveDraftService();
  setWorkflow();
  evaluateAsync.mockResolvedValue([]);
  bondingAsync.mockResolvedValue(undefined);
  designateAsync.mockResolvedValue('designation-1');
});

describe('MhdLeaveWorkflowPanel eligibility facts', () => {
  it('opens the evaluation as a dialog and offers no launch to a non-administrator', () => {
    renderPanel(false);
    expect(screen.queryByRole('button', { name: 'Evaluate Eligibility' })).not.toBeInTheDocument();
  });

  it('assumes no employer or service fact and cannot evaluate until each is entered', () => {
    renderPanel();
    expect(screen.queryByLabelText(LABELS.weekly)).not.toBeInTheDocument();
    const dialog = openEvaluate();
    expect(dialog).toHaveAccessibleName('Evaluate Current Facts');
    for (const label of Object.values(LABELS)) {
      expect(within(dialog).getByLabelText(label)).toHaveValue(null);
    }
    expect(screen.getByText(/none are assumed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Evaluate All Bases' })).toBeDisabled();
  });

  it('stays disabled for a negative count or zero weekly hours', () => {
    renderPanel();
    openEvaluate();
    enterFacts();
    expect(screen.getByRole('button', { name: 'Evaluate All Bases' })).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '-1' } });
    expect(screen.getByRole('button', { name: 'Evaluate All Bases' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '19' } });
    fireEvent.change(screen.getByLabelText(LABELS.weekly), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Evaluate All Bases' })).toBeDisabled();
  });

  it('sends exactly the facts that were entered and discards the draft', async () => {
    renderPanel();
    openEvaluate();
    enterFacts();
    await evaluateAndWaitForClose(1);
    expect(evaluateAsync.mock.calls[0][0]).toMatchObject({
      caseId: CASE_ID,
      employerEmployeeCount: 62,
      worksiteEmployeeCount75: 58,
      monthsOfService: 19,
      hoursWorked12Months: 1310,
      scheduledWeeklyHours: 30,
    });
    expect(drafts.discard).toHaveBeenCalledWith(
      'LEAVE_CASE_ACTION',
      `${CASE_ID}:eligibility-evaluate`,
    );
  });

  it('shows the refusal inside the dialog and keeps the facts', async () => {
    evaluateAsync.mockRejectedValueOnce(new Error('No active rule set for CFRA'));
    renderPanel();
    openEvaluate();
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate All Bases' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No active rule set for CFRA');
    expect(screen.getByLabelText(LABELS.employer)).toHaveValue(62);
  });

  it('saves the facts as a draft, the self-care answer included', async () => {
    renderPanel();
    openEvaluate();
    expect(screen.queryByText(/not saved in drafts/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Family relationship'), {
      target: { value: 'CHILD_ADULT' },
    });
    fireEvent.change(screen.getByLabelText('Incapable Of Self-Care'), {
      target: { value: 'YES' },
    });
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(drafts.save).toHaveBeenCalledTimes(1));
    const saved = drafts.save.mock.calls[0][0];
    expect(saved).toMatchObject({
      draftKind: 'LEAVE_CASE_ACTION',
      draftKey: `${CASE_ID}:eligibility-evaluate`,
      companyId: '9b5e2c71-3d84-4f1a-a6c0-58d27e4f1b93',
      payload: {
        reasonCode: 'OWN_SERIOUS_HEALTH_CONDITION',
        familyRelationship: 'CHILD_ADULT',
        weeklyHours: '30',
        employerCount: '62',
        worksiteCount: '58',
        months: '19',
        hours: '1310',
        employerAgreedBonding: false,
        coveredEmployerOverride: false,
        selfCare: 'YES',
      },
    });
  });

  it('resumes a saved evaluation draft, including the reason and relationship', async () => {
    drafts.get.mockResolvedValue(
      mhdTestLeaveDraft(`${CASE_ID}:eligibility-evaluate`, {
        reasonCode: 'FAMILY_SERIOUS_HEALTH_CONDITION',
        familyRelationship: 'PARENT',
        weeklyHours: '32',
        employerCount: '140',
      }),
    );
    renderPanel();
    openEvaluate();
    fireEvent.click(await screen.findByRole('button', { name: 'Resume Draft' }));
    expect(screen.getByLabelText('Leave reason')).toHaveValue('FAMILY_SERIOUS_HEALTH_CONDITION');
    expect(screen.getByLabelText('Family relationship')).toHaveValue('PARENT');
    expect(screen.getByLabelText(LABELS.weekly)).toHaveValue(32);
    expect(screen.getByLabelText(LABELS.employer)).toHaveValue(140);
  });

  it('resumes the saved self-care answer', async () => {
    drafts.get.mockResolvedValue(
      mhdTestLeaveDraft(`${CASE_ID}:eligibility-evaluate`, {
        familyRelationship: 'CHILD_ADULT',
        selfCare: 'YES',
      }),
    );
    renderPanel();
    openEvaluate();
    fireEvent.click(await screen.findByRole('button', { name: 'Resume Draft' }));
    expect(screen.getByLabelText('Incapable Of Self-Care')).toHaveValue('YES');
  });
});

describe('MhdLeaveWorkflowPanel relationships and bonding', () => {
  it('offers exactly the shared family-relationship vocabulary, labelled in words', () => {
    renderPanel();
    openEvaluate();
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
    openEvaluate();
    expect(screen.queryByLabelText('Incapable Of Self-Care')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Family relationship'), {
      target: { value: 'CHILD_ADULT' },
    });
    expect(screen.getByLabelText('Incapable Of Self-Care')).toHaveValue('UNKNOWN');
    enterFacts();
    await evaluateAndWaitForClose(1);
    expect(evaluateAsync.mock.calls[0][0]).not.toHaveProperty('incapableOfSelfCare');

    // The relationship is the panel's choice, so it is still chosen on reopening.
    openEvaluate();
    expect(screen.getByLabelText('Family relationship')).toHaveValue('CHILD_ADULT');
    fireEvent.change(screen.getByLabelText('Incapable Of Self-Care'), { target: { value: 'YES' } });
    enterFacts();
    await evaluateAndWaitForClose(2);
    expect(evaluateAsync.mock.calls[1][0]).toMatchObject({
      familyRelationship: 'CHILD_ADULT',
      incapableOfSelfCare: true,
    });

    openEvaluate();
    fireEvent.change(screen.getByLabelText('Incapable Of Self-Care'), { target: { value: 'NO' } });
    enterFacts();
    await evaluateAndWaitForClose(3);
    expect(evaluateAsync.mock.calls[2][0]).toMatchObject({ incapableOfSelfCare: false });
  });

  it('records the bonding event and sends employer agreement for intermittent bonding', async () => {
    setWorkflow({}, { reason_code: 'BONDING', is_intermittent: true });
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Bonding Event' }));
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
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    openEvaluate();
    fireEvent.click(screen.getByLabelText('Employer Agrees To Intermittent Bonding'));
    enterFacts();
    await evaluateAndWaitForClose(1);
    expect(evaluateAsync.mock.calls[0][0]).toMatchObject({
      reasonCode: 'BONDING',
      employerAgreedIntermittentBonding: true,
    });
  });

  it('does not offer the intermittent-bonding agreement for continuous bonding leave', () => {
    setWorkflow({}, { reason_code: 'BONDING' });
    renderPanel();
    expect(screen.getByRole('button', { name: 'Edit Bonding Event' })).toBeInTheDocument();
    openEvaluate();
    expect(
      screen.queryByLabelText('Employer Agrees To Intermittent Bonding'),
    ).not.toBeInTheDocument();
  });

  it('replaces the designated-person checkbox with the designated-person record', async () => {
    renderPanel();
    expect(screen.queryByLabelText(/designated person selected/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Designated Person' })).not.toBeInTheDocument();
    openEvaluate();
    fireEvent.change(screen.getByLabelText('Family relationship'), {
      target: { value: 'DESIGNATED_PERSON' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('heading', { name: 'Designated Person' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Designated Person' }));
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
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    openEvaluate();
    enterFacts();
    await evaluateAndWaitForClose(1);
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

  it('records a documented override in a dialog', async () => {
    setWorkflow({
      eligibility: [
        {
          id: 'det-2',
          snapshot_id: 'snap-2',
          leave_type_id: 'type-2',
          type_key: 'CFRA',
          evaluated_outcome: 'INELIGIBLE',
          effective_outcome: 'INELIGIBLE',
          findings: [],
          entitlement_hours: null,
          override_reason: null,
          confirmed_at: null,
        },
      ],
    });
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Override' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Override CFRA Determination');
    expect(screen.getByRole('button', { name: 'Record Override' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Override reason'), {
      target: { value: 'Hours worked include the agency placement period' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() =>
      expect(drafts.save.mock.calls[0][0]).toMatchObject({
        draftKey: `${CASE_ID}:eligibility-override:det-2`,
        payload: {
          outcome: 'ELIGIBLE',
          reason: 'Hours worked include the agency placement period',
        },
      }),
    );
  });
});
