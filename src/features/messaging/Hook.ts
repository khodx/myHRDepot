import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdMessagingService } from './Service';
import type {
  MhdCreateMessageThreadInput,
  MhdGetOrCreateEntityMessageThreadInput,
  MhdListMessagesInput,
  MhdMessageThreadFilters,
  MhdSendMessageInput,
} from './Types';

export const mhdMessagingQueryKeys = {
  list: (filters: MhdMessageThreadFilters = {}) => ['mhd-messaging', 'threads', filters] as const,
  detail: (threadId: string | null) => ['mhd-messaging', 'thread', threadId ?? ''] as const,
  messages: (threadId: string | null) => ['mhd-messaging', 'messages', threadId ?? ''] as const,
  replies: (parentMessageId: string | null) => ['mhd-messaging', 'replies', parentMessageId ?? ''] as const,
};

function useRefresh(threadId?: string | null) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-messaging', 'threads'] });
    if (threadId) {
      void queryClient.invalidateQueries({ queryKey: mhdMessagingQueryKeys.detail(threadId) });
      void queryClient.invalidateQueries({ queryKey: mhdMessagingQueryKeys.messages(threadId) });
    }
  };
}

export function useMhdMessageThreads(filters: MhdMessageThreadFilters = {}) {
  return useQuery({
    queryKey: mhdMessagingQueryKeys.list(filters),
    queryFn: () => mhdMessagingService.listThreads(filters),
    refetchInterval: 60_000,
  });
}

export function useMhdMessageThread(threadId: string | null) {
  return useQuery({
    queryKey: mhdMessagingQueryKeys.detail(threadId),
    queryFn: () => mhdMessagingService.getThread(threadId!),
    enabled: Boolean(threadId),
    refetchInterval: 60_000,
  });
}

export function useMhdMessages(threadId: string | null, input?: Omit<MhdListMessagesInput, 'threadId'>) {
  return useQuery({
    queryKey: mhdMessagingQueryKeys.messages(threadId),
    queryFn: () =>
      mhdMessagingService.listMessages({
        threadId: threadId!,
        limit: input?.limit,
        before: input?.before,
      }),
    enabled: Boolean(threadId),
    refetchInterval: 60_000,
  });
}

export function useMhdMessageReplies(parentMessageId: string | null, limit?: number) {
  return useQuery({
    queryKey: mhdMessagingQueryKeys.replies(parentMessageId),
    queryFn: () => mhdMessagingService.listReplies({ parentMessageId: parentMessageId!, limit }),
    enabled: Boolean(parentMessageId),
    refetchInterval: 60_000,
  });
}

export function useMhdEntityMessageThread(input: MhdGetOrCreateEntityMessageThreadInput | null) {
  return useQuery({
    queryKey: ['mhd-messaging', 'entity-thread', input?.entityType ?? '', input?.entityId ?? ''],
    queryFn: () => mhdMessagingService.getOrCreateEntityThread(input!),
    enabled: Boolean(input),
    staleTime: 5 * 60_000,
  });
}

export function useMhdCreateMessageThread() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (input: MhdCreateMessageThreadInput) => mhdMessagingService.createThread(input),
    onSuccess: refresh,
  });
}

export function useMhdSendMessage(threadId: string) {
  const refresh = useRefresh(threadId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<MhdSendMessageInput, 'threadId'>) =>
      mhdMessagingService.sendMessage({
        threadId,
        body: input.body,
        parentMessageId: input.parentMessageId,
      }),
    onSuccess: (_data, variables) => {
      refresh();
      if (variables.parentMessageId) {
        void queryClient.invalidateQueries({
          queryKey: mhdMessagingQueryKeys.replies(variables.parentMessageId),
        });
      }
    },
  });
}

export function useMhdMarkThreadRead(threadId: string) {
  const refresh = useRefresh(threadId);
  return useMutation({
    mutationFn: () => mhdMessagingService.markThreadRead(threadId),
    onSuccess: refresh,
  });
}

export function useMhdArchiveThread(threadId: string) {
  const refresh = useRefresh(threadId);
  return useMutation({
    mutationFn: (isArchived: boolean) => mhdMessagingService.archiveThread(threadId, isArchived),
    onSuccess: refresh,
  });
}

export function useMhdEditMessage(threadId: string) {
  const refresh = useRefresh(threadId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { messageId: string; body: string; parentMessageId?: string | null }) =>
      mhdMessagingService.editMessage(input.messageId, input.body),
    onSuccess: (_data, variables) => {
      refresh();
      if (variables.parentMessageId) {
        void queryClient.invalidateQueries({
          queryKey: mhdMessagingQueryKeys.replies(variables.parentMessageId),
        });
      }
    },
  });
}

export function useMhdDeleteMessage(threadId: string) {
  const refresh = useRefresh(threadId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { messageId: string; parentMessageId?: string | null }) =>
      mhdMessagingService.deleteMessage(input.messageId),
    onSuccess: (_data, variables) => {
      refresh();
      if (variables.parentMessageId) {
        void queryClient.invalidateQueries({
          queryKey: mhdMessagingQueryKeys.replies(variables.parentMessageId),
        });
      }
    },
  });
}

export function useMhdManageParticipants(threadId: string) {
  const refresh = useRefresh(threadId);
  const addParticipants = useMutation({
    mutationFn: (userIds: string[]) => mhdMessagingService.addParticipants(threadId, userIds),
    onSuccess: refresh,
  });
  const removeParticipant = useMutation({
    mutationFn: (userId: string) => mhdMessagingService.removeParticipant(threadId, userId),
    onSuccess: refresh,
  });

  return { addParticipants, removeParticipant };
}
