import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdCorrespondenceService } from './Service';
import type {
  MhdCorrespondenceMailboxAliasFilters,
  MhdCorrespondenceThreadFilters,
  MhdCreateCorrespondenceMailboxAliasInput,
  MhdListCorrespondenceMessagesInput,
  MhdLinkCorrespondenceThreadInput,
  MhdSendCorrespondenceInput,
  MhdUpdateCorrespondenceMailboxAliasInput,
} from './Types';

export const mhdCorrespondenceQueryKeys = {
  all: ['mhd-correspondence'] as const,
  list: (filters: MhdCorrespondenceThreadFilters) =>
    [...mhdCorrespondenceQueryKeys.all, 'threads', filters] as const,
  detail: (threadId: string | null) =>
    [...mhdCorrespondenceQueryKeys.all, 'thread', threadId ?? ''] as const,
  messages: (threadId: string | null) =>
    [...mhdCorrespondenceQueryKeys.all, 'messages', threadId ?? ''] as const,
  aliases: (filters: MhdCorrespondenceMailboxAliasFilters) =>
    [...mhdCorrespondenceQueryKeys.all, 'mailbox-aliases', filters] as const,
  mailboxes: () => [...mhdCorrespondenceQueryKeys.all, 'mailboxes'] as const,
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

export function useMhdCorrespondenceMailboxAliases(
  filters: MhdCorrespondenceMailboxAliasFilters = {},
) {
  return useQuery({
    queryKey: mhdCorrespondenceQueryKeys.aliases(filters),
    queryFn: () => mhdCorrespondenceService.listMailboxAliases(filters),
  });
}

export function useMhdCorrespondenceActiveMailboxes(enabled = true) {
  return useQuery({
    queryKey: mhdCorrespondenceQueryKeys.mailboxes(),
    queryFn: () => mhdCorrespondenceService.listActiveMailboxes(),
    enabled,
  });
}

export function useMhdCreateCorrespondenceMailboxAlias() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateCorrespondenceMailboxAliasInput) =>
      mhdCorrespondenceService.createMailboxAlias(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mhdCorrespondenceQueryKeys.all });
    },
  });
}

export function useMhdUpdateCorrespondenceMailboxAlias() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateCorrespondenceMailboxAliasInput) =>
      mhdCorrespondenceService.updateMailboxAlias(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mhdCorrespondenceQueryKeys.all });
    },
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
