import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdChecklistInstanceDetail,
  MhdChecklistInstanceItem,
  MhdChecklistInstanceItemRpcJson,
  MhdChecklistInstanceRpcRow,
  MhdChecklistInstanceSummary,
  MhdChecklistInstanceSummaryRpcRow,
  MhdChecklistTemplate,
  MhdChecklistTemplateRpcRow,
  MhdCompleteChecklistItemInput,
  MhdCreateChecklistInstanceInput,
  MhdCreateChecklistTemplateInput,
} from './Types';

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function mapTemplate(row: MhdChecklistTemplateRpcRow): MhdChecklistTemplate {
  return {
    id: row.id,
    companyId: row.company_id,
    sourceTemplateId: row.source_template_id,
    title: row.title,
    description: row.description,
    category: row.category,
    isActive: row.is_active,
    isLibrary: row.is_library,
    itemCount: toNumber(row.item_count),
  };
}

function mapInstanceSummary(row: MhdChecklistInstanceSummaryRpcRow): MhdChecklistInstanceSummary {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    title: row.title,
    status: row.status,
    dueDate: row.due_date,
    totalItems: toNumber(row.total_items),
    completedItems: toNumber(row.completed_items),
  };
}

function mapInstanceItem(row: MhdChecklistInstanceItemRpcJson): MhdChecklistInstanceItem {
  return {
    id: row.id,
    templateItemId: row.template_item_id,
    sortOrder: row.sort_order,
    title: row.title,
    description: row.description,
    isRequired: row.is_required,
    requiresEvidence: row.requires_evidence,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    evidenceNote: row.evidence_note,
    evidenceAttachmentId: row.evidence_attachment_id,
  };
}

function mapInstanceDetail(row: MhdChecklistInstanceRpcRow): MhdChecklistInstanceDetail {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    title: row.title,
    status: row.status,
    assignedToPersonId: row.assigned_to_person_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    items: (row.items ?? []).map(mapInstanceItem),
  };
}

export const mhdChecklistsService = {
  async listLibrary(companyId: string, category?: string | null): Promise<MhdChecklistTemplate[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_checklist_library', {
      p_company_id: companyId,
      p_category: category && category !== 'ALL' ? category : undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdChecklistTemplateRpcRow[]).map(mapTemplate);
  },

  async createTemplate(input: MhdCreateChecklistTemplateInput): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_create_checklist_template',
      {
        p_company_id: input.companyId,
        p_title: input.title.trim(),
        p_description: input.description?.trim() || undefined,
        p_category: input.category ?? 'GENERAL',
        p_source_template_id: input.sourceTemplateId ?? undefined,
      } as never,
    );
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string }>)[0];
    if (!row) throw new Error('Checklist template creation returned no row.');

    for (const item of input.items) {
      const { error: itemError } = await supabaseClient.rpc('mhd_add_checklist_template_item', {
        p_template_id: row.id,
        p_title: item.title.trim(),
        p_description: item.description?.trim() || undefined,
        p_is_required: item.isRequired,
        p_requires_evidence: item.requiresEvidence,
        p_sort_order: item.sortOrder,
      });
      if (itemError) throw itemError;
    }

    return { id: row.id };
  },

  async forkTemplate(sourceTemplateId: string, companyId: string): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc('mhd_fork_checklist_template', {
      p_source_template_id: sourceTemplateId,
      p_company_id: companyId,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string }>)[0];
    if (!row) throw new Error('Checklist template fork returned no row.');
    return { id: row.id };
  },

  async listMyInstances(): Promise<MhdChecklistInstanceSummary[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_my_checklist_instances');
    if (error) throw error;
    return ((data ?? []) as MhdChecklistInstanceSummaryRpcRow[]).map(mapInstanceSummary);
  },

  async createInstance(input: MhdCreateChecklistInstanceInput): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_create_checklist_instance',
      {
        p_company_id: input.companyId,
        p_title: input.title.trim(),
        p_assigned_to_person_id: input.assignedToPersonId,
        p_template_id: input.templateId ?? undefined,
        p_entity_type: input.entityType ?? undefined,
        p_entity_id: input.entityId ?? undefined,
        p_due_date: input.dueDate ?? undefined,
      } as never,
    );
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string }>)[0];
    if (!row) throw new Error('Checklist instance creation returned no row.');
    return { id: row.id };
  },

  async getInstance(instanceId: string): Promise<MhdChecklistInstanceDetail | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_checklist_instance', {
      p_instance_id: instanceId,
    });
    if (error) throw error;
    const row = ((data ?? []) as unknown as MhdChecklistInstanceRpcRow[])[0];
    return row ? mapInstanceDetail(row) : null;
  },

  async completeItem(input: MhdCompleteChecklistItemInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_complete_checklist_item', {
      p_item_id: input.itemId,
      p_is_completed: input.isCompleted,
      p_evidence_note: input.evidenceNote?.trim() || undefined,
      p_evidence_attachment_id: input.evidenceAttachmentId ?? undefined,
    });
    if (error) throw error;
  },
};
