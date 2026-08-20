export type MhdChecklistCategory =
  | 'GENERAL'
  | 'ONBOARDING'
  | 'OFFBOARDING'
  | 'COMPLIANCE'
  | 'TRAINING'
  | 'SAFETY'
  | 'FACILITIES'
  | 'IT'
  | 'OTHER';

export type MhdChecklistInstanceStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const MHD_CHECKLIST_CATEGORIES: readonly MhdChecklistCategory[] = [
  'GENERAL',
  'ONBOARDING',
  'OFFBOARDING',
  'COMPLIANCE',
  'TRAINING',
  'SAFETY',
  'FACILITIES',
  'IT',
  'OTHER',
];

export interface MhdChecklistTemplateRpcRow {
  id: string;
  company_id: string | null;
  source_template_id: string | null;
  title: string;
  description: string | null;
  category: MhdChecklistCategory;
  is_active: boolean;
  is_library: boolean;
  item_count: number | string;
}

export interface MhdChecklistTemplate {
  id: string;
  companyId: string | null;
  sourceTemplateId: string | null;
  title: string;
  description: string | null;
  category: MhdChecklistCategory;
  isActive: boolean;
  isLibrary: boolean;
  itemCount: number;
}

export interface MhdChecklistTemplateItemDraft {
  title: string;
  description?: string | null;
  isRequired: boolean;
  requiresEvidence: boolean;
  sortOrder: number;
}

export interface MhdCreateChecklistTemplateInput {
  companyId: string | null;
  title: string;
  description?: string | null;
  category?: MhdChecklistCategory;
  sourceTemplateId?: string | null;
  items: MhdChecklistTemplateItemDraft[];
}

export interface MhdCreateChecklistInstanceInput {
  companyId: string;
  title: string;
  assignedToPersonId: string;
  templateId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  dueDate?: string | null;
}

export interface MhdChecklistInstanceSummaryRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  title: string;
  status: MhdChecklistInstanceStatus;
  due_date: string | null;
  total_items: number | string;
  completed_items: number | string;
}

export interface MhdChecklistInstanceSummary {
  id: string;
  referenceId: string;
  companyId: string;
  title: string;
  status: MhdChecklistInstanceStatus;
  dueDate: string | null;
  totalItems: number;
  completedItems: number;
}

export interface MhdChecklistInstanceItemRpcJson {
  id: string;
  template_item_id: string | null;
  sort_order: number;
  title: string;
  description: string | null;
  is_required: boolean;
  requires_evidence: boolean;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  evidence_note: string | null;
  evidence_attachment_id: string | null;
}

export interface MhdChecklistInstanceRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  title: string;
  status: MhdChecklistInstanceStatus;
  assigned_to_person_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  items: MhdChecklistInstanceItemRpcJson[];
}

export interface MhdChecklistInstanceItem {
  id: string;
  templateItemId: string | null;
  sortOrder: number;
  title: string;
  description: string | null;
  isRequired: boolean;
  requiresEvidence: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  evidenceNote: string | null;
  evidenceAttachmentId: string | null;
}

export interface MhdChecklistInstanceDetail {
  id: string;
  referenceId: string;
  companyId: string;
  title: string;
  status: MhdChecklistInstanceStatus;
  assignedToPersonId: string | null;
  entityType: string | null;
  entityId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  items: MhdChecklistInstanceItem[];
}

export interface MhdCompleteChecklistItemInput {
  itemId: string;
  isCompleted: boolean;
  evidenceNote?: string | null;
  evidenceAttachmentId?: string | null;
}

export function mhdFormatChecklistValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
