import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdCompensationService } from './Service';
import type {
  MhdJobClassificationEvaluateInput,
  MhdJobEvaluationScoreInput,
  MhdJobPayGradeConfirmInput,
  MhdJobPayGradeRecommendInput,
  MhdMarketWageLookupInput,
} from './Types';

const compensationKey = ['mhd-compensation'] as const;

function useRefresh() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: compensationKey });
}

export function useMhdCompensationReadiness() {
  return useQuery({
    queryKey: [...compensationKey, 'readiness'],
    queryFn: () => mhdCompensationService.readiness(),
  });
}

export function useMhdJobClassificationEvaluate() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: MhdJobClassificationEvaluateInput) => mhdCompensationService.evaluate(input), onSuccess: refresh });
}

export function useMhdJobClassificationConfirm() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (determinationId: string) => mhdCompensationService.confirm(determinationId), onSuccess: refresh });
}

export function useMhdJobClassificationOverride() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: Parameters<typeof mhdCompensationService.override>[0]) => mhdCompensationService.override(input), onSuccess: refresh });
}

export function useMhdJobEvaluationScore() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: MhdJobEvaluationScoreInput) => mhdCompensationService.score(input), onSuccess: refresh });
}

export function useMhdJobPayGradeRecommend() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: MhdJobPayGradeRecommendInput) => mhdCompensationService.payGradeRecommend(input), onSuccess: refresh });
}

export function useMhdJobPayGradeConfirm() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: MhdJobPayGradeConfirmInput) => mhdCompensationService.payGradeConfirm(input), onSuccess: refresh });
}

export function useMhdMarketWageLookup() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: MhdMarketWageLookupInput) => mhdCompensationService.marketWageLookup(input), onSuccess: refresh });
}
