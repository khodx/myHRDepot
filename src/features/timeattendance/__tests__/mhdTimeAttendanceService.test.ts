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
