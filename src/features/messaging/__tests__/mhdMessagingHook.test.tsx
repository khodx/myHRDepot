import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  sendMessageMock,
  editMessageMock,
  deleteMessageMock,
  listRepliesMock,
  getOrCreateEntityThreadMock,
  listThreadsMock,
  getThreadMock,
  listMessagesMock,
  createThreadMock,
  markThreadReadMock,
  archiveThreadMock,
  addParticipantsMock,
  removeParticipantMock,
} = vi.hoisted(() => ({
  sendMessageMock: vi.fn(),
  editMessageMock: vi.fn(),
  deleteMessageMock: vi.fn(),
  listRepliesMock: vi.fn(),
  getOrCreateEntityThreadMock: vi.fn(),
  listThreadsMock: vi.fn(),
  getThreadMock: vi.fn(),
  listMessagesMock: vi.fn(),
  createThreadMock: vi.fn(),
  markThreadReadMock: vi.fn(),
  archiveThreadMock: vi.fn(),
  addParticipantsMock: vi.fn(),
  removeParticipantMock: vi.fn(),
}));

vi.mock('../Service', () => ({
  mhdMessagingService: {
    listThreads: listThreadsMock,
    getThread: getThreadMock,
    listMessages: listMessagesMock,
    listReplies: listRepliesMock,
    createThread: createThreadMock,
    getOrCreateEntityThread: getOrCreateEntityThreadMock,
    sendMessage: sendMessageMock,
    editMessage: editMessageMock,
    deleteMessage: deleteMessageMock,
    markThreadRead: markThreadReadMock,
    archiveThread: archiveThreadMock,
    addParticipants: addParticipantsMock,
    removeParticipant: removeParticipantMock,
  },
}));

const {
  useMhdSendMessage,
  useMhdEditMessage,
  useMhdDeleteMessage,
  useMhdMessageReplies,
  useMhdEntityMessageThread,
  mhdMessagingQueryKeys,
} = await import('../Hook');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, queryClient, invalidateSpy };
}

function calledRepliesInvalidation(invalidateSpy: ReturnType<typeof vi.spyOn>) {
  return invalidateSpy.mock.calls.some(
    ([arg]: [{ queryKey?: unknown[] } | undefined]) =>
      Array.isArray(arg?.queryKey) && arg.queryKey[1] === 'replies',
  );
}

