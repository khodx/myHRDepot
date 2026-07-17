import type { Json, Database } from '@/types/database.types';

type DbFunctions = Database['public']['Functions'];

export type MhdFormStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type MhdSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type MhdFieldType =
  | 'text'
  | 'text_field'
  | 'longtext'
  | 'long_text'
  | 'email'
  | 'email_field'
  | 'phone'
  | 'phone_field'
  | 'number'
  | 'number_field'
  | 'date'
  | 'date_field'
  | 'time'
  | 'time_field'
  | 'select'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'file_upload'
  | 'rating'
  | 'currency'
  | 'percentage'
  | 'toggle'
  | (string & {});

export const MHD_FORM_PALETTE_FIELD_TYPES: Array<{ type: MhdFieldType; label: string }> = [
  { type: 'text', label: 'Text' },
  { type: 'longtext', label: 'Long Text' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone' },
  { type: 'number', label: 'Number' },
  { type: 'date', label: 'Date' },
  { type: 'time', label: 'Time' },
  { type: 'select', label: 'Dropdown' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'radio', label: 'Radio Buttons' },
  { type: 'file', label: 'File Upload' },
  { type: 'rating', label: 'Rating' },
  { type: 'currency', label: 'Currency' },
  { type: 'percentage', label: 'Percentage' },
  { type: 'toggle', label: 'Toggle' },
];

export interface MhdFormFieldOption {
  value: string;
  label: string;
}

export interface MhdFormFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customFunction?: string;
}

export interface MhdRepeatableFieldConfig {
  kind: 'section' | 'table';
  fields?: MhdFormField[];
  columns?: Array<{ id: string; label: string; type: MhdFieldType }>;
  minRows?: number;
  maxRows?: number;
}

export interface MhdFormField {
  id: string;
  type: MhdFieldType;
  label: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  required: boolean;
  hidden: boolean;
  defaultValue?: Json | string | number | boolean | null;
  validation?: MhdFormFieldValidation;
  options?: MhdFormFieldOption[];
  repeatable?: MhdRepeatableFieldConfig;
}

export interface MhdLogicCondition {
  field: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterOrEqual'
    | 'lessOrEqual'
    | 'isEmpty'
    | 'isNotEmpty';
  value?: Json | string | number | boolean | null;
}

export interface MhdLogicConditionGroup {
  combinator: 'AND' | 'OR';
  conditions: MhdLogicConditionNode[];
}

export type MhdLogicConditionNode = MhdLogicCondition | MhdLogicConditionGroup;

export function mhdIsConditionGroup(node: MhdLogicConditionNode): node is MhdLogicConditionGroup {
  return (node as MhdLogicConditionGroup).combinator !== undefined;
}

export interface MhdFormLogicRule {
  id: string;
  order: number;
  condition: MhdLogicConditionNode;
  action: 'SHOW' | 'HIDE' | 'REQUIRE' | 'UNREQUIRE';
  targetFieldId: string;
}

export type MhdCalculationOp = 'sum' | 'average' | 'count' | 'concatenate' | 'formula';

export interface MhdFormCalculation {
  id: string;
  targetFieldId: string;
  op: MhdCalculationOp;
  formula?: string;
  dependencies: string[];
}

export interface MhdFormPage {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  order: number;
  skipLogic?: {
    condition: MhdLogicConditionNode;
    targetPageId: string;
  };
}

export interface MhdFormDefinitionSettings {
  allowDraft: boolean;
  multiPage: boolean;
  progressBar: boolean;
}

export interface MhdFormDefinition {
  id: string;
  name: string;
  description?: string;
  pages: MhdFormPage[];
  fields: MhdFormField[];
  logic: MhdFormLogicRule[];
  calculations: MhdFormCalculation[];
  settings: MhdFormDefinitionSettings;
}

export interface MhdForm {
  id: string;
  referenceId: string;
  companyId: string;
  name: string;
  description?: string;
  status: MhdFormStatus;
  definition: MhdFormDefinition;
  version: number;
  previousVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  publishedBy: string | null;
}

export interface MhdFormSubmission {
  id: string;
  referenceId: string;
  formId: string;
  submitterId: string;
  taskId: string | null;
  status: MhdSubmissionStatus;
  values: Record<string, Json | string | number | boolean | null>;
  createdAt: string;
  updatedAt: string | null;
  submittedAt: string | null;
  isDraft: boolean;
}

/**
 * Submission value stored for a file-type field after a successful Google
 * Drive upload. This is a *reference* (Drive file id + display metadata),
 * never raw file bytes. The corresponding public.form_submission_attachments
 * row stores the same Drive file id under the `drive_file_id` column and the
 * original file name under `file_name`.
 */
export interface MhdFormFileValue {
  driveFileId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  driveWebViewLink: string | null;
}

export function mhdIsFormFileValue(value: unknown): value is MhdFormFileValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.driveFileId === 'string' && candidate.driveFileId.length > 0 && typeof candidate.fileName === 'string';
}

/**
 * Submission value stored for a field flagged `form_fields.field_encryption_required`.
 * The database stores `{ mhd_encrypted: true, cipher: <armored pgp> }` at rest, but
 * every read RPC masks the wrapper to `{ mhd_encrypted: true, masked: true }` before
 * it leaves the database — the ciphertext never reaches the client. Plaintext is only
 * obtainable through the role-gated, audited `mhd_reveal_submission_field` RPC
 * (see mhdFormService.revealSubmissionField).
 */
export interface MhdFormEncryptedValue {
  mhd_encrypted: true;
  masked?: boolean;
  cipher?: string;
}

export function mhdIsEncryptedFormValue(value: unknown): value is MhdFormEncryptedValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return (value as Record<string, unknown>).mhd_encrypted === true;
}

export interface MhdCreateFormInput {
  name: string;
  description?: string;
  definition: MhdFormDefinition;
}

export interface MhdUpdateFormInput {
  name?: string;
  description?: string;
  definition?: MhdFormDefinition;
}

export interface MhdFormsIndexFilters {
  status: MhdFormStatus | 'ALL';
}

export type MhdRpcFormRow = DbFunctions['mhd_get_form']['Returns'][number];
export type MhdRpcFormsListRow = DbFunctions['mhd_list_forms']['Returns'][number];
export type MhdRpcSubmissionRow = DbFunctions['mhd_get_submission']['Returns'][number];
export type MhdRpcDraftSubmissionRow = DbFunctions['mhd_list_my_draft_submissions']['Returns'][number];
export type MhdRpcSubmissionListRow = DbFunctions['mhd_list_submissions_for_form']['Returns'][number];

export function mhdNormalizeFieldType(type: string | null | undefined): MhdFieldType {
  switch (type) {
    case 'text_field':
      return 'text';
    case 'long_text':
      return 'longtext';
    case 'email_field':
      return 'email';
    case 'phone_field':
      return 'phone';
    case 'number_field':
      return 'number';
    case 'date_field':
      return 'date';
    case 'time_field':
      return 'time';
    case 'dropdown':
      return 'select';
    case 'file_upload':
      return 'file';
    default:
      return (type ?? 'text') as MhdFieldType;
  }
}
