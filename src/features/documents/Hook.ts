import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdDocumentService } from './Service';
import type {
  MhdCreateDocumentTemplateInput,
  MhdDocumentMutationContext,
  MhdRequestDocumentGenerationInput,
  MhdUpdateDocumentTemplateInput,
} from './Types';

const mhdDocumentQueryKeys = {
  templates: (
    companyId: string | null,
    templateType?: string,
    includeInactive?: boolean,
    entityType?: string,
  ) => ['mhd-document-templates', companyId, templateType, includeInactive, entityType] as const,
  template: (templateId: string | null) => ['mhd-document-template', templateId] as const,
  templateByKey: (templateKey: string | null, companyId: string | null) =>
    ['mhd-document-template-by-key', templateKey, companyId] as const,
  generations: (entityType: string, entityId: string | null) =>
    ['mhd-document-generations', entityType, entityId] as const,
};

export function useMhdDocumentTemplates(
  companyId: string | null,
  templateType?: string,
  includeInactive = false,
  entityType?: string,
) {
  return useQuery({
    queryKey: mhdDocumentQueryKeys.templates(companyId, templateType, includeInactive, entityType),
    queryFn: () =>
      mhdDocumentService.listTemplates(companyId, templateType, includeInactive, entityType),
  });
}

export function useMhdDocumentTemplate(templateId: string | null) {
  return useQuery({
    queryKey: mhdDocumentQueryKeys.template(templateId),
    queryFn: () => mhdDocumentService.getTemplate(templateId!),
    enabled: Boolean(templateId),
  });
}

/** Resolves a module's default/master template by its stable template_key
 *  (e.g. TASK_MASTER_ALL_FIELDS) — the reusable pattern any module uses to
 *  pin a "download, customize, upload back" starting point. */
export function useMhdDocumentTemplateByKey(
  templateKey: string | null,
  companyId: string | null,
) {
  return useQuery({
    queryKey: mhdDocumentQueryKeys.templateByKey(templateKey, companyId),
    queryFn: () => mhdDocumentService.getTemplateByKey(templateKey!, companyId),
    enabled: Boolean(templateKey),
  });
}

export function useMhdDocumentGenerations(entityType: string, entityId: string | null) {
  return useQuery({
    queryKey: mhdDocumentQueryKeys.generations(entityType, entityId),
    queryFn: () => mhdDocumentService.listGenerationsForEntity(entityType, entityId!),
    enabled: Boolean(entityId),
  });
}

export function useMhdDocumentTemplateActions(context: MhdDocumentMutationContext | null) {
  const queryClient = useQueryClient();

  async function invalidateTemplates() {
    await queryClient.invalidateQueries({ queryKey: ['mhd-document-templates'] });
    await queryClient.invalidateQueries({ queryKey: ['mhd-document-template'] });
  }

  const createTemplate = useMutation({
    mutationFn: (input: MhdCreateDocumentTemplateInput) => {
      if (!context) throw new Error('Cannot create a template without an authenticated user.');
      return mhdDocumentService.createTemplate(input, context);
    },
    onSuccess: () => void invalidateTemplates(),
  });

  const updateTemplate = useMutation({
    mutationFn: (input: MhdUpdateDocumentTemplateInput) => {
      if (!context) throw new Error('Cannot update a template without an authenticated user.');
      return mhdDocumentService.updateTemplate(input, context);
    },
    onSuccess: () => void invalidateTemplates(),
  });

  const deleteTemplate = useMutation({
    mutationFn: (templateId: string) => {
      if (!context) throw new Error('Cannot delete a template without an authenticated user.');
      return mhdDocumentService.deleteTemplate(templateId, context);
    },
    onSuccess: () => void invalidateTemplates(),
  });

  return { createTemplate, updateTemplate, deleteTemplate };
}

export function useMhdDocumentGenerationActions(
  entityType: string,
  entityId: string | null,
  context: MhdDocumentMutationContext | null,
) {
  const queryClient = useQueryClient();

  const generate = useMutation({
    mutationFn: (input: MhdRequestDocumentGenerationInput) => {
      if (!context) throw new Error('Cannot generate a document without an authenticated user.');
      return mhdDocumentService.generateAndPoll(input, context);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdDocumentQueryKeys.generations(entityType, entityId),
      });
    },
  });

  const uploadCompleted = useMutation({
    mutationFn: ({ input, file }: { input: MhdRequestDocumentGenerationInput; file: File }) => {
      if (!context) throw new Error('Cannot upload a document without an authenticated user.');
      return mhdDocumentService.uploadCompletedDocument(input, file, context);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdDocumentQueryKeys.generations(entityType, entityId),
      });
    },
  });

  return { generate, uploadCompleted };
}
