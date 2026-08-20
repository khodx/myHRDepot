import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import { mhdPoliciesService } from './Service';
import type {
  MhdAcknowledgePolicyInput,
  MhdAssignPolicyAcknowledgmentInput,
  MhdCreatePolicyInput,
  MhdForkPolicyInput,
  MhdPublishPolicyVersionInput,
} from './Types';

export const mhdPolicyQueryKeys = {
  canManage: (companyId: string | null) => ['mhd-policies', 'can-manage', companyId ?? ''] as const,
  library: (companyId: string | null, category?: string | null) =>
    ['mhd-policies', 'library', companyId ?? '', category ?? 'ALL'] as const,
  myAcknowledgments: () => ['mhd-policies', 'my-acknowledgments'] as const,
  ackBoard: (versionId: string | null) => ['mhd-policies', 'ack-board', versionId ?? ''] as const,
  people: (companyId: string | null) => ['mhd-policies', 'people', companyId ?? ''] as const,
};

export function useMhdCanManagePolicyLibrary(companyId: string | null) {
  return useQuery({
    queryKey: mhdPolicyQueryKeys.canManage(companyId),
    queryFn: () => mhdPoliciesService.canManageLibrary(companyId),
  });
}

export function useMhdPolicyLibrary(companyId: string | null, category?: string | null) {
  return useQuery({
    queryKey: mhdPolicyQueryKeys.library(companyId, category),
    queryFn: () => mhdPoliciesService.listLibrary(companyId, category),
    enabled: Boolean(companyId),
  });
}

export function useMhdCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreatePolicyInput) => mhdPoliciesService.createPolicy(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-policies', 'library'] });
    },
  });
}

export function useMhdForkPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdForkPolicyInput) => mhdPoliciesService.forkPolicy(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-policies', 'library'] });
    },
  });
}

export function useMhdPublishPolicyVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdPublishPolicyVersionInput) =>
      mhdPoliciesService.publishVersion(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-policies', 'library'] });
    },
  });
}

export function useMhdAssignPolicyAcknowledgment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssignPolicyAcknowledgmentInput) =>
      mhdPoliciesService.assignAcknowledgment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-policies', 'ack-board'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-policies', 'my-acknowledgments'] });
    },
  });
}

export function useMhdMyPolicyAcknowledgments() {
  return useQuery({
    queryKey: mhdPolicyQueryKeys.myAcknowledgments(),
    queryFn: () => mhdPoliciesService.myAcknowledgments(),
  });
}

export function useMhdAcknowledgePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAcknowledgePolicyInput) => mhdPoliciesService.acknowledge(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-policies', 'ack-board'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-policies', 'my-acknowledgments'] });
    },
  });
}

export function useMhdPolicyAckBoard(versionId: string | null) {
  return useQuery({
    queryKey: mhdPolicyQueryKeys.ackBoard(versionId),
    queryFn: () => mhdPoliciesService.ackBoard(versionId!),
    enabled: Boolean(versionId),
  });
}

export function useMhdPolicyPeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdPolicyQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}
