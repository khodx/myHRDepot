import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import {
  MHD_FIELD_INPUT_CLASS,
  MHD_FIELD_INPUT_DISABLED_CLASS,
  MhdFieldLabel,
} from '@/components/ui/MhdFieldLabel';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdMultiSelectCombobox } from '@/components/ui/MhdMultiSelectCombobox';
import { mhdFormService } from '@/features/forms/Service';
import { useMhdUpsertEmployeeFileRequirement } from '../Hook';
import {
  mhdEmployeeFileRequirementSchema,
  type MhdEmployeeFileRequirementFormValues,
} from '../Schemas';
import {
  MHD_EMPLOYEE_FILE_REQUIREMENT_KINDS,
  MHD_EMPLOYEE_FILE_REQUIREMENT_STATES,
  MHD_EMPLOYEE_FILE_TYPES,
  mhdEmployeeFileStateLabel,
  type MhdEmployeeFileRequirement,
  type MhdEmployeeFileRequirementKind,
  type MhdEmployeeFileRequirementState,
  type MhdEmployeeFileTypeKey,
} from '../Types';

interface Props {
  companyId: string;
  /** Rule being edited; omitted when adding a new one. */
  requirement?: MhdEmployeeFileRequirement;
  onClose: () => void;
}

type FieldErrors = Partial<Record<keyof MhdEmployeeFileRequirementFormValues, string>>;

const STATE_OPTIONS = MHD_EMPLOYEE_FILE_REQUIREMENT_STATES.map((state) => ({
  id: state,
  label: mhdEmployeeFileStateLabel(state),
}));

function initialValues(
  requirement: MhdEmployeeFileRequirement | undefined,
): MhdEmployeeFileRequirementFormValues {
  return {
    label: requirement?.label ?? '',
    category: requirement?.category ?? MHD_EMPLOYEE_FILE_TYPES[0].key,
    satisfiedByKind: requirement?.satisfiedByKind ?? MHD_EMPLOYEE_FILE_REQUIREMENT_KINDS[0].value,
    formId: requirement?.formId ?? '',
    templateKey: requirement?.templateKey ?? '',
    appliesToStates: requirement?.appliesToStates ?? [],
    dueDaysAfterHire:
      requirement?.dueDaysAfterHire === null || requirement?.dueDaysAfterHire === undefined
        ? ''
        : String(requirement.dueDaysAfterHire),
    isActive: requirement?.isActive ?? true,
  };
}

/**
 * Add / edit an employee file requirement for one company. The label is the
 * rule's identity: saving an existing label overrides the platform default for
 * this company (switch a default off by saving it with Active unchecked).
 */
