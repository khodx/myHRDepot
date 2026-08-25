import type { Json, Database } from '@/types/database.types';
import type { MhdEmployeeFileTypeKey } from '@/features/employee-files/Types';

type DbFunctions = Database['public']['Functions'];

export type MhdFormStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type MhdSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

/**
 * Cross-module intake tag (0219, closes the Multi-Tenant Library
 * Architecture build's documented modal-route gap): identifies a form as
 * *the* structured-intake form for a case-creation flow. Matches the values
 * `MhdFormRendererPage` already reads from `?intakeAction=...` (added in
 * 0188). Mirrors `MhdEmployeeFileTypeKey`'s "tag a form for a destination"
 * shape.
 */
export type MhdFormIntakeKind = 'leaveCase' | 'accommodationCase';

export const MHD_FORM_INTAKE_KINDS: Array<{ key: MhdFormIntakeKind; label: string }> = [
  { key: 'leaveCase', label: 'Leave Case Intake' },
  { key: 'accommodationCase', label: 'Accommodation Case Intake' },
];

export function mhdIsFormIntakeKind(value: unknown): value is MhdFormIntakeKind {
  return value === 'leaveCase' || value === 'accommodationCase';
}

export function mhdFormIntakeKindLabel(kind: MhdFormIntakeKind): string {
  return MHD_FORM_INTAKE_KINDS.find((entry) => entry.key === kind)?.label ?? kind;
}

export type MhdFieldType =
  | 'text'
  | 'text_field'
  | 'longtext'
  | 'long_text'
  | 'name'
  | 'email'
  | 'email_field'
  | 'phone'
  | 'phone_field'
  | 'address'
  | 'website'
  | 'number'
  | 'number_field'
  | 'date'
  | 'date_field'
  | 'time'
  | 'time_field'
  | 'choice'
  | 'select'
  | 'dropdown'
  | 'checkbox'
  | 'yes_no'
  | 'radio'
  | 'file'
  | 'file_upload'
  | 'rating'
  | 'rating_scale'
  | 'currency'
  | 'price'
  | 'percentage'
  | 'toggle'
  | 'signature'
  | 'initials'
  | 'masked_text'
  | 'state_select'
  | 'lookup'
  | 'person'
  | 'calculation'
  | 'display_block'
  | 'content'
  | 'page_break'
  | 'section'
  | 'repeating_section'
  | 'repeating_table'
  | 'table'
  | 'grid'
  | 'notice_packet_acknowledgment'
  | (string & {});

export interface MhdFormPaletteGroup {
  group: string;
  fields: Array<{ type: MhdFieldType; label: string }>;
}

export const MHD_FORM_PALETTE_FIELD_GROUPS: MhdFormPaletteGroup[] = [
  {
    group: 'Basic Fields',
    fields: [
      { type: 'text', label: 'Textbox' },
      { type: 'longtext', label: 'Long Text' },
      { type: 'name', label: 'Name' },
      { type: 'email', label: 'Email' },
      { type: 'phone', label: 'Phone' },
      { type: 'address', label: 'Address' },
      { type: 'website', label: 'Website' },
      { type: 'number', label: 'Number' },
      { type: 'date', label: 'Date' },
      { type: 'time', label: 'Time' },
    ],
  },
  {
    group: 'Choice Fields',
    fields: [
      { type: 'choice', label: 'Choice' },
      { type: 'select', label: 'Dropdown' },
      { type: 'radio', label: 'Radio Buttons' },
      { type: 'checkbox', label: 'Checkbox' },
      { type: 'yes_no', label: 'Yes/No' },
      { type: 'toggle', label: 'Toggle' },
      { type: 'rating_scale', label: 'Rating Scale' },
    ],
  },
  {
    group: 'Advanced Fields',
    fields: [
      { type: 'currency', label: 'Currency' },
      { type: 'price', label: 'Price' },
      { type: 'percentage', label: 'Percentage' },
      { type: 'file', label: 'File Upload' },
      { type: 'signature', label: 'Signature' },
      { type: 'initials', label: 'Initials' },
      { type: 'masked_text', label: 'Masked Text' },
      { type: 'state_select', label: 'State' },
      { type: 'lookup', label: 'Lookup' },
      { type: 'person', label: 'Person' },
      { type: 'calculation', label: 'Calculation' },
    ],
  },
  {
    group: 'Layout & Repeating',
    fields: [
      { type: 'content', label: 'Content' },
      { type: 'display_block', label: 'Display Text' },
      { type: 'page_break', label: 'Page Break' },
      { type: 'section', label: 'Section' },
      { type: 'repeating_section', label: 'Repeating Section' },
      { type: 'repeating_table', label: 'Repeating Table' },
      { type: 'table', label: 'Table' },
      { type: 'grid', label: 'Grid' },
      { type: 'notice_packet_acknowledgment', label: 'Notice Packet Acknowledgment' },
    ],
  },
];

