import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdMileageService } = await import('../Service');

// snake_case row fixtures, exactly as PostgREST serialises the RPC results.
const ownTripRow = {
  id: 'trip-1',
  reference_id: 'TRIP-000001',
  person_id: 'person-self',
  person_display_name: 'Self Employee',
  trip_date: '2026-06-15',
  miles: '42.00',
  reimbursable_miles: '42.00',
  origin: 'Office',
  destination: 'Client site',
  business_purpose: 'Kickoff meeting',
  recorded_on_behalf: false,
  claim_id: null,
  claim_status: null,
  voided_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdMileageService — employee scope', () => {
  it('lists the employee’s own trips and pins the self person filter', async () => {
    rpcMock.mockResolvedValueOnce({ data: [ownTripRow], error: null });

    const rows = await mhdMileageService.listTrips({
      companyId: 'company-1',
      personId: 'person-self',
      unclaimedOnly: false,
      includeVoided: false,
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_mileage_list_trips',
      expect.objectContaining({ p_company_id: 'company-1', p_person_id: 'person-self' }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ personId: 'person-self', miles: 42, reimbursableMiles: 42 });
  });

  it('surfaces the 42501 an employee hits requesting another person’s trips', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'permission denied: mileage trips are visible to their owner' },
    });

    await expect(
      mhdMileageService.listTrips({ companyId: 'company-1', personId: 'someone-else' }),
    ).rejects.toMatchObject({ code: '42501' });
  });
});

describe('mhdMileageService — the global rate registry is Platform-Admin-write', () => {
  it('accepts a Platform Admin proposal and returns the minted reference', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'rate-1', reference_id: 'MRTE-000007' }],
      error: null,
    });

    const result = await mhdMileageService.proposeRate({
      category: 'BUSINESS',
      ratePerMile: 0.7,
      effectiveFrom: '2026-07-01',
      sourceUrl: 'https://www.irs.gov/newsroom/irs-mileage',
      noticeNumber: 'IR-2026-XX',
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_mileage_propose_rate',
      expect.objectContaining({ p_rate_per_mile: 0.7, p_notice_number: 'IR-2026-XX' }),
    );
    expect(result).toEqual({ id: 'rate-1', referenceId: 'MRTE-000007' });
  });

  it('surfaces the 42501 an HR Partner hits writing the global registry', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'permission denied: only Platform Admin may write the IRS rate registry' },
    });

    await expect(
      mhdMileageService.proposeRate({
        category: 'BUSINESS',
        ratePerMile: 0.7,
        effectiveFrom: '2026-07-01',
        sourceUrl: 'https://www.irs.gov/newsroom/irs-mileage',
        noticeNumber: 'IR-2026-XX',
      }),
    ).rejects.toMatchObject({ code: '42501' });
  });
});

describe('mhdMileageService — stamping across a mid-year rate boundary', () => {
  it('prices each line from its own trip date’s rate, each citing its own notice', async () => {
    // A single claim straddling the real 2026-07-01 revision: June before it,
    // July after. Each line arrives stamped against a different registry row.
    const detailRow = {
      id: 'claim-1',
      reference_id: 'MCLM-000001',
      person_id: 'person-self',
      person_display_name: 'Self Employee',
      period_start: '2026-06-01',
      period_end: '2026-07-31',
      status: 'APPROVED',
      total_miles: '200.00',
      total_company_amount: '137.00',
      total_irs_amount: '137.00',
      taxable_excess: '0.00',
      decision_note: null,
      exported_at: null,
      lines: [
        {
          line_number: 1,
          trip_date: '2026-06-15',
          miles: '100.00',
          irs_rate: '0.6700',
          company_rate: '0.6700',
          company_amount: '67.00',
          rate_reference: 'MRTE-000001',
          notice_number: 'Notice 2026-03',
        },
        {
          line_number: 2,
          trip_date: '2026-07-15',
          miles: '100.00',
          irs_rate: '0.7000',
          company_rate: '0.7000',
          company_amount: '70.00',
          rate_reference: 'MRTE-000002',
          notice_number: 'IR-2026-XX',
        },
      ],
    };
    rpcMock.mockResolvedValueOnce({ data: [detailRow], error: null });

    const claim = await mhdMileageService.getClaim('claim-1');

    expect(claim).not.toBeNull();
    expect(claim!.lines).toHaveLength(2);

    const [june, july] = claim!.lines;
    // Each line priced from its own date's rate — the module's reason for existing.
    expect(june.irsRate).toBe(0.67);
    expect(july.irsRate).toBe(0.7);
    expect(june.irsRate).not.toBe(july.irsRate);
    // And each cites its own publication.
    expect(june.noticeNumber).toBe('Notice 2026-03');
    expect(july.noticeNumber).toBe('IR-2026-XX');
    expect(june.noticeNumber).not.toBe(july.noticeNumber);
    // The priced amounts differ line-to-line as a result.
    expect(june.companyAmount).toBe(67);
    expect(july.companyAmount).toBe(70);
    expect(june.companyAmount).not.toBe(july.companyAmount);
  });
});
