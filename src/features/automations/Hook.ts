import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdAutomationService } from './Service';
import type { MhdAutomationSetRuleActiveInput } from './Types';

export const mhdAutomationQueryKeys = {
  rules: (companyId: string | null) => ['mhd-automations', 'rules', companyId ?? ''] as const,
  rule: (ruleId: string | null) => ['mhd-automations', 'rule', ruleId ?? ''] as const,
  runs: (companyId: string | null) => ['mhd-automations', 'runs', companyId ?? ''] as const,
  run: (runId: string | null) => ['mhd-automations', 'run', runId ?? ''] as const,
  catalog: () => ['mhd-automations', 'catalog'] as const,
};

export function useMhdAutomationRules(companyId: string | null) {
  return useQuery({
    queryKey: mhdAutomationQueryKeys.rules(companyId),
    queryFn: () => mhdAutomationService.listRules(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useMhdAutomationRule(ruleId: string | null) {
  return useQuery({
    queryKey: mhdAutomationQueryKeys.rule(ruleId),
    queryFn: () => mhdAutomationService.getRule(ruleId as string),
    enabled: Boolean(ruleId),
  });
}

export function useMhdAutomationRuns(companyId: string | null) {
  return useQuery({
    queryKey: mhdAutomationQueryKeys.runs(companyId),
    queryFn: () => mhdAutomationService.listRuns(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useMhdAutomationRun(runId: string | null) {
  return useQuery({
    queryKey: mhdAutomationQueryKeys.run(runId),
    queryFn: () => mhdAutomationService.getRun(runId as string),
    enabled: Boolean(runId),
  });
}

/** The registry catalog is platform-global reference data and changes rarely. */
export function useMhdAutomationCatalog() {
  return useQuery({
    queryKey: mhdAutomationQueryKeys.catalog(),
    queryFn: () => mhdAutomationService.getCatalog(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Arming changes whether a rule acts on live data, so both the list and the
 * individual rule are invalidated — a stale "Inactive" badge next to a rule that
 * is in fact running is exactly the kind of thing an operator would act on.
 */
export function useMhdSetAutomationRuleActive(companyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MhdAutomationSetRuleActiveInput) =>
      mhdAutomationService.setRuleActive(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdAutomationQueryKeys.rules(companyId),
      });
      void queryClient.invalidateQueries({
        queryKey: mhdAutomationQueryKeys.rule(input.ruleId),
      });
    },
  });
}
