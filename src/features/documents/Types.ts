// Frontend layer for the 04.8 Document Generation Engine — a shared,
// polymorphic backend (document_templates / document_generations,
// migrations 0020/0031) that was previously consumed only through bespoke
// service calls in Conduct/Offboarding/Performance/Case Documents. This is
// the first general-purpose UI: a template library (list/create/edit) plus
// a generation panel any module can embed via `entityType`/`entityId`.
export type MhdDocumentTemplateId = string;
export type MhdDocumentTemplateReferenceId = `DOCT-${string}`;
export type MhdDocumentGenerationId = string;
export type MhdDocumentGenerationReferenceId = `DGEN-${string}`;

export type MhdDocumentTemplateType =
  | 'OFFER_LETTER'
  | 'CONTRACT'
  | 'FORM'
  | 'CERTIFICATE'
  | 'CORRESPONDENCE'
  | 'REPORT';

export const MHD_DOCUMENT_TEMPLATE_TYPES: MhdDocumentTemplateType[] = [
  'OFFER_LETTER',
  'CONTRACT',
  'FORM',
  'CERTIFICATE',
  'CORRESPONDENCE',
  'REPORT',
];

/** The known entity_type values a module passes to filter its own report
 *  section (see MhdDocumentGenerationPanel's `entityType` prop) — kept here
 *  as the editor's dropdown options so tagging stays consistent with what
 *  each module's generation calls already use. Not a closed enum in the
 *  database; a template can be tagged with any non-empty string. */
export const MHD_DOCUMENT_TEMPLATE_ENTITY_TYPES: { value: string; label: string }[] = [
  { value: 'TASK', label: 'Task' },
  { value: 'CONDUCT_ACTION', label: 'Conduct' },
  { value: 'OFFBOARDING_CASE', label: 'Offboarding' },
  { value: 'PERFORMANCE_REVIEW', label: 'Performance' },
  { value: 'CASE_DOCUMENT', label: 'Case Documents' },
  { value: 'ONBOARDING', label: 'Onboarding' },
];

export type MhdDocumentContentFormat = 'HTML' | 'DOCX' | 'MARKDOWN';

export type MhdDocumentOutputFormat = 'HTML' | 'PDF' | 'DOCX';

export interface MhdDocumentMergeBatchItem {
  id: string;
  personId: string;
  status: string;
  errorMessage: string | null;
}

export interface MhdDocumentMergeBatch {
  id: string;
  status: string;
  totalCount: number;
  succeededCount: number;
  failedCount: number;
  items: MhdDocumentMergeBatchItem[];
}

export const MHD_DOCUMENT_CONTENT_FORMATS: MhdDocumentContentFormat[] = [
  'HTML',
  'DOCX',
  'MARKDOWN',
];

export type MhdDocumentGenerationStatus = 'PENDING' | 'GENERATED' | 'FAILED' | 'SIGNED' | 'VOIDED';

export type MhdDocumentDeliveryChannel = 'EMAIL' | 'US_MAIL' | 'CERTIFIED_MAIL' | 'HAND_DELIVERED';
export type MhdDocumentDeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RETURNED';

/** One of the "Merge Field Sources" the Bible spec documents — the source a
 *  declared merge field's value is resolved from at generation time. */
export type MhdDocumentMergeFieldSource = 'person' | 'company' | 'user' | 'task' | 'system' | 'custom';

export interface MhdDocumentMergeField {
  /** e.g. "person.first_name" — matches the `{{field.path}}` template syntax. */
  path: string;
  label: string;
  source: MhdDocumentMergeFieldSource;
}

export interface MhdDocumentMergeFieldCatalogEntry {
  source: MhdDocumentMergeFieldSource;
  path: string;
  label: string;
  sampleValue: string | null;
  sortOrder: number;
}

export interface MhdDocumentTemplate {
  id: MhdDocumentTemplateId;
  referenceId: MhdDocumentTemplateReferenceId;
  /** Null = platform-level/shared template (Platform-Admin-authored only). */
  companyId: string | null;
  name: string;
  templateType: MhdDocumentTemplateType;
  /** The entity_type a module-embedded MhdDocumentGenerationPanel filters
   *  by (e.g. TASK, CONDUCT_ACTION, OFFBOARDING_CASE, PERFORMANCE_REVIEW,
   *  CASE_DOCUMENT). Null = not yet tagged to a module — hidden from every
   *  module-filtered list, still visible in the admin template library. */
  applicableEntityType: string | null;
  description: string | null;
  contentFormat: MhdDocumentContentFormat;
  mergeFields: MhdDocumentMergeField[];
  version: number;
  isActive: boolean;
  requiresSignature: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MhdDocumentTemplateDetail extends MhdDocumentTemplate {
  /** Template body with `{{field.path}}` merge placeholders. */
  content: string;
}

export interface MhdDocumentGeneration {
  id: MhdDocumentGenerationId;
  referenceId: MhdDocumentGenerationReferenceId;
  templateId: MhdDocumentTemplateId;
  templateName: string;
  companyId: string;
  status: MhdDocumentGenerationStatus;
  outputFormat: MhdDocumentOutputFormat;
  subjectPersonId: string | null;
  outputFileName: string | null;
  outputDriveFileId: string | null;
  generatedAt: string | null;
  esignatureRequestId: string | null;
  createdAt: string;
}

export interface MhdCreateDocumentTemplateInput {
  companyId: string | null;
  name: string;
  templateType: MhdDocumentTemplateType;
  contentFormat: MhdDocumentContentFormat;
  content: string;
  mergeFields: MhdDocumentMergeField[];
  description?: string | null;
  requiresSignature?: boolean;
  applicableEntityType?: string | null;
}

export interface MhdUpdateDocumentTemplateInput extends MhdCreateDocumentTemplateInput {
  templateId: MhdDocumentTemplateId;
  isActive: boolean;
}

export interface MhdRequestDocumentGenerationInput {
  templateId: MhdDocumentTemplateId;
  companyId: string;
  entityType: string;
  entityId: string;
  mergeData: Record<string, unknown>;
  outputFormat?: MhdDocumentOutputFormat;
}

export interface MhdDocumentMutationContext {
  actorUserId: string;
}
