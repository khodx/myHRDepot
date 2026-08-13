import { appConfig } from '@/config/appConfig';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json, Database } from '@/types/database.types';
import type { MhdDriveUploadResponse } from '@/features/attachments/Types';
import { mhdValidateAttachment } from '@/features/attachments/Types';
import { mhdIsEmployeeFileTypeKey } from '@/features/employee-files/Types';
import type {
  MhdCalculationOp,
  MhdCreateFormInput,
  MhdCreateSubmissionOptions,
  MhdEmployeeFileSubmissionRecord,
  MhdForm,
  MhdFormCalculation,
  MhdFormDefinition,
  MhdFormField,
  MhdFormFieldOption,
  MhdFormFileValue,
  MhdFormLogicRule,
  MhdFormPage,
  MhdFormStatus,
  MhdFormSubmission,
  MhdLogicCondition,
  MhdLogicConditionGroup,
  MhdLogicConditionNode,
  MhdRpcDraftSubmissionRow,
  MhdRpcEmployeeFileSubmissionRow,
  MhdRpcFormRow,
  MhdRpcFormsListRow,
  MhdRpcSubmissionListRow,
  MhdRpcSubmissionRow,
  MhdSubmissionStatus,
  MhdUpdateFormInput,
  MhdVisibilityNode,
  MhdGridDefinition,
} from './Types';
import { mhdIsConditionGroup, mhdIsVisibilityGroup, mhdNormalizeFieldType } from './Types';

type DbFunctions = Database['public']['Functions'];
type MhdCreateFormResultRow = DbFunctions['mhd_create_form']['Returns'][number];
type MhdCreateSubmissionResultRow = DbFunctions['mhd_create_submission']['Returns'][number];
type MhdCreateRevisionResultRow = DbFunctions['mhd_create_form_revision']['Returns'][number];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function asFieldOptions(value: unknown): MhdFormFieldOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!isObject(entry)) return null;
      const optionValue = asString(entry.value);
      const optionLabel = asString(entry.label, optionValue);
      return optionValue ? { value: optionValue, label: optionLabel } : null;
    })
    .filter((entry): entry is MhdFormFieldOption => entry !== null);
}

function mapConditionNode(value: unknown): MhdLogicConditionNode {
  if (isObject(value) && Array.isArray(value.conditions)) {
    const combinator = value.combinator === 'AND' ? 'AND' : 'OR';
    return {
      combinator,
      conditions: value.conditions.map((entry) => mapConditionNode(entry)),
    } satisfies MhdLogicConditionGroup;
  }

  const condition = isObject(value) ? value : {};
  return {
    field: asString(condition.field),
    operator: (condition.operator as MhdLogicCondition['operator']) ?? 'equals',
    value: (condition.value ?? null) as Json | string | number | boolean | null,
  } satisfies MhdLogicCondition;
}

function mapField(value: unknown): MhdFormField | null {
  if (!isObject(value)) return null;

  return {
    id: asString(value.id),
    type: mhdNormalizeFieldType(asString(value.type, 'text')),
    label: asString(value.label, 'Untitled field'),
    description: asString(value.description) || undefined,
    helpText: asString(value.helpText) || undefined,
    placeholder: asString(value.placeholder) || undefined,
    required: asBoolean(value.required),
    hidden: asBoolean(value.hidden),
    defaultValue: (value.defaultValue ?? null) as Json | string | number | boolean | null,
    validation: isObject(value.validation)
      ? {
          minLength: asNumber(value.validation.minLength),
          maxLength: asNumber(value.validation.maxLength),
          min: asNumber(value.validation.min),
          max: asNumber(value.validation.max),
          pattern: asString(value.validation.pattern) || undefined,
          customFunction: asString(value.validation.customFunction) || undefined,
        }
      : undefined,
    options: asFieldOptions(value.options),
    fieldKey:
      asString(value.fieldKey) ||
      asString(value.key) ||
      asString(value.name) ||
      asString(value.destinationColumn) ||
      asString(value.destination_column) ||
      undefined,
    visibilityRule: (isObject(value.visibilityRule)
      ? value.visibilityRule
      : isObject(value.field_visibility_rule)
        ? value.field_visibility_rule
        : isObject(value.visibleWhen)
          ? value.visibleWhen
          : undefined) as MhdVisibilityNode | undefined,
    grid: mapGrid(value.grid ?? value.gridDefinition ?? value.grid_definition),
    clauseKey: asString(value.clauseKey) || asString(value.clause_key) || undefined,
  };
}

