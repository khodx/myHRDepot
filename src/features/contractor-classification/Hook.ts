import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdContractorClassificationService } from './Service';
import type { MhdContractorClassificationConfirmInput, MhdContractorClassificationEvaluateInput } from './Types';

const contractorClassificationKey = ['mhd-contractor-classification'] as const;

function useRefresh() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: contractorClassificationKey });
}

export function useMhdContractorClassificationReadiness() {
  return useQuery({
    queryKey: [...contractorClassificationKey, 'readiness'],
    queryFn: () => mhdContractorClassificationService.readiness(),
  });
}

export function useContractorClassificationSnapshots(companyId: string, personId?: string | null) {
  return useQuery({
    queryKey: [...contractorClassificationKey, 'snapshots', companyId, personId ?? null],
    queryFn: () => mhdContractorClassificationService.listSnapshots(companyId, personId),
    enabled: Boolean(companyId),
  });
}

export function useContractorClassificationSnapshot(snapshotId: string) {
  return useQuery({
    queryKey: [...contractorClassificationKey, 'snapshot', snapshotId],
    queryFn: () => mhdContractorClassificationService.getSnapshot(snapshotId),
    enabled: Boolean(snapshotId),
  });
}

export function useMhdCaAb5ExemptionCategories() {
  return useQuery({
    queryKey: [...contractorClassificationKey, 'ca-ab5-exemption-categories'],
    queryFn: () => mhdContractorClassificationService.listExemptionCategories(),
  });
}

export function useEvaluateContractorClassification() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (input: MhdContractorClassificationEvaluateInput) => mhdContractorClassificationService.evaluate(input),
    onSuccess: refresh,
  });
}

export function useConfirmContractorClassification() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (input: MhdContractorClassificationConfirmInput) => mhdContractorClassificationService.confirm(input),
    onSuccess: refresh,
  });
}
