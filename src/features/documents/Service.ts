import { appConfig } from '@/config/appConfig';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import {
  MHD_ATTACHMENT_MAX_SIZE_BYTES,
  MHD_ATTACHMENT_MAX_SIZE_MB,
  type MhdDriveUploadResponse,
} from '@/features/attachments/Types';
import { mhdRenderDocumentGeneration } from './generationEngine';
import type {
  MhdCreateDocumentTemplateInput,
  MhdDocumentGeneration,
  MhdDocumentMergeFieldCatalogEntry,
  MhdDocumentMutationContext,
  MhdDocumentTemplate,
  MhdDocumentTemplateDetail,
  MhdRequestDocumentGenerationInput,
  MhdUpdateDocumentTemplateInput,
} from './Types';

const DEFAULT_POLL_ATTEMPTS = 10;
const DEFAULT_POLL_INTERVAL_MS = 1500;
const MHD_ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type MhdDocumentTemplateRow = {
  id: string;
  reference_id: string;
  company_id: string | null;
  name: string;
  template_type: string;
  applicable_entity_type: string | null;
  description: string | null;
  content_format: string;
  merge_fields: Json;
  version: number;
  is_active: boolean;
  requires_signature: boolean;
  created_at: string;
  updated_at: string;
};

type MhdDocumentTemplateDetailRow = MhdDocumentTemplateRow & { content: string };

type MhdDocumentGenerationRow = {
  id: string;
  reference_id: string;
  template_id: string;
  template_name: string;
  company_id: string;
  status: string;
  output_format: string;
  output_file_name: string | null;
  output_drive_file_id: string | null;
  generated_at: string | null;
  esignature_request_id: string | null;
  created_at: string;
};

type MhdDocumentMergeFieldCatalogRow = {
  source: string;
  path: string;
  label: string;
  sample_value: string | null;
  sort_order: number;
};

export type MhdDocumentGenerationDetailRow = {
  id: string;
  reference_id: string;
  template_id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  output_file_name: string | null;
  output_drive_file_id: string | null;
  generated_at: string | null;
  esignature_request_id: string | null;
};

function mapTemplateRow(row: MhdDocumentTemplateRow): MhdDocumentTemplate {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdDocumentTemplate['referenceId'],
    companyId: row.company_id,
    name: row.name,
    templateType: row.template_type as MhdDocumentTemplate['templateType'],
    applicableEntityType: row.applicable_entity_type,
    description: row.description,
    contentFormat: row.content_format as MhdDocumentTemplate['contentFormat'],
    mergeFields: (row.merge_fields ?? []) as unknown as MhdDocumentTemplate['mergeFields'],
    version: row.version,
    isActive: row.is_active,
    requiresSignature: row.requires_signature,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGenerationRow(row: MhdDocumentGenerationRow): MhdDocumentGeneration {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdDocumentGeneration['referenceId'],
    templateId: row.template_id,
    templateName: row.template_name,
    companyId: row.company_id,
    status: row.status as MhdDocumentGeneration['status'],
    outputFormat: row.output_format as MhdDocumentGeneration['outputFormat'],
    outputFileName: row.output_file_name,
    outputDriveFileId: row.output_drive_file_id,
    generatedAt: row.generated_at,
    esignatureRequestId: row.esignature_request_id,
    createdAt: row.created_at,
  };
}

