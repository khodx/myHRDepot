import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const CASE_ID = 'e7a13c94-5d20-4b86-8f31-2c9b06d4a715';

const { segmentAsync, obligationAsync, transactionAsync, workflowData } = vi.hoisted(() => ({
  segmentAsync: vi.fn(),
  obligationAsync: vi.fn(),
  transactionAsync: vi.fn(),
  workflowData: {
    current: null as unknown,
  },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ authUserId: 'user-1', profile: { companyId: null }, roles: ['HR Partner'] }),
}));

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: { listTemplates: vi.fn().mockResolvedValue([]) },
}));

const idle = () => ({ mutateAsync: vi.fn(), isPending: false });

vi.mock('../WorkflowHook', () => ({
  useMhdLeaveWorkflow: () => ({ isLoading: false, data: workflowData.current }),
  useMhdLeaveReadiness: () => ({ data: undefined }),
  useMhdLeaveEligibility: () => idle(),
  useMhdConfirmLeaveEligibility: () => idle(),
  useMhdOverrideLeaveEligibility: () => idle(),
  useMhdLeaveEvent: () => idle(),
  useMhdLeaveReturnToWork: () => idle(),
  useMhdLeaveNotice: () => idle(),
  useMhdLeaveNoticeDelivery: () => idle(),
  useMhdLeaveSegment: () => ({ mutateAsync: segmentAsync, isPending: false }),
  useMhdLeaveBenefitObligation: () => ({ mutateAsync: obligationAsync, isPending: false }),
  useMhdLeaveBenefitTransaction: () => ({ mutateAsync: transactionAsync, isPending: false }),
}));

const { MhdLeaveWorkflowPanel } = await import('../components/MhdLeaveWorkflowPanel');

function workflow(benefits: unknown[] = []) {
  return {
    case: { id: CASE_ID },
    eligibility: [],
    notices: [],
    segments: [],
    events: [],
    certifications: [],
    benefits,
    return_to_work: null,
  };
}

const obligationRow = {
  id: 'obl-1',
  benefit_type: 'MEDICAL_PREMIUM',
  coverage_start: '2026-08-03',
  coverage_end: null,
  employer_amount: 412.5,
  employee_amount: 96,
  frequency: 'MONTHLY',
  status: 'ACTIVE',
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

beforeEach(() => {
  vi.clearAllMocks();
  workflowData.current = workflow();
  segmentAsync.mockResolvedValue('seg-1');
  obligationAsync.mockResolvedValue('obl-2');
  transactionAsync.mockResolvedValue('txn-1');
});

describe('Schedule tab', () => {
  it('shows no recording form to a non-privileged viewer', () => {
    renderPanel(false);
    openTab(/Schedule/);
    expect(screen.queryByRole('button', { name: 'Record Segment' })).not.toBeInTheDocument();
  });

  it('records a requested segment and clears the form', async () => {
    renderPanel();
    openTab(/Schedule/);
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
    await waitFor(() => expect(screen.getByLabelText('Segment start')).toHaveValue(''));
  });

  it('shows the exact server refusal for a taken segment and keeps what was typed', async () => {
    segmentAsync.mockRejectedValueOnce(new Error('Hours exceed the remaining balance of 12'));
    renderPanel();
    openTab(/Schedule/);
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
});

describe('Benefits tab', () => {
  it('shows no forms to a non-privileged viewer', () => {
    workflowData.current = workflow([obligationRow]);
    renderPanel(false);
    openTab(/Benefits/);
    expect(screen.queryByRole('button', { name: 'Record Obligation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record Transaction' })).not.toBeInTheDocument();
  });

  it('records an obligation from free-text type and frequency', async () => {
    renderPanel();
    openTab(/Benefits/);
    expect(screen.queryByRole('button', { name: 'Record Transaction' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record Obligation' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Benefit type'), {
      target: { value: 'Dental premium' },
    });
    fireEvent.change(screen.getByLabelText('Contribution frequency'), {
      target: { value: 'Monthly' },
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
      benefitType: 'Dental premium',
      frequency: 'Monthly',
      coverageStart: '2026-08-03',
      coverageEnd: null,
      employerAmount: 38.4,
      employeeAmount: 12,
    });
  });

  it('records a transaction against a listed obligation, never offering Reversal', async () => {
    workflowData.current = workflow([obligationRow]);
    renderPanel();
    openTab(/Benefits/);
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

  function withTransactions(transactions: unknown[]) {
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
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    expect(reversalTypeOffered()).toBe(false);
  });

  it('does not offer Reversal when every transaction is a reversal or already reversed', () => {
    withTransactions([charge, reversalOfCharge]);
    renderPanel();
    openTab(/Benefits/);
    fireEvent.change(screen.getByLabelText('Obligation'), { target: { value: 'obl-1' } });
    expect(reversalTypeOffered()).toBe(false);
  });

  it('offers only unreversed non-reversal transactions and locks the amount to the target', async () => {
    withTransactions([charge, payment, reversalOfCharge]);
    renderPanel();
    openTab(/Benefits/);
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
    expect(await screen.findByText('That transaction has already been reversed')).toBeInTheDocument();
    expect(screen.getByLabelText('Transaction type')).toHaveValue('REVERSAL');
    expect(screen.getByLabelText('Transaction being reversed')).toHaveValue('txn-charge');
    expect(screen.getByLabelText('Effective date')).toHaveValue('08/20/2026');
  });
});
