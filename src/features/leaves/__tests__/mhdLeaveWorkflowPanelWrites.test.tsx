import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MhdLeaveBenefit,
  MhdLeaveBenefitTransaction,
  MhdLeaveWorkflow,
} from '../WorkflowTypes';
import {
  mhdLeaveDraftServiceMock as drafts,
  mhdResetLeaveDraftService,
  mhdTestLeaveDraft,
} from './leaveDraftTestKit';
import { mhdTestLeaveWorkflow } from './leaveWorkflowFixture';

const CASE_ID = 'e7a13c94-5d20-4b86-8f31-2c9b06d4a715';

const {
  segmentAsync,
  segmentStatusAsync,
  obligationAsync,
  obligationStatusAsync,
  transactionAsync,
  noticeAsync,
  returnAsync,
  generateAndPoll,
  listTemplates,
  workflowData,
} = vi.hoisted(() => ({
  segmentAsync: vi.fn(),
  noticeAsync: vi.fn(),
  returnAsync: vi.fn(),
  generateAndPoll: vi.fn(),
  listTemplates: vi.fn(),
  segmentStatusAsync: vi.fn(),
  obligationAsync: vi.fn(),
  obligationStatusAsync: vi.fn(),
  transactionAsync: vi.fn(),
  workflowData: {
    current: null as unknown,
  },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    authUserId: 'user-1',
    profile: { companyId: '9b5e2c71-3d84-4f1a-a6c0-58d27e4f1b93' },
    roles: ['HR Partner'],
  }),
}));

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: { listTemplates, generateAndPoll },
}));

vi.mock('@/features/drafts/Service', async () => ({
  mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
}));

vi.mock('../WorkflowHook', async () => {
  const { mhdIdleLeaveWorkflowHooks } = await import('./leaveWorkflowFixture');
  return {
    ...mhdIdleLeaveWorkflowHooks(),
    useMhdLeaveWorkflow: () => ({ isLoading: false, data: workflowData.current }),
    useMhdLeaveReturnToWork: () => ({ mutateAsync: returnAsync, isPending: false }),
    useMhdLeaveNotice: () => ({ mutateAsync: noticeAsync, isPending: false }),
    useMhdLeaveSegment: () => ({ mutateAsync: segmentAsync, isPending: false }),
    useMhdLeaveSegmentStatus: () => ({ mutateAsync: segmentStatusAsync, isPending: false }),
    useMhdLeaveBenefitObligation: () => ({ mutateAsync: obligationAsync, isPending: false }),
    useMhdLeaveBenefitObligationStatus: () => ({
      mutateAsync: obligationStatusAsync,
      isPending: false,
    }),
    useMhdLeaveBenefitTransaction: () => ({ mutateAsync: transactionAsync, isPending: false }),
  };
});

const { MhdLeaveWorkflowPanel } = await import('../components/MhdLeaveWorkflowPanel');

function workflow(
  benefits: MhdLeaveBenefit[] = [],
  overrides: Partial<MhdLeaveWorkflow> = {},
): MhdLeaveWorkflow {
  return mhdTestLeaveWorkflow(CASE_ID, { benefits, ...overrides });
}

const segmentRow = {
  id: 'seg-1',
  segment_mode: 'CONTINUOUS',
  start_at: '2026-08-03T08:00:00Z',
  end_at: '2026-08-03T16:00:00Z',
  planned_hours: 8,
  actual_hours: null,
  status: 'REQUESTED',
  designated_at: null,
};

const obligationRow: MhdLeaveBenefit = {
  id: 'obl-1',
  benefit_type: 'MEDICAL',
  benefit_label: 'Kaiser HMO family plan',
  coverage_start: '2026-08-03',
  coverage_end: null,
  employer_amount: 412.5,
  employee_amount: 96,
  frequency: 'MONTHLY',
  status: 'ACTIVE',
  status_reason: null,
  due_date: '2026-08-01',
  grace_period_days: 30,
  continuation_basis: 'FMLA_CFRA',
  seniority_credit_through: null,
  transactions: [],
};

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

