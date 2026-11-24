import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const COMPANY_ID = '3a9d7e41-5b02-4c68-8f17-d2e60c4b9a13';
const PERSON_ID = '5c1f9a20-6d3e-4b87-8a14-0e2b7d9c3f51';
const WORKSITE_ID = 'a7e3c2d4-1b58-4f09-9d6a-3c8e5b1f7a20';

const { listAssignments, assignWorksite } = vi.hoisted(() => ({
  listAssignments: vi.fn(),
  assignWorksite: vi.fn(),
}));

vi.mock('../Service', () => ({
  mhdCompanyService: { listAssignments, assignWorksite },
}));

const { useMhdAssignWorksite, useMhdCompanyWorksiteAssignments } = await import('../Hook');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.clearAllMocks());

describe('worksite assignment hooks', () => {
  it('refreshes the assignment list after a person is assigned to a worksite', async () => {
    listAssignments.mockResolvedValueOnce([]).mockResolvedValue([{ personId: PERSON_ID }]);
    assignWorksite.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => ({
        list: useMhdCompanyWorksiteAssignments(COMPANY_ID),
        assign: useMhdAssignWorksite(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toEqual([]));

    await act(async () => {
      await result.current.assign.mutateAsync({
        personId: PERSON_ID,
        worksiteId: WORKSITE_ID,
        effectiveFrom: '2026-11-23',
      });
    });

    await waitFor(() => expect(result.current.list.data).toHaveLength(1));
    expect(listAssignments).toHaveBeenCalledTimes(2);
  });
});