export const MHD_FORM_PALETTE_FIELD_TYPES = MHD_FORM_PALETTE_FIELD_GROUPS.flatMap(
  (group) => group.fields,
);

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

/**
 * Authored conditional-visibility rule, as written by the onboarding packet seed
 * into `form_fields.field_visibility_rule` (migration 0067).
 *
 * This is a *different shape* from `MhdFormLogicRule`, which is what the logic
 * engine consumes. The seed expresses a rule declaratively on the field it
 * governs; the engine expects a flat list of rules targeting a field id.
 * `mhdVisibilityRuleToLogic` in Service.ts bridges the two at load time, so the
 * rule is authored once and never duplicated into `form_logic_rules`.
 */
export interface MhdVisibilityCondition {
  field: string;
  op: 'eq' | 'neq' | 'in' | 'contains' | 'isEmpty' | 'isNotEmpty';
  value?: Json | string | number | boolean | null;
}

export interface MhdVisibilityGroup {
  all?: MhdVisibilityNode[];
  any?: MhdVisibilityNode[];
}

export type MhdVisibilityNode = MhdVisibilityCondition | MhdVisibilityGroup;

export function mhdIsVisibilityGroup(node: MhdVisibilityNode): node is MhdVisibilityGroup {
  const group = node as MhdVisibilityGroup;
  return Array.isArray(group.all) || Array.isArray(group.any);
}

/** Fixed row x column matrix, e.g. the Employment Application availability grid. */
export interface MhdGridColumn {
  key: string;
  label: string;
  type: MhdFieldType;
  options?: MhdFormFieldOption[];
}

export interface MhdGridDefinition {
  rowKey: string;
  rows: MhdFormFieldOption[];
  columns: MhdGridColumn[];
}

export type MhdFormFieldWidth = 'full' | 'half' | 'third' | 'quarter';

/**
 * Backed by `form_fields.masking_mode` (added 0067, wired to the definition
 * round trip in 0237). `'SSN'` drives both the display mask and a
 * format-as-you-type dash insertion (3-2-4) on `masked_text` fields; the
 * others exist at the database/constraint level for future field types.
 */
export type MhdFormFieldMaskingMode =
  | 'SSN'
  | 'BANK_ACCOUNT'
  | 'ROUTING_NUMBER'
  | 'GOVERNMENT_ID'
  | 'LAST_FOUR_ONLY';

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
  /** Key that authored visibility rules use to reference this field. Backed by `form_fields.field_external_key`. */
  fieldKey?: string;
  visibilityRule?: MhdVisibilityNode;
  grid?: MhdGridDefinition;
  /** Clause this field captures assent to (initials / acknowledgment checkbox). */
  clauseKey?: string;
  /**
   * Backed by `form_fields.field_width`/`field_group`. Consecutive same-page
   * fields sharing a non-empty `group` render side by side instead of the
   * default vertical stack -- added for government-form replicas (I-9, W-4)
   * whose printed layout requires e.g. first/middle/last name or
   * city/state/zip on one line. `width` sizes each field within its group;
   * ignored for fields with no group (or whose group has no sibling).
   */
  width?: MhdFormFieldWidth;
  group?: string;
  /** Backed by `form_fields.masking_mode`. */
  maskingMode?: MhdFormFieldMaskingMode;
  /** Backed by `form_fields.field_mask_pattern`; a custom mask pattern, distinct from `validation.pattern`'s submit-time regex. */
  maskPattern?: string;
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

export interface MhdFormWorkflowStatus {
  id: string;
  name: string;
  color: string;
  isInitial?: boolean;
  isTerminal?: boolean;
  autoAssignWhen?: string;
}

export type MhdFormWorkflowRoleType = 'PUBLIC' | 'INTERNAL' | 'OTHER';

export interface MhdFormWorkflowRole {
  id: string;
  name: string;
  type: MhdFormWorkflowRoleType;
  description?: string;
}

export interface MhdFormWorkflowAction {
  id: string;
  name: string;
  fromStatusId?: string;
  toStatusId?: string;
  allowedRoleIds: string[];
  triggerEvent:
    | 'SUBMIT'
    | 'SAVE'
    | 'UPDATE'
    | 'STATUS_CHANGE'
    | 'PAYMENT_COMPLETE'
    | 'TASK_COMPLETE'
    | 'MANUAL';
  condition?: string;
  sendEmail?: boolean;
  createTask?: boolean;
  /** Sends the submitter a confirmation, independent of `sendEmail`'s role-based recipients. */
  notifySubmitter?: boolean;
  /**
   * Records the submission as a person-centric Activity (activity_type
   * 'FORM_SUBMISSION') about the submission's resolved subject employee,
   * rather than assigning a Task. Skipped server-side when no subject
   * person is resolvable for the submission.
   */
  createActivity?: boolean;
  webhookUrl?: string;
}