function mapGrid(value: unknown): MhdGridDefinition | undefined {
  if (!isObject(value)) return undefined;
  const rows = asFieldOptions(value.rows);
  const rawColumns = Array.isArray(value.columns) ? value.columns : [];
  const columns = rawColumns
    .filter(isObject)
    .map((column) => ({
      key: asString(column.key),
      label: asString(column.label),
      type: mhdNormalizeFieldType(asString(column.type, 'text')),
      options: asFieldOptions(column.options),
    }))
    .filter((column) => column.key !== '');
  if (rows.length === 0 || columns.length === 0) return undefined;
  return {
    rowKey: asString(value.rowKey) || asString(value.row_key) || 'row',
    rows,
    columns,
  };
}

/**
 * Bridges an authored `visibilityRule` -- declared on the field it governs --
 * into the flat `MhdFormLogicRule[]` the logic engine evaluates.
 *
 * Without this the onboarding packet seed's conditional rules are inert: the
 * seed writes them to `form_fields.field_visibility_rule` (migration 0067) and
 * the engine reads `definition.logic`. Two different places, so every branch
 * rendered unconditionally -- the I-9 citizenship branch, the Self-Identification
 * decline gate, the staffing-agency block, the Marketplace eligibility branch
 * and the jurisdiction-conditional FCRA disclosures all showed at once.
 *
 * Emitted as SHOW, so a field carrying a rule stays hidden unless its condition
 * passes. References resolve by field id first and then by field key, because
 * authored rules name the destination column rather than the generated id.
 */
export function mhdVisibilityRuleToLogic(fields: MhdFormField[]): MhdFormLogicRule[] {
  const byKey = new Map<string, string>();
  for (const field of fields) {
    byKey.set(field.id, field.id);
    if (field.fieldKey) byKey.set(field.fieldKey, field.id);
  }

  const resolve = (reference: string): string => byKey.get(reference) ?? reference;

  const toCondition = (node: MhdVisibilityNode): MhdLogicConditionNode | null => {
    if (mhdIsVisibilityGroup(node)) {
      const children = (node.all ?? node.any ?? [])
        .map(toCondition)
        .filter((child): child is MhdLogicConditionNode => child !== null);
      if (children.length === 0) return null;
      return { combinator: node.all ? 'AND' : 'OR', conditions: children };
    }

    const field = resolve(node.field);

    switch (node.op) {
      case 'eq':
        return { field, operator: 'equals', value: (node.value ?? null) as Json };
      case 'neq':
        return { field, operator: 'notEquals', value: (node.value ?? null) as Json };
      case 'contains':
        return { field, operator: 'contains', value: (node.value ?? null) as Json };
      case 'isEmpty':
        return { field, operator: 'isEmpty' };
      case 'isNotEmpty':
        return { field, operator: 'isNotEmpty' };
      case 'in': {
        // The engine has no `in`. Expanded to an OR of equals so a multi-value
        // condition -- the FCRA Minnesota/Oklahoma state list, for instance --
        // is not silently dropped.
        const values = Array.isArray(node.value) ? node.value : [node.value ?? null];
        if (values.length === 0) return null;
        if (values.length === 1) {
          return { field, operator: 'equals', value: values[0] as Json };
        }
        return {
          combinator: 'OR',
          conditions: values.map((entry) => ({
            field,
            operator: 'equals' as const,
            value: entry as Json,
          })),
        };
      }
      default:
        return null;
    }
  };

  const rules: MhdFormLogicRule[] = [];
  let order = 0;
  for (const field of fields) {
    if (!field.visibilityRule) continue;
    const condition = toCondition(field.visibilityRule);
    if (!condition) continue;
    order += 1;
    rules.push({
      id: `visibility-${field.id}`,
      order,
      condition,
      action: 'SHOW',
      targetFieldId: field.id,
    });
  }
  return rules;
}

function mapPage(value: unknown, fallbackFieldIds: string[]): MhdFormPage | null {
  if (!isObject(value)) return null;

  return {
    id: asString(value.id),
    title: asString(value.title, 'Page 1'),
    description: asString(value.description) || undefined,
    fields: asStringArray(value.fields).length > 0 ? asStringArray(value.fields) : fallbackFieldIds,
    order: asNumber(value.order) ?? 1,
    skipLogic:
      isObject(value.skipLogic) && asString(value.skipLogic.targetPageId)
        ? {
            condition: mapConditionNode(value.skipLogic.condition),
            targetPageId: asString(value.skipLogic.targetPageId),
          }
        : undefined,
  };
}

