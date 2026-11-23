import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdLeaveWorkflowService } = await import('../WorkflowService');
const { mhdLeavePolicyService } = await import('../PolicyService');
const validation = await import('../WorkflowValidation');
const types = await import('../WorkflowTypes');

const CASE = 'case-1';
const COMPANY = 'company-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('vocabularies added by migrations 0381-0386', () => {
  it('lists every family relationship the database accepts, including the adult child and in-laws', () => {
    expect([...types.MHD_LEAVE_FAMILY_RELATIONSHIPS]).toEqual([
      'CHILD',
      'CHILD_ADULT',
      'PARENT',
      'PARENT_IN_LAW',
      'SPOUSE',
      'DOMESTIC_PARTNER',
      'GRANDPARENT',
      'GRANDCHILD',
      'SIBLING',
      'DESIGNATED_PERSON',
      'NEXT_OF_KIN',
    ]);
  });

  it('mirrors the pay source, benefit and policy lists', () => {
    expect([...types.MHD_LEAVE_PAY_SOURCE_KEYS]).toEqual([
      'SDI',
      'PFL',
      'WC',
      'EMPLOYER_PLAN',
      'PTO',
      'EMPLOYER_SICK',
      'CA_PAID_SICK',
      'UNPAID',
    ]);
    expect([...types.MHD_LEAVE_BENEFIT_TYPES]).toHaveLength(8);
    expect([...types.MHD_LEAVE_BENEFIT_FREQUENCIES]).toHaveLength(7);
    expect([...types.MHD_LEAVE_YEAR_METHODS]).toEqual([
      'CALENDAR_YEAR',
      'FIXED_YEAR',
      'ROLLING_FORWARD',
      'ROLLING_BACKWARD',
    ]);
    expect([...types.MHD_LEAVE_REINSTATEMENT_OUTCOMES]).toEqual([
      'SAME_POSITION',
      'COMPARABLE_POSITION',
      'NOT_REINSTATED',
    ]);
  });
});

describe('designated person and bonding writers', () => {
  it('records a trimmed designated person and returns the id', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'dp-1', error: null });
    await expect(
      mhdLeaveWorkflowService.recordDesignatedPerson({
        caseId: CASE,
        designatedName: '  Rosalind Okafor-Bell ',
        relationshipNote: ' Close friend ',
      }),
    ).resolves.toBe('dp-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_designated_person_record', {
      p_case_id: CASE,
      p_designated_name: 'Rosalind Okafor-Bell',
      p_relationship_note: 'Close friend',
      p_pfl_attested_on: undefined,
    });
  });

  it('refuses a blank name and a void without a reason before calling the database', async () => {
    await expect(
      mhdLeaveWorkflowService.recordDesignatedPerson({ caseId: CASE, designatedName: '  ' }),
    ).rejects.toThrow("Enter the designated person's name.");
    await expect(
      mhdLeaveWorkflowService.voidDesignatedPerson({ designatedPersonId: 'dp-1', reason: ' ' }),
    ).rejects.toThrow('Voiding a designation requires a reason.');
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('records a bonding event and validates its type', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdLeaveWorkflowService.setBondingEvent({
      caseId: CASE,
      eventDate: '2026-11-01',
      eventType: 'BIRTH',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_case_set_bonding_event', {
      p_case_id: CASE,
      p_event_date: '2026-11-01',
      p_event_type: 'BIRTH',
    });
    expect(
      validation.mhdValidateLeaveBondingEvent({ caseId: CASE, eventDate: '', eventType: 'BIRTH' }),
    ).toBe('Enter the date of the birth, adoption or placement.');
    expect(
      validation.mhdValidateLeaveBondingEvent({
        caseId: CASE,
        eventDate: '2026-11-01',
        eventType: 'X' as never,
      }),
    ).toBe('Choose the type of bonding event.');
  });
});

