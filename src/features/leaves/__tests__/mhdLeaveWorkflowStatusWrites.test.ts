import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));

const { mhdLeaveWorkflowService } = await import('../WorkflowService');

beforeEach(() => vi.clearAllMocks());

describe('leave status service writes', () => {
  it('sends exact segment status RPC arguments', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdLeaveWorkflowService.updateSegmentStatus({
      segmentId: 'seg-1', currentStatus: 'APPROVED', status: 'TAKEN', actualHours: 7.5,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_schedule_update_status', {
      p_segment_id: 'seg-1', p_status: 'TAKEN', p_actual_hours: 7.5,
    });
  });

  it('validates before either RPC and propagates server errors unchanged', async () => {
    await expect(mhdLeaveWorkflowService.updateSegmentStatus({
      segmentId: 'seg-1', currentStatus: 'TAKEN', status: 'APPROVED',
    })).rejects.toThrow('cannot change');
    expect(rpcMock).not.toHaveBeenCalled();

    const refusal = { code: '22023', message: 'The eligibility basis is not confirmed' };
    rpcMock.mockResolvedValueOnce({ data: null, error: refusal });
    await expect(mhdLeaveWorkflowService.updateSegmentStatus({
      segmentId: 'seg-1', currentStatus: 'APPROVED', status: 'TAKEN', actualHours: 7.5,
    })).rejects.toBe(refusal);
  });

  it('sends the obligation status and trimmed reason', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdLeaveWorkflowService.updateBenefitObligationStatus({
      obligationId: 'obl-1', currentStatus: 'ACTIVE', status: 'WAIVED', reason: '  no longer owed  ',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_benefit_obligation_update_status', {
      p_obligation_id: 'obl-1', p_status: 'WAIVED', p_reason: 'no longer owed',
    });
  });
});