function mapLogicRule(value: unknown): MhdFormLogicRule | null {
  if (!isObject(value)) return null;
  return {
    id: asString(value.id),
    order: asNumber(value.order) ?? 0,
    condition: mapConditionNode(value.condition),
    action: (value.action as MhdFormLogicRule['action']) ?? 'SHOW',
    targetFieldId: asString(value.targetFieldId),
  };
}

function mapCalculation(value: unknown): MhdFormCalculation | null {
  if (!isObject(value)) return null;
  return {
    id: asString(value.id),
    targetFieldId: asString(value.targetFieldId),
    op: (value.op as MhdCalculationOp) ?? 'formula',
    formula: asString(value.formula) || undefined,
    dependencies: asStringArray(value.dependencies),
  };
}

function mapDefinition(
  rawDefinition: Json | null,
  meta: { id: string; name: string; description?: string | null },
): MhdFormDefinition {
  const definition = isObject(rawDefinition) ? rawDefinition : {};
  const fields = (Array.isArray(definition.fields) ? definition.fields : [])
    .map((field) => mapField(field))
    .filter((field): field is MhdFormField => field !== null);
  const fallbackFieldIds = fields.map((field) => field.id);
  const pages = (Array.isArray(definition.pages) ? definition.pages : [])
    .map((page) => mapPage(page, fallbackFieldIds))
    .filter((page): page is MhdFormPage => page !== null);
  const authoredLogic = (Array.isArray(definition.logic) ? definition.logic : [])
    .map((rule) => mapLogicRule(rule))
    .filter((rule): rule is MhdFormLogicRule => rule !== null);
  // Field-level visibility rules are projected into the same rule list the logic
  // engine already evaluates, rather than duplicated into form_logic_rules.
  // Explicit rules win: a rule authored directly against a field id overrides the
  // derived one for that field.
  const explicitTargets = new Set(authoredLogic.map((rule) => rule.targetFieldId));
  const derivedLogic = mhdVisibilityRuleToLogic(fields).filter(
    (rule) => !explicitTargets.has(rule.targetFieldId),
  );
  const logic = [...authoredLogic, ...derivedLogic];
  const calculations = (Array.isArray(definition.calculations) ? definition.calculations : [])
    .map((calculation) => mapCalculation(calculation))
    .filter((calculation): calculation is MhdFormCalculation => calculation !== null);

  return {
    id: asString(definition.id, meta.id),
    name: asString(definition.name, meta.name),
    description: asString(definition.description, meta.description ?? '') || undefined,
    pages:
      pages.length > 0
        ? pages
        : [
            {
              id: 'page-1',
              title: meta.name,
              description: meta.description ?? undefined,
              fields: fallbackFieldIds,
              order: 1,
            },
          ],
    fields,
    logic,
    calculations,
    settings: {
      allowDraft: isObject(definition.settings)
        ? asBoolean(definition.settings.allowDraft, true)
        : true,
      multiPage: isObject(definition.settings) ? asBoolean(definition.settings.multiPage) : false,
      progressBar: isObject(definition.settings)
        ? asBoolean(definition.settings.progressBar, true)
        : true,
    },
  };
}

function mapFormRow(row: MhdRpcFormRow | MhdRpcFormsListRow): MhdForm {
  const employeeFileCategory = mhdIsEmployeeFileTypeKey(row.employee_file_category)
    ? row.employee_file_category
    : null;

  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status as MhdFormStatus,
    employeeFileCategory,
    requiresEsignature: row.requires_esignature,
    esignatureDocumentTemplateId: row.esignature_document_template_id ?? null,
    definition: mapDefinition(row.definition, {
      id: row.id,
      name: row.name,
      description: row.description,
    }),
    version: row.version,
    previousVersionId: row.previous_version_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
    publishedBy: row.published_by ?? null,
  };
}