describe('pay sources', () => {
  it('returns the new id with the SDI/PFL overlap warning', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ pay_source_id: 'ps-1', warnings: ['SDI_PFL_OVERLAP'] }],
      error: null,
    });
    await expect(
      mhdLeaveWorkflowService.recordPaySource({
        caseId: CASE,
        sourceKey: 'PFL',
        status: 'EXPECTED',
        paidFrom: '2026-12-20',
        paidTo: '2027-01-10',
      }),
    ).resolves.toEqual({ id: 'ps-1', warnings: ['SDI_PFL_OVERLAP'] });
  });

  it('never lets the client require statutory paid sick leave or a wage-replacement source', () => {
    expect(
      validation.mhdValidateLeavePaySource({
        caseId: CASE,
        sourceKey: 'CA_PAID_SICK',
        status: 'EXPECTED',
        employerRequired: true,
      }),
    ).toMatch(/can never be required/);
    expect(
      validation.mhdValidateLeavePaySource({
        caseId: CASE,
        sourceKey: 'SDI',
        status: 'EXPECTED',
        employerRequired: true,
      }),
    ).toMatch(/not something an employer can require/);
    expect(
      validation.mhdValidateLeavePaySource({
        caseId: CASE,
        sourceKey: 'PTO',
        status: 'EXPECTED',
        employerRequired: true,
      }),
    ).toBeNull();
    expect(
      validation.mhdValidateLeavePaySource({
        caseId: CASE,
        sourceKey: 'PTO',
        status: 'EXPECTED',
        paidFrom: '2026-12-10',
        paidTo: '2026-12-01',
      }),
    ).toBe('The pay period cannot end before it starts.');
  });

  it('surfaces the database refusal unchanged', async () => {
    const refusal = {
      code: '22023',
      message:
        'Cannot require Accrued vacation or PTO while a wage-replacement benefit is approved',
    };
    rpcMock.mockResolvedValueOnce({ data: null, error: refusal });
    await expect(
      mhdLeaveWorkflowService.recordPaySource({
        caseId: CASE,
        sourceKey: 'PTO',
        status: 'EXPECTED',
        employerRequired: true,
      }),
    ).rejects.toBe(refusal);
  });
});

describe('benefits, workers comp, key employee, return to work', () => {
  const benefit = {
    caseId: CASE,
    benefitType: 'MEDICAL' as const,
    coverageStart: '2026-12-01',
    employerAmount: 480,
    employeeAmount: 120,
    frequency: 'MONTHLY' as const,
  };

  it('sends the structured benefit fields', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'obl-1', error: null });
    await mhdLeaveWorkflowService.recordBenefitObligation({
      ...benefit,
      dueDate: '2026-12-01',
      continuationBasis: 'FMLA_CFRA',
      benefitLabel: ' PPO premium ',
    });
    expect(rpcMock.mock.calls[0][1]).toMatchObject({
      p_benefit_type: 'MEDICAL',
      p_frequency: 'MONTHLY',
      p_due_date: '2026-12-01',
      p_continuation_basis: 'FMLA_CFRA',
      p_benefit_label: 'PPO premium',
    });
  });

  it('validates continuation basis and the 30-day minimum grace period', () => {
    expect(
      validation.mhdValidateLeaveBenefitObligation({
        ...benefit,
        continuationBasis: 'PDL',
        gracePeriodDays: 10,
      }),
    ).toMatch(/cannot be shorter than 30 days/);
    expect(
      validation.mhdValidateLeaveBenefitObligation({
        ...benefit,
        continuationBasis: 'PDL',
        gracePeriodDays: 45,
      }),
    ).toBeNull();
    expect(
      validation.mhdValidateLeaveBenefitObligation({
        ...benefit,
        benefitType: 'RETIREMENT',
        continuationBasis: 'FMLA_CFRA',
      }),
    ).toBe('Only a group health benefit has a continuation basis.');
  });

  it('validates workers comp and key employee shapes', () => {
    expect(
      validation.mhdValidateLeaveWorkersComp({ caseId: CASE, claim: false, filedOn: '2026-11-01' }),
    ).toBe("Claim details need a workers' compensation claim.");
    expect(
      validation.mhdValidateLeaveWorkersComp({ caseId: CASE, claim: true, filedOn: '2026-11-01' }),
    ).toBeNull();
    expect(validation.mhdValidateLeaveKeyEmployee({ caseId: CASE, status: 'KEY' })).toBe(
      'Enter the date the key-employee determination was made.',
    );
    expect(
      validation.mhdValidateLeaveKeyEmployee({
        caseId: CASE,
        status: 'NOT_KEY',
        determinedOn: '2026-11-01',
        noticeOn: '2026-11-01',
      }),
    ).toBe('Key-employee notices apply only to a key employee.');
    expect(
      validation.mhdValidateLeaveKeyEmployee({
        caseId: CASE,
        status: 'KEY',
        determinedOn: '2026-11-01',
        restorationDeniedNoticeOn: '2026-12-01',
      }),
    ).toMatch(/notice given at the request/);
  });

  it('validates return to work and sends the reinstatement fields', async () => {
    const base = {
      caseId: CASE,
      expectedReturnDate: '2027-01-04',
      fitnessRequired: false,
      restrictionsPresent: false,
      accommodationReferralRequired: false,
    };
    expect(
      validation.mhdValidateLeaveReturnToWork({
        ...base,
        rtwCertificationRequestedOn: '2026-12-20',
      }),
    ).toBe('A return-to-work certification can be requested only when one is required.');
    expect(
      validation.mhdValidateLeaveReturnToWork({ ...base, reinstatementOutcome: 'NOT_REINSTATED' }),
    ).toBe('Not reinstating an employee requires a recorded reason.');
    rpcMock.mockResolvedValueOnce({ data: 'rtw-1', error: null });
    await mhdLeaveWorkflowService.recordReturnToWork({
      ...base,
      reinstatementOutcome: 'COMPARABLE_POSITION',
      exceptionReason: ' The original position was eliminated ',
    });
    expect(rpcMock.mock.calls[0][1]).toMatchObject({
      p_reinstatement_outcome: 'COMPARABLE_POSITION',
      p_exception_reason: 'The original position was eliminated',
    });
  });

  it('requires a reason and at least one date to clear certification dates', async () => {
    await expect(
      mhdLeaveWorkflowService.clearCertificationDates({
        certificationId: 'c-1',
        fields: [],
        reason: 'x',
      }),
    ).rejects.toThrow('Choose the dates to clear.');
    await expect(
      mhdLeaveWorkflowService.clearCertificationDates({
        certificationId: 'c-1',
        fields: ['received_at'],
        reason: ' ',
      }),
    ).rejects.toThrow('Clearing a certification date requires a reason.');
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdLeaveWorkflowService.clearCertificationDates({
      certificationId: 'c-1',
      fields: ['received_at'],
      reason: 'Keyed from the wrong document',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_certification_clear_dates', {
      p_certification_id: 'c-1',
      p_fields: ['received_at'],
      p_reason: 'Keyed from the wrong document',
    });
  });
});

