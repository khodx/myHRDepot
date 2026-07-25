import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdLeaveWorkflowService } from './WorkflowService';
import type { MhdLeaveEligibilityInput } from './WorkflowTypes';

const key = (caseId: string | null) => ['mhd-leaves', 'workflow', caseId ?? ''] as const;

export function useMhdLeaveWorkflow(caseId: string | null) {
  return useQuery({
    queryKey: key(caseId),
    queryFn: () => mhdLeaveWorkflowService.get(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdLeaveReadiness() {
  return useQuery({
    queryKey: ['mhd-leaves', 'readiness'],
    queryFn: () => mhdLeaveWorkflowService.readiness(),
  });
}

function useRefresh(caseId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: key(caseId) });
    void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'cases'] });
  };
}

export function useMhdLeaveEligibility(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: MhdLeaveEligibilityInput) => mhdLeaveWorkflowService.evaluate(input),
    onSuccess: refresh,
  });
}

export function useMhdConfirmLeaveEligibility(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (snapshotId: string) => mhdLeaveWorkflowService.confirm(snapshotId),
    onSuccess: refresh,
  });
}

export function useMhdOverrideLeaveEligibility(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.override>[0]) =>
      mhdLeaveWorkflowService.override(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveEvent(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordEvent>[0]) =>
      mhdLeaveWorkflowService.recordEvent(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveReturnToWork(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordReturnToWork>[0]) =>
      mhdLeaveWorkflowService.recordReturnToWork(input),
    onSuccess: refresh,
  });
}
