import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdLeaveWorkflowService } = await import('../WorkflowService');
const { mhdLeavesService } = await import('../Service');

const CASE = 'case-1';

/**
 * The fact set the panel submits. Every legal basis is evaluated against the
 * SAME facts and reaches its OWN conclusion — that separation is the whole
 * point of the v2 engine, and these tests pin the client half of it.
 */
function facts(overrides: Partial<Parameters<typeof mhdLeaveWorkflowService.evaluate>[0]> = {}) {
  return {
    caseId: CASE,
    asOfDate: '2026-07-25',
    employerEmployeeCount: 50,
    monthsOfService: 12,
    hoursWorked12Months: 1250,
    worksiteEmployeeCount75: 50,
    scheduledWeeklyHours: 40,
    reasonCode: 'OWN_SERIOUS_HEALTH_CONDITION',
    familyRelationship: null,
    designatedPersonSelected: false,
    coveredEmployerOverride: false,
    ...overrides,
  };
}

function lastArgs(): Record<string, unknown> {
  return rpcMock.mock.calls[rpcMock.mock.calls.length - 1][1] as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/* The fact contract                                                   */
/* ------------------------------------------------------------------ */

describe('mhdLeaveWorkflowService.evaluate — the immutable fact snapshot', () => {
  it('sends every eligibility fact under the argument names the RPC declares', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await mhdLeaveWorkflowService.evaluate(facts());

    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_eligibility_evaluate', {
      p_case_id: CASE,
      p_as_of_date: '2026-07-25',
      p_employer_employee_count: 50,
      p_months_of_service: 12,
      p_hours_worked_12_months: 1250,
      p_worksite_employee_count_75: 50,
      p_scheduled_weekly_hours: 40,
      p_reason_code: 'OWN_SERIOUS_HEALTH_CONDITION',
      p_family_relationship: undefined,
      p_designated_person_selected: false,
      p_facts_source: 'ADMIN_ENTERED',
      p_eligibility_context: { covered_employer_override: false },
    });
  });

  it('sends the ACTUAL scheduled workweek, never a hard-coded 40 hours', async () => {
    // Entitlement is snapshotted as weeks × the employee's real workweek. A
    // half-time employee's 12 weeks is 240 hours, not 480.
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await mhdLeaveWorkflowService.evaluate(facts({ scheduledWeeklyHours: 20 }));
    expect(lastArgs().p_scheduled_weekly_hours).toBe(20);
  });

  it('records the covered-employer override as an evidenced fact, not a silent flag', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await mhdLeaveWorkflowService.evaluate(facts({ coveredEmployerOverride: true }));
    expect(lastArgs().p_eligibility_context).toEqual({ covered_employer_override: true });
  });

  it('surfaces the 22023 raised when the scheduled workweek is missing or zero', async () => {
    rpcMock.mockResolvedValueOnce({
      error: { code: '22023', message: 'Scheduled weekly hours must be positive' },
    });
    await expect(
      mhdLeaveWorkflowService.evaluate(facts({ scheduledWeeklyHours: 0 })),
    ).rejects.toMatchObject({ code: '22023' });
  });
});

/* ------------------------------------------------------------------ */
/* Per-basis outcomes — CFRA vs FMLA vs PDL                            */
/* ------------------------------------------------------------------ */

/** One determination row, exactly as the RPC returns it. */
function determination(
  typeKey: string,
  outcome: string,
  entitlement: number | null,
  findings: Array<Record<string, unknown>> = [],
) {
  return {
    snapshot_id: 'snap-1',
    determination_id: `det-${typeKey}`,
    leave_type_id: `type-${typeKey}`,
    type_key: typeKey,
    evaluated_outcome: outcome,
    entitlement_hours: entitlement,
    findings,
  };
}

