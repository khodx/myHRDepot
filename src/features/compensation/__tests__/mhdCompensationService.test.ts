import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdCompensationService } from '../Service';

const { rpc, invoke } = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc,
    functions: { invoke },
  },
}));

describe('mhdCompensationService', () => {
  beforeEach(() => {
    rpc.mockReset();
    invoke.mockReset();
  });

  it('maps multiple classification evaluation rows', async () => {
    rpc.mockResolvedValue({ data: [
      { snapshot_id: 's1', determination_id: 'd1', jurisdiction: 'FEDERAL', evaluated_outcome: 'EXEMPT', findings: {} },
      { snapshot_id: 's1', determination_id: 'd2', jurisdiction: 'CA', evaluated_outcome: 'NON_EXEMPT', findings: { reason: 'salary' } },
    ], error: null });
    await expect(mhdCompensationService.evaluate({ jobId: 'j1', asOfDate: '2026-01-01', exemptionCategory: 'EXECUTIVE' })).resolves.toEqual([
      { snapshotId: 's1', determinationId: 'd1', jurisdiction: 'FEDERAL', evaluatedOutcome: 'EXEMPT', findings: {} },
      { snapshotId: 's1', determinationId: 'd2', jurisdiction: 'CA', evaluatedOutcome: 'NON_EXEMPT', findings: { reason: 'salary' } },
    ]);
  });

  it('confirms a determination and overrides with the correct params', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await mhdCompensationService.confirm('d1');
    expect(rpc).toHaveBeenNthCalledWith(1, 'mhd_job_classification_confirm', { p_determination_id: 'd1' });
    await mhdCompensationService.override({ determinationId: 'd2', effectiveOutcome: 'NON_EXEMPT', overrideReason: ' Manual review ' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'mhd_job_classification_override', { p_determination_id: 'd2', p_effective_outcome: 'NON_EXEMPT', p_override_reason: 'Manual review' });
  });

  it('rejects a blank override reason before calling Supabase', async () => {
    await expect(mhdCompensationService.override({ determinationId: 'd1', effectiveOutcome: 'EXEMPT', overrideReason: '  ' })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('throws when the BLS function returns a client-level error', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('network') });
    await expect(mhdCompensationService.marketWageLookup({ jobId: 'j1', onetSocCode: '11-1011' })).rejects.toThrow('network');
  });

  it('throws when the BLS function returns success false in its body', async () => {
    invoke.mockResolvedValue({ data: { success: false, error: 'No BLS data' }, error: null });
    await expect(mhdCompensationService.marketWageLookup({ jobId: 'j1', onetSocCode: '11-1011' })).rejects.toThrow('No BLS data');
  });
});
