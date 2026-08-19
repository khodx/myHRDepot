import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdEmployeeFilesService } from './Service';
import type { MhdEmployeeFileTypeKey } from './Types';

export const mhdEmployeeFileQueryKeys = {
  categoryDefault: (companyId: string | null, category: MhdEmployeeFileTypeKey | null) =>
    ['mhd-employee-files', 'category-default', companyId ?? '', category ?? ''] as const,
  categoryDefaults: (companyId: string | null) =>
    ['mhd-employee-files', 'category-defaults', companyId ?? ''] as const,
};

/**
 * Used by the New Record flow to decide whether a category has a canonical
 * form and the manual picker can be skipped.
 */
export function useMhdEmployeeFileCategoryDefault(
  companyId: string | null,
  category: MhdEmployeeFileTypeKey | null,
) {
  return useQuery({
    queryKey: mhdEmployeeFileQueryKeys.categoryDefault(companyId, category),
    queryFn: () => mhdEmployeeFilesService.getCategoryDefault(companyId!, category!),
    enabled: Boolean(companyId && category),
  });
}

/** Platform Admin / HR Partner only — backs the category defaults settings panel. */
export function useMhdEmployeeFileCategoryDefaults(companyId: string | null) {
  return useQuery({
    queryKey: mhdEmployeeFileQueryKeys.categoryDefaults(companyId),
    queryFn: () => mhdEmployeeFilesService.listCategoryDefaults(companyId!),
    enabled: Boolean(companyId),
  });
}

function useInvalidateEmployeeFileCategoryDefaults(companyId: string | null) {
  const queryClient = useQueryClient();
  return () => {
    // Broad prefix invalidation: a set/clear for one category can be read by
    // any open New Record flow for that company, regardless of which
    // category query key it holds, so every categoryDefault entry for this
    // feature is invalidated, not just the one just mutated.
    void queryClient.invalidateQueries({ queryKey: ['mhd-employee-files', 'category-default'] });
    void queryClient.invalidateQueries({
      queryKey: mhdEmployeeFileQueryKeys.categoryDefaults(companyId),
    });
  };
}

export function useMhdSetEmployeeFileCategoryDefault(companyId: string | null) {
  const invalidate = useInvalidateEmployeeFileCategoryDefaults(companyId);
  return useMutation({
    mutationFn: (input: { category: MhdEmployeeFileTypeKey; formId: string }) =>
      mhdEmployeeFilesService.setCategoryDefault(companyId!, input.category, input.formId),
    onSuccess: () => invalidate(),
  });
}

export function useMhdClearEmployeeFileCategoryDefault(companyId: string | null) {
  const invalidate = useInvalidateEmployeeFileCategoryDefaults(companyId);
  return useMutation({
    mutationFn: (category: MhdEmployeeFileTypeKey) =>
      mhdEmployeeFilesService.clearCategoryDefault(companyId!, category),
    onSuccess: () => invalidate(),
  });
}
