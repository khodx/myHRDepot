import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import {
  mhdGenerationPollOptionsFor,
  mhdPollDocumentGenerationUntilGenerated,
  mhdRenderDocumentGeneration,
} from './generationEngine';
import type {
  MhdDocumentBranding,
  MhdDocumentEmployeeFileCategory,
  MhdDocumentMergeOverrides,
  MhdDocumentNarrativeSlot,
  MhdDocumentNarrativeSections,
  MhdDocumentPreviewInput,
  MhdDocumentPreviewRenderInput,
  MhdDocumentQueueDetail,
  MhdDocumentQueueFilters,
  MhdDocumentQueueItem,
  MhdDocumentSourceWizard,
  MhdDocumentTemplateVersion,
  MhdDocumentTemplateWizardSettings,
  MhdEmployeeFileDocument,
  MhdEnqueueDocumentInput,
  MhdEnqueuedDocument,
  MhdForkedDocumentTemplate,
  MhdQueuedDocumentGeneration,
  MhdSaveDocumentBrandingInput,
  MhdSetDocumentTemplateWizardSettingsInput,
} from './Types';

type MhdQueueListRow = {
  id: string;
  reference_id: string;
  company_id: string;
  template_key: string;
  template_name: string | null;
  entity_type: string;
  entity_id: string;
  subject_person_id: string | null;
  subject_person_name: string | null;
  source_wizard: string;
  status: string;
  output_format: string;
  requires_signature: boolean;
  employee_file_category: string | null;
  generation_id: string | null;
  generation_status: string | null;
  failure_reason: string | null;
  queued_by: string | null;
  queued_by_name: string | null;
  queued_at: string;
  generated_at: string | null;
};
type MhdQueueDetailRow = {
  id: string;
  reference_id: string;
  company_id: string;
  template_key: string;
  entity_type: string;
  entity_id: string;
  subject_person_id: string | null;
  source_wizard: string;
  status: string;
  output_format: string;
  requires_signature: boolean;
  employee_file_category: string | null;
  wizard_inputs: Json;
  merge_overrides: Json;
  narrative_sections: Json;
  generation_id: string | null;
  failure_reason: string | null;
  queued_by: string | null;
  queued_at: string;
};
type MhdEnqueuedRow = { id: string; reference_id: string };
type MhdGenerationRequestRow = {
  generation_id: string;
  generation_reference_id: string;
  template_id: string;
};
type MhdTemplateVersionRow = {
  version: number;
  name: string;
  content_format: string;
  content: string;
  requires_signature: boolean;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
};
type MhdWizardSettingsRow = {
  id: string;
  template_key: string | null;
  version: number;
  is_system: boolean;
  company_id: string | null;
  requires_signature: boolean;
  employee_file_category: string | null;
  narrative_slots: Json;
  compliance_module_key: string | null;
  compliance_content_key: string | null;
};
type MhdForkedTemplateRow = { id: string; reference_id: string; already_existed: boolean };
type MhdBrandingRow = {
  id: string;
  company_id: string | null;
  is_platform_default: boolean;
  header_text: string | null;
  footer_text: string | null;
  accent_color: string;
  font_family: string;
  logo_data_uri: string | null;
  show_reference_id: boolean;
};
type MhdEmployeeFileRow = {
  id: string;
  reference_id: string;
  template_key: string | null;
  template_name: string;
  employee_file_category: string;
  entity_type: string;
  entity_id: string;
  status: string;
  output_format: string;
  output_file_name: string | null;
  output_drive_file_id: string | null;
  esignature_request_id: string | null;
  generated_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

/**
 * The generated RPC argument types model a SQL NULL argument as a required non-null value
 * (a Postgres function parameter carries no nullability), but these RPCs deliberately accept
 * NULL: a null company means "the platform default", a null header/footer/logo means "none",
 * a null category means "not filed". This is the one place that bridges that gap, so every
 * call site stays honest about which arguments may legitimately be null. (The Forms service
 * documents the same compatibility need for `p_employee_file_category`.)
 */
function nullableArg<T>(value: T | null): T {
  return value as T;
}

function isObject(value: Json | unknown): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonObject(value: Json | undefined): Record<string, unknown> {
  return isObject(value) ? value : {};
}

function mergeOverrides(value: Json): MhdDocumentMergeOverrides {
  const result: MhdDocumentMergeOverrides = {};
  if (!isObject(value)) return result;
  for (const [key, item] of Object.entries(value)) {
    if (
      item === null ||
      typeof item === 'string' ||
      typeof item === 'number' ||
      typeof item === 'boolean'
    )
      result[key] = item;
  }
  return result;
}

function narrativeSections(value: Json): MhdDocumentNarrativeSections {
  const result: MhdDocumentNarrativeSections = {};
  if (!isObject(value)) return result;
  for (const [key, item] of Object.entries(value)) if (typeof item === 'string') result[key] = item;
  return result;
}

function narrativeSlots(value: Json): MhdDocumentNarrativeSlot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isObject(item) || typeof item.key !== 'string' || typeof item.label !== 'string')
      return [];
    return [
      {
        key: item.key,
        label: item.label,
        ...(typeof item.help === 'string' ? { help: item.help } : {}),
      },
    ];
  });
}

