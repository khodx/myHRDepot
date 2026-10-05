import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: {
    listIncompleteProfiles: vi.fn(),
    getPersonProfileCompleteness: vi.fn(),
    listProfileRequirements: vi.fn(),
    listProfileSectionDefinitions: vi.fn(),
    upsertProfileRequirement: vi.fn(),
  },
}));

vi.mock('../Service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../Service')>()),
  mhdPersonService: serviceMock,
}));

const {
  useMhdIncompleteProfiles,
  useMhdPersonProfileCompleteness,
  useMhdUpsertProfileRequirement,
  mhdPeopleQueryKeys,
} = await import('../Hook');
const { MhdProfileCompletenessError } = await import('../Service');

function setup(defaultRetry: false | undefined = false) {
  const queryClient = new QueryClient(
    defaultRetry === false ? { defaultOptions: { queries: { retry: false } } } : undefined,
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('profile completeness hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not query the worklist without a company', () => {
    const { wrapper } = setup();
    renderHook(() => useMhdIncompleteProfiles(null, 50, 0), { wrapper });
    expect(serviceMock.listIncompleteProfiles).not.toHaveBeenCalled();
  });

  it('loads the worklist for a company page', async () => {
    serviceMock.listIncompleteProfiles.mockResolvedValue([]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useMhdIncompleteProfiles('c-1', 50, 50), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(serviceMock.listIncompleteProfiles).toHaveBeenCalledWith({
      companyId: 'c-1',
      limit: 50,
      offset: 50,
    });
  });

  it('does not retry a 42501 completeness error', async () => {
    serviceMock.getPersonProfileCompleteness.mockRejectedValue(
      new MhdProfileCompletenessError('denied', '42501'),
    );
    const { wrapper } = setup(undefined);
    const { result } = renderHook(() => useMhdPersonProfileCompleteness('p-1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(serviceMock.getPersonProfileCompleteness).toHaveBeenCalledTimes(1);
  });

  it('invalidates the worklist and rules after an upsert', async () => {
    serviceMock.upsertProfileRequirement.mockResolvedValue('req-1');
    const { queryClient, wrapper } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useMhdUpsertProfileRequirement(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        companyId: 'c-1',
        relationshipState: 'EMPLOYEE',
        sectionKey: 'address',
        isRequired: true,
        isActive: true,
      });
    });

    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toContainEqual(mhdPeopleQueryKeys.incompleteProfilesRoot());
    expect(keys).toContainEqual(mhdPeopleQueryKeys.profileRequirements('c-1'));
  });
});