export interface MhdFormWorkflowTaskView {
  id: string;
  name: string;
  roleId?: string;
  statusId?: string;
  dueInDays?: number;
  reminderEnabled?: boolean;
  reminderOffsetDays?: number;
}

export interface MhdFormWorkflowDefinition {
  enabled: boolean;
  saveAndResume: boolean;
  workflowLinkSharing: boolean;
  formReadOnlyWhenComplete: boolean;
  statuses: MhdFormWorkflowStatus[];
  roles: MhdFormWorkflowRole[];
  actions: MhdFormWorkflowAction[];
  taskViews: MhdFormWorkflowTaskView[];
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
  workflow?: MhdFormWorkflowDefinition;
}

export interface MhdForm {
  id: string;
  referenceId: string;
  companyId: string;
  name: string;
  description?: string;
  status: MhdFormStatus;
  employeeFileCategory: MhdEmployeeFileTypeKey | null;
  requiresEsignature: boolean;
  esignatureDocumentTemplateId: string | null;
  intakeKind: MhdFormIntakeKind | null;
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
  employeeFileCategory: MhdEmployeeFileTypeKey | null;
  employeeFilePersonId: string | null;
  employeeFileUserId: string | null;
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
  return (
    typeof candidate.driveFileId === 'string' &&
    candidate.driveFileId.length > 0 &&
    typeof candidate.fileName === 'string'
  );
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
  employeeFileCategory?: MhdEmployeeFileTypeKey | null;
  requiresEsignature?: boolean;
  esignatureDocumentTemplateId?: string | null;
  intakeKind?: MhdFormIntakeKind | null;
  definition: MhdFormDefinition;
}

export interface MhdUpdateFormInput {
  name?: string;
  description?: string;
  employeeFileCategory?: MhdEmployeeFileTypeKey | null;
  requiresEsignature?: boolean;
  esignatureDocumentTemplateId?: string | null;
  intakeKind?: MhdFormIntakeKind | null;
  definition?: MhdFormDefinition;
}

export interface MhdCreateSubmissionOptions {
  taskId?: string;
  employeeFilePersonId?: string;
  employeeFileUserId?: string;
  employeeFileCategory?: MhdEmployeeFileTypeKey | null;
}

export interface MhdEmployeeFileSubmissionRecord {
  id: string;
  referenceId: string;
  formId: string;
  formName: string;
  employeeFileCategory: MhdEmployeeFileTypeKey;
  employeeFilePersonId: string;
  employeeFileUserId: string | null;
  submitterId: string;
  submitterDisplayName: string;
  status: MhdSubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  attachmentCount: number;
  esignatureRequestId: string | null;
  certificateStatus: string | null;
  certificateDigitallySigned: boolean;
  certificateVerificationCode: string | null;
}

export interface MhdFormsIndexFilters {
  status: MhdFormStatus | 'ALL';
}

/**
 * One row of the merged Forms Library view (migration 0183, Multi-Tenant
 * Library Architecture): platform-wide "library" forms (`companyId === null`,
 * `isLibrary === true`) plus the caller's own company's forms, sorted library
 * rows first by `mhd_list_form_library`. This is a lighter-weight projection
 * than `MhdForm` — no `definition`, since the Library browse surface never
 * renders the form builder/preview, only enough to list and launch/fork it.
 */
export interface MhdFormLibraryEntry {
  id: string;
  referenceId: string;
  companyId: string | null;
  name: string;
  description?: string;
  status: MhdFormStatus;
  employeeFileCategory: MhdEmployeeFileTypeKey | null;
  requiresEsignature: boolean;
  /** Set when this row is a company's own fork of a library form. */
  sourceFormId: string | null;
  /** True for a platform-wide library form (`companyId === null`); false for a company-owned form. */
  isLibrary: boolean;
  /** Cross-module intake tag (0219) — set when this form is the/a designated intake form for a case-creation flow. */
  intakeKind: MhdFormIntakeKind | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type MhdRpcFormRow = DbFunctions['mhd_get_form']['Returns'][number];
export type MhdRpcFormsListRow = DbFunctions['mhd_list_forms']['Returns'][number];
export type MhdRpcFormLibraryRow = DbFunctions['mhd_list_form_library']['Returns'][number];
export type MhdRpcSubmissionRow = DbFunctions['mhd_get_submission']['Returns'][number];
export type MhdRpcDraftSubmissionRow =
  DbFunctions['mhd_list_my_draft_submissions']['Returns'][number];
export type MhdRpcSubmissionListRow =
  DbFunctions['mhd_list_submissions_for_form']['Returns'][number];
export type MhdRpcEmployeeFileSubmissionRow =
  DbFunctions['mhd_list_employee_file_submissions']['Returns'][number];

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
    case 'rating':
      return 'rating_scale';
    case 'price':
      return 'currency';
    case 'display_block':
      return 'content';
    case 'table':
      return 'repeating_table';
    default:
      return (type ?? 'text') as MhdFieldType;
  }
}
