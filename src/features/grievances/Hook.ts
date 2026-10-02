import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MhdAddGrievanceStepInput,
  MhdGrievanceIntakeInput,
  MhdGrievanceListFilters,
  MhdRejectGrievanceInput,
  MhdReferGrievanceInput,
  MhdResolveGrievanceInput,
  MhdSubmitGrievanceInput,
} from './Types';
import { mhdPersonService } from '@/features/people/Service';
import { mhdGrievancesService } from './Service';

export const mhdGrievancesQueryKeys = {
  list: (filters: MhdGrievanceListFilters) => ['mhd-grievances', 'list', filters] as const,
  mine: (personId: string | null) => ['mhd-grievances', 'mine', personId ?? ''] as const,
  detail: (grievanceId: string | null) => ['mhd-grievances', 'detail', grievanceId ?? ''] as const,
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

// ---------------------------------------------------------------------------
// Intake wizard (0372)
// ---------------------------------------------------------------------------

export function useMhdGrievanceIntakeDetail(grievanceId: string | null) {
  return useQuery({
    queryKey: ['mhd-grievances', 'intake-detail', grievanceId ?? ''] as const,
    queryFn: () => mhdGrievancesService.getIntakeDetail(grievanceId!),
    enabled: Boolean(grievanceId),
  });
}

export function useMhdOpenGrievanceFromIntake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdGrievanceIntakeInput) => mhdGrievancesService.openFromIntake(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-grievances'] });
    },
  });
}

/**
 * People the filer can name as the subject of a grievance or as a witness. The People service applies
 * the caller's own visibility, so a filer sees only the colleagues the app already lets them see; the
 * wizard also accepts a typed name.
 */
export function useMhdGrievancePeople(companyId: string | null) {
  return useQuery({
    queryKey: ['mhd-grievances', 'people', companyId ?? ''] as const,
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}
