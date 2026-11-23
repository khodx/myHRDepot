import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdLeaveWorkflowService } = await import('../WorkflowService');
const { mhdLeavesService } = await import('../Service');

const CASE = 'case-1';

function lastArgs(): Record<string, unknown> {
  return rpcMock.mock.calls[rpcMock.mock.calls.length - 1][1] as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/* The fact contract                                                   */
/* ------------------------------------------------------------------ */

describe('eligibility runs only from company records and the HR payroll record', () => {
  it('runs the evaluation by case id alone, with no caller-typed facts', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { ran: false, blockers: ['SCHEDULE_ASSIGNMENT_REQUIRED'] },
      error: null,
    });
    const result = await mhdLeaveWorkflowService.runEligibility(CASE);
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_eligibility_run', { p_case_id: CASE });
    expect(result).toEqual({
      ran: false,
      snapshotId: null,
      blockers: ['SCHEDULE_ASSIGNMENT_REQUIRED'],
      recordId: undefined,
    });
  });

  it('records payroll hours under the declared p_ names and returns the evaluation outcome', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { record_id: 'rec-1', ran: true, snapshot_id: 'snap-1', blockers: [] },
      error: null,
    });
    const result = await mhdLeaveWorkflowService.recordPayrollHours({
      caseId: CASE,
      hoursWorked12Months: 1380.5,
      periodStart: '2025-07-01',
      periodEnd: '2026-06-30',
      attachmentId: 'att-1',
      note: 'Payroll register export',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_payroll_hours_record', {
      p_case_id: CASE,
      p_hours_worked_12_months: 1380.5,
      p_period_start: '2025-07-01',
      p_period_end: '2026-06-30',
      p_attachment_id: 'att-1',
      p_note: 'Payroll register export',
    });
    expect(result).toMatchObject({ ran: true, snapshotId: 'snap-1', recordId: 'rec-1' });
  });

  it('surfaces the server refusal when a non-HR caller records payroll hours', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Only HR may record payroll hours' },
    });
    await expect(
      mhdLeaveWorkflowService.recordPayrollHours({
        caseId: CASE,
        hoursWorked12Months: 1200,
        periodStart: '2025-07-01',
        periodEnd: '2026-06-30',
        attachmentId: 'att-1',
      }),
    ).rejects.toThrow('Only HR may record payroll hours');
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
      visibility: 'ADMIN_ONLY',
    });
    const args = lastArgs();
    expect(args.p_visibility).toBe('ADMIN_ONLY');
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
    await expect(
      mhdLeaveWorkflowService.recordNotice({
        caseId: CASE,
        noticeType: 'ELIGIBILITY',
        templateKey: 'FMLA_ELIGIBILITY_NOTICE',
        templateVersion: 3,
        leaveTypeId: 'type-1',
        dueAt: '2026-09-01T00:00:00.000Z',
        authorityName: 'DOL',
        authoritySourceUrl: 'https://dol.gov/fmla',
        contentRegistryId: 'content-1',
        snapshot: { outcome: 'ELIGIBLE' },
        documentGenerationId: 'gen-1',
      }),
    ).resolves.toBe('notice-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_notice_record', {
      p_case_id: CASE,
      p_notice_type: 'ELIGIBILITY',
      p_template_key: 'FMLA_ELIGIBILITY_NOTICE',
      p_template_version: 3,
      p_leave_type_id: 'type-1',
      p_due_at: '2026-09-01T00:00:00.000Z',
      p_authority_name: 'DOL',
      p_authority_source_url: 'https://dol.gov/fmla',
      p_content_registry_id: 'content-1',
      p_snapshot: { outcome: 'ELIGIBLE' },
      p_document_generation_id: 'gen-1',
    });
  });

  it('marks notice delivery with status and optional physical-mail fields', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdLeaveWorkflowService.markNoticeDelivery({
      noticeId: 'notice-1',
      status: 'DELIVERED',
      deliveryMethod: 'CERTIFIED_MAIL',
      deliveryReference: '9400',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_notice_mark_delivery', {
      p_notice_id: 'notice-1',
      p_status: 'DELIVERED',
      p_delivery_method: 'CERTIFIED_MAIL',
      p_delivery_reference: '9400',
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
