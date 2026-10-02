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
  'OFFER_LETTER' | 'CONTRACT' | 'FORM' | 'CERTIFICATE' | 'CORRESPONDENCE' | 'REPORT';

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
export type MhdDocumentMergeFieldSource =
  | 'person'
  | 'company'
  | 'user'
  | 'task'
  | 'system'
  | 'custom'
  | 'record'
  | 'handbook'
  | 'narrative';

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
  /** The template's stable key (null for a template created without one). What a record that
   *  refers to a template by name — a notice, an output setting — stores, never the id. */
  templateKey: string | null;
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

export interface MhdTemplateComplianceTag {
  moduleKey: string | null;
  contentKey: string | null;
}

export interface MhdComplianceContentOption {
  moduleKey: string;
  contentKey: string;
  version: number;
  authorityName: string;
  reviewStatus: string;
  productionEnabled: boolean;
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

export const MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES = [
  'general',
  'payroll',
  'i9',
  'benefits',
  'confidential',
  'supervisors',
  'hr',
  'private',
] as const;
export type MhdDocumentEmployeeFileCategory =
  (typeof MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES)[number];

export const MHD_DOCUMENT_SOURCE_WIZARDS = [
  'JOB_DESCRIPTION',
  'LEAVE_INTAKE',
  'COMPENSATION_CLASSIFICATION',
  'CONTRACTOR_CLASSIFICATION',
  'TRAINING',
  'HANDBOOK',
  'ACCOMMODATION_INTAKE',
  'CONDUCT',
  'INVESTIGATION',
  'OFFBOARDING',
  'ONBOARDING',
  'REQUISITION',
  'OFFER',
  'SAFETY_INCIDENT',
  'PERFORMANCE_CYCLE',
  'GRIEVANCE',
] as const;
export type MhdDocumentSourceWizard = (typeof MHD_DOCUMENT_SOURCE_WIZARDS)[number];

/** Display names, matching the cards on the Wizards hub. */
export const MHD_DOCUMENT_SOURCE_WIZARD_LABELS: Record<MhdDocumentSourceWizard, string> = {
  JOB_DESCRIPTION: 'Job Description Wizard',
  LEAVE_INTAKE: 'Leave Intake Wizard',
  COMPENSATION_CLASSIFICATION: 'Compensation Classification Wizard',
  CONTRACTOR_CLASSIFICATION: 'Contractor Classification Wizard',
  TRAINING: 'Course/Curriculum/Program Wizard',
  HANDBOOK: 'Handbook Wizard',
  ACCOMMODATION_INTAKE: 'Accommodation Intake Wizard',
  CONDUCT: 'Conduct Intake Wizard',
  INVESTIGATION: 'Investigation Intake Wizard',
  OFFBOARDING: 'Offboarding Wizard',
  ONBOARDING: 'Onboarding Wizard',
  REQUISITION: 'Requisition Wizard',
  OFFER: 'Offer Wizard',
  SAFETY_INCIDENT: 'Safety Incident Wizard',
  PERFORMANCE_CYCLE: 'Performance Cycle Wizard',
  GRIEVANCE: 'Grievance Intake Wizard',
};

export const MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS: Record<
  MhdDocumentEmployeeFileCategory,
  string
> = {
  general: 'General File',
  payroll: 'Payroll File',
  i9: 'I9 File',
  benefits: 'Benefits File',
  confidential: 'Confidential File',
  supervisors: "Supervisor's File",
  hr: 'HR File',
  private: 'Private File',
};

/** 'CONDUCT_ACTION' -> 'Conduct Action'. */
export function mhdFormatDocumentEntityType(entityType: string): string {
  return entityType
    .toLowerCase()
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const MHD_DOCUMENT_QUEUE_STATUSES = [
  'QUEUED',
  'GENERATING',
  'GENERATED',
  'FAILED',
  'DISMISSED',
] as const;
export type MhdDocumentQueueStatus = (typeof MHD_DOCUMENT_QUEUE_STATUSES)[number];

export const MHD_DOCUMENT_QUEUE_STATUS_LABELS: Record<MhdDocumentQueueStatus, string> = {
  QUEUED: 'Queued',
  GENERATING: 'Generating',
  GENERATED: 'Generated',
  FAILED: 'Failed',
  DISMISSED: 'Dismissed',
};

export const MHD_DOCUMENT_BRANDING_FONTS = [
  'Arial',
  'Calibri',
  'Georgia',
  'Helvetica',
  'Times New Roman',
] as const;
export type MhdDocumentBrandingFont = (typeof MHD_DOCUMENT_BRANDING_FONTS)[number];

export type MhdDocumentMergeOverrides = Record<string, string | number | boolean | null>;
export type MhdDocumentNarrativeSections = Record<string, string>;

export interface MhdDocumentQueueItem {
  id: string;
  referenceId: string;
  companyId: string;
  templateKey: string;
  templateName: string | null;
  entityType: string;
  entityId: string;
  subjectPersonId: string | null;
  subjectPersonName: string | null;
  sourceWizard: MhdDocumentSourceWizard;
  status: MhdDocumentQueueStatus;
  outputFormat: MhdDocumentOutputFormat;
  requiresSignature: boolean;
  employeeFileCategory: MhdDocumentEmployeeFileCategory | null;
  generationId: string | null;
  generationStatus: string | null;
  outputFileName: string | null;
  outputDriveFileId: string | null;
  failureReason: string | null;
  queuedBy: string | null;
  queuedByName: string | null;
  queuedAt: string;
  generatedAt: string | null;
}
export interface MhdDocumentQueueDetail {
  id: string;
  referenceId: string;
  companyId: string;
  templateKey: string;
  entityType: string;
  entityId: string;
  subjectPersonId: string | null;
  sourceWizard: MhdDocumentSourceWizard;
  status: MhdDocumentQueueStatus;
  outputFormat: MhdDocumentOutputFormat;
  requiresSignature: boolean;
  employeeFileCategory: MhdDocumentEmployeeFileCategory | null;
  wizardInputs: Record<string, unknown>;
  mergeOverrides: MhdDocumentMergeOverrides;
  narrativeSections: MhdDocumentNarrativeSections;
  generationId: string | null;
  failureReason: string | null;
  queuedBy: string | null;
  queuedAt: string;
}
export interface MhdDocumentQueueFilters {
  status?: MhdDocumentQueueStatus | 'ALL';
  subjectPersonId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}
export interface MhdEnqueueDocumentInput {
  companyId: string;
  templateKey: string;
  entityType: string;
  entityId: string;
  sourceWizard: MhdDocumentSourceWizard;
  wizardInputs?: Record<string, unknown>;
  mergeOverrides?: MhdDocumentMergeOverrides;
  narrativeSections?: MhdDocumentNarrativeSections;
  outputFormat?: MhdDocumentOutputFormat;
  requiresSignature?: boolean;
  /** Omit to use the template's default category; 'NONE' to deliberately not file the document. */
  employeeFileCategory?: MhdDocumentEmployeeFileCategory | 'NONE';
}
export interface MhdEnqueuedDocument {
  id: string;
  referenceId: string;
}
export interface MhdDocumentNarrativeSlot {
  key: string;
  label: string;
  help?: string;
}
export interface MhdDocumentTemplateWizardSettings {
  id: string;
  templateKey: string | null;
  version: number;
  isSystem: boolean;
  companyId: string | null;
  requiresSignature: boolean;
  employeeFileCategory: MhdDocumentEmployeeFileCategory | null;
  narrativeSlots: MhdDocumentNarrativeSlot[];
  complianceModuleKey: string | null;
  complianceContentKey: string | null;
}
export interface MhdSetDocumentTemplateWizardSettingsInput {
  employeeFileCategory: MhdDocumentEmployeeFileCategory | null;
  narrativeSlots: MhdDocumentNarrativeSlot[];
}
export interface MhdDocumentTemplateVersion {
  version: number;
  name: string;
  contentFormat: string;
  content: string;
  mergeFields: MhdDocumentMergeField[];
  narrativeSlots: MhdDocumentNarrativeSlot[];
  requiresSignature: boolean;
  changedBy: string | null;
  changedByName: string | null;
  changedAt: string;
}
export interface MhdForkedDocumentTemplate {
  id: string;
  referenceId: string;
  alreadyExisted: boolean;
}
export interface MhdDocumentBranding {
  id: string;
  companyId: string | null;
  isPlatformDefault: boolean;
  headerText: string | null;
  footerText: string | null;
  accentColor: string;
  fontFamily: MhdDocumentBrandingFont;
  logoDataUri: string | null;
  showReferenceId: boolean;
}
export interface MhdSaveDocumentBrandingInput {
  companyId: string | null;
  headerText: string | null;
  footerText: string | null;
  accentColor: string;
  fontFamily: MhdDocumentBrandingFont;
  logoDataUri: string | null;
  showReferenceId: boolean;
}
export interface MhdEmployeeFileDocument {
  id: string;
  referenceId: string;
  templateKey: string | null;
  templateName: string;
  employeeFileCategory: MhdDocumentEmployeeFileCategory;
  entityType: string;
  entityId: string;
  status: string;
  outputFormat: MhdDocumentOutputFormat;
  outputFileName: string | null;
  outputDriveFileId: string | null;
  esignatureRequestId: string | null;
  generatedAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}
/** What the wizard's preview step renders: the template, the company (for its letterhead) and the merged data. */
export interface MhdDocumentPreviewRenderInput {
  templateId: string;
  companyId: string;
  mergeData: Record<string, unknown>;
}
export interface MhdDocumentPreviewInput {
  templateId: string;
  companyId: string;
  entityType: string;
  entityId: string;
  custom?: Record<string, unknown>;
  overrides?: MhdDocumentMergeOverrides;
  narrative?: MhdDocumentNarrativeSections;
}
export interface MhdQueuedDocumentGeneration {
  queueId: string;
  generationId: string;
  generationReferenceId: string;
  templateId: string;
  documentHash: string | null;
  outputDriveFileId: string | null;
}
