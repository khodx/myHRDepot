import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdLeaveWorkflowService } = await import('../WorkflowService');
const { mhdLeavesService } = await import('../Service');
const {
  mhdValidateLeaveBenefitObligation,
  mhdValidateLeaveBenefitTransaction,
  mhdValidateLeaveSegment,
} = await import('../WorkflowValidation');
const types = await import('../WorkflowTypes');
const leaveTypes = await import('../Types');

const CASE = 'case-1';

beforeEach(() => {
  vi.clearAllMocks();
});

const segment = (
  overrides: Partial<Parameters<typeof mhdLeaveWorkflowService.recordSegment>[0]> = {},
) => ({
  caseId: CASE,
  segmentMode: 'INTERMITTENT' as const,
  startAt: '2026-08-03T15:00:00.000Z',
  endAt: '2026-08-03T23:00:00.000Z',
  plannedHours: 8,
  actualHours: null,
  status: 'REQUESTED' as const,
  ...overrides,
});

describe('database vocabularies', () => {
  it('mirrors the CHECK constraints exactly', () => {
    expect(types.MHD_LEAVE_SEGMENT_MODES).toEqual([
      'CONTINUOUS',
      'INTERMITTENT',
      'REDUCED_SCHEDULE',
    ]);
    expect(types.MHD_LEAVE_SEGMENT_STATUSES).toEqual([
      'REQUESTED',
      'APPROVED',
      'TAKEN',
      'DENIED',
      'CANCELLED',
    ]);
    expect(types.MHD_LEAVE_BENEFIT_TRANSACTION_TYPES).toEqual([
      'CHARGE',
      'PAYMENT',
      'ADJUSTMENT',
      'REVERSAL',
    ]);
    expect(leaveTypes.MHD_LEAVE_CERTIFICATION_STATUSES).toEqual([
      'REQUESTED',
      'RECEIVED',
      'INCOMPLETE',
      'INSUFFICIENT',
      'SUFFICIENT',
      'EXPIRED',
      'WAIVED',
    ]);
  });

  it('never offers REVERSAL for recording, because it needs a transaction id the read does not list', () => {
    expect(types.MHD_LEAVE_BENEFIT_RECORDABLE_TRANSACTION_TYPES).toEqual([
      'CHARGE',
      'PAYMENT',
      'ADJUSTMENT',
    ]);
  });
});

describe('mhdLeaveWorkflowService.recordSegment', () => {
  it('sends every argument under the RPC names', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'seg-1', error: null });
    await expect(mhdLeaveWorkflowService.recordSegment(segment())).resolves.toBe('seg-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_schedule_record', {
      p_case_id: CASE,
      p_segment_mode: 'INTERMITTENT',
      p_start_at: '2026-08-03T15:00:00.000Z',
      p_end_at: '2026-08-03T23:00:00.000Z',
      p_planned_hours: 8,
      p_actual_hours: undefined,
      p_status: 'REQUESTED',
    });
  });

  it('rejects a taken segment without actual hours before calling the database', async () => {
    await expect(
      mhdLeaveWorkflowService.recordSegment(segment({ status: 'TAKEN' })),
    ).rejects.toThrow('A taken segment requires actual hours.');
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('throws the designation guard refusal verbatim for a taken segment', async () => {
    const refusal = { code: '22023', message: 'Hours exceed the remaining balance of 12' };
    rpcMock.mockResolvedValueOnce({ data: null, error: refusal });
    await expect(
      mhdLeaveWorkflowService.recordSegment(segment({ status: 'TAKEN', actualHours: 40 })),
    ).rejects.toBe(refusal);
  });
});

describe('segment validation', () => {
  it('requires positive hours and an end at or after the start', () => {
    expect(mhdValidateLeaveSegment(segment({ plannedHours: 0 }))).toBe(
      'Planned hours must be greater than zero.',
    );
    expect(mhdValidateLeaveSegment(segment({ actualHours: -2 }))).toBe(
      'Actual hours must be greater than zero.',
    );
    expect(mhdValidateLeaveSegment(segment({ endAt: '2026-08-03T14:00:00.000Z' }))).toBe(
      'The end cannot be before the start.',
    );
    expect(mhdValidateLeaveSegment(segment({ endAt: '2026-08-03T15:00:00.000Z' }))).toBeNull();
    expect(mhdValidateLeaveSegment(segment({ status: 'TAKEN', actualHours: 6 }))).toBeNull();
  });
});