describe('the engine reaches an INDEPENDENT conclusion per legal basis', () => {
  it('CFRA is covered at 5 employees where FMLA is not covered at 50', async () => {
    // A 6-employee California employer: CFRA's employer threshold (5) is met,
    // FMLA's (50) is not. One fact set, two different answers.
    rpcMock.mockResolvedValueOnce({
      data: [
        determination('CFRA', 'ELIGIBLE', 480),
        determination('FMLA', 'INELIGIBLE', null, [
          { code: 'EMPLOYER_COVERAGE_NOT_MET', required: '50', actual: 6 },
        ]),
      ],
      error: null,
    });

    const rows = (await mhdLeaveWorkflowService.evaluate(
      facts({ employerEmployeeCount: 6, worksiteEmployeeCount75: 6 }),
    )) as ReturnType<typeof determination>[];

    const cfra = rows.find((row) => row.type_key === 'CFRA');
    const fmla = rows.find((row) => row.type_key === 'FMLA');
    expect(cfra?.evaluated_outcome).toBe('ELIGIBLE');
    expect(fmla?.evaluated_outcome).toBe('INELIGIBLE');
    expect(fmla?.findings.map((f) => f.code)).toContain('EMPLOYER_COVERAGE_NOT_MET');
  });

  it('CFRA never fails on the 75-mile worksite test — that finding is FMLA-only', async () => {
    // 8 employees at the worksite: FMLA fails its 50-within-75-miles test; CFRA
    // has no such test at all, so no worksite finding may ever appear on it.
    rpcMock.mockResolvedValueOnce({
      data: [
        determination('CFRA', 'ELIGIBLE', 480),
        determination('FMLA', 'INELIGIBLE', null, [
          { code: 'FMLA_75_MILE_WORKSITE_NOT_MET', required: '50', actual: 8 },
        ]),
      ],
      error: null,
    });

    const rows = (await mhdLeaveWorkflowService.evaluate(
      facts({ employerEmployeeCount: 60, worksiteEmployeeCount75: 8 }),
    )) as ReturnType<typeof determination>[];

    const cfra = rows.find((row) => row.type_key === 'CFRA');
    const fmla = rows.find((row) => row.type_key === 'FMLA');
    expect(cfra?.findings.map((f) => f.code)).not.toContain('FMLA_75_MILE_WORKSITE_NOT_MET');
    expect(cfra?.evaluated_outcome).toBe('ELIGIBLE');
    expect(fmla?.findings.map((f) => f.code)).toContain('FMLA_75_MILE_WORKSITE_NOT_MET');
  });

  it('PDL is eligible on day one — no tenure and no hours-worked gate', async () => {
    // A brand-new employee with zero months of service and zero hours worked.
    // FMLA and CFRA both fail their tenure/hours gates; PDL has none.
    rpcMock.mockResolvedValueOnce({
      data: [
        determination('PREGNANCY_DISABILITY', 'ELIGIBLE', 693.33),
        determination('FMLA', 'INELIGIBLE', null, [
          { code: 'MONTHS_OF_SERVICE_NOT_MET', required: '12', actual: 0 },
          { code: 'HOURS_WORKED_NOT_MET', required: '1250', actual: 0 },
        ]),
        determination('CFRA', 'INELIGIBLE', null, [
          { code: 'MONTHS_OF_SERVICE_NOT_MET', required: '12', actual: 0 },
          { code: 'CFRA_EXCLUDES_PREGNANCY_DISABILITY' },
        ]),
      ],
      error: null,
    });

    const rows = (await mhdLeaveWorkflowService.evaluate(
      facts({
        reasonCode: 'PREGNANCY_DISABILITY',
        monthsOfService: 0,
        hoursWorked12Months: 0,
        employerEmployeeCount: 5,
      }),
    )) as ReturnType<typeof determination>[];

    const pdl = rows.find((row) => row.type_key === 'PREGNANCY_DISABILITY');
    expect(pdl?.evaluated_outcome).toBe('ELIGIBLE');
    // Neither gate may appear against PDL, no matter the facts.
    expect(pdl?.findings.map((f) => f.code)).not.toContain('MONTHS_OF_SERVICE_NOT_MET');
    expect(pdl?.findings.map((f) => f.code)).not.toContain('HOURS_WORKED_NOT_MET');
  });

  it('PDL is separate from CFRA — CFRA excludes pregnancy disability outright', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        determination('PREGNANCY_DISABILITY', 'ELIGIBLE', 693.33),
        determination('CFRA', 'INELIGIBLE', null, [{ code: 'CFRA_EXCLUDES_PREGNANCY_DISABILITY' }]),
        // FMLA MAY run concurrently during pregnancy disability, and does here
        // because the employee meets its gates. PDL does not consume it.
        determination('FMLA', 'ELIGIBLE', 480),
      ],
      error: null,
    });

    const rows = (await mhdLeaveWorkflowService.evaluate(
      facts({ reasonCode: 'PREGNANCY_DISABILITY' }),
    )) as ReturnType<typeof determination>[];

    expect(rows.find((r) => r.type_key === 'CFRA')?.evaluated_outcome).toBe('INELIGIBLE');
    expect(rows.find((r) => r.type_key === 'CFRA')?.findings.map((f) => f.code)).toContain(
      'CFRA_EXCLUDES_PREGNANCY_DISABILITY',
    );
    // Pregnancy concurrency: FMLA remains available alongside PDL, and each
    // basis carries its OWN entitlement rather than a shared pool.
    expect(rows.find((r) => r.type_key === 'FMLA')?.evaluated_outcome).toBe('ELIGIBLE');
    expect(rows.find((r) => r.type_key === 'PREGNANCY_DISABILITY')?.entitlement_hours).not.toBe(
      rows.find((r) => r.type_key === 'FMLA')?.entitlement_hours,
    );
  });

  it('a CFRA designated person is UNDETERMINED until the selection is recorded', async () => {
    // Designated-person leave is a real CFRA relationship, but the employee's
    // one-per-leave-year selection is a fact a human must supply. The engine
    // refuses to guess: UNDETERMINED, not INELIGIBLE and not ELIGIBLE.
    rpcMock.mockResolvedValueOnce({
      data: [
        determination('CFRA', 'UNDETERMINED', null, [
          { code: 'DESIGNATED_PERSON_SELECTION_REQUIRED' },
        ]),
      ],
      error: null,
    });

    const undetermined = (await mhdLeaveWorkflowService.evaluate(
      facts({
        reasonCode: 'FAMILY_SERIOUS_HEALTH_CONDITION',
        familyRelationship: 'DESIGNATED_PERSON',
        designatedPersonSelected: false,
      }),
    )) as ReturnType<typeof determination>[];

    expect(lastArgs().p_family_relationship).toBe('DESIGNATED_PERSON');
    expect(lastArgs().p_designated_person_selected).toBe(false);
    expect(undetermined[0].evaluated_outcome).toBe('UNDETERMINED');
    expect(undetermined[0].findings.map((f) => f.code)).toContain(
      'DESIGNATED_PERSON_SELECTION_REQUIRED',
    );

    rpcMock.mockResolvedValueOnce({
      data: [determination('CFRA', 'ELIGIBLE', 480)],
      error: null,
    });
    const resolved = (await mhdLeaveWorkflowService.evaluate(
      facts({
        reasonCode: 'FAMILY_SERIOUS_HEALTH_CONDITION',
        familyRelationship: 'DESIGNATED_PERSON',
        designatedPersonSelected: true,
      }),
    )) as ReturnType<typeof determination>[];

    expect(lastArgs().p_designated_person_selected).toBe(true);
    expect(resolved[0].evaluated_outcome).toBe('ELIGIBLE');
  });

  it('carries the CFRA family relationships FMLA does not recognize', async () => {
    // Grandparent, grandchild, sibling, domestic partner and designated person
    // are CFRA relationships with no FMLA counterpart.
    for (const relationship of [
      'GRANDPARENT',
      'GRANDCHILD',
      'SIBLING',
      'DOMESTIC_PARTNER',
      'DESIGNATED_PERSON',
    ]) {
      rpcMock.mockResolvedValueOnce({
        data: [
          determination('CFRA', 'ELIGIBLE', 480),
          determination('FMLA', 'INELIGIBLE', null, [
            { code: 'FAMILY_RELATIONSHIP_NOT_COVERED', relationship },
          ]),
        ],
        error: null,
      });

      const rows = (await mhdLeaveWorkflowService.evaluate(
        facts({
          reasonCode: 'FAMILY_SERIOUS_HEALTH_CONDITION',
          familyRelationship: relationship,
          designatedPersonSelected: true,
        }),
      )) as ReturnType<typeof determination>[];

      expect(lastArgs().p_family_relationship).toBe(relationship);
      expect(rows.find((r) => r.type_key === 'CFRA')?.evaluated_outcome).toBe('ELIGIBLE');
      expect(rows.find((r) => r.type_key === 'FMLA')?.evaluated_outcome).toBe('INELIGIBLE');
    }
  });
});