function mapSubmissionRow(
  row: MhdRpcSubmissionRow | MhdRpcDraftSubmissionRow | MhdRpcSubmissionListRow,
): MhdFormSubmission {
  const values =
    isObject(row.values) && !Array.isArray(row.values)
      ? (row.values as Record<string, Json | string | number | boolean | null>)
      : {};

  return {
    id: row.id,
    referenceId: row.reference_id,
    formId: row.form_id,
    submitterId: row.submitter_id,
    taskId: row.task_id ?? null,
    status: row.status as MhdSubmissionStatus,
    employeeFileCategory: mhdIsEmployeeFileTypeKey(row.employee_file_category)
      ? row.employee_file_category
      : null,
    employeeFilePersonId: row.employee_file_person_id ?? null,
    employeeFileUserId: row.employee_file_user_id ?? null,
    values,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    submittedAt: row.submitted_at ?? null,
    isDraft: row.is_draft,
  };
}

function mapEmployeeFileSubmissionRow(
  row: MhdRpcEmployeeFileSubmissionRow,
): MhdEmployeeFileSubmissionRecord | null {
  if (!mhdIsEmployeeFileTypeKey(row.employee_file_category)) return null;

  return {
    id: row.id,
    referenceId: row.reference_id,
    formId: row.form_id,
    formName: row.form_name,
    employeeFileCategory: row.employee_file_category,
    employeeFilePersonId: row.employee_file_person_id,
    employeeFileUserId: row.employee_file_user_id ?? null,
    submitterId: row.submitter_id,
    submitterDisplayName: row.submitter_display_name,
    status: row.status as MhdSubmissionStatus,
    submittedAt: row.submitted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    attachmentCount: Number(row.attachment_count ?? 0),
    esignatureRequestId: row.esignature_request_id ?? null,
    certificateStatus: row.certificate_status ?? null,
    certificateDigitallySigned: row.certificate_digitally_signed ?? false,
    certificateVerificationCode: row.certificate_verification_code ?? null,
  };
}

function stringToUndefined(value?: string): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toJsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

