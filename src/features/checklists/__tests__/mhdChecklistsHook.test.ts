import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useQueryMock, useMutationMock, useQueryClientMock, serviceMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryClientMock: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  serviceMock: {
    listLibrary: vi.fn(),
    createTemplate: vi.fn(),
    forkTemplate: vi.fn(),
    listMyInstances: vi.fn(),
    getInstance: vi.fn(),
    completeItem: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: useMutationMock,
  useQuery: useQueryMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock('../Service', () => ({
  mhdChecklistsService: serviceMock,
}));

const {
  mhdChecklistQueryKeys,
  useMhdChecklistLibrary,
  useMhdChecklistInstance,
  useMhdCompleteChecklistItem,
} = await import('../Hook');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('checklist hooks', () => {
  it('keys the library query by company and category', () => {
    useQueryMock.mockReturnValueOnce({});

    useMhdChecklistLibrary('company-1', 'TRAINING');

    expect(useQueryMock.mock.calls[0][0]).toMatchObject({
      queryKey: mhdChecklistQueryKeys.library('company-1', 'TRAINING'),
      enabled: true,
    });
  });

  it('disables instance detail until an id is available', () => {
    useQueryMock.mockReturnValueOnce({});

    useMhdChecklistInstance(null);

    expect(useQueryMock.mock.calls[0][0]).toMatchObject({
      queryKey: mhdChecklistQueryKeys.instance(null),
      enabled: false,
    });
  });

  it('wires completion mutations through the service', () => {
    useMutationMock.mockReturnValueOnce({});

    useMhdCompleteChecklistItem('instance-1');

    const options = useMutationMock.mock.calls[0][0];
    options.mutationFn({ itemId: 'item-1', isCompleted: true });
    expect(serviceMock.completeItem).toHaveBeenCalledWith({ itemId: 'item-1', isCompleted: true });
  });
});
