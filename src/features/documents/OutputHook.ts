import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdDocumentOutputService } from './OutputService';
import type {
  MhdDocumentMergeOverrides,
  MhdDocumentNarrativeSections,
  MhdDocumentPreviewInput,
  MhdDocumentQueueFilters,
  MhdEnqueueDocumentInput,
  MhdSaveDocumentBrandingInput,
  MhdSetDocumentTemplateWizardSettingsInput,
} from './Types';

export const mhdDocumentOutputQueryKeys = {
  queue: (companyId: string | null, filters?: MhdDocumentQueueFilters) =>
    ['mhd-document-queue', companyId, filters] as const,
  queueItem: (id: string | null) => ['mhd-document-queue-item', id] as const,
  templateVersions: (id: string | null) => ['mhd-document-template-versions', id] as const,
  templateWizardSettings: (id: string | null) =>
    ['mhd-document-template-wizard-settings', id] as const,
  branding: (companyId: string | null) => ['mhd-document-branding', companyId] as const,
  employeeFileDocuments: (personId: string | null) =>
    ['mhd-employee-file-documents', personId] as const,
};

export function useMhdDocumentQueue(companyId: string | null, filters?: MhdDocumentQueueFilters) {
  return useQuery({
    queryKey: mhdDocumentOutputQueryKeys.queue(companyId, filters),
    queryFn: () => mhdDocumentOutputService.listQueue(companyId!, filters),
    enabled: Boolean(companyId),
  });
}
export function useMhdDocumentQueueItem(queueId: string | null) {
  return useQuery({
    queryKey: mhdDocumentOutputQueryKeys.queueItem(queueId),
    queryFn: () => mhdDocumentOutputService.getQueued(queueId!),
    enabled: Boolean(queueId),
  });
}

export function useMhdEnqueueDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdEnqueueDocumentInput) => mhdDocumentOutputService.enqueue(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-queue'] });
      void queryClient.invalidateQueries({
        queryKey: mhdDocumentOutputQueryKeys.queueItem(result.id),
      });
    },
  });
}
export function useMhdUpdateQueuedDocumentEdits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      queueId: string;
      overrides: MhdDocumentMergeOverrides;
      narrative: MhdDocumentNarrativeSections;
    }) =>
      mhdDocumentOutputService.updateQueuedEdits(input.queueId, input.overrides, input.narrative),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-queue'] });
      void queryClient.invalidateQueries({
        queryKey: mhdDocumentOutputQueryKeys.queueItem(input.queueId),
      });
    },
  });
}
export function useMhdDismissQueuedDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { queueId: string; reason: string }) =>
      mhdDocumentOutputService.dismissQueued(input.queueId, input.reason),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-queue'] });
      void queryClient.invalidateQueries({
        queryKey: mhdDocumentOutputQueryKeys.queueItem(input.queueId),
      });
    },
  });
}
export function useMhdGenerateQueuedDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      queueId: string;
      entityType?: string;
      pollAttempts?: number;
      pollIntervalMs?: number;
    }) => mhdDocumentOutputService.generateQueued(input.queueId, input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-queue'] });
      void queryClient.invalidateQueries({
        queryKey: mhdDocumentOutputQueryKeys.queueItem(input.queueId),
      });
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-generations'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-employee-file-documents'] });
    },
  });
}

export function useMhdDocumentPreviewContext(input: MhdDocumentPreviewInput | null) {
  return useQuery({
    queryKey: ['mhd-document-preview-context', input] as const,
    queryFn: () => mhdDocumentOutputService.previewContext(input!),
    enabled: input !== null,
  });
}
/**
 * The wizard's preview: resolves the merge data server-side (with the person's edits applied),
 * then renders it as the company's letterheaded HTML. Returns both so the caller can show the
 * rendered document and read the current values of the editable fields.
 */
export function useMhdDocumentPreviewHtml(input: MhdDocumentPreviewInput | null) {
  return useQuery({
    queryKey: ['mhd-document-preview-html', input] as const,
    queryFn: async () => {
      const mergeData = await mhdDocumentOutputService.previewContext(input!);
      const html = await mhdDocumentOutputService.renderPreviewHtml({
        templateId: input!.templateId,
        companyId: input!.companyId,
        mergeData,
      });
      return { mergeData, html };
    },
    enabled: input !== null,
    retry: false,
    staleTime: 0,
  });
}

export function useMhdForkDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { templateId: string; companyId: string }) =>
      mhdDocumentOutputService.forkTemplate(input.templateId, input.companyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-templates'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-template'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-template-by-key'] });
    },
  });
}
export function useMhdDocumentTemplateVersions(templateId: string | null) {
  return useQuery({
    queryKey: mhdDocumentOutputQueryKeys.templateVersions(templateId),
    queryFn: () => mhdDocumentOutputService.listTemplateVersions(templateId!),
    enabled: Boolean(templateId),
  });
}
export function useMhdDocumentTemplateWizardSettings(templateId: string | null) {
  return useQuery({
    queryKey: mhdDocumentOutputQueryKeys.templateWizardSettings(templateId),
    queryFn: () => mhdDocumentOutputService.getTemplateWizardSettings(templateId!),
    enabled: Boolean(templateId),
  });
}
export function useMhdSetDocumentTemplateWizardSettings(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSetDocumentTemplateWizardSettingsInput) =>
      mhdDocumentOutputService.setTemplateWizardSettings(templateId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdDocumentOutputQueryKeys.templateWizardSettings(templateId),
      });
    },
  });
}
export function useMhdDocumentBranding(companyId: string | null) {
  return useQuery({
    queryKey: mhdDocumentOutputQueryKeys.branding(companyId),
    queryFn: () => mhdDocumentOutputService.getBranding(companyId),
    enabled: Boolean(companyId),
  });
}
export function useMhdSaveDocumentBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSaveDocumentBrandingInput) =>
      mhdDocumentOutputService.saveBranding(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-branding'] });
    },
  });
}
export function useMhdEmployeeFileDocuments(personId: string | null) {
  return useQuery({
    queryKey: mhdDocumentOutputQueryKeys.employeeFileDocuments(personId),
    queryFn: () => mhdDocumentOutputService.listEmployeeFileDocuments(personId!),
    enabled: Boolean(personId),
  });
}
export function useMhdSetGenerationEmployeeFileCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      generationId: string;
      category: Parameters<typeof mhdDocumentOutputService.setGenerationEmployeeFileCategory>[1];
    }) =>
      mhdDocumentOutputService.setGenerationEmployeeFileCategory(
        input.generationId,
        input.category,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-employee-file-documents'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-document-generations'] });
    },
  });
}
