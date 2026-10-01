import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mhdModuleAlertsService } from '../Service';

const mockRpc = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: mockRpc },
}));

describe('mhdModuleAlertsService.getCounts', () => {
  beforeEach(() => vi.resetAllMocks());

  it('keys each count by module route and coerces bigint strings to numbers', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { module_route: '/tasks', needs_attention: '3' },
        { module_route: '/forms', needs_attention: 0 },
      ],
      error: null,
    });

    await expect(mhdModuleAlertsService.getCounts()).resolves.toEqual({ '/tasks': 3, '/forms': 0 });
    expect(mockRpc).toHaveBeenCalledWith('mhd_module_attention_counts');
  });

  it('returns an empty map when nothing needs attention', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(mhdModuleAlertsService.getCounts()).resolves.toEqual({});
  });

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Permission denied' } });
    await expect(mhdModuleAlertsService.getCounts()).rejects.toThrow('Permission denied');
  });
});