describe('messaging Hook.ts', () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
    editMessageMock.mockReset();
    deleteMessageMock.mockReset();
    listRepliesMock.mockReset();
    getOrCreateEntityThreadMock.mockReset();
    listThreadsMock.mockReset();
    getThreadMock.mockReset();
    listMessagesMock.mockReset();
    createThreadMock.mockReset();
    markThreadReadMock.mockReset();
    archiveThreadMock.mockReset();
    addParticipantsMock.mockReset();
    removeParticipantMock.mockReset();
  });

  describe('useMhdSendMessage', () => {
    it('sends a top-level message and does not invalidate any replies query', async () => {
      sendMessageMock.mockResolvedValueOnce('message-1');
      const { Wrapper, invalidateSpy } = createWrapper();
      const { result } = renderHook(() => useMhdSendMessage('thread-1'), { wrapper: Wrapper });

      await result.current.mutateAsync({ body: 'Hello' });

      expect(sendMessageMock).toHaveBeenCalledWith({
        threadId: 'thread-1',
        body: 'Hello',
        parentMessageId: undefined,
      });
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mhd-messaging', 'threads'] });
      });
      expect(calledRepliesInvalidation(invalidateSpy)).toBe(false);
    });

    it('sends a reply and additionally invalidates the parent reply list', async () => {
      sendMessageMock.mockResolvedValueOnce('reply-1');
      const { Wrapper, invalidateSpy } = createWrapper();
      const { result } = renderHook(() => useMhdSendMessage('thread-1'), { wrapper: Wrapper });

      await result.current.mutateAsync({ body: 'A reply', parentMessageId: 'message-1' });

      expect(sendMessageMock).toHaveBeenCalledWith({
        threadId: 'thread-1',
        body: 'A reply',
        parentMessageId: 'message-1',
      });
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: mhdMessagingQueryKeys.replies('message-1'),
        });
      });
    });
  });

  describe('useMhdEditMessage', () => {
    it('edits a top-level message without touching any replies query', async () => {
      editMessageMock.mockResolvedValueOnce(undefined);
      const { Wrapper, invalidateSpy } = createWrapper();
      const { result } = renderHook(() => useMhdEditMessage('thread-1'), { wrapper: Wrapper });

      await result.current.mutateAsync({ messageId: 'message-1', body: 'Edited' });

      expect(editMessageMock).toHaveBeenCalledWith('message-1', 'Edited');
      expect(calledRepliesInvalidation(invalidateSpy)).toBe(false);
    });

    it('edits a reply and invalidates its parent reply list', async () => {
      editMessageMock.mockResolvedValueOnce(undefined);
      const { Wrapper, invalidateSpy } = createWrapper();
      const { result } = renderHook(() => useMhdEditMessage('thread-1'), { wrapper: Wrapper });

      await result.current.mutateAsync({
        messageId: 'reply-1',
        body: 'Edited reply',
        parentMessageId: 'message-1',
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: mhdMessagingQueryKeys.replies('message-1'),
        });
      });
    });
  });

  describe('useMhdDeleteMessage', () => {
    it('deletes a reply and invalidates its parent reply list', async () => {
      deleteMessageMock.mockResolvedValueOnce(undefined);
      const { Wrapper, invalidateSpy } = createWrapper();
      const { result } = renderHook(() => useMhdDeleteMessage('thread-1'), { wrapper: Wrapper });

      await result.current.mutateAsync({ messageId: 'reply-1', parentMessageId: 'message-1' });

      expect(deleteMessageMock).toHaveBeenCalledWith('reply-1');
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: mhdMessagingQueryKeys.replies('message-1'),
        });
      });
    });

    it('deletes a top-level message without a replies invalidation', async () => {
      deleteMessageMock.mockResolvedValueOnce(undefined);
      const { Wrapper, invalidateSpy } = createWrapper();
      const { result } = renderHook(() => useMhdDeleteMessage('thread-1'), { wrapper: Wrapper });

      await result.current.mutateAsync({ messageId: 'message-1' });

      expect(calledRepliesInvalidation(invalidateSpy)).toBe(false);
    });
  });

  describe('useMhdMessageReplies', () => {
    it('does not fetch when parentMessageId is null', () => {
      const { Wrapper } = createWrapper();
      renderHook(() => useMhdMessageReplies(null), { wrapper: Wrapper });
      expect(listRepliesMock).not.toHaveBeenCalled();
    });

    it('fetches replies for the given parent message id once truthy', async () => {
      listRepliesMock.mockResolvedValueOnce([]);
      const { Wrapper } = createWrapper();
      renderHook(() => useMhdMessageReplies('message-1'), { wrapper: Wrapper });
      await waitFor(() => {
        expect(listRepliesMock).toHaveBeenCalledWith({ parentMessageId: 'message-1', limit: undefined });
      });
    });
  });

  describe('useMhdEntityMessageThread', () => {
    it('does not fetch when input is null', () => {
      const { Wrapper } = createWrapper();
      renderHook(() => useMhdEntityMessageThread(null), { wrapper: Wrapper });
      expect(getOrCreateEntityThreadMock).not.toHaveBeenCalled();
    });

    it('resolves the entity thread once given a real input', async () => {
      getOrCreateEntityThreadMock.mockResolvedValueOnce('thread-9');
      const { Wrapper } = createWrapper();
      const input = { entityType: 'TASK', entityId: 'task-1', companyId: 'company-1' };
      const { result } = renderHook(() => useMhdEntityMessageThread(input), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.data).toBe('thread-9'));
      expect(getOrCreateEntityThreadMock).toHaveBeenCalledWith(input);
    });
  });
});