/* ------------------------------------------------------------------ */
/* Recommendation, not decision                                        */
/* ------------------------------------------------------------------ */

describe('rule-engine results are recommendations a human must confirm or override', () => {
  it('confirmation is keyed on the SNAPSHOT, so the whole fact set is confirmed at once', async () => {
    // Confirming one basis in isolation would let the confirmed set drift from
    // the facts it was derived from; the RPC takes p_snapshot_id, not a
    // determination id.
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdLeaveWorkflowService.confirm('snap-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_eligibility_confirm', {
      p_snapshot_id: 'snap-1',
    });
  });

  it('an unconfirmed determination leaves the case with NO designable basis', async () => {
    // mhd_leave_eligibility_confirm is what writes leave_case_bases, and
    // mhd_leave_designate raises 22023 when there are none. Designating hours
    // before a human has confirmed is therefore structurally impossible, not
    // merely discouraged.
    rpcMock.mockResolvedValueOnce({
      error: {
        code: '22023',
        message: 'Case LOA-0001 has no designated legal bases; set them before designating hours',
      },
    });

    await expect(
      mhdLeavesService.designate({ caseId: CASE, hours: 480, effectiveDate: '2026-08-01' }),
    ).rejects.toMatchObject({ code: '22023' });
  });

  it('designation writes one ledger row per confirmed basis once confirmation happened', async () => {
    rpcMock.mockResolvedValueOnce({ data: '2', error: null });
    const rows = await mhdLeavesService.designate({
      caseId: CASE,
      hours: 480,
      effectiveDate: '2026-08-01',
    });
    // FMLA and PDL running concurrently: one designation, two independent
    // clocks moved.
    expect(rows).toBe(2);
  });

  it('an override is recorded as a reasoned act against a specific determination', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdLeaveWorkflowService.override({
      determinationId: 'det-CFRA',
      effectiveOutcome: 'ELIGIBLE',
      overrideReason: 'Verified prior service credited under a predecessor employer.',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_eligibility_override', {
      p_determination_id: 'det-CFRA',
      p_effective_outcome: 'ELIGIBLE',
      p_override_reason: 'Verified prior service credited under a predecessor employer.',
    });
  });

  it('refuses to send an override with no recorded reason', async () => {
    await expect(
      mhdLeaveWorkflowService.override({
        determinationId: 'det-CFRA',
        effectiveOutcome: 'ELIGIBLE',
        overrideReason: '   ',
      }),
    ).rejects.toThrow(/reason/i);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* Independent balances                                                */
/* ------------------------------------------------------------------ */

describe('each legal basis keeps its own balance', () => {
  it('exhausting one basis leaves the others whole', async () => {
    rpcMock.mockResolvedValueOnce({ data: '0', error: null });
    const fmla = await mhdLeavesService.balance('person-1', 'type-FMLA', '2026-08-01');

    rpcMock.mockResolvedValueOnce({ data: '480', error: null });
    const cfra = await mhdLeavesService.balance('person-1', 'type-CFRA', '2026-08-01');

    rpcMock.mockResolvedValueOnce({ data: '693.33', error: null });
    const pdl = await mhdLeavesService.balance('person-1', 'type-PDL', '2026-08-01');

    expect(fmla).toBe(0);
    expect(cfra).toBe(480);
    // PDL's four months is per pregnancy and neither shares nor reduces the
    // family/medical entitlements.
    expect(pdl).toBeCloseTo(693.33, 2);
  });
});

/* ------------------------------------------------------------------ */
/* Operational contact history carries no medical content              */
/* ------------------------------------------------------------------ */

describe('workflow evidence stays inside its sensitivity tier', () => {
  it('records an operational contact with an explicit visibility tier', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'event-1', error: null });
    await mhdLeaveWorkflowService.recordEvent({
      caseId: CASE,
      eventType: 'CONTACT',
      channel: 'PHONE',
      summary: 'Confirmed the expected return date.',
      visibility: 'HR_ONLY',
    });
    const args = lastArgs();
    expect(args.p_visibility).toBe('HR_ONLY');
    expect(args.p_summary).toBe('Confirmed the expected return date.');
  });

  it('links return-to-work restrictions to an accommodation referral', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'rtw-1', error: null });
    await mhdLeaveWorkflowService.recordReturnToWork({
      caseId: CASE,
      expectedReturnDate: '2026-10-01',
      fitnessRequired: false,
      restrictionsPresent: true,
      accommodationReferralRequired: true,
    });
    const args = lastArgs();
    // Restrictions on return are the classic leave→accommodation hand-off; the
    // referral flag is what opens the interactive process rather than ending
    // the employment relationship.
    expect(args.p_restrictions_present).toBe(true);
    expect(args.p_accommodation_referral_required).toBe(true);
  });
});