function mapQueueRow(row: MhdQueueListRow): MhdDocumentQueueItem {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    templateKey: row.template_key,
    templateName: row.template_name,
    entityType: row.entity_type,
    entityId: row.entity_id,
    subjectPersonId: row.subject_person_id,
    subjectPersonName: row.subject_person_name,
    sourceWizard: row.source_wizard as MhdDocumentSourceWizard,
    status: row.status as MhdDocumentQueueItem['status'],
    outputFormat: row.output_format as MhdDocumentQueueItem['outputFormat'],
    requiresSignature: row.requires_signature,
    employeeFileCategory: row.employee_file_category as MhdDocumentEmployeeFileCategory | null,
    generationId: row.generation_id,
    generationStatus: row.generation_status,
    failureReason: row.failure_reason,
    queuedBy: row.queued_by,
    queuedByName: row.queued_by_name,
    queuedAt: row.queued_at,
    generatedAt: row.generated_at,
  };
}

function mapQueueDetail(row: MhdQueueDetailRow): MhdDocumentQueueDetail {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    templateKey: row.template_key,
    entityType: row.entity_type,
    entityId: row.entity_id,
    subjectPersonId: row.subject_person_id,
    sourceWizard: row.source_wizard as MhdDocumentSourceWizard,
    status: row.status as MhdDocumentQueueDetail['status'],
    outputFormat: row.output_format as MhdDocumentQueueDetail['outputFormat'],
    requiresSignature: row.requires_signature,
    employeeFileCategory: row.employee_file_category as MhdDocumentEmployeeFileCategory | null,
    wizardInputs: jsonObject(row.wizard_inputs),
    mergeOverrides: mergeOverrides(row.merge_overrides),
    narrativeSections: narrativeSections(row.narrative_sections),
    generationId: row.generation_id,
    failureReason: row.failure_reason,
    queuedBy: row.queued_by,
    queuedAt: row.queued_at,
  };
}

function mapBrandingRow(row: MhdBrandingRow): MhdDocumentBranding {
  return {
    id: row.id,
    companyId: row.company_id,
    isPlatformDefault: row.is_platform_default,
    headerText: row.header_text,
    footerText: row.footer_text,
    accentColor: row.accent_color,
    fontFamily: row.font_family as MhdDocumentBranding['fontFamily'],
    logoDataUri: row.logo_data_uri,
    showReferenceId: row.show_reference_id,
  };
}

