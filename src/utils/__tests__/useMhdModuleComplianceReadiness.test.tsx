import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));

const { useMhdModuleComplianceReadiness } = await import('../useMhdModuleComplianceReadiness');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.clearAllMocks());

describe('useMhdModuleComplianceReadiness', () => {
  it('asks the server about the named module and returns its readiness row', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ module_key: 'CONDUCT', release_ready: false, blocker_count: 1, blockers: [] }],
      error: null,
    });
    const { result } = renderHook(() => useMhdModuleComplianceReadiness('CONDUCT'), { wrapper });
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ module_key: 'CONDUCT', release_ready: false }),
    );
    expect(rpcMock).toHaveBeenCalledWith('mhd_compliance_module_readiness', {
      p_module_key: 'CONDUCT',
    });
  });

  it('treats an empty answer as unknown (null), never as approval', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    const { result } = renderHook(() => useMhdModuleComplianceReadiness('ONBOARDING'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('surfaces a server error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('permission denied') });
    const { result } = renderHook(() => useMhdModuleComplianceReadiness('CONDUCT'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