function openTab(name: RegExp) {
  fireEvent.click(screen.getByRole('tab', { name }));
}

function launch(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
  return screen.getByRole('dialog');
}

beforeEach(() => {
  vi.clearAllMocks();
  mhdResetLeaveDraftService();
  workflowData.current = workflow();
  segmentAsync.mockResolvedValue('seg-1');
  segmentStatusAsync.mockResolvedValue(undefined);
  obligationAsync.mockResolvedValue('obl-2');
  obligationStatusAsync.mockResolvedValue(undefined);
  transactionAsync.mockResolvedValue('txn-1');
  noticeAsync.mockResolvedValue('notice-1');
  returnAsync.mockResolvedValue('rtw-1');
  generateAndPoll.mockResolvedValue({ id: 'generation-1' });
  listTemplates.mockResolvedValue([]);
});

describe('Schedule tab', () => {
  it('shows no recording form to a non-privileged viewer', () => {
    workflowData.current = { ...workflow(), segments: [segmentRow] };
    renderPanel(false);
    openTab(/Schedule/);
    expect(screen.queryByRole('button', { name: 'Add Segment' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change Status' })).not.toBeInTheDocument();
  });

  it('records a requested segment in a dialog, discards the draft and closes', async () => {
    renderPanel();
    openTab(/Schedule/);
    expect(screen.queryByLabelText('Segment start')).not.toBeInTheDocument();
    expect(launch('Add Segment')).toHaveAccessibleName('Record Leave Segment');
    expect(screen.getByRole('button', { name: 'Record Segment' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Segment start'), {
      target: { value: '2026-08-03T08:00' },
    });
    fireEvent.change(screen.getByLabelText('Planned hours (optional)'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Segment' }));
    await waitFor(() => expect(segmentAsync).toHaveBeenCalledTimes(1));
    expect(segmentAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: CASE_ID,
        segmentMode: 'CONTINUOUS',
        status: 'REQUESTED',
        plannedHours: 8,
        actualHours: null,
        endAt: null,
        startAt: new Date('2026-08-03T08:00').toISOString(),
      }),
    );
    await waitFor(() =>
      expect(drafts.discard).toHaveBeenCalledWith('LEAVE_CASE_ACTION', `${CASE_ID}:segment`),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the exact server refusal for a taken segment and keeps what was typed', async () => {
    segmentAsync.mockRejectedValueOnce(new Error('Hours exceed the remaining balance of 12'));
    renderPanel();
    openTab(/Schedule/);
    launch('Add Segment');
    fireEvent.change(screen.getByLabelText('Segment status'), { target: { value: 'TAKEN' } });
    expect(
      screen.getByLabelText('Actual hours (required for a taken segment)'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Segment start'), {
      target: { value: '2026-08-03T08:00' },
    });
    fireEvent.change(screen.getByLabelText('Actual hours (required for a taken segment)'), {
      target: { value: '40' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record Segment' }));
    expect(await screen.findByText('Hours exceed the remaining balance of 12')).toBeInTheDocument();
    expect(screen.getByLabelText('Segment start')).toHaveValue('2026-08-03T08:00');
  });

  it('shows a status server refusal and keeps the typed actual hours', async () => {
    workflowData.current = { ...workflow(), segments: [segmentRow] };
    segmentStatusAsync.mockRejectedValueOnce(new Error('The eligibility basis is not confirmed'));
    renderPanel();
    openTab(/Schedule/);
    launch('Change Status');
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'TAKEN' } });
    fireEvent.change(screen.getByLabelText('Actual Hours'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    expect(await screen.findByText('The eligibility basis is not confirmed')).toBeInTheDocument();
    expect(screen.getByLabelText('Actual Hours')).toHaveValue(40);
  });
});

describe('Benefits tab', () => {
  it('shows no forms to a non-privileged viewer', () => {
    workflowData.current = workflow([obligationRow]);
    renderPanel(false);
    openTab(/Benefits/);
    expect(screen.queryByRole('button', { name: 'Add Obligation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Transaction' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change Status' })).not.toBeInTheDocument();
  });

  it('records an obligation from the benefit type and frequency vocabularies', async () => {
    renderPanel();
    openTab(/Benefits/);
    expect(screen.queryByRole('button', { name: 'Add Transaction' })).not.toBeInTheDocument();
    launch('Add Obligation');
    expect(screen.getByRole('button', { name: 'Record Obligation' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Benefit type'), {
      target: { value: 'DENTAL' },
    });
    fireEvent.change(screen.getByLabelText('Contribution frequency'), {
      target: { value: 'MONTHLY' },
    });
    fireEvent.change(screen.getByLabelText('Coverage start'), { target: { value: '08/03/2026' } });
    fireEvent.blur(screen.getByLabelText('Coverage start'));
    fireEvent.change(screen.getByLabelText('Employer amount'), { target: { value: '38.4' } });
    fireEvent.change(screen.getByLabelText('Employee amount'), { target: { value: '12' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Record Obligation' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record Obligation' }));
    await waitFor(() => expect(obligationAsync).toHaveBeenCalledTimes(1));
    expect(obligationAsync).toHaveBeenCalledWith({
      caseId: CASE_ID,
      benefitType: 'DENTAL',
      frequency: 'MONTHLY',
      coverageStart: '2026-08-03',
      coverageEnd: null,
      employerAmount: 38.4,
      employeeAmount: 12,
      dueDate: null,
      gracePeriodDays: null,
      continuationBasis: null,
      seniorityCreditThrough: null,
      benefitLabel: null,
    });
  });

  it('records a transaction against a listed obligation, never offering Reversal', async () => {
    workflowData.current = workflow([obligationRow]);
    renderPanel();
    openTab(/Benefits/);
    launch('Add Transaction');
    const typeSelect = screen.getByLabelText('Transaction type');
    expect(Array.from(typeSelect.querySelectorAll('option')).map((option) => option.value)).toEqual(
      ['CHARGE', 'PAYMENT', 'ADJUSTMENT'],
    );
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    fireEvent.change(typeSelect, { target: { value: 'PAYMENT' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '96' } });
    fireEvent.change(screen.getByLabelText('Effective date'), { target: { value: '08/15/2026' } });
    fireEvent.blur(screen.getByLabelText('Effective date'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Record Transaction' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record Transaction' }));
    await waitFor(() => expect(transactionAsync).toHaveBeenCalledTimes(1));
    expect(transactionAsync).toHaveBeenCalledWith({
      obligationId: 'obl-1',
      transactionType: 'PAYMENT',
      amount: 96,
      effectiveDate: '2026-08-15',
      referenceNote: null,
    });
  });

  it('shows the server refusal for a transaction', async () => {
    workflowData.current = workflow([obligationRow]);
    transactionAsync.mockRejectedValueOnce(new Error('Benefit obligation not found'));
    renderPanel();
    openTab(/Benefits/);
    launch('Add Transaction');
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Effective date'), { target: { value: '08/15/2026' } });
    fireEvent.blur(screen.getByLabelText('Effective date'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Record Transaction' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record Transaction' }));
    expect(await screen.findByText('Benefit obligation not found')).toBeInTheDocument();
  });
});

describe('Benefit transaction reversals', () => {
  const charge = {
    id: 'txn-charge',
    transaction_type: 'CHARGE',
    amount: 96,
    effective_date: '2026-08-10',
    reference_note: 'August premium',
    reversal_of: null,
  };
  const payment = {
    id: 'txn-payment',
    transaction_type: 'PAYMENT',
    amount: 40,
    effective_date: '2026-08-12',
    reference_note: null,
    reversal_of: null,
  };
  const reversalOfCharge = {
    id: 'txn-reversal',
    transaction_type: 'REVERSAL',
    amount: 96,
    effective_date: '2026-08-14',
    reference_note: null,
    reversal_of: 'txn-charge',
  };

  function withTransactions(transactions: MhdLeaveBenefitTransaction[]) {
    workflowData.current = workflow([{ ...obligationRow, transactions }]);
  }

  function reversalTypeOffered() {
    return Array.from(screen.getByLabelText('Transaction type').querySelectorAll('option')).some(
      (option) => option.value === 'REVERSAL',
    );
  }

  it('lists transactions and marks the reversed one and the reversal row', () => {
    withTransactions([charge, payment, reversalOfCharge]);
    renderPanel();
    openTab(/Benefits/);
    expect(screen.getByText(/CHARGE 96 on 2026-08-10/)).toBeInTheDocument();
    expect(screen.getByText('August premium')).toBeInTheDocument();
    expect(screen.getAllByText('Reversed')).toHaveLength(1);
    expect(screen.getByText('Reverses 2026-08-10 CHARGE')).toBeInTheDocument();
  });

  it('does not offer Reversal until the obligation has something reversible', () => {
    withTransactions([]);
    renderPanel();
    openTab(/Benefits/);
    launch('Add Transaction');
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    expect(reversalTypeOffered()).toBe(false);
  });

  it('does not offer Reversal when every transaction is a reversal or already reversed', () => {
    withTransactions([charge, reversalOfCharge]);
    renderPanel();
    openTab(/Benefits/);
    launch('Add Transaction');
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    expect(reversalTypeOffered()).toBe(false);
  });

  it('offers only unreversed non-reversal transactions and locks the amount to the target', async () => {
    withTransactions([charge, payment, reversalOfCharge]);
    renderPanel();
    openTab(/Benefits/);
    launch('Add Transaction');
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    expect(reversalTypeOffered()).toBe(true);
    fireEvent.change(screen.getByLabelText('Transaction type'), { target: { value: 'REVERSAL' } });
    const target = screen.getByLabelText('Transaction being reversed');
    expect(Array.from(target.querySelectorAll('option')).map((option) => option.value)).toEqual([
      '',
      'txn-payment',
    ]);
    fireEvent.change(target, { target: { value: 'txn-payment' } });
    const amount = screen.getByLabelText(/^Amount/);
    expect(amount).toHaveValue(40);
    expect(amount).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('Effective date'), { target: { value: '08/20/2026' } });
    fireEvent.blur(screen.getByLabelText('Effective date'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Record Transaction' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record Transaction' }));
    await waitFor(() => expect(transactionAsync).toHaveBeenCalledTimes(1));
    expect(transactionAsync).toHaveBeenCalledWith({
      obligationId: 'obl-1',
      transactionType: 'REVERSAL',
      amount: 40,
      effectiveDate: '2026-08-20',
      referenceNote: null,
      reversalOf: 'txn-payment',
    });
  });

  it('will not submit a reversal without a target', () => {
    withTransactions([charge]);
    renderPanel();
    openTab(/Benefits/);
    launch('Add Transaction');
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    fireEvent.change(screen.getByLabelText('Transaction type'), { target: { value: 'REVERSAL' } });
    fireEvent.change(screen.getByLabelText('Effective date'), { target: { value: '08/20/2026' } });
    fireEvent.blur(screen.getByLabelText('Effective date'));
    expect(screen.getByRole('button', { name: 'Record Transaction' })).toBeDisabled();
  });

  it('shows the server refusal and keeps the typed values', async () => {
    withTransactions([charge]);
    transactionAsync.mockRejectedValueOnce(new Error('That transaction has already been reversed'));
    renderPanel();
    openTab(/Benefits/);
    launch('Add Transaction');
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    fireEvent.change(screen.getByLabelText('Transaction type'), { target: { value: 'REVERSAL' } });
    fireEvent.change(screen.getByLabelText('Transaction being reversed'), {
      target: { value: 'txn-charge' },
    });
    fireEvent.change(screen.getByLabelText('Effective date'), { target: { value: '08/20/2026' } });
    fireEvent.blur(screen.getByLabelText('Effective date'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Record Transaction' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record Transaction' }));
    expect(
      await screen.findByText('That transaction has already been reversed'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Transaction type')).toHaveValue('REVERSAL');
    expect(screen.getByLabelText('Transaction being reversed')).toHaveValue('txn-charge');
    expect(screen.getByLabelText('Effective date')).toHaveValue('08/20/2026');
  });
});

describe('Benefits tab: continuation and health caps', () => {
  it('offers a continuation basis only for group health coverage and sends it', async () => {
    renderPanel();
    openTab(/Benefits/);
    launch('Add Obligation');
    const basis = screen.getByLabelText('Continuation basis');
    expect(basis).toBeDisabled();
    expect(
      Array.from(basis.querySelectorAll('option')).map((option) => option.textContent),
    ).toEqual(['Not applicable', 'FMLA/CFRA (12 workweeks)', 'Pregnancy Disability (4 months)']);
    fireEvent.change(screen.getByLabelText('Benefit type'), {
      target: { value: 'LIFE_INSURANCE' },
    });
    expect(screen.getByLabelText('Continuation basis')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Benefit type'), { target: { value: 'MEDICAL' } });
    expect(screen.getByLabelText('Continuation basis')).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Continuation basis'), { target: { value: 'PDL' } });
    fireEvent.change(screen.getByLabelText('Contribution frequency'), {
      target: { value: 'BIWEEKLY' },
    });
    fireEvent.change(screen.getByLabelText('Description (optional)'), {
      target: { value: 'Blue Shield PPO employee plus one' },
    });
    fireEvent.change(screen.getByLabelText('Grace period in days (optional)'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByLabelText('Coverage start'), { target: { value: '09/01/2026' } });
    fireEvent.blur(screen.getByLabelText('Coverage start'));
    fireEvent.change(screen.getByLabelText('Employer amount'), { target: { value: '510' } });
    fireEvent.change(screen.getByLabelText('Employee amount'), { target: { value: '88.25' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Record Obligation' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record Obligation' }));
    await waitFor(() => expect(obligationAsync).toHaveBeenCalledTimes(1));
    expect(obligationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        benefitType: 'MEDICAL',
        frequency: 'BIWEEKLY',
        continuationBasis: 'PDL',
        gracePeriodDays: 30,
        benefitLabel: 'Blue Shield PPO employee plus one',
      }),
    );
  });

  it('shows the health continuation summary and warns when coverage runs past the cap', () => {
    workflowData.current = workflow([obligationRow], {
      health_continuation: [
        {
          continuation_basis: 'FMLA_CFRA',
          label: 'FMLA/CFRA',
          coverage_start: '2026-08-03',
          cap_end: '2026-10-26',
          coverage_end: '2026-12-31',
          exceeds_cap: true,
          days_remaining: 41,
        },
      ],
    });
    renderPanel(false);
    openTab(/Benefits/);
    expect(screen.getByText('Coverage Runs Past The Cap')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('continuation cap of 2026-10-26');
    expect(screen.getByText('Kaiser HMO family plan')).toBeInTheDocument();
    expect(screen.getByText('FMLA/CFRA (12 workweeks)')).toBeInTheDocument();
  });
});

describe('Notices tab', () => {
  const keyedTemplate = {
    id: '5f0c7e2a-93d1-4b8e-a647-0d2b9c1e8f35',
    referenceId: 'DOCT-000214',
    templateKey: 'LEAVE_ELIGIBILITY_RIGHTS_NOTICE',
    companyId: null,
    name: 'Notice of Eligibility and Rights',
    templateType: 'REPORT',
    applicableEntityType: 'LEAVE_CASE',
    description: null,
    contentFormat: 'HTML',
    mergeFields: [],
    version: 3,
    isActive: true,
    requiresSignature: false,
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
  };
  const unkeyedTemplate = {
    ...keyedTemplate,
    id: '8a3d51c6-2e7f-4b90-b1d4-6c5e0f2a9d73',
    referenceId: 'DOCT-000215',
    templateKey: null,
    name: 'Ad Hoc Leave Letter',
  };
  const eligibilityDeadline = {
    id: 'deadline-1',
    deadline_kind: 'LEAVE_ELIGIBILITY_NOTICE' as const,
    basis_event: 'CASE_REQUEST',
    basis_at: '2026-08-03T15:00:00Z',
    due_at: '2026-08-10T15:00:00Z',
    satisfied_at: null,
    waived_at: null,
    waiver_reason: null,
    legal_citation: '29 CFR 825.300(b)(1)',
    is_overdue: true,
  };

  it('records a notice under the template stable key with no hand-typed due date', async () => {
    listTemplates.mockResolvedValue([keyedTemplate, unkeyedTemplate]);
    workflowData.current = workflow([], { deadlines: [eligibilityDeadline] });
    renderPanel();
    openTab(/Notices/);
    expect(screen.getByText('Eligibility Notice')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New Notice' }));
    expect(screen.queryByLabelText(/due date/i)).not.toBeInTheDocument();
    expect(listTemplates).toHaveBeenCalledWith(
      '9b5e2c71-3d84-4f1a-a6c0-58d27e4f1b93',
      undefined,
      false,
      'LEAVE_CASE',
    );
    await screen.findByRole('option', { name: 'Notice of Eligibility and Rights (v3)' });
    expect(screen.queryByRole('option', { name: /Ad Hoc Leave Letter/ })).not.toBeInTheDocument();
    expect(
      Array.from(screen.getByLabelText('Notice type').querySelectorAll('option')),
    ).toHaveLength(16);
    fireEvent.change(screen.getByLabelText('Document template'), {
      target: { value: 'LEAVE_ELIGIBILITY_RIGHTS_NOTICE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Notice' }));
    await waitFor(() => expect(noticeAsync).toHaveBeenCalledTimes(1));
    expect(generateAndPoll).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: keyedTemplate.id, entityType: 'LEAVE_CASE' }),
      { actorUserId: 'user-1' },
    );
    expect(noticeAsync).toHaveBeenCalledWith({
      caseId: CASE_ID,
      noticeType: 'ELIGIBILITY',
      templateKey: 'LEAVE_ELIGIBILITY_RIGHTS_NOTICE',
      templateVersion: 3,
      documentGenerationId: 'generation-1',
    });
  });

  it('shows which open deadlines the chosen notice type closes', () => {
    workflowData.current = workflow([], { deadlines: [eligibilityDeadline] });
    renderPanel();
    openTab(/Notices/);
    fireEvent.click(screen.getByRole('button', { name: 'New Notice' }));
    expect(screen.getAllByText('Eligibility Notice')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Notice type'), { target: { value: 'BALANCE' } });
    expect(screen.getByText('This notice type closes no open deadline.')).toBeInTheDocument();
  });
});

describe('Return To Work tab', () => {
  it('records the extended return-to-work fields', async () => {
    workflowData.current = workflow([], {
      policy: { ...mhdTestLeaveWorkflow(CASE_ID).policy, rtw_certification_uniform_policy: true },
    });
    renderPanel();
    openTab(/Return To Work/);
    launch('Add Return-To-Work Plan');
    expect(
      screen.getAllByText(
        'Return-to-work certifications are required under a uniformly applied company policy.',
      ).length,
    ).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Expected return date'), {
      target: { value: '09/14/2026' },
    });
    fireEvent.blur(screen.getByLabelText('Expected return date'));
    fireEvent.change(screen.getByLabelText('Reinstatement outcome (optional)'), {
      target: { value: 'COMPARABLE_POSITION' },
    });
    fireEvent.change(screen.getByLabelText('Exception reason'), {
      target: { value: 'Original route eliminated in the August reorganization' },
    });
    fireEvent.click(screen.getByLabelText('Fitness-For-Duty Certification Required'));
    fireEvent.change(screen.getByLabelText('Certification requested on (optional)'), {
      target: { value: '09/01/2026' },
    });
    fireEvent.blur(screen.getByLabelText('Certification requested on (optional)'));
    fireEvent.change(screen.getByLabelText('Reinstatement note (optional)'), {
      target: { value: 'Same shift and pay grade' },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save Return-To-Work Plan' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save Return-To-Work Plan' }));
    await waitFor(() => expect(returnAsync).toHaveBeenCalledTimes(1));
    expect(returnAsync).toHaveBeenCalledWith({
      caseId: CASE_ID,
      expectedReturnDate: '2026-09-14',
      actualReturnDate: null,
      sameOrComparableJob: true,
      fitnessRequired: true,
      restrictionsPresent: false,
      accommodationReferralRequired: false,
      reinstatementNote: 'Same shift and pay grade',
      reinstatementOutcome: 'COMPARABLE_POSITION',
      exceptionReason: 'Original route eliminated in the August reorganization',
      rtwCertificationRequestedOn: '2026-09-01',
      rtwCertificationReceivedOn: null,
    });
  });

  it('explains that a certification will be refused without a uniform policy', () => {
    renderPanel();
    openTab(/Return To Work/);
    launch('Add Return-To-Work Plan');
    expect(screen.getByText(/requiring a certification will be refused/)).toBeInTheDocument();
  });
});

describe('Leave workflow action drafts', () => {
  it('keeps return-to-work certification and restriction facts out of the draft', async () => {
    renderPanel();
    openTab(/Return To Work/);
    launch('Add Return-To-Work Plan');
    expect(screen.getByText('Medical details are not saved in drafts.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Expected return date'), {
      target: { value: '09/14/2026' },
    });
    fireEvent.blur(screen.getByLabelText('Expected return date'));
    fireEvent.click(screen.getByLabelText('Fitness-For-Duty Certification Required'));
    fireEvent.click(
      screen.getByLabelText('Work Restrictions Present; Begin Accommodation Referral'),
    );
    fireEvent.change(screen.getByLabelText('Exception reason'), {
      target: { value: 'Comparable position on the day shift' },
    });
    fireEvent.change(screen.getByLabelText('Reinstatement note (optional)'), {
      target: { value: 'Same pay grade' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(drafts.save).toHaveBeenCalledTimes(1));
    expect(drafts.save.mock.calls[0][0]).toMatchObject({
      draftKey: `${CASE_ID}:return-to-work`,
      payload: {
        expectedReturn: '2026-09-14',
        actualReturn: '',
        outcome: '',
        note: 'Same pay grade',
      },
    });
    const payload = drafts.save.mock.calls[0][0].payload as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual([
      'actualReturn',
      'expectedReturn',
      'note',
      'outcome',
    ]);
  });

  it('resumes a saved benefit obligation draft', async () => {
    drafts.get.mockResolvedValue(
      mhdTestLeaveDraft(`${CASE_ID}:benefit-obligation`, {
        benefitType: 'DENTAL',
        frequency: 'MONTHLY',
        employerAmount: '38.4',
        description: 'Delta Dental PPO',
      }),
    );
    renderPanel();
    openTab(/Benefits/);
    launch('Add Obligation');
    fireEvent.click(await screen.findByRole('button', { name: 'Resume Draft' }));
    expect(screen.getByLabelText('Benefit type')).toHaveValue('DENTAL');
    expect(screen.getByLabelText('Contribution frequency')).toHaveValue('MONTHLY');
    expect(screen.getByLabelText('Employer amount')).toHaveValue(38.4);
    expect(screen.getByLabelText('Description (optional)')).toHaveValue('Delta Dental PPO');
  });

  it('saves the chosen notice type and template as a draft', async () => {
    renderPanel();
    openTab(/Notices/);
    launch('New Notice');
    fireEvent.change(screen.getByLabelText('Notice type'), { target: { value: 'DESIGNATION' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(drafts.save).toHaveBeenCalledTimes(1));
    expect(drafts.save.mock.calls[0][0]).toMatchObject({
      draftKind: 'LEAVE_CASE_ACTION',
      draftKey: `${CASE_ID}:notice`,
      payload: { noticeType: 'DESIGNATION', templateKey: '' },
    });
  });

  it('records an operational contact in a dialog and discards its draft', async () => {
    renderPanel();
    openTab(/Contacts/);
    launch('Add Contact');
    fireEvent.change(screen.getByLabelText('Contact summary'), {
      target: { value: 'Called to confirm the expected return week' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record Contact' }));
    await waitFor(() =>
      expect(drafts.discard).toHaveBeenCalledWith('LEAVE_CASE_ACTION', `${CASE_ID}:contact`),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
