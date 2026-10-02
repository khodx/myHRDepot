import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdGrievancesService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdGrievancesService', () => {
  it('never queries the list RPC without a company — an empty board, not a query', async () => {
    const rows = await mhdGrievancesService.listGrievances({ companyId: null });
    expect(rows).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('maps a listed grievance, including a null status filter defaulting to undefined', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'g1',
          reference_id: 'GRV-000001',
          person_id: 'p1',
          person_display_name: 'Dana Doe',
          status: 'SUBMITTED',
          is_harassment_related: false,
          submitted_at: '2026-09-01T00:00:00Z',
          acknowledged_at: null,
          referred_to_process: null,
          referred_at: null,
          resolution_at: null,
          closed_at: null,
        },
      ],
      error: null,
    });

    const rows = await mhdGrievancesService.listGrievances({ companyId: 'company-1' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_grievance_list', {
      p_company_id: 'company-1',
      p_status: undefined,
    });
    expect(rows).toEqual([
      {
        id: 'g1',
        referenceId: 'GRV-000001',
        personId: 'p1',
        personDisplayName: 'Dana Doe',
        status: 'SUBMITTED',
        isHarassmentRelated: false,
        submittedAt: '2026-09-01T00:00:00Z',
        acknowledgedAt: null,
        referredToProcess: null,
        referredAt: null,
        resolutionAt: null,
        closedAt: null,
      },
    ]);
  });

  it('submits a grievance and returns its id', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'grievance-1', error: null });
    const id = await mhdGrievancesService.submitGrievance({
      companyId: 'company-1',
      personId: 'person-1',
      grievanceWhat: 'What happened',
      disagreementExplanation: 'Why I disagree',
      remedyRequested: 'The remedy',
      employeeSignatureName: 'Dana Doe',
    });
    expect(id).toBe('grievance-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_submit_grievance', {
      p_company_id: 'company-1',
      p_person_id: 'person-1',
      p_grievance_what: 'What happened',
      p_disagreement_explanation: 'Why I disagree',
      p_remedy_requested: 'The remedy',
      p_employee_signature_name: 'Dana Doe',
      p_grievance_who: undefined,
      p_grievance_where: undefined,
      p_grievance_when: undefined,
      p_grievance_why: undefined,
      p_is_harassment_related: false,
    });
  });

  it('acknowledges, refers, resolves, rejects, and withdraws with the right RPC and args', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await mhdGrievancesService.acknowledgeGrievance('g1');
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_grievance_acknowledge', { p_grievance_id: 'g1' });

    await mhdGrievancesService.referGrievance({
      grievanceId: 'g1',
      referredToProcess: 'Harassment Policy',
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_grievance_refer', {
      p_grievance_id: 'g1',
      p_referred_to_process: 'Harassment Policy',
    });

    await mhdGrievancesService.resolveGrievance({
      grievanceId: 'g1',
      resolution: 'Resolved amicably',
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_grievance_resolve', {
      p_grievance_id: 'g1',
      p_resolution: 'Resolved amicably',
    });

    await mhdGrievancesService.rejectGrievance({
      grievanceId: 'g1',
      reason: 'Oral reprimand, not recorded',
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_grievance_reject_not_grievable', {
      p_grievance_id: 'g1',
      p_reason: 'Oral reprimand, not recorded',
    });

    await mhdGrievancesService.withdrawGrievance('g1');
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_grievance_withdraw', { p_grievance_id: 'g1' });
  });

  it('links a referral to an investigation when one is given, and sends nothing extra otherwise', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await mhdGrievancesService.referGrievance({
      grievanceId: 'g1',
      referredToProcess: 'Investigation',
      investigationCaseId: 'case-9',
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_grievance_refer', {
      p_grievance_id: 'g1',
      p_referred_to_process: 'Investigation',
      p_investigation_case_id: 'case-9',
    });

    await mhdGrievancesService.referGrievance({
      grievanceId: 'g1',
      referredToProcess: 'Mediation',
      investigationCaseId: null,
    });
    expect(rpcMock.mock.lastCall?.[1]).not.toHaveProperty('p_investigation_case_id');
  });

  it('propagates a denial error verbatim from get', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'Access denied' } });
    await expect(mhdGrievancesService.getGrievance('g1')).rejects.toMatchObject({
      message: 'Access denied',
    });
  });
});
