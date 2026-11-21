import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdLeavePolicyService } from './PolicyService';
import type { MhdLeavePolicySetInput } from './WorkflowTypes';

export const mhdLeavePolicyQueryKey = (companyId: string | null) =>
  ['mhd-leaves', 'policy', companyId ?? ''] as const;

export function useMhdLeavePolicy(companyId: string | null) {
  return useQuery({
    queryKey: mhdLeavePolicyQueryKey(companyId),
    queryFn: () => mhdLeavePolicyService.get(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdSetLeavePolicy(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdLeavePolicySetInput) => mhdLeavePolicyService.set(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mhdLeavePolicyQueryKey(companyId) });
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'workflow'] });
    },
  });
}
