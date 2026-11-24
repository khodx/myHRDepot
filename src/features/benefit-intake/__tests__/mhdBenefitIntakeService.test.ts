import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));

const { mhdBenefitIntakeService } = await import('../Service');
const { mhdCompanyService } = await import('@/features/companies/Service');

beforeEach(() => vi.clearAllMocks());

describe('mhdBenefitIntakeService', () => {
  it('submits exactly the supplied fields and no eligibility-fact keys', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { outcome: 'LEAVE', leave_case_id: 'c-1', eligibility: { ran: false, blockers: [] } },
      error: null,
    });
    const result = await mhdBenefitIntakeService.submit({
      reason: 'OWN_HEALTH',
      needsTimeAway: true,
      needsWorkplaceChange: false,
      requestedStart: '2026-12-01',
    });
    const [name, args] = rpcMock.mock.calls[0];
    expect(name).toBe('mhd_benefit_intake_submit');
    expect(args.p_payload).toEqual({
      reason: 'OWN_HEALTH',
      needs_time_away: true,
      needs_workplace_change: false,
      requested_start: '2026-12-01',
    });
    expect(Object.keys(args.p_payload).join(' ')).not.toMatch(
      /hours|headcount|employee_count|months|worksite/i,
    );
    expect(result).toMatchObject({ outcome: 'LEAVE', leaveCaseId: 'c-1' });
  });

  it('returns the routing text from the RPC', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'BOTH', error: null });
    await expect(
      mhdBenefitIntakeService.route({
        reason: 'PREGNANCY',
        needsTimeAway: true,
        needsWorkplaceChange: true,
      }),
    ).resolves.toBe('BOTH');
    expect(rpcMock).toHaveBeenCalledWith('mhd_benefit_intake_route', {
      p_answers: { reason: 'PREGNANCY', needs_time_away: true, needs_workplace_change: true },
    });
  });

  it('surfaces the server message on failure', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'Not permitted.' } });
    await expect(
      mhdBenefitIntakeService.submit({
        reason: 'OTHER',
        needsTimeAway: false,
        needsWorkplaceChange: true,
      }),
    ).rejects.toThrow('Not permitted.');
  });

  it('creates and answers information requests with the contract argument names', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await mhdBenefitIntakeService.createInformationRequest({
      caseType: 'LEAVE',
      caseId: 'c-1',
      question: 'Return date?',
      dueDate: '2026-12-05',
    });
    await mhdBenefitIntakeService.respondToInformationRequest({
      activityId: 'a-1',
      response: 'January 5.',
    });
    expect(rpcMock).toHaveBeenNthCalledWith(1, 'mhd_information_request_create', {
      p_case_type: 'LEAVE',
      p_case_id: 'c-1',
      p_question: 'Return date?',
      p_due_date: '2026-12-05',
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'mhd_information_request_respond', {
      p_activity_id: 'a-1',
      p_response: 'January 5.',
    });
  });

  it('reads a thread through the thread RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ note_id: 'n1', author_user_id: 'u1', note_plain_text: 'Hello', created_at: 't' }],
      error: null,
    });
    await expect(mhdBenefitIntakeService.listInformationRequestThread('a-1')).resolves.toEqual([
      { noteId: 'n1', authorUserId: 'u1', text: 'Hello', createdAt: 't' },
    ]);
    expect(rpcMock).toHaveBeenCalledWith('mhd_information_request_thread', {
      p_activity_id: 'a-1',
    });
  });
});

describe('company worksite service', () => {
  it('saves a worksite with the contract argument keys', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'w-1', error: null });
    await mhdCompanyService.saveWorksite({
      companyId: 'co-1',
      worksiteName: 'Sacramento Distribution Center',
      addressStreet: '4410 Power Inn Rd',
      addressCity: 'Sacramento',
      addressState: 'CA',
      addressZip: '95826',
      latitude: 38.52,
      longitude: -121.41,
    } as never);
    expect(rpcMock).toHaveBeenCalledWith('mhd_company_worksite_save', {
      p_company_id: 'co-1',
      p_worksite_id: null,
      p_worksite_name: 'Sacramento Distribution Center',
      p_address_street: '4410 Power Inn Rd',
      p_address_city: 'Sacramento',
      p_address_state: 'CA',
      p_address_zip: '95826',
      p_latitude: 38.52,
      p_longitude: -121.41,
      p_is_active: true,
    });
  });

  it('assigns a person to a worksite with the contract argument keys', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'x', error: null });
    await mhdCompanyService.assignWorksite({
      personId: 'p-1',
      worksiteId: 'w-1',
      effectiveFrom: '2026-11-01',
    } as never);
    expect(rpcMock).toHaveBeenCalledWith('mhd_person_worksite_assign', {
      p_person_id: 'p-1',
      p_worksite_id: 'w-1',
      p_effective_from: '2026-11-01',
    });
  });
});
