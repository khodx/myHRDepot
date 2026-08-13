import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdCorrespondenceService } from './Service';
import type {
  MhdCorrespondenceThreadFilters,
  MhdListCorrespondenceMessagesInput,
  MhdLinkCorrespondenceThreadInput,
  MhdSendCorrespondenceInput,
} from './Types';

export const mhdCorrespondenceQueryKeys = {
  all: ['mhd-correspondence'] as const,
  list: (filters: MhdCorrespondenceThreadFilters) =>
    [...mhdCorrespondenceQueryKeys.all, 'threads', filters] as const,
  detail: (threadId: string | null) =>
    [...mhdCorrespondenceQueryKeys.all, 'thread', threadId ?? ''] as const,
  messages: (threadId: string | null) =>
    [...mhdCorrespondenceQueryKeys.all, 'messages', threadId ?? ''] as const,
};

function useRefresh(threadId?: string | null) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: mhdCorrespondenceQueryKeys.all });
    if (threadId) {
      void queryClient.invalidateQueries({ queryKey: mhdCorrespondenceQueryKeys.detail(threadId) });
      void queryClient.invalidateQueries({ queryKey: mhdCorrespondenceQueryKeys.messages(threadId) });
    }
  };
}

export function useMhdCorrespondenceThreads(filters: MhdCorrespondenceThreadFilters) {
  return useQuery({
    queryKey: mhdCorrespondenceQueryKeys.list(filters),
    queryFn: () => mhdCorrespondenceService.listThreads(filters),
    enabled: Boolean(filters.companyId),
    refetchInterval: 60_000,
  });
}

export function useMhdCorrespondenceThread(threadId: string | null) {
  return useQuery({
    queryKey: mhdCorrespondenceQueryKeys.detail(threadId),
    queryFn: () => mhdCorrespondenceService.getThread(threadId!),
    enabled: Boolean(threadId),
    refetchInterval: 60_000,
  });
}

export function useMhdCorrespondenceMessages(
  threadId: string | null,
  input?: Omit<MhdListCorrespondenceMessagesInput, 'threadId'>,
) {
  return useQuery({
    queryKey: mhdCorrespondenceQueryKeys.messages(threadId),
    queryFn: () =>
      mhdCorrespondenceService.listMessages({
        threadId: threadId!,
        limit: input?.limit,
        offset: input?.offset,
      }),
    enabled: Boolean(threadId),
    refetchInterval: 60_000,
  });
}

export function useMhdSendCorrespondence(threadId?: string | null) {
  const refresh = useRefresh(threadId);
  return useMutation({
    mutationFn: (input: MhdSendCorrespondenceInput) => mhdCorrespondenceService.send(input),
    onSuccess: refresh,
  });
}

export function useMhdLinkCorrespondenceThread(threadId: string) {
  const refresh = useRefresh(threadId);
  return useMutation({
    mutationFn: (input: Omit<MhdLinkCorrespondenceThreadInput, 'threadId'>) =>
      mhdCorrespondenceService.linkThread({ threadId, ...input }),
    onSuccess: refresh,
  });
}
