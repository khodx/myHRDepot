import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdChecklistsService } from './Service';
import { mhdPeopleQueryKeys } from '@/features/people/Hook';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdCompleteChecklistItemInput,
  MhdCreateChecklistInstanceInput,
  MhdCreateChecklistTemplateInput,
} from './Types';

export const mhdChecklistQueryKeys = {
  library: (companyId: string | null, category: string | null) =>
    ['mhd-checklists', 'library', companyId ?? '', category ?? 'ALL'] as const,
  myInstances: () => ['mhd-checklists', 'my-instances'] as const,
  instance: (instanceId: string | null) => ['mhd-checklists', 'instance', instanceId ?? ''] as const,
};

function useInvalidateChecklistLibrary() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-checklists', 'library'] });
  };
}

function useInvalidateChecklistInstance() {
  const queryClient = useQueryClient();
  return (instanceId?: string) => {
    void queryClient.invalidateQueries({ queryKey: mhdChecklistQueryKeys.myInstances() });
    if (instanceId) {
      void queryClient.invalidateQueries({ queryKey: mhdChecklistQueryKeys.instance(instanceId) });
    }
  };
}

export function useMhdChecklistLibrary(companyId: string | null, category?: string | null) {
  return useQuery({
    queryKey: mhdChecklistQueryKeys.library(companyId, category ?? null),
    queryFn: () => mhdChecklistsService.listLibrary(companyId!, category),
    enabled: Boolean(companyId),
  });
}

export function useMhdCreateChecklistTemplate() {
  const invalidate = useInvalidateChecklistLibrary();
  return useMutation({
    mutationFn: (input: MhdCreateChecklistTemplateInput) =>
      mhdChecklistsService.createTemplate(input),
    onSuccess: () => invalidate(),
  });
}

export function useMhdForkChecklistTemplate() {
  const invalidate = useInvalidateChecklistLibrary();
  return useMutation({
    mutationFn: (input: { sourceTemplateId: string; companyId: string }) =>
      mhdChecklistsService.forkTemplate(input.sourceTemplateId, input.companyId),
    onSuccess: () => invalidate(),
  });
}

export function useMhdMyChecklistInstances() {
  return useQuery({
    queryKey: mhdChecklistQueryKeys.myInstances(),
    queryFn: () => mhdChecklistsService.listMyInstances(),
  });
}

export function useMhdChecklistInstance(instanceId: string | null) {
  return useQuery({
    queryKey: mhdChecklistQueryKeys.instance(instanceId),
    queryFn: () => mhdChecklistsService.getInstance(instanceId!),
    enabled: Boolean(instanceId),
  });
}

export function useMhdCompleteChecklistItem(instanceId: string | null) {
  const invalidate = useInvalidateChecklistInstance();
  return useMutation({
    mutationFn: (input: MhdCompleteChecklistItemInput) => mhdChecklistsService.completeItem(input),
    onSuccess: () => invalidate(instanceId ?? undefined),
  });
}

export function useMhdCreateChecklistInstance() {
  const invalidate = useInvalidateChecklistInstance();
  return useMutation({
    mutationFn: (input: MhdCreateChecklistInstanceInput) => mhdChecklistsService.createInstance(input),
    onSuccess: () => invalidate(),
  });
}

// A plain person list for the "Assign checklist" picker -- delegates to the
// People feature's own service/query keys rather than re-fetching or
// duplicating person data inside this feature.
export function useMhdChecklistPeople(companyId: string | null) {
  const filters = { companyId: companyId ?? 'ALL', searchTerm: '' } as const;
  return useQuery({
    queryKey: mhdPeopleQueryKeys.list(filters),
    queryFn: () => mhdPersonService.listPeople(filters),
    enabled: Boolean(companyId),
  });
}
