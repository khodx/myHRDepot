import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import { mhdFormService } from '@/features/forms/Service';
import type { MhdFormLibraryEntry } from '@/features/forms/Types';
import { mhdAccommodationsService } from './Service';
import type {
  MhdAccommodationStatus,
  MhdCreateAccommodationInput,
  MhdCreateAccommodationOptionCatalogEntryInput,
  MhdRecordAccommodationMedicalInput,
  MhdUpdateAccommodationOptionCatalogEntryInput,
} from './Types';

export const mhdAccommodationQueryKeys = {
  list: (companyId: string | null, status: string | null, personId: string | null) =>
    ['mhd-accommodations', 'list', companyId ?? '', status ?? 'ALL', personId ?? 'ALL'] as const,
  detail: (caseId: string | null) => ['mhd-accommodations', 'detail', caseId ?? ''] as const,
  people: (companyId: string | null) => ['mhd-accommodations', 'people', companyId ?? ''] as const,
  readiness: () => ['mhd-accommodations', 'readiness'] as const,
  managerInstructions: (personId: string | null) =>
    ['mhd-accommodations', 'manager-instructions', personId ?? ''] as const,
  optionCatalog: (companyId: string | null, category: string | null) =>
    ['mhd-accommodations', 'option-catalog', companyId ?? '', category ?? 'ALL'] as const,
  documentTemplates: (companyId: string | null) =>
    ['mhd-accommodations', 'document-templates', companyId ?? ''] as const,
};

export const mhdAccommodationNoticeQueryKey = (caseId: string | null) =>
  ['mhd-accommodations', 'notices', caseId ?? ''] as const;

function useInvalidateAccommodationCase() {
  const queryClient = useQueryClient();
  return (caseId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-accommodations', 'list'] });
    if (caseId) {
      void queryClient.invalidateQueries({
        queryKey: mhdAccommodationQueryKeys.detail(caseId),
      });
      void queryClient.invalidateQueries({ queryKey: mhdAccommodationNoticeQueryKey(caseId) });
    }
  };
}

export function useMhdAccommodationCases(
  companyId: string | null,
  status?: string | null,
  personId?: string | null,
) {
  return useQuery({
    queryKey: mhdAccommodationQueryKeys.list(companyId, status ?? null, personId ?? null),
    queryFn: () => mhdAccommodationsService.list(companyId!, status, personId),
    enabled: Boolean(companyId),
  });
}

export function useMhdAccommodationCase(caseId: string | null) {
  return useQuery({
    queryKey: mhdAccommodationQueryKeys.detail(caseId),
    queryFn: () => mhdAccommodationsService.get(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdAccommodationNotices(caseId: string | null) {
  return useQuery({
    queryKey: mhdAccommodationNoticeQueryKey(caseId),
    queryFn: () => mhdAccommodationsService.listNotices(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdAccommodationNotice(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdAccommodationsService.recordNotice>[0]) =>
      mhdAccommodationsService.recordNotice(input),
    onSuccess: () => invalidate(caseId),
  });
}

export function useMhdAccommodationNoticeDelivery(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdAccommodationsService.markNoticeDelivery>[0]) =>
      mhdAccommodationsService.markNoticeDelivery(input),
    onSuccess: () => invalidate(caseId),
  });
}

export function useMhdAccommodationPeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdAccommodationQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}

export function useMhdAccommodationReadiness() {
  return useQuery({
    queryKey: mhdAccommodationQueryKeys.readiness(),
    queryFn: () => mhdAccommodationsService.readiness(),
  });
}

export function useMhdCreateAccommodation() {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: MhdCreateAccommodationInput) => mhdAccommodationsService.create(input),
    onSuccess: () => invalidate(),
  });
}

export function useMhdAccommodationTransition(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: { status: MhdAccommodationStatus; reason?: string | null }) =>
      mhdAccommodationsService.transition(caseId, input.status, input.reason),
    onSuccess: () => invalidate(caseId),
  });
}

export function useMhdAccommodationInteraction(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdAccommodationsService.addInteraction>[0]) =>
      mhdAccommodationsService.addInteraction(input),
    onSuccess: () => invalidate(caseId),
  });
}

