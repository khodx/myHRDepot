import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdTimeAttendanceService } = await import('../Service');

const occurrenceRow = {
  id: 'occ-1',
  reference_id: 'OCCR-000001',
  person_id: 'person-self',
  person_display_name: 'Sam Self',
  occurrence_date: '2026-07-01',
  occurrence_type: 'ABSENCE',
  classification: 'UNEXCUSED',
  protected_leave_category: null,
  minutes_variance: null,
  reason_note: null,
  points_assessed: 1,
  voided_at: null,
};

const ledgerRow = {
  id: 'led-1',
  occurrence_id: 'occ-1',
  occurrence_reference: 'OCCR-000001',
  entry_type: 'ASSESSMENT',
  points_delta: 1,
  effective_date: '2026-07-01',
  expires_on: '2027-07-01',
  reason: null,
  reversal_of_entry_id: null,
  created_at: '2026-07-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * The subject-self contract: an employee sees their OWN occurrences and their
 * OWN point ledger through the same RPCs a privileged caller uses (the person
 * branch is in the RPC/RLS, not a UI filter) — but the threshold and
 * reassessment RPCs are SECURITY DEFINER and refuse a non-privileged caller with
 * 42501. These are pending decisions about disciplining the employee, and must
 * never reach them.
 */
describe('mhdTimeAttendanceService — subject-self visibility', () => {
  it('returns the employee’s own occurrences and passes the self person filter', async () => {
    rpcMock.mockResolvedValueOnce({ data: [occurrenceRow], error: null });

    const rows = await mhdTimeAttendanceService.listOccurrences({
      companyId: 'company-1',
      personId: 'person-self',
      occurrenceType: 'ALL',
      classification: 'ALL',
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_attendance_list_occurrences',
      expect.objectContaining({ p_company_id: 'company-1', p_person_id: 'person-self' }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ personId: 'person-self', pointsAssessed: 1 });
  });

  it('returns the employee’s own point ledger', async () => {
    rpcMock.mockResolvedValueOnce({ data: [ledgerRow], error: null });

    const ledger = await mhdTimeAttendanceService.listPointLedger('person-self');

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_attendance_list_point_ledger',
      expect.objectContaining({ p_person_id: 'person-self' }),
    );
    expect(ledger[0]).toMatchObject({ entryType: 'ASSESSMENT', pointsDelta: 1 });
  });

  it('surfaces the 42501 denial an employee hits on the threshold-events RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: {
        code: '42501',
        message: 'permission denied for function mhd_attendance_list_threshold_events',
      },
    });

    await expect(mhdTimeAttendanceService.listThresholdEvents('company-1')).rejects.toMatchObject({
      code: '42501',
    });
  });

  it('surfaces the 42501 denial an employee hits on the reassessment-events RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: {
        code: '42501',
        message: 'permission denied for function mhd_attendance_list_reassessment_events',
      },
    });

    await expect(
      mhdTimeAttendanceService.listReassessmentEvents('company-1'),
    ).rejects.toMatchObject({ code: '42501' });
  });
});

/**
 * Migration 0335 hands managers a redacted view and HR Coordinator a read-only one. The
 * redaction happens in the RPC, so the service must pass the nulls through unchanged
 * rather than invent defaults for them.
 */
