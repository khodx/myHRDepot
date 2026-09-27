import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MhdAddGrievanceStepInput,
  MhdGrievanceListFilters,
  MhdRejectGrievanceInput,
  MhdReferGrievanceInput,
  MhdResolveGrievanceInput,
  MhdSubmitGrievanceInput,
} from './Types';
import { mhdGrievancesService } from './Service';

export const mhdGrievancesQueryKeys = {
  list: (filters: MhdGrievanceListFilters) => ['mhd-grievances', 'list', filters] as const,
  mine: (personId: string | null) => ['mhd-grievances', 'mine', personId ?? ''] as const,
  detail: (grievanceId: string | null) =>
    ['mhd-grievances', 'detail', grievanceId ?? ''] as const,
  steps: (grievanceId: string | null) => ['mhd-grievances', 'steps', grievanceId ?? ''] as const,
};

function invalidateGrievance(queryClient: ReturnType<typeof useQueryClient>, grievanceId: string) {
  void queryClient.invalidateQueries({ queryKey: ['mhd-grievances', 'list'] });
  void queryClient.invalidateQueries({ queryKey: ['mhd-grievances', 'mine'] });
  void queryClient.invalidateQueries({ queryKey: mhdGrievancesQueryKeys.detail(grievanceId) });
  void queryClient.invalidateQueries({ queryKey: mhdGrievancesQueryKeys.steps(grievanceId) });
}

export function useMhdGrievances(filters: MhdGrievanceListFilters) {
  return useQuery({
    queryKey: mhdGrievancesQueryKeys.list(filters),
    queryFn: () => mhdGrievancesService.listGrievances(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdMyGrievances(personId: string | null) {
  return useQuery({
    queryKey: mhdGrievancesQueryKeys.mine(personId),
    queryFn: () => mhdGrievancesService.listMyGrievances(personId!),
    enabled: Boolean(personId),
  });
}

export function useMhdGrievance(grievanceId: string | null) {
  return useQuery({
    queryKey: mhdGrievancesQueryKeys.detail(grievanceId),
    queryFn: () => mhdGrievancesService.getGrievance(grievanceId!),
    enabled: Boolean(grievanceId),
  });
}

export function useMhdGrievanceSteps(grievanceId: string | null) {
  return useQuery({
    queryKey: mhdGrievancesQueryKeys.steps(grievanceId),
    queryFn: () => mhdGrievancesService.listSteps(grievanceId!),
    enabled: Boolean(grievanceId),
  });
}

export function useMhdSubmitGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSubmitGrievanceInput) => mhdGrievancesService.submitGrievance(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-grievances', 'mine'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-grievances', 'list'] });
    },
  });
}

export function useMhdAcknowledgeGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grievanceId: string) => mhdGrievancesService.acknowledgeGrievance(grievanceId),
    onSuccess: (_data, grievanceId) => invalidateGrievance(queryClient, grievanceId),
  });
}

export function useMhdAddGrievanceStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAddGrievanceStepInput) => mhdGrievancesService.addStep(input),
    onSuccess: (_data, input) => invalidateGrievance(queryClient, input.grievanceId),
  });
}

export function useMhdReferGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdReferGrievanceInput) => mhdGrievancesService.referGrievance(input),
    onSuccess: (_data, input) => invalidateGrievance(queryClient, input.grievanceId),
  });
}

export function useMhdResolveGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdResolveGrievanceInput) => mhdGrievancesService.resolveGrievance(input),
    onSuccess: (_data, input) => invalidateGrievance(queryClient, input.grievanceId),
  });
}

export function useMhdRejectGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRejectGrievanceInput) => mhdGrievancesService.rejectGrievance(input),
    onSuccess: (_data, input) => invalidateGrievance(queryClient, input.grievanceId),
  });
}

export function useMhdWithdrawGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grievanceId: string) => mhdGrievancesService.withdrawGrievance(grievanceId),
    onSuccess: (_data, grievanceId) => invalidateGrievance(queryClient, grievanceId),
  });
}