export function useMhdAccommodationOption(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdAccommodationsService.addOption>[0]) =>
      mhdAccommodationsService.addOption(input),
    onSuccess: () => invalidate(caseId),
  });
}

export function useMhdAccommodationDecision(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdAccommodationsService.decide>[0]) =>
      mhdAccommodationsService.decide(input),
    onSuccess: () => invalidate(caseId),
  });
}

export function useMhdAccommodationImplementation(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdAccommodationsService.implement>[0]) =>
      mhdAccommodationsService.implement(input),
    onSuccess: () => invalidate(caseId),
  });
}

export function useMhdAccommodationMedicalRecord(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: MhdRecordAccommodationMedicalInput) =>
      mhdAccommodationsService.recordMedical(input),
    onSuccess: () => invalidate(caseId),
  });
}

/**
 * Deliberately a mutation, not a query: every reveal writes an audit event
 * server-side, so it must be an explicit act, never something React Query
 * refetches in the background or replays from cache.
 */
export function useMhdAccommodationMedicalReveal() {
  return useMutation({
    mutationFn: (documentationId: string) =>
      mhdAccommodationsService.revealMedical(documentationId),
  });
}

export function useMhdAccommodationManagerInstructions(personId: string | null) {
  return useQuery({
    queryKey: mhdAccommodationQueryKeys.managerInstructions(personId),
    queryFn: () => mhdAccommodationsService.managerProjection(personId!),
    enabled: Boolean(personId),
  });
}

export function useMhdAccommodationReview(caseId: string) {
  const invalidate = useInvalidateAccommodationCase();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdAccommodationsService.completeReview>[0]) =>
      mhdAccommodationsService.completeReview(input),
    onSuccess: () => invalidate(caseId),
  });
}

export function useMhdAccommodationOptionCatalog(
  companyId: string | null,
  category?: string | null,
) {
  return useQuery({
    queryKey: mhdAccommodationQueryKeys.optionCatalog(companyId, category ?? null),
    queryFn: () => mhdAccommodationsService.listOptionCatalog(companyId!, category),
    enabled: Boolean(companyId),
  });
}

const MHD_ACCOMMODATION_DOCUMENT_TEMPLATE_NAMES = new Set([
  'Accommodation Request Letter',
  'Employer Request for Additional Documentation',
  'Temporary/Trial Accommodation Approval',
  'Interactive Process Documentation Log',
]);

export function useMhdAccommodationDocumentTemplates(companyId: string | null | undefined) {
  return useQuery({
    queryKey: mhdAccommodationQueryKeys.documentTemplates(companyId ?? null),
    queryFn: async () => {
      const entries = await mhdFormService.listFormLibrary(companyId!);
      return entries.filter((entry: MhdFormLibraryEntry) =>
        MHD_ACCOMMODATION_DOCUMENT_TEMPLATE_NAMES.has(entry.name),
      );
    },
    enabled: Boolean(companyId),
  });
}

function useInvalidateAccommodationOptionCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-accommodations', 'option-catalog'] });
  };
}

export function useMhdCreateAccommodationOptionCatalogEntry() {
  const invalidate = useInvalidateAccommodationOptionCatalog();
  return useMutation({
    mutationFn: (input: MhdCreateAccommodationOptionCatalogEntryInput) =>
      mhdAccommodationsService.createOptionCatalogEntry(input),
    onSuccess: () => invalidate(),
  });
}

export function useMhdUpdateAccommodationOptionCatalogEntry() {
  const invalidate = useInvalidateAccommodationOptionCatalog();
  return useMutation({
    mutationFn: (input: MhdUpdateAccommodationOptionCatalogEntryInput) =>
      mhdAccommodationsService.updateOptionCatalogEntry(input),
    onSuccess: () => invalidate(),
  });
}

export function useMhdForkAccommodationOptionCatalogEntry() {
  const invalidate = useInvalidateAccommodationOptionCatalog();
  return useMutation({
    mutationFn: (input: { sourceOptionId: string; companyId: string }) =>
      mhdAccommodationsService.forkOptionCatalogEntry(input.sourceOptionId, input.companyId),
    onSuccess: () => invalidate(),
  });
}