export const mhdFormService = {
  async createForm(input: MhdCreateFormInput, companyId: string): Promise<MhdForm> {
    const description = stringToUndefined(input.description);
    // SME review addition (Stage 6b review): mhd_create_form has no prior row
    // to preserve, so this arg's SQL default is plain NULL, unlike
    // mhd_update_form's "unchanged" default (see updateForm below). Omitting
    // the key when not provided (matching p_employee_file_category's
    // conditional-spread pattern just below) lets Postgres's own default
    // resolve it, instead of inserting a bogus all-zero UUID that would
    // violate the document_templates FK.
    const { data, error } = await supabaseClient
      .rpc('mhd_create_form', {
        p_company_id: companyId,
        p_name: input.name.trim(),
        p_definition: toJsonValue(input.definition),
        p_employee_file_category: input.employeeFileCategory ?? null,
        p_requires_esignature: input.requiresEsignature ?? false,
        ...(Object.prototype.hasOwnProperty.call(input, 'esignatureDocumentTemplateId')
          ? { p_esignature_document_template_id: input.esignatureDocumentTemplateId ?? null }
          : {}),
        ...(description ? { p_description: description } : {}),
        // Postgres uses NULL to mean "no employee-file destination"; gen:types
        // currently omits null from defaulted RPC arguments even though the
        // function accepts it at runtime.
      } as never)
      .returns<MhdCreateFormResultRow[]>();

    if (error) {
      throw new Error(`Unable to create form: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create form: no record returned.');
    }

    return this.getFormById(row.id);
  },

  async updateForm(formId: string, input: MhdUpdateFormInput): Promise<MhdForm> {
    const name = stringToUndefined(input.name);
    const description = stringToUndefined(input.description);
    const definition = input.definition ? toJsonValue(input.definition) : undefined;
    const shouldUpdateEmployeeFileCategory = Object.prototype.hasOwnProperty.call(
      input,
      'employeeFileCategory',
    );
    const shouldUpdateRequiresEsignature = Object.prototype.hasOwnProperty.call(
      input,
      'requiresEsignature',
    );
    const shouldUpdateEsignatureDocumentTemplateId = Object.prototype.hasOwnProperty.call(
      input,
      'esignatureDocumentTemplateId',
    );

    const { error } = await supabaseClient.rpc('mhd_update_form', {
      p_form_id: formId,
      ...(name ? { p_name: name } : {}),
      ...(description ? { p_description: description } : {}),
      ...(definition ? { p_definition: definition } : {}),
      // 0142 replaced mhd_update_form's magic-value "unchanged" defaults
      // (a '__MHD_UNCHANGED__' string and an all-zero UUID — the latter is
      // exactly the sentinel-UUID pattern CLAUDE.md's engineering standard
      // prohibits) with explicit p_update_* boolean flags. Omitting a field's
      // keys entirely still means "don't touch it" (Postgres's own default:
      // false), so this conditional-spread shape is unchanged from before —
      // only the flag alongside each value is new.
      ...(shouldUpdateEmployeeFileCategory
        ? {
            p_employee_file_category: input.employeeFileCategory ?? null,
            p_update_employee_file_category: true,
          }
        : {}),
      ...(shouldUpdateRequiresEsignature
        ? { p_requires_esignature: input.requiresEsignature ?? null }
        : {}),
      ...(shouldUpdateEsignatureDocumentTemplateId
        ? {
            p_esignature_document_template_id: input.esignatureDocumentTemplateId ?? null,
            p_update_esignature_document_template_id: true,
          }
        : {}),
    } as never);

    if (error) {
      throw new Error(`Unable to update form: ${error.message}`);
    }

    return this.getFormById(formId);
  },

  async createFormRevision(formId: string): Promise<MhdForm> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_form_revision', { p_form_id: formId })
      .returns<MhdCreateRevisionResultRow[]>();

    if (error) {
      throw new Error(`Unable to create form revision: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create form revision: no record returned.');
    }

    return this.getFormById(row.id);
  },

  async publishForm(formId: string): Promise<MhdForm> {
    const { error } = await supabaseClient.rpc('mhd_publish_form', { p_form_id: formId });
    if (error) {
      throw new Error(`Unable to publish form: ${error.message}`);
    }
    return this.getFormById(formId);
  },

  async archiveForm(formId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_archive_form', { p_form_id: formId });
    if (error) {
      throw new Error(`Unable to archive form: ${error.message}`);
    }
  },

  async getFormById(formId: string): Promise<MhdForm> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_form', { p_form_id: formId })
      .returns<MhdRpcFormRow[]>();

    if (error) {
      throw new Error(`Unable to fetch form: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error(`Form not found: ${formId}`);
    }

    return mapFormRow(row);
  },

  async listFormsForCompany(companyId: string, status?: MhdFormStatus): Promise<MhdForm[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_forms', { p_company_id: companyId, ...(status ? { p_status: status } : {}) })
      .returns<MhdRpcFormsListRow[]>();

    if (error) {
      throw new Error(`Unable to list forms: ${error.message}`);
    }

    return (data ?? []).map(mapFormRow);
  },

  async createSubmission(
    formId: string,
    optionsOrTaskId?: MhdCreateSubmissionOptions | string,
  ): Promise<MhdFormSubmission> {
    const options =
      typeof optionsOrTaskId === 'string' ? { taskId: optionsOrTaskId } : (optionsOrTaskId ?? {});
    const { data, error } = await supabaseClient
      .rpc('mhd_create_submission', {
        p_form_id: formId,
        ...(options.taskId ? { p_task_id: options.taskId } : {}),
        ...(options.employeeFilePersonId
          ? { p_employee_file_person_id: options.employeeFilePersonId }
          : {}),
        ...(options.employeeFileUserId
          ? { p_employee_file_user_id: options.employeeFileUserId }
          : {}),
        ...(options.employeeFileCategory
          ? { p_employee_file_category: options.employeeFileCategory }
          : {}),
      })
      .returns<MhdCreateSubmissionResultRow[]>();

    if (error) {
      throw new Error(`Unable to create submission: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create submission: no record returned.');
    }

    return this.getSubmissionById(row.id);
  },

  async saveDraft(
    submissionId: string,
    values: Record<string, unknown>,
  ): Promise<MhdFormSubmission> {
    const { error } = await supabaseClient.rpc('mhd_save_form_draft', {
      p_submission_id: submissionId,
      p_values: toJsonValue(values),
    });

    if (error) {
      throw new Error(`Unable to save draft: ${error.message}`);
    }

    return this.getSubmissionById(submissionId);
  },

  async updateSubmission(
    submissionId: string,
    values: Record<string, unknown>,
  ): Promise<MhdFormSubmission> {
    return this.saveDraft(submissionId, values);
  },

  async submitForm(
    submissionId: string,
    values?: Record<string, unknown>,
  ): Promise<MhdFormSubmission> {
    const jsonValues = values ? toJsonValue(values) : undefined;
    const { error } = await supabaseClient.rpc('mhd_submit_form_response', {
      p_submission_id: submissionId,
      ...(jsonValues ? { p_values: jsonValues } : {}),
    });

    if (error) {
      throw new Error(`Unable to submit form: ${error.message}`);
    }

    const { error: applyError } = await supabaseClient.rpc(
      'mhd_apply_form_submission_to_destination',
      {
        p_submission_id: submissionId,
      },
    );

    if (applyError) {
      throw new Error(`Unable to apply submitted form to its destination: ${applyError.message}`);
    }

    return this.getSubmissionById(submissionId);
  },

  async getSubmissionById(submissionId: string): Promise<MhdFormSubmission> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_submission', { p_submission_id: submissionId })
      .returns<MhdRpcSubmissionRow[]>();

    if (error) {
      throw new Error(`Unable to fetch submission: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    return mapSubmissionRow(row);
  },

  async listSubmissionsForForm(formId: string): Promise<MhdFormSubmission[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_submissions_for_form', { p_form_id: formId })
      .returns<MhdRpcSubmissionListRow[]>();

    if (error) {
      throw new Error(`Unable to list submissions: ${error.message}`);
    }

    return (data ?? []).map(mapSubmissionRow);
  },

  async listEmployeeFileSubmissions(personId: string): Promise<MhdEmployeeFileSubmissionRecord[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_employee_file_submissions', { p_person_id: personId })
      .returns<MhdRpcEmployeeFileSubmissionRow[]>();

    if (error) {
      throw new Error(`Unable to list employee file records: ${error.message}`);
    }

    return (data ?? [])
      .map(mapEmployeeFileSubmissionRow)
      .filter((record): record is MhdEmployeeFileSubmissionRecord => record !== null);
  },

  /**
   * Uploads a file-field selection for a submission through the same Google
   * Drive edge-function pipeline the attachments feature uses, then records it
   * in public.form_submission_attachments via the typed client.
   *
   * Column mapping: `drive_file_id` stores the Drive file id and `file_name`
   * stores the original file name. `uploaded_at` is defaulted by
   * the database. The RLS INSERT policy ("Users can attach files to their own
   * submissions") requires that `submissionId` belongs to the current user,
   * which is guaranteed because this is only called during the draft/submit
   * flow against a submission created by mhd_create_submission.
   */
  async uploadSubmissionFile(
    submissionId: string,
    fieldId: string,
    file: File,
  ): Promise<MhdFormFileValue> {
    const validation = mhdValidateAttachment(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.set('file', file);
    formData.set('entity_type', 'FORM_SUBMISSION');
    formData.set('entity_id', submissionId);
    formData.set('original_file_name', file.name);
    formData.set('mime_type', file.type);

    const { data, error } = await supabaseClient.functions.invoke<MhdDriveUploadResponse>(
      appConfig.attachmentUploadFunctionName,
      { body: formData },
    );

    if (error) {
      throw new Error(error.message || 'Google Drive upload failed.');
    }

    if (!data?.driveFileId || !data?.driveFolderId) {
      throw new Error('Google Drive upload function returned an incomplete payload.');
    }

    const { error: insertError } = await supabaseClient.from('form_submission_attachments').insert({
      submission_id: submissionId,
      field_id: fieldId,
      drive_file_id: data.driveFileId,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
    });

    if (insertError) {
      throw new Error(`Unable to record form attachment: ${insertError.message}`);
    }

    return {
      driveFileId: data.driveFileId,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      driveWebViewLink: data.driveWebViewLink ?? null,
    };
  },

  /**
   * Reveals the plaintext of one encrypted submission field via the audited,
   * role-gated `mhd_reveal_submission_field` RPC (Platform Admin / HR Partner /
   * Client Admin only — the database enforces this; every call writes a
   * SENSITIVE_FIELD_REVEAL audit_events row). The returned plaintext must only
   * be displayed transiently — never persisted or written back into form state.
   */
  async revealSubmissionField(submissionId: string, fieldId: string): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_reveal_submission_field', {
      p_submission_id: submissionId,
      p_field_id: fieldId,
    });

    if (error) {
      throw new Error(`Unable to reveal encrypted field: ${error.message}`);
    }
    if (typeof data !== 'string') {
      throw new Error('Unable to reveal encrypted field: no value returned.');
    }

    return data;
  },

  async listMyDraftSubmissions(): Promise<MhdFormSubmission[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_my_draft_submissions')
      .returns<MhdRpcDraftSubmissionRow[]>();

    if (error) {
      throw new Error(`Unable to list draft submissions: ${error.message}`);
    }

    return (data ?? []).map(mapSubmissionRow);
  },
};

export const mhdFormLogicEngine = {
  evaluateCondition(condition: MhdLogicCondition, formValues: Record<string, unknown>): boolean {
    const fieldValue = formValues[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'notEquals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue ?? '').includes(String(condition.value ?? ''));
      case 'greaterThan':
        return Number(fieldValue) > Number(condition.value);
      case 'lessThan':
        return Number(fieldValue) < Number(condition.value);
      case 'greaterOrEqual':
        return Number(fieldValue) >= Number(condition.value);
      case 'lessOrEqual':
        return Number(fieldValue) <= Number(condition.value);
      case 'isEmpty':
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      case 'isNotEmpty':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      default:
        return false;
    }
  },

  evaluateNode(node: MhdLogicConditionNode, formValues: Record<string, unknown>): boolean {
    if (mhdIsConditionGroup(node)) {
      if (node.combinator === 'AND') {
        return node.conditions.every((child) => this.evaluateNode(child, formValues));
      }
      return node.conditions.some((child) => this.evaluateNode(child, formValues));
    }

    return this.evaluateCondition(node, formValues);
  },

  evaluateAllLogic(
    logic: MhdFormLogicRule[],
    formValues: Record<string, unknown>,
    defaultHiddenFieldIds: Iterable<string> = [],
  ): { visibleFields: Set<string>; hiddenFields: Set<string>; requiredFields: Set<string> } {
    const hiddenFields = new Set<string>(defaultHiddenFieldIds);
    const requiredFields = new Set<string>();
    const visibleFields = new Set<string>();

    for (const rule of [...logic].sort((a, b) => a.order - b.order)) {
      const isMatch = this.evaluateNode(rule.condition, formValues);
      if (!isMatch) continue;

      switch (rule.action) {
        case 'SHOW':
          hiddenFields.delete(rule.targetFieldId);
          visibleFields.add(rule.targetFieldId);
          break;
        case 'HIDE':
          hiddenFields.add(rule.targetFieldId);
          visibleFields.delete(rule.targetFieldId);
          break;
        case 'REQUIRE':
          requiredFields.add(rule.targetFieldId);
          break;
        case 'UNREQUIRE':
          requiredFields.delete(rule.targetFieldId);
          break;
      }
    }

    return { visibleFields, hiddenFields, requiredFields };
  },
};

function mhdToNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const mhdFormCalculationEngine = {
  evaluateCalculation(
    calculation: MhdFormCalculation,
    formValues: Record<string, unknown>,
  ): unknown {
    switch (calculation.op) {
      case 'sum':
        return calculation.dependencies.reduce(
          (total, fieldId) => total + mhdToNumber(formValues[fieldId]),
          0,
        );
      case 'average': {
        if (calculation.dependencies.length === 0) return 0;
        const total = calculation.dependencies.reduce(
          (sum, fieldId) => sum + mhdToNumber(formValues[fieldId]),
          0,
        );
        return total / calculation.dependencies.length;
      }
      case 'count':
        return calculation.dependencies.filter((fieldId) => {
          const value = formValues[fieldId];
          return value !== undefined && value !== null && value !== '' && value !== false;
        }).length;
      case 'concatenate':
        return calculation.dependencies
          .map((fieldId) => String(formValues[fieldId] ?? '').trim())
          .filter((value) => value.length > 0)
          .join(' ');
      case 'formula':
      default: {
        if (!calculation.formula) return null;
        try {
          const safeVars = Object.entries(formValues).reduce<Record<string, number>>(
            (acc, [key, value]) => {
              acc[key] = mhdToNumber(value);
              return acc;
            },
            {},
          );
          const evaluator = new Function(
            ...Object.keys(safeVars),
            `"use strict"; return (${calculation.formula});`,
          );
          return evaluator(...Object.values(safeVars));
        } catch {
          return null;
        }
      }
    }
  },

  evaluateAllCalculations(
    calculations: MhdFormCalculation[],
    formValues: Record<string, unknown>,
  ): Record<string, unknown> {
    const mergedValues: Record<string, unknown> = { ...formValues };
    const results: Record<string, unknown> = {};

    for (const calculation of calculations) {
      const value = this.evaluateCalculation(calculation, mergedValues);
      results[calculation.targetFieldId] = value;
      mergedValues[calculation.targetFieldId] = value;
    }

    return results;
  },
};
