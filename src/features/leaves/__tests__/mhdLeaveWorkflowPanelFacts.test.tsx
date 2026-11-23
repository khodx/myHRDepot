import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdLeaveWorkflow } from '../WorkflowTypes';
import {
  mhdLeaveDraftServiceMock as drafts,
  mhdResetLeaveDraftService,
} from './leaveDraftTestKit';
import { mhdTestLeaveWorkflow } from './leaveWorkflowFixture';

const CASE_ID = 'd4b91e60-2c73-4a58-9e1f-6a0c8d35b27e';

const { runAsync, answersAsync, bondingAsync, designateAsync, workflowData, factsRef, runData } =
  vi.hoisted(() => ({
    runAsync: vi.fn(),
    answersAsync: vi.fn(),
    bondingAsync: vi.fn(),
    designateAsync: vi.fn(),
    workflowData: { current: null as unknown },
    factsRef: { current: null as unknown },
    runData: { current: undefined as unknown },
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
    useMhdRunLeaveEligibility: () => ({
      mutateAsync: runAsync,
      isPending: false,
      data: runData.current,
    }),
    useMhdLeaveEligibilityFacts: () => ({ data: factsRef.current }),
    useMhdSetLeaveCaseAnswers: () => ({ mutateAsync: answersAsync, isPending: false }),
    useMhdLeaveBondingEvent: () => ({ mutateAsync: bondingAsync, isPending: false }),
    useMhdLeaveDesignatedPerson: () => ({ mutateAsync: designateAsync, isPending: false }),
  };
});

const { MhdLeaveWorkflowPanel } = await import('../components/MhdLeaveWorkflowPanel');

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

const FACTS = {
  snapshotId: 'snap-1',
  asOfDate: '2026-11-23',
  employerEmployeeCount: 64,
  monthsOfService: 31.5,
  hoursWorked12Months: 1412,
  worksiteEmployeeCount75: 58,
  scheduledWeeklyHours: 40,
  provenance: {
    source: 'COMPANY_RECORDS',
    worksite_name: 'Sacramento Distribution Center',
    worksite_employees_near_boundary: 3,
    worksite_confirmation_needed: true,
    employees_without_worksite: 2,
  },
  createdAt: '2026-11-23T17:00:00Z',
  adultChildIncapableOfSelfCare: null,
  employerAgreedIntermittentBonding: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mhdResetLeaveDraftService();
  setWorkflow();
  factsRef.current = null;
  runData.current = undefined;
  runAsync.mockResolvedValue({ ran: true, snapshotId: 'snap-1', blockers: [] });
  answersAsync.mockResolvedValue(undefined);
  bondingAsync.mockResolvedValue(undefined);
  designateAsync.mockResolvedValue('designation-1');
});

describe('MhdLeaveWorkflowPanel evaluation', () => {
  it('offers no evaluation to a non-administrator, who sees the verification status instead', () => {
    renderPanel(false);
    expect(screen.queryByRole('button', { name: 'Run Evaluation' })).not.toBeInTheDocument();
    expect(screen.getByText('Awaiting HR verification')).toBeInTheDocument();
  });

  it('runs the evaluation with no typed facts', async () => {
    renderPanel();
    expect(screen.queryByLabelText(/months of service|hours worked|employee count/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Run Evaluation' }));
    await waitFor(() => expect(runAsync).toHaveBeenCalledTimes(1));
    expect(runAsync).toHaveBeenCalledWith();
  });

  it('explains in plain language why an evaluation could not run', () => {
    runData.current = { ran: false, snapshotId: null, blockers: ['SCHEDULE_ASSIGNMENT_REQUIRED'] };
    renderPanel();
    expect(screen.getByText(/schedule assignment is required/i)).toBeInTheDocument();
  });

  it('shows HR the facts the evaluation used, with the 75-mile boundary warning', () => {
    factsRef.current = FACTS;
    renderPanel();
    expect(screen.getByText('Facts Used In This Evaluation')).toBeInTheDocument();
    expect(screen.getByText('1412')).toBeInTheDocument();
    expect(
      screen.getByText(/Employees within 75 miles of Sacramento Distribution Center/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/HR confirmation needed: 3 employees are near the 75-mile boundary/),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 employees have no worksite assignment/)).toBeInTheDocument();
  });

  it('shows no facts card when no evaluation has run', () => {
    renderPanel();
    expect(screen.queryByText('Facts Used In This Evaluation')).not.toBeInTheDocument();
  });
});

describe('MhdLeaveWorkflowPanel eligibility answers', () => {
  it('asks the adult-child question only for an adult-child relationship and saves the answer', async () => {
    setWorkflow(
      {},
      { reason_code: 'FAMILY_SERIOUS_HEALTH_CONDITION', family_relationship: 'CHILD_ADULT' },
    );
    renderPanel();
    const select = screen.getByLabelText(/unable to care for themself/i);
    expect(select).toHaveValue('UNKNOWN');
    fireEvent.change(select, { target: { value: 'YES' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Answers' }));
    await waitFor(() =>
      expect(answersAsync).toHaveBeenCalledWith({
        adultChildIncapableOfSelfCare: true,
        employerAgreedIntermittentBonding: null,
      }),
    );
  });

  it('asks about employer agreement only for intermittent bonding leave', async () => {
    setWorkflow({}, { reason_code: 'BONDING', is_intermittent: true });
    renderPanel();
    expect(screen.queryByLabelText(/unable to care for themself/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Employer agrees to intermittent bonding/i), {
      target: { value: 'NO' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Answers' }));
    await waitFor(() =>
      expect(answersAsync).toHaveBeenCalledWith({
        adultChildIncapableOfSelfCare: null,
        employerAgreedIntermittentBonding: false,
      }),
    );
  });

  it('shows the saved answers from the latest evaluation', () => {
    factsRef.current = { ...FACTS, adultChildIncapableOfSelfCare: false };
    setWorkflow(
      {},
      { reason_code: 'FAMILY_SERIOUS_HEALTH_CONDITION', family_relationship: 'CHILD_ADULT' },
    );
    renderPanel();
    expect(screen.getByLabelText(/unable to care for themself/i)).toHaveValue('NO');
  });

  it('asks neither question for an ordinary own-health leave', () => {
    renderPanel();
    expect(screen.queryByText('Eligibility Answers')).not.toBeInTheDocument();
  });
});

describe('MhdLeaveWorkflowPanel relationships and bonding', () => {
  it('records the bonding event', async () => {
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
  });

  it('does not offer the bonding agreement or answers for continuous bonding leave', () => {
    setWorkflow({}, { reason_code: 'BONDING' });
    renderPanel();
    expect(screen.getByRole('button', { name: 'Edit Bonding Event' })).toBeInTheDocument();
    expect(screen.queryByText('Eligibility Answers')).not.toBeInTheDocument();
  });

  it('shows the designated-person record when the relationship is a designated person', async () => {
    setWorkflow({}, { family_relationship: 'DESIGNATED_PERSON' });
    renderPanel();
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