describe('leave notice document and delivery integration', () => {
  it('records every migration-0238 notice argument under its declared p_ name', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'notice-1', error: null });
    await expect(mhdLeaveWorkflowService.recordNotice({
      caseId: CASE, noticeType: 'ELIGIBILITY', templateKey: 'FMLA_ELIGIBILITY_NOTICE', templateVersion: 3,
      leaveTypeId: 'type-1', dueAt: '2026-09-01T00:00:00.000Z', authorityName: 'DOL',
      authoritySourceUrl: 'https://dol.gov/fmla', contentRegistryId: 'content-1', snapshot: { outcome: 'ELIGIBLE' }, documentGenerationId: 'gen-1',
    })).resolves.toBe('notice-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_notice_record', {
      p_case_id: CASE, p_notice_type: 'ELIGIBILITY', p_template_key: 'FMLA_ELIGIBILITY_NOTICE', p_template_version: 3,
      p_leave_type_id: 'type-1', p_due_at: '2026-09-01T00:00:00.000Z', p_authority_name: 'DOL',
      p_authority_source_url: 'https://dol.gov/fmla', p_content_registry_id: 'content-1', p_snapshot: { outcome: 'ELIGIBLE' }, p_document_generation_id: 'gen-1',
    });
  });

  it('marks notice delivery with status and optional physical-mail fields', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdLeaveWorkflowService.markNoticeDelivery({ noticeId: 'notice-1', status: 'DELIVERED', deliveryMethod: 'CERTIFIED_MAIL', deliveryReference: '9400' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_notice_mark_delivery', {
      p_notice_id: 'notice-1', p_status: 'DELIVERED', p_delivery_method: 'CERTIFIED_MAIL', p_delivery_reference: '9400',
    });
  });
});

/* ------------------------------------------------------------------ */
/* Pre-live compliance gate                                            */
/* ------------------------------------------------------------------ */

describe('the Leaves pre-live compliance gate', () => {
  it('reads readiness for the LEAVES module and reports pending blockers', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          module_key: 'LEAVES',
          release_ready: false,
          blocker_count: 4,
          blockers: [
            {
              content_key: 'FMLA_ELIGIBILITY_NOTICE',
              version: 1,
              review_status: 'PENDING_REVIEW',
              production_enabled: false,
              source_url: 'https://www.dol.gov/agencies/whd/fmla',
            },
          ],
        },
      ],
      error: null,
    });

    const readiness = await mhdLeaveWorkflowService.readiness();

    expect(rpcMock).toHaveBeenCalledWith('mhd_compliance_module_readiness', {
      p_module_key: 'LEAVES',
    });
    expect(readiness?.release_ready).toBe(false);
    expect(readiness?.blockers[0].production_enabled).toBe(false);
  });
});