export const mhdDocumentOutputService = {
  async enqueue(input: MhdEnqueueDocumentInput): Promise<MhdEnqueuedDocument> {
    const { data, error } = await supabaseClient
      .rpc('mhd_document_queue_enqueue', {
        p_company_id: input.companyId,
        p_template_key: input.templateKey,
        p_entity_type: input.entityType,
        p_entity_id: input.entityId,
        p_source_wizard: input.sourceWizard,
        ...(input.wizardInputs !== undefined
          ? { p_wizard_inputs: input.wizardInputs as Json }
          : {}),
        ...(input.mergeOverrides !== undefined
          ? { p_merge_overrides: input.mergeOverrides as Json }
          : {}),
        ...(input.narrativeSections !== undefined
          ? { p_narrative_sections: input.narrativeSections as Json }
          : {}),
        ...(input.outputFormat !== undefined ? { p_output_format: input.outputFormat } : {}),
        ...(input.requiresSignature !== undefined
          ? { p_requires_signature: input.requiresSignature }
          : {}),
        // Omitted = the template's default category; 'NONE' = deliberately not filed, which
        // the server reads as an empty category.
        ...(input.employeeFileCategory !== undefined
          ? {
              p_employee_file_category:
                input.employeeFileCategory === 'NONE' ? '' : input.employeeFileCategory,
            }
          : {}),
      })
      .returns<MhdEnqueuedRow[]>();
    if (error) throw new Error(`Unable to enqueue document: ${error.message}`);
    const row = data?.[0];
    if (!row) throw new Error('Unable to enqueue document: no record returned.');
    return { id: row.id, referenceId: row.reference_id };
  },

  async updateQueuedEdits(
    queueId: string,
    overrides: MhdDocumentMergeOverrides,
    narrative: MhdDocumentNarrativeSections,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_document_queue_update_edits', {
      p_queue_id: queueId,
      p_merge_overrides: overrides as Json,
      p_narrative_sections: narrative as Json,
    });
    if (error) throw new Error(`Unable to update queued document edits: ${error.message}`);
  },
  async dismissQueued(queueId: string, reason: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_document_queue_dismiss', {
      p_queue_id: queueId,
      p_reason: reason,
    });
    if (error) throw new Error(`Unable to dismiss queued document: ${error.message}`);
  },
  async listQueue(
    companyId: string,
    filters?: MhdDocumentQueueFilters,
  ): Promise<MhdDocumentQueueItem[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_document_queue_list', {
        p_company_id: companyId,
        ...(filters?.status && filters.status !== 'ALL' ? { p_status: filters.status } : {}),
        ...(filters?.subjectPersonId ? { p_subject_person_id: filters.subjectPersonId } : {}),
        ...(filters?.entityType ? { p_entity_type: filters.entityType } : {}),
        ...(filters?.entityId ? { p_entity_id: filters.entityId } : {}),
      })
      .returns<MhdQueueListRow[]>();
    if (error) throw new Error(`Unable to load document queue: ${error.message}`);
    return (data ?? []).map(mapQueueRow);
  },
  async getQueued(queueId: string): Promise<MhdDocumentQueueDetail> {
    const { data, error } = await supabaseClient
      .rpc('mhd_document_queue_get', { p_queue_id: queueId })
      .returns<MhdQueueDetailRow[]>();
    if (error) throw new Error(`Unable to load queued document: ${error.message}`);
    const row = data?.[0];
    if (!row) throw new Error('Queued document not found');
    return mapQueueDetail(row);
  },
  async generateQueued(
    queueId: string,
    options?: { entityType?: string; pollAttempts?: number; pollIntervalMs?: number },
  ): Promise<MhdQueuedDocumentGeneration> {
    const { data, error } = await supabaseClient
      .rpc('mhd_document_queue_generate', { p_queue_id: queueId })
      .returns<MhdGenerationRequestRow[]>();
    if (error) throw new Error(`Unable to generate queued document: ${error.message}`);
    const row = data?.[0];
    if (!row) throw new Error('Unable to generate queued document: no generation returned.');
    const defaults = mhdGenerationPollOptionsFor(options?.entityType ?? '');
    await mhdRenderDocumentGeneration(row.generation_id, 'Document render');
    const generated = await mhdPollDocumentGenerationUntilGenerated(row.generation_id, {
      attempts: options?.pollAttempts ?? defaults.pollAttempts,
      intervalMs: options?.pollIntervalMs ?? defaults.pollIntervalMs,
      timeoutHint: 'The document is still rendering. Generate it again from the queue to resume.',
    });
    return {
      queueId,
      generationId: row.generation_id,
      generationReferenceId: row.generation_reference_id,
      templateId: row.template_id,
      documentHash: generated.output_document_hash,
      outputDriveFileId: generated.output_drive_file_id,
    };
  },
  async previewContext(input: MhdDocumentPreviewInput): Promise<Record<string, unknown>> {
    const { data, error } = await supabaseClient.rpc('mhd_document_preview_context', {
      p_template_id: input.templateId,
      p_company_id: input.companyId,
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_custom: (input.custom ?? {}) as Json,
      p_overrides: (input.overrides ?? {}) as Json,
      p_narrative: (input.narrative ?? {}) as Json,
    });
    if (error) throw new Error(`Unable to load document preview context: ${error.message}`);
    return jsonObject(data as Json);
  },
  async renderPreviewHtml(input: MhdDocumentPreviewRenderInput): Promise<string> {
    const { data, error } = await supabaseClient.functions.invoke<{
      success?: boolean;
      error?: string;
      html?: string;
    }>('render-document', {
      body: {
        mode: 'preview',
        template_id: input.templateId,
        company_id: input.companyId,
        merge_data: input.mergeData,
      },
    });
    if (error) throw new Error(`Preview render failed: ${error.message}`);
    if (data?.success === false || !data?.html)
      throw new Error(`Preview render failed: ${data?.error ?? 'no preview was returned.'}`);
    return data.html;
  },
  async applyEdits(
    generationId: string,
    overrides: MhdDocumentMergeOverrides,
    narrative: MhdDocumentNarrativeSections,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_document_generation_apply_edits', {
      p_generation_id: generationId,
      p_overrides: overrides as Json,
      p_narrative: narrative as Json,
    });
    if (error) throw new Error(`Unable to apply document edits: ${error.message}`);
  },
  async forkTemplate(templateId: string, companyId: string): Promise<MhdForkedDocumentTemplate> {
    const { data, error } = await supabaseClient
      .rpc('mhd_document_template_fork', { p_template_id: templateId, p_company_id: companyId })
      .returns<MhdForkedTemplateRow[]>();
    if (error) throw new Error(`Unable to fork document template: ${error.message}`);
    const row = data?.[0];
    if (!row) throw new Error('Unable to fork document template: no record returned.');
    return { id: row.id, referenceId: row.reference_id, alreadyExisted: row.already_existed };
  },
  async listTemplateVersions(templateId: string): Promise<MhdDocumentTemplateVersion[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_document_template_versions', { p_template_id: templateId })
      .returns<MhdTemplateVersionRow[]>();
    if (error) throw new Error(`Unable to load document template versions: ${error.message}`);
    return (data ?? []).map((row) => ({
      version: row.version,
      name: row.name,
      contentFormat: row.content_format,
      content: row.content,
      requiresSignature: row.requires_signature,
      changedBy: row.changed_by,
      changedByName: row.changed_by_name,
      changedAt: row.changed_at,
    }));
  },
  async getTemplateWizardSettings(templateId: string): Promise<MhdDocumentTemplateWizardSettings> {
    const { data, error } = await supabaseClient
      .rpc('mhd_document_template_wizard_settings', { p_template_id: templateId })
      .returns<MhdWizardSettingsRow[]>();
    if (error)
      throw new Error(`Unable to load document template wizard settings: ${error.message}`);
    const row = data?.[0];
    if (!row) throw new Error('Document template wizard settings not found');
    return {
      id: row.id,
      templateKey: row.template_key,
      version: row.version,
      isSystem: row.is_system,
      companyId: row.company_id,
      requiresSignature: row.requires_signature,
      employeeFileCategory: row.employee_file_category as MhdDocumentEmployeeFileCategory | null,
      narrativeSlots: narrativeSlots(row.narrative_slots),
      complianceModuleKey: row.compliance_module_key,
      complianceContentKey: row.compliance_content_key,
    };
  },
  async setTemplateWizardSettings(
    templateId: string,
    input: MhdSetDocumentTemplateWizardSettingsInput,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_document_template_set_wizard_settings', {
      p_template_id: templateId,
      p_employee_file_category: nullableArg(input.employeeFileCategory),
      p_narrative_slots: input.narrativeSlots.map((slot) => ({
        key: slot.key,
        label: slot.label,
        ...(slot.help !== undefined ? { help: slot.help } : {}),
      })),
    });
    if (error)
      throw new Error(`Unable to save document template wizard settings: ${error.message}`);
  },
  async getBranding(companyId: string | null): Promise<MhdDocumentBranding> {
    const { data, error } = await supabaseClient
      .rpc('mhd_document_branding_get', { p_company_id: nullableArg(companyId) })
      .returns<MhdBrandingRow[]>();
    if (error) throw new Error(`Unable to load document branding: ${error.message}`);
    const row = data?.[0];
    if (!row) throw new Error('Document branding not found');
    return mapBrandingRow(row);
  },
  async saveBranding(input: MhdSaveDocumentBrandingInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_document_branding_upsert', {
      p_company_id: nullableArg(input.companyId),
      p_header_text: nullableArg(input.headerText),
      p_footer_text: nullableArg(input.footerText),
      p_accent_color: input.accentColor,
      p_font_family: input.fontFamily,
      p_logo_data_uri: nullableArg(input.logoDataUri),
      p_show_reference_id: input.showReferenceId,
    });
    if (error) throw new Error(`Unable to save document branding: ${error.message}`);
    if (!data) throw new Error('Unable to save document branding: no id returned.');
    return data;
  },
  async listEmployeeFileDocuments(personId: string): Promise<MhdEmployeeFileDocument[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_employee_file_documents', { p_person_id: personId })
      .returns<MhdEmployeeFileRow[]>();
    if (error) throw new Error(`Unable to load employee file documents: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      referenceId: row.reference_id,
      templateKey: row.template_key,
      templateName: row.template_name,
      employeeFileCategory: row.employee_file_category as MhdDocumentEmployeeFileCategory,
      entityType: row.entity_type,
      entityId: row.entity_id,
      status: row.status,
      outputFormat: row.output_format as MhdEmployeeFileDocument['outputFormat'],
      outputFileName: row.output_file_name,
      outputDriveFileId: row.output_drive_file_id,
      esignatureRequestId: row.esignature_request_id,
      generatedAt: row.generated_at,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
    }));
  },
  async setGenerationEmployeeFileCategory(
    generationId: string,
    category: MhdDocumentEmployeeFileCategory | null,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc(
      'mhd_document_generation_set_employee_file_category',
      { p_generation_id: generationId, p_category: nullableArg(category) },
    );
    if (error) throw new Error(`Unable to set employee file category: ${error.message}`);
  },
};