export const mhdDocumentService = {
  async listMergeFieldCatalog(): Promise<MhdDocumentMergeFieldCatalogEntry[]> {
    const { data, error } = await supabaseClient
      .from('document_merge_field_catalog' as never)
      .select('source, path, label, sample_value, sort_order')
      .order('source')
      .order('sort_order')
      .returns<MhdDocumentMergeFieldCatalogRow[]>();

    if (error) {
      throw new Error(`Unable to load document merge field catalog: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      source: row.source as MhdDocumentMergeFieldCatalogEntry['source'],
      path: row.path,
      label: row.label,
      sampleValue: row.sample_value,
      sortOrder: row.sort_order,
    }));
  },

  async listTemplates(
    companyId: string | null,
    templateType?: string,
    includeInactive = false,
    entityType?: string,
  ): Promise<MhdDocumentTemplate[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_document_templates', {
        p_company_id: companyId ?? undefined,
        p_template_type: templateType,
        p_include_inactive: includeInactive,
        p_entity_type: entityType,
      })
      .returns<MhdDocumentTemplateRow[]>();

    if (error) {
      throw new Error(`Unable to load document templates: ${error.message}`);
    }

    return (data ?? []).map(mapTemplateRow);
  },

  async getTemplate(templateId: string): Promise<MhdDocumentTemplateDetail> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_document_template', { p_template_id: templateId })
      .returns<MhdDocumentTemplateDetailRow[]>();

    if (error) {
      throw new Error(`Unable to load document template: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error(`Document template not found: ${templateId}`);
    }

    return { ...mapTemplateRow(row), content: row.content };
  },

  /**
   * Resolves a template by its stable `template_key` (company override if one
   * exists, else the platform-level default) — the mechanism a module's
   * "default/master" template is found through, e.g. Task's
   * TASK_MASTER_ALL_FIELDS. Returns null when no such template exists yet.
   */
  async getTemplateByKey(
    templateKey: string,
    companyId: string | null,
  ): Promise<MhdDocumentTemplateDetail | null> {
    const { data: templateId, error } = await supabaseClient.rpc(
      'mhd_get_document_template_by_key',
      { p_template_key: templateKey, p_company_id: companyId ?? undefined },
    );

    if (error) {
      throw new Error(`Unable to resolve template "${templateKey}": ${error.message}`);
    }
    if (!templateId) {
      return null;
    }

    return mhdDocumentService.getTemplate(templateId);
  },

  async createTemplate(
    input: MhdCreateDocumentTemplateInput,
    context: MhdDocumentMutationContext,
  ): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_document_template', {
        // The generated Args type marks this required `string`, but the RPC
        // param is a plain nullable uuid — null is valid over the wire for a
        // platform-level (shared) template.
        p_company_id: input.companyId as unknown as string,
        p_name: input.name.trim(),
        p_template_type: input.templateType,
        p_content_format: input.contentFormat,
        p_content: input.content,
        p_merge_fields: input.mergeFields as unknown as Json,
        p_description: input.description ?? undefined,
        p_requires_signature: input.requiresSignature ?? false,
        p_actor_user_id: context.actorUserId,
        p_applicable_entity_type: input.applicableEntityType ?? undefined,
      })
      .returns<{ id: string; reference_id: string }[]>();

    if (error) {
      throw new Error(`Unable to create document template: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create document template: no record returned.');
    }
    return { id: row.id, referenceId: row.reference_id };
  },

  async updateTemplate(
    input: MhdUpdateDocumentTemplateInput,
    context: MhdDocumentMutationContext,
  ): Promise<{ id: string; referenceId: string; version: number }> {
    const { data, error } = await supabaseClient
      .rpc('mhd_update_document_template', {
        p_template_id: input.templateId,
        p_name: input.name.trim(),
        p_template_type: input.templateType,
        p_content_format: input.contentFormat,
        p_content: input.content,
        p_merge_fields: input.mergeFields as unknown as Json,
        p_description: input.description ?? undefined,
        p_requires_signature: input.requiresSignature ?? false,
        p_is_active: input.isActive,
        p_actor_user_id: context.actorUserId,
        p_applicable_entity_type: input.applicableEntityType ?? undefined,
      })
      .returns<{ id: string; reference_id: string; version: number }[]>();

    if (error) {
      throw new Error(`Unable to update document template: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to update document template: no record returned.');
    }
    return { id: row.id, referenceId: row.reference_id, version: row.version };
  },

  async deleteTemplate(templateId: string, context: MhdDocumentMutationContext): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_document_template', {
      p_template_id: templateId,
      p_actor_user_id: context.actorUserId,
    });

    if (error) {
      throw new Error(`Unable to delete document template: ${error.message}`);
    }
  },

  async listGenerationsForEntity(
    entityType: string,
    entityId: string,
  ): Promise<MhdDocumentGeneration[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_document_generations', {
        p_entity_type: entityType,
        p_entity_id: entityId,
      })
      .returns<MhdDocumentGenerationRow[]>();

    if (error) {
      throw new Error(`Unable to load document generations: ${error.message}`);
    }

    return (data ?? []).map(mapGenerationRow);
  },

  async getGeneration(generationId: string): Promise<MhdDocumentGenerationDetailRow> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_document_generation', { p_generation_id: generationId })
      .returns<MhdDocumentGenerationDetailRow[]>();

    if (error) {
      throw new Error(`Unable to load document generation: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error(`Document generation not found: ${generationId}`);
    }
    return row;
  },

  async requestGeneration(
    input: MhdRequestDocumentGenerationInput,
    context: MhdDocumentMutationContext,
  ): Promise<{ id: string; referenceId: string; status: string }> {
    const { data, error } = await supabaseClient
      .rpc('mhd_request_document_generation', {
        p_template_id: input.templateId,
        p_company_id: input.companyId,
        p_entity_type: input.entityType,
        p_entity_id: input.entityId,
        p_merge_data: input.mergeData as Json,
        p_output_format: input.outputFormat ?? 'HTML',
        p_actor_user_id: context.actorUserId,
      })
      .returns<{ id: string; reference_id: string; status: string }[]>();

    if (error) {
      throw new Error(`Unable to request document generation: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to request document generation: no record returned.');
    }
    return { id: row.id, referenceId: row.reference_id, status: row.status };
  },

  /**
   * Requests a generation, invokes the `render-document` edge function
   * (HTML/DOCX rendering + Google Drive upload — not something Postgres
   * does), then polls until the row reaches a terminal status. Mirrors the
   * request/render/poll sequence already used by Offboarding's exit
   * documents, Conduct, and Performance.
   */
  async generateAndPoll(
    input: MhdRequestDocumentGenerationInput,
    context: MhdDocumentMutationContext,
    options?: { pollAttempts?: number; pollIntervalMs?: number },
  ): Promise<MhdDocumentGenerationDetailRow> {
    const requested = await mhdDocumentService.requestGeneration(input, context);

    await mhdRenderDocumentGeneration(requested.id, 'Document render');

    const attempts = options?.pollAttempts ?? DEFAULT_POLL_ATTEMPTS;
    const intervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

    let generation = await mhdDocumentService.getGeneration(requested.id);
    for (let attempt = 0; attempt < attempts && generation.status === 'PENDING'; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      generation = await mhdDocumentService.getGeneration(requested.id);
    }

    if (generation.status === 'FAILED') {
      throw new Error('Document generation failed — see generation history for details.');
    }

    return generation;
  },

  /**
   * The "download the master template, customize it offline, upload the
   * finished file" path: requests a generation row (same lifecycle as
   * `generateAndPoll`), uploads the user's file to Google Drive via the same
   * edge function the Attachments engine uses, then completes the
   * generation directly with that Drive file — skipping the
   * `render-document` auto-render step entirely, since the user already
   * produced the final PDF/DOCX themselves.
   */
  async uploadCompletedDocument(
    input: MhdRequestDocumentGenerationInput,
    file: File,
    context: MhdDocumentMutationContext,
  ): Promise<MhdDocumentGenerationDetailRow> {
    if (file.size > MHD_ATTACHMENT_MAX_SIZE_BYTES) {
      throw new Error(`File is too large (${MHD_ATTACHMENT_MAX_SIZE_MB} MB maximum).`);
    }
    if (!MHD_ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
      throw new Error('Only PDF or Word (.doc/.docx) files are accepted.');
    }

    const requested = await mhdDocumentService.requestGeneration(input, context);

    const formData = new FormData();
    formData.set('file', file);
    formData.set('entity_type', 'DOCUMENT_GENERATION');
    formData.set('entity_id', requested.id);
    formData.set('original_file_name', file.name);
    formData.set('mime_type', file.type);

    const { data: driveData, error: driveError } =
      await supabaseClient.functions.invoke<MhdDriveUploadResponse>(
        appConfig.attachmentUploadFunctionName,
        { body: formData },
      );

    if (driveError) {
      throw new Error(`Upload failed: ${driveError.message}`);
    }
    if (!driveData?.driveFileId) {
      throw new Error('Upload failed: the upload function returned an incomplete payload.');
    }

    const { error: completeError } = await supabaseClient.rpc('mhd_complete_document_generation', {
      p_generation_id: requested.id,
      p_output_file_name: file.name,
      p_output_drive_file_id: driveData.driveFileId,
      p_actor_user_id: context.actorUserId,
    });

    if (completeError) {
      await mhdDocumentService
        .failGeneration(requested.id, completeError.message, context)
        .catch(() => undefined);
      throw new Error(`Unable to record the uploaded document: ${completeError.message}`);
    }

    return mhdDocumentService.getGeneration(requested.id);
  },

  async failGeneration(
    generationId: string,
    reason: string | undefined,
    context: MhdDocumentMutationContext,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_fail_document_generation', {
      p_generation_id: generationId,
      p_reason: reason,
      p_actor_user_id: context.actorUserId,
    });
    if (error) {
      throw new Error(`Unable to mark document generation failed: ${error.message}`);
    }
  },
};

// Re-exported through the feature's public contract (Service.ts) rather than
// importing generationEngine.ts directly cross-feature — the
// mhd-feature-boundary/no-cross-feature-internals lint rule requires every
// cross-feature import go through Service.ts/Types.ts/Hook.ts/Schemas.ts.
// conduct, case-documents, offboarding, and performance each independently
// reimplemented this render-invoke + poll pair before 2026-08-06 (audit
// finding M2/M6); they now call these shared primitives instead.
export { mhdRenderDocumentGeneration, mhdPollDocumentGenerationUntilGenerated } from './generationEngine';