describe('mhdTimeAttendanceService - redacted and read-only views', () => {
  it('maps a manager-redacted occurrence: category and note stay null', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          ...occurrenceRow,
          classification: 'PROTECTED',
          protected_leave_category: null,
          reason_note: null,
          points_assessed: 0,
        },
      ],
      error: null,
    });

    const [row] = await mhdTimeAttendanceService.listOccurrences({
      companyId: 'company-1',
      personId: null,
      occurrenceType: 'ALL',
      classification: 'ALL',
    });

    expect(row).toMatchObject({
      classification: 'PROTECTED',
      protectedLeaveCategory: null,
      reasonNote: null,
      pointsAssessed: 0,
    });
  });

  it('requests the whole visible set when no person is chosen', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await mhdTimeAttendanceService.listOccurrences({
      companyId: 'company-1',
      personId: null,
      occurrenceType: 'ALL',
      classification: 'ALL',
    });
    const args = rpcMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(args.p_person_id).toBeUndefined();
    expect(args.p_occurrence_type).toBeUndefined();
    expect(args.p_classification).toBeUndefined();
  });

  it('maps the Conduct case linked to a threshold event', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'th-1',
          person_id: 'person-1',
          person_display_name: 'Priya Raman',
          action_level: 'WRITTEN_WARNING',
          points_at: 6,
          points_at_crossing: 6.5,
          crossed_at: '2026-09-01T00:00:00Z',
          status: 'ACTIONED',
          resolution_note: null,
          linked_task_id: null,
          linked_conduct_case_id: 'case-1',
          linked_conduct_case_reference: 'C4F-2-0A1B-7-9D',
        },
        {
          id: 'th-2',
          person_id: 'person-2',
          person_display_name: 'Tomas Okafor',
          action_level: 'VERBAL_WARNING',
          points_at: 3,
          points_at_crossing: 3,
          crossed_at: '2026-09-02T00:00:00Z',
          status: 'RAISED',
          resolution_note: null,
          linked_task_id: null,
          linked_conduct_case_id: null,
          linked_conduct_case_reference: null,
        },
      ],
      error: null,
    });

    const [linked, open] = await mhdTimeAttendanceService.listThresholdEvents('company-1');

    expect(linked).toMatchObject({
      status: 'ACTIONED',
      linkedConductCaseId: 'case-1',
      linkedConductCaseReference: 'C4F-2-0A1B-7-9D',
      pointsAtCrossing: 6.5,
    });
    expect(open).toMatchObject({ linkedConductCaseId: null, linkedConductCaseReference: null });
  });
});

describe('mhdTimeAttendanceService - mutation contracts', () => {
  it('sends a reclassification with its reason and category through the dedicated RPC', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTimeAttendanceService.reclassifyOccurrence({
      occurrenceId: 'occ-1',
      classification: 'PROTECTED',
      protectedLeaveCategory: 'CFRA',
      reason: '  Certification received.  ',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_attendance_reclassify_occurrence', {
      p_occurrence_id: 'occ-1',
      p_classification: 'PROTECTED',
      p_protected_leave_category: 'CFRA',
      p_reason: 'Certification received.',
    });
  });

  it('omits the category when reclassifying out of PROTECTED so the RPC applies its null default', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTimeAttendanceService.reclassifyOccurrence({
      occurrenceId: 'occ-1',
      classification: 'UNEXCUSED',
      protectedLeaveCategory: null,
      reason: 'Certification not received.',
    });
    const args = rpcMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(args.p_protected_leave_category).toBeUndefined();
  });

  it('never sends a classification through the plain update RPC', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTimeAttendanceService.updateOccurrence({
      occurrenceId: 'occ-1',
      occurrenceType: 'TARDY',
      minutesVariance: 12,
      reasonNote: 'Traffic.',
    });
    const args = rpcMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(Object.keys(args).sort()).toEqual(
      ['p_minutes_variance', 'p_occurrence_id', 'p_occurrence_type', 'p_reason_note'].sort(),
    );
  });

  it('ends an assignment and overrides a shift through their RPCs', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await mhdTimeAttendanceService.endAssignment('asg-1', '2026-10-31');
    expect(rpcMock).toHaveBeenCalledWith('mhd_schedule_end_assignment', {
      p_assignment_id: 'asg-1',
      p_effective_to: '2026-10-31',
    });

    await mhdTimeAttendanceService.overrideShift({
      shiftId: 'shift-1',
      startTime: '08:00',
      endTime: '16:30',
      unpaidBreakMinutes: null,
      reason: '  Covering a colleague.  ',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_schedule_override_shift', {
      p_shift_id: 'shift-1',
      p_start_time: '08:00',
      p_end_time: '16:30',
      p_unpaid_break_minutes: 0,
      p_reason: 'Covering a colleague.',
    });
  });

  it('upserts and deletes a company holiday through their RPCs', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'holiday-1', error: null });
    await mhdTimeAttendanceService.upsertHoliday(
      'company-1',
      '2026-12-25',
      '  Christmas Day ',
      true,
    );
    expect(rpcMock).toHaveBeenCalledWith('mhd_schedule_upsert_holiday', {
      p_company_id: 'company-1',
      p_holiday_date: '2026-12-25',
      p_holiday_name: 'Christmas Day',
      p_is_paid: true,
    });

    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTimeAttendanceService.deleteHoliday('holiday-1');
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_schedule_delete_holiday', {
      p_holiday_id: 'holiday-1',
    });
  });

  it('surfaces the server error when a template delete is refused', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { code: '23503', message: 'Template has assignments and cannot be deleted' },
    });
    await expect(mhdTimeAttendanceService.deleteTemplate('tpl-1')).rejects.toMatchObject({
      code: '23503',
    });
  });
});