export function MhdEmployeeFileRequirementModal({ companyId, requirement, onClose }: Props) {
  const upsert = useMhdUpsertEmployeeFileRequirement(companyId);
  // A requirement may only point at one of the company's own forms.
  const formsQuery = useQuery({
    queryKey: ['mhd-employee-file-requirement-forms', companyId],
    queryFn: () => mhdFormService.listFormsForCompany(companyId),
  });
  const [values, setValues] = useState(() => initialValues(requirement));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = Boolean(requirement);

  function setField<K extends keyof MhdEmployeeFileRequirementFormValues>(
    key: K,
    value: MhdEmployeeFileRequirementFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const parsed = mhdEmployeeFileRequirementSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MhdEmployeeFileRequirementFormValues | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const data = parsed.data;
    try {
      await upsert.mutateAsync({
        label: data.label,
        category: data.category as MhdEmployeeFileTypeKey,
        satisfiedByKind: data.satisfiedByKind,
        formId: data.satisfiedByKind === 'FORM_SUBMISSION' ? data.formId : null,
        templateKey: data.satisfiedByKind === 'DOCUMENT_TEMPLATE' ? data.templateKey : null,
        appliesToStates: data.appliesToStates,
        dueDaysAfterHire: data.dueDaysAfterHire === '' ? null : Number(data.dueDaysAfterHire),
        isActive: data.isActive,
      });
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable To Save Employee File Requirement.',
      );
    }
  }

  const errorText = (key: keyof FieldErrors) =>
    errors[key] ? (
      <p role="alert" className="mt-1 text-xs text-red-600">
        {errors[key]}
      </p>
    ) : null;

  const heading = isEditing ? 'Edit Requirement' : 'Add Requirement';

  return (
    <MhdModal onClose={onClose} title={heading}>
      <h2 className="mb-4 text-lg font-semibold text-foreground">{heading}</h2>
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <MhdFormFieldStack>
          <div>
            <MhdFieldLabel htmlFor="mhd-requirement-label" required>
              Label
            </MhdFieldLabel>
            <input
              id="mhd-requirement-label"
              className={isEditing ? MHD_FIELD_INPUT_DISABLED_CLASS : MHD_FIELD_INPUT_CLASS}
              value={values.label}
              disabled={isEditing}
              onChange={(event) => setField('label', event.target.value)}
            />
            {isEditing ? (
              <p className="mt-1 text-xs text-muted-foreground">
                The label identifies the rule. Saving changes for this company overrides any default
                with the same label.
              </p>
            ) : null}
            {errorText('label')}
          </div>

          <div>
            <MhdFieldLabel htmlFor="mhd-requirement-category" required>
              Category
            </MhdFieldLabel>
            <select
              id="mhd-requirement-category"
              className={MHD_FIELD_INPUT_CLASS}
              value={values.category}
              onChange={(event) => setField('category', event.target.value)}
            >
              {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => (
                <option key={fileType.key} value={fileType.key}>
                  {fileType.label}
                </option>
              ))}
            </select>
            {errorText('category')}
          </div>

          <div>
            <MhdFieldLabel htmlFor="mhd-requirement-kind" required>
              Satisfied By
            </MhdFieldLabel>
            <select
              id="mhd-requirement-kind"
              className={MHD_FIELD_INPUT_CLASS}
              value={values.satisfiedByKind}
              onChange={(event) =>
                setField('satisfiedByKind', event.target.value as MhdEmployeeFileRequirementKind)
              }
            >
              {MHD_EMPLOYEE_FILE_REQUIREMENT_KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
            {errorText('satisfiedByKind')}
          </div>

          {values.satisfiedByKind === 'FORM_SUBMISSION' ? (
            <div>
              <MhdFieldLabel htmlFor="mhd-requirement-form" required>
                Form
              </MhdFieldLabel>
              <select
                id="mhd-requirement-form"
                className={MHD_FIELD_INPUT_CLASS}
                value={values.formId}
                onChange={(event) => setField('formId', event.target.value)}
              >
                <option value="">Select A Form</option>
                {(formsQuery.data ?? []).map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
              {formsQuery.isError ? (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {formsQuery.error instanceof Error
                    ? formsQuery.error.message
                    : 'Unable To Load Company Forms.'}
                </p>
              ) : null}
              {errorText('formId')}
            </div>
          ) : null}

          {values.satisfiedByKind === 'DOCUMENT_TEMPLATE' ? (
            <div>
              <MhdFieldLabel htmlFor="mhd-requirement-template-key" required>
                Document Template Key
              </MhdFieldLabel>
              <input
                id="mhd-requirement-template-key"
                className={MHD_FIELD_INPUT_CLASS}
                value={values.templateKey}
                onChange={(event) => setField('templateKey', event.target.value)}
              />
              {errorText('templateKey')}
            </div>
          ) : null}

          <div>
            <MhdFieldLabel htmlFor="mhd-requirement-states" required>
              Applies To Employment States
            </MhdFieldLabel>
            <div id="mhd-requirement-states" className="mt-1">
              <MhdMultiSelectCombobox
                options={STATE_OPTIONS}
                value={values.appliesToStates}
                onChange={(next) =>
                  setField('appliesToStates', next as MhdEmployeeFileRequirementState[])
                }
                placeholder="Select Employment States"
                emptyMessage="No employment states match."
              />
            </div>
            {errorText('appliesToStates')}
          </div>

          <div>
            <MhdFieldLabel htmlFor="mhd-requirement-due-days">Due Days After Hire</MhdFieldLabel>
            <input
              id="mhd-requirement-due-days"
              className={MHD_FIELD_INPUT_CLASS}
              inputMode="numeric"
              value={values.dueDaysAfterHire}
              onChange={(event) => setField('dueDaysAfterHire', event.target.value)}
            />
            {errorText('dueDaysAfterHire')}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) => setField('isActive', event.target.checked)}
            />
            Active
          </label>
        </MhdFormFieldStack>

        {submitError ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {submitError}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={upsert.isPending}>
            Save Requirement
          </Button>
        </div>
      </form>
    </MhdModal>
  );
}
