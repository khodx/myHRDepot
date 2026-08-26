import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdCalculatorService } from './Service';
import type { MhdCalculatorTemplateFilters, MhdCreateCalculatorTemplateInput, MhdSetCalculatorTemplateActiveInput, MhdUpdateCalculatorTemplateInput } from './Types';

export const mhdCalculatorQueryKeys = {
  templates: (filters: MhdCalculatorTemplateFilters) => ['mhd-calculator', 'templates', filters] as const,
};

export function useMhdCalculatorTemplates(filters: MhdCalculatorTemplateFilters = {}) {
  return useQuery({ queryKey: mhdCalculatorQueryKeys.templates(filters), queryFn: () => mhdCalculatorService.listTemplates(filters) });
}

export function useMhdCreateCalculatorTemplate() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: MhdCreateCalculatorTemplateInput) => mhdCalculatorService.createTemplate(input), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['mhd-calculator', 'templates'] }); } });
}

export function useMhdUpdateCalculatorTemplate() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: MhdUpdateCalculatorTemplateInput) => mhdCalculatorService.updateTemplate(input), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['mhd-calculator', 'templates'] }); } });
}

export function useMhdSetCalculatorTemplateActive() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: MhdSetCalculatorTemplateActiveInput) => mhdCalculatorService.setTemplateActive(input), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['mhd-calculator', 'templates'] }); } });
}
