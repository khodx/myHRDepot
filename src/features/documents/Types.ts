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

export type MhdDocumentContentFormat = 'HTML' | 'DOCX' | 'MARKDOWN';

export const MHD_DOCUMENT_CONTENT_FORMATS: MhdDocumentContentFormat[] = [
  'HTML',
  'DOCX',
  'MARKDOWN',
];

export type MhdDocumentGenerationStatus = 'PENDING' | 'GENERATED' | 'FAILED' | 'SIGNED' | 'VOIDED';

/** One of the "Merge Field Sources" the Bible spec documents — the source a
 *  declared merge field's value is resolved from at generation time. */
export type MhdDocumentMergeFieldSource = 'person' | 'company' | 'user' | 'task' | 'system' | 'custom';

export interface MhdDocumentMergeField {
  /** e.g. "person.first_name" — matches the `{{field.path}}` template syntax. */
  path: string;
  label: string;
  source: MhdDocumentMergeFieldSource;
}

export interface MhdDocumentTemplate {
  id: MhdDocumentTemplateId;
  referenceId: MhdDocumentTemplateReferenceId;
  /** Null = platform-level/shared template (Platform-Admin-authored only). */
  companyId: string | null;
  name: string;
  templateType: MhdDocumentTemplateType;
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
}

export interface MhdDocumentMutationContext {
  actorUserId: string;
}
