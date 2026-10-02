import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPerformanceCycleService } from './Service-cycles';
import type {
  MhdPerformanceCycleCandidateFilters,
  MhdPerformanceCycleLaunchInput,
  MhdPerformanceCycleRaterPlanInput,
} from './Types-cycles';

export const mhdPerformanceCycleQueryKeys = {
  all: ['mhd-performance-cycles'] as const,
  list: (companyId: string | null) => ['mhd-performance-cycles', 'list', companyId ?? ''] as const,
  progress: (cycleId: string | null) =>
    ['mhd-performance-cycles', 'progress', cycleId ?? ''] as const,
};

export function useMhdPerformanceCycleCandidates(
  filters: MhdPerformanceCycleCandidateFilters | null,
) {
  return useQuery({
    queryKey: ['mhd-performance-cycles', 'candidates', filters] as const,
    queryFn: () => mhdPerformanceCycleService.listCandidates(filters!),
    enabled: Boolean(filters?.companyId),
  });
}

/** The recommended raters for the chosen people; waits until there is something to plan. */
export function useMhdPerformanceCycleRaterPlan(input: MhdPerformanceCycleRaterPlanInput | null) {
  return useQuery({
    queryKey: ['mhd-performance-cycles', 'rater-plan', input] as const,
    queryFn: () => mhdPerformanceCycleService.planRaters(input!),
    enabled: Boolean(
      input && input.personIds.length > 0 && (input.includePeers || input.includeUpward),
    ),
  });
}

export function useMhdLaunchPerformanceCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdPerformanceCycleLaunchInput) => mhdPerformanceCycleService.launch(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mhdPerformanceCycleQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['mhd-performance'] });
    },
  });
}

export function useMhdPerformanceCycles(companyId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceCycleQueryKeys.list(companyId),
    queryFn: () => mhdPerformanceCycleService.listCycles(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdPerformanceCycleProgress(cycleId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceCycleQueryKeys.progress(cycleId),
    queryFn: () => mhdPerformanceCycleService.getProgress(cycleId!),
    enabled: Boolean(cycleId),
  });
}

export function useMhdClosePerformanceCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) => mhdPerformanceCycleService.closeCycle(cycleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mhdPerformanceCycleQueryKeys.all });
    },
  });
}