describe('company leave policy', () => {
  it('validates the anchor: only a fixed year takes one, and February 29 is refused', () => {
    expect(
      validation.mhdValidateLeavePolicySet({ companyId: COMPANY, yearMethod: 'FIXED_YEAR' }),
    ).toBe('A fixed leave year needs an anchor month and day.');
    expect(
      validation.mhdValidateLeavePolicySet({
        companyId: COMPANY,
        yearMethod: 'FIXED_YEAR',
        anchorMonth: 2,
        anchorDay: 29,
      }),
    ).toMatch(/February 29/);
    expect(
      validation.mhdValidateLeavePolicySet({
        companyId: COMPANY,
        yearMethod: 'FIXED_YEAR',
        anchorMonth: 7,
        anchorDay: 1,
      }),
    ).toBeNull();
    expect(
      validation.mhdValidateLeavePolicySet({
        companyId: COMPANY,
        yearMethod: 'CALENDAR_YEAR',
        anchorMonth: 7,
        anchorDay: 1,
      }),
    ).toBe('Only a fixed leave year takes an anchor date.');
  });

  it('reads the policy and sets an election with its reason', async () => {
    rpcMock.mockResolvedValueOnce({ data: { election_recorded: false }, error: null });
    await expect(mhdLeavePolicyService.get(COMPANY)).resolves.toEqual({ election_recorded: false });
    rpcMock.mockResolvedValueOnce({ data: 'pol-1', error: null });
    await mhdLeavePolicyService.set({
      companyId: COMPANY,
      yearMethod: 'ROLLING_BACKWARD',
      effectiveFrom: '2027-02-01',
      reason: ' Match the payroll year ',
      rtwCertificationUniform: true,
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_leave_policy_set', {
      p_company_id: COMPANY,
      p_year_method: 'ROLLING_BACKWARD',
      p_anchor_month: undefined,
      p_anchor_day: undefined,
      p_effective_from: '2027-02-01',
      p_limit_designated_person: undefined,
      p_reason: 'Match the payroll year',
      p_rtw_certification_uniform: true,
    });
  });
});