describe('benefit recording', () => {
  const obligation = {
    caseId: CASE,
    benefitType: ' Medical premium ',
    coverageStart: '2026-08-03',
    coverageEnd: null,
    employerAmount: 412.5,
    employeeAmount: 96,
    frequency: 'Monthly',
  };

  it('records an obligation with an open-ended coverage period as NULL', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'obl-1', error: null });
    await mhdLeaveWorkflowService.recordBenefitObligation(obligation);
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_benefit_obligation_record', {
      p_case_id: CASE,
      p_benefit_type: 'Medical premium',
      p_coverage_start: '2026-08-03',
      p_coverage_end: null,
      p_employer_amount: 412.5,
      p_employee_amount: 96,
      p_frequency: 'Monthly',
    });
  });

  it('validates obligations and transactions before calling the database', async () => {
    expect(mhdValidateLeaveBenefitObligation({ ...obligation, employeeAmount: -1 })).toBe(
      'Amounts must be zero or more.',
    );
    expect(mhdValidateLeaveBenefitObligation({ ...obligation, coverageEnd: '2026-07-01' })).toBe(
      'Coverage cannot end before it starts.',
    );
    expect(mhdValidateLeaveBenefitObligation({ ...obligation, benefitType: '  ' })).toBe(
      'Enter the benefit type.',
    );
    await expect(
      mhdLeaveWorkflowService.recordBenefitTransaction({
        obligationId: 'obl-1',
        transactionType: 'CHARGE',
        amount: 0,
        effectiveDate: '2026-08-15',
      }),
    ).rejects.toThrow('The amount must be a non-zero number.');
    expect(
      mhdValidateLeaveBenefitTransaction({
        obligationId: 'obl-1',
        transactionType: 'ADJUSTMENT',
        amount: -25,
        effectiveDate: '2026-08-15',
      }),
    ).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('records a transaction with a trimmed optional note', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'txn-1', error: null });
    await mhdLeaveWorkflowService.recordBenefitTransaction({
      obligationId: 'obl-1',
      transactionType: 'PAYMENT',
      amount: 96,
      effectiveDate: '2026-08-15',
      referenceNote: '  Check 4471  ',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_benefit_transaction_record', {
      p_obligation_id: 'obl-1',
      p_transaction_type: 'PAYMENT',
      p_amount: 96,
      p_effective_date: '2026-08-15',
      p_reference_note: 'Check 4471',
    });
  });
});

describe('mhdLeavesService.updateCertificationStatus', () => {
  it('sends status, dates and the operational note under the RPC names', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdLeavesService.updateCertificationStatus({
      certId: 'cert-1',
      status: 'INCOMPLETE',
      receivedAt: '2026-08-05',
      deficiencyNotifiedAt: '2026-08-07',
      cureDueDate: '2026-08-14',
      reviewNote: '  Provider section unsigned  ',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_certification_update_status', {
      p_certification_id: 'cert-1',
      p_status: 'INCOMPLETE',
      p_received_at: '2026-08-05',
      p_deficiency_notified_at: '2026-08-07',
      p_cure_due_date: '2026-08-14',
      p_review_note: 'Provider section unsigned',
    });
  });

  it('omits blank dates and note so the RPC keeps what is on record', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdLeavesService.updateCertificationStatus({ certId: 'cert-1', status: 'SUFFICIENT' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_certification_update_status', {
      p_certification_id: 'cert-1',
      p_status: 'SUFFICIENT',
      p_received_at: undefined,
      p_deficiency_notified_at: undefined,
      p_cure_due_date: undefined,
      p_review_note: undefined,
    });
  });

  it('rejects a cure date before the deficiency notice locally, and surfaces a medical-access denial', async () => {
    await expect(
      mhdLeavesService.updateCertificationStatus({
        certId: 'cert-1',
        status: 'INCOMPLETE',
        deficiencyNotifiedAt: '2026-08-07',
        cureDueDate: '2026-08-01',
      }),
    ).rejects.toThrow('The cure due date cannot be before the deficiency notice date.');
    expect(rpcMock).not.toHaveBeenCalled();

    const denial = { code: '42501', message: 'Certification not found or medical access denied' };
    rpcMock.mockResolvedValueOnce({ error: denial });
    await expect(
      mhdLeavesService.updateCertificationStatus({ certId: 'cert-1', status: 'RECEIVED' }),
    ).rejects.toBe(denial);
  });
});

describe('benefit transaction reversals', () => {
  const base = {
    obligationId: 'obl-1',
    amount: 96,
    effectiveDate: '2026-08-20',
  };

  it('requires a target for a reversal and refuses one on any other type', () => {
    expect(mhdValidateLeaveBenefitTransaction({ ...base, transactionType: 'REVERSAL' })).toBe(
      'Select the transaction being reversed.',
    );
    expect(
      mhdValidateLeaveBenefitTransaction({
        ...base,
        transactionType: 'REVERSAL',
        reversalOf: 'txn-1',
      }),
    ).toBeNull();
    expect(
      mhdValidateLeaveBenefitTransaction({
        ...base,
        transactionType: 'PAYMENT',
        reversalOf: 'txn-1',
      }),
    ).toBe('Only a reversal can reference another transaction.');
  });

  it('sends the reversed transaction id under the RPC argument name', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'txn-2', error: null });
    await mhdLeaveWorkflowService.recordBenefitTransaction({
      ...base,
      transactionType: 'REVERSAL',
      reversalOf: 'txn-1',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_benefit_transaction_record', {
      p_obligation_id: 'obl-1',
      p_transaction_type: 'REVERSAL',
      p_amount: 96,
      p_effective_date: '2026-08-20',
      p_reference_note: undefined,
      p_reversal_of: 'txn-1',
    });
  });
});
