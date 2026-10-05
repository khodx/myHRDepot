import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdEmployeeFilesService, type MhdUpsertEmployeeFileRequirementInput } from './Service';
import type { MhdEmployeeFileTypeKey } from './Types';

export const mhdEmployeeFileQueryKeys = {
  categoryDefault: (companyId: string | null, category: MhdEmployeeFileTypeKey | null) =>
    ['mhd-employee-files', 'category-default', companyId ?? '', category ?? ''] as const,
  categoryDefaults: (companyId: string | null) =>
    ['mhd-employee-files', 'category-defaults', companyId ?? ''] as const,
  requirementGaps: (companyId: string | null) =>
    ['mhd-employee-files', 'requirement-gaps', companyId ?? ''] as const,
  requirements: (companyId: string | null) =>
    ['mhd-employee-files', 'requirements', companyId ?? ''] as const,
  completeness: (personId: string | null) =>
    ['mhd-employee-files', 'completeness', personId ?? ''] as const,
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

export function useMhdEmployeeFileRequirementGaps(companyId: string | null) {
  return useQuery({
    queryKey: mhdEmployeeFileQueryKeys.requirementGaps(companyId),
    queryFn: () => mhdEmployeeFilesService.listRequirementGaps(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdEmployeeFileRequirements(companyId: string | null) {
  return useQuery({
    queryKey: mhdEmployeeFileQueryKeys.requirements(companyId),
    queryFn: () => mhdEmployeeFilesService.listRequirements(companyId!),
    enabled: Boolean(companyId),
  });
}

/**
 * A refused call (caller lacks file access) surfaces as `isError`; callers
 * that should render nothing in that case check it. A refusal is not
 * transient, so it is not retried.
 */
export function useMhdEmployeeFileCompleteness(personId: string | null) {
  return useQuery({
    queryKey: mhdEmployeeFileQueryKeys.completeness(personId),
    queryFn: () => mhdEmployeeFilesService.getPersonCompleteness(personId!),
    enabled: Boolean(personId),
    retry: false,
  });
}

export function useMhdUpsertEmployeeFileRequirement(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpsertEmployeeFileRequirementInput) =>
      mhdEmployeeFilesService.upsertRequirement(companyId!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdEmployeeFileQueryKeys.requirementGaps(companyId),
      });
      void queryClient.invalidateQueries({
        queryKey: mhdEmployeeFileQueryKeys.requirements(companyId),
      });
      // A rule change alters every person's checklist for this company.
      void queryClient.invalidateQueries({ queryKey: ['mhd-employee-files', 'completeness'] });
    },
  });
}
