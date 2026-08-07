import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdCompanyService } from './Service';
import type { MhdCompanyListFilters, MhdCreateCompanyInput, MhdUpdateCompanyInput } from './Types';

export const mhdCompanyQueryKeys = {
  all: ['mhd-companies'] as const,
  list: (filters: MhdCompanyListFilters) => [...mhdCompanyQueryKeys.all, 'list', filters] as const,
  detail: (companyId: string) => [...mhdCompanyQueryKeys.all, 'detail', companyId] as const,
};

export function useMhdCompanies(filters: MhdCompanyListFilters) {
  return useQuery({
    queryKey: mhdCompanyQueryKeys.list(filters),
    queryFn: () => mhdCompanyService.listCompanies(filters),
  });
}

export function useMhdCompany(companyId: string) {
  return useQuery({
    queryKey: mhdCompanyQueryKeys.detail(companyId),
    queryFn: () => mhdCompanyService.getCompanyById(companyId),
    enabled: companyId.length > 0,
  });
}

export function useMhdCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MhdCreateCompanyInput) => mhdCompanyService.createCompany(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdCompanyQueryKeys.all });
    },
  });
}

export function useMhdUpdateCompany(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MhdUpdateCompanyInput) => mhdCompanyService.updateCompany(companyId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdCompanyQueryKeys.all });
    },
  });
}
