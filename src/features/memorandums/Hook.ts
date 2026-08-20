import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdMemorandumsService } from './Service';
import { mhdPeopleQueryKeys } from '@/features/people/Hook';
import { mhdPersonService } from '@/features/people/Service';
import type { MhdCreateMemorandumInput, MhdPublishMemorandumInput } from './Types';

export const mhdMemorandumQueryKeys = {
  list: (companyId: string | null, status: string | null) =>
    ['mhd-memorandums', 'list', companyId ?? '', status ?? 'ALL'] as const,
  my: () => ['mhd-memorandums', 'my'] as const,
  detail: (id: string | null) => ['mhd-memorandums', 'detail', id ?? ''] as const,
  deliveries: (id: string | null) => ['mhd-memorandums', 'deliveries', id ?? ''] as const,
};

function useInvalidateMemorandums() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-memorandums'] });
    if (id) {
      void queryClient.invalidateQueries({ queryKey: mhdMemorandumQueryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: mhdMemorandumQueryKeys.deliveries(id) });
    }
  };
}

export function useMhdMemorandums(companyId: string | null, status?: string | null) {
  return useQuery({
    queryKey: mhdMemorandumQueryKeys.list(companyId, status ?? null),
    queryFn: () => mhdMemorandumsService.listMemorandums(companyId!, status),
    enabled: Boolean(companyId),
  });
}

export function useMhdMyMemorandums() {
  return useQuery({
    queryKey: mhdMemorandumQueryKeys.my(),
    queryFn: () => mhdMemorandumsService.listMyMemorandums(),
  });
}

export function useMhdMemorandum(id: string | null) {
  return useQuery({
    queryKey: mhdMemorandumQueryKeys.detail(id),
    queryFn: () => mhdMemorandumsService.getMemorandum(id!),
    enabled: Boolean(id),
  });
}

export function useMhdMemorandumDeliveries(id: string | null) {
  return useQuery({
    queryKey: mhdMemorandumQueryKeys.deliveries(id),
    queryFn: () => mhdMemorandumsService.listDeliveries(id!),
    enabled: Boolean(id),
  });
}

export function useMhdCreateMemorandum() {
  const invalidate = useInvalidateMemorandums();
  return useMutation({
    mutationFn: (input: MhdCreateMemorandumInput) => mhdMemorandumsService.createMemorandum(input),
    onSuccess: () => invalidate(),
  });
}

export function useMhdPublishMemorandum() {
  const invalidate = useInvalidateMemorandums();
  return useMutation({
    mutationFn: (input: MhdPublishMemorandumInput) => mhdMemorandumsService.publishMemorandum(input),
    onSuccess: (_data, variables) => invalidate(variables.memorandumId),
  });
}

export function useMhdMarkMemorandumRead() {
  const invalidate = useInvalidateMemorandums();
  return useMutation({
    mutationFn: (memorandumId: string) => mhdMemorandumsService.markRead(memorandumId),
    onSuccess: (_data, memorandumId) => invalidate(memorandumId),
  });
}

export function useMhdAcknowledgeMemorandum() {
  const invalidate = useInvalidateMemorandums();
  return useMutation({
    mutationFn: (acknowledgmentId: string) => mhdMemorandumsService.acknowledge(acknowledgmentId),
    onSuccess: () => invalidate(),
  });
}

// A plain person list for the "Publish" recipient picker -- delegates to the
// People feature's own service/query keys, same pattern as
// useMhdChecklistPeople in the Checklists feature.
export function useMhdMemorandumPeople(companyId: string | null) {
  const filters = { companyId: companyId ?? 'ALL', searchTerm: '' } as const;
  return useQuery({
    queryKey: mhdPeopleQueryKeys.list(filters),
    queryFn: () => mhdPersonService.listPeople(filters),
    enabled: Boolean(companyId),
  });
}
