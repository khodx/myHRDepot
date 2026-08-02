import { useEffect, useMemo, useRef, useState } from 'react';
import { mhdBuildFormValuesSchema } from '../Schemas';
import { mhdFormCalculationEngine, mhdFormLogicEngine, mhdFormService } from '../Service';
import type { MhdForm, MhdFormDefinition, MhdFormFileValue } from '../Types';
import { mhdIsEncryptedFormValue } from '../Types';
import type { MhdEmployeeFileTypeKey } from '@/features/employee-files/Types';
import { MhdFormDraftSave } from './MhdFormDraftSave';
import { MhdFormPage } from './MhdFormPage';
import { MhdFormPageManager } from './MhdFormPageManager';
import { MhdFormProgress } from './MhdFormProgress';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface MhdFormRendererProps {
  formId: string;
  submissionId?: string;
  taskId?: string;
  employeeFilePersonId?: string;
  employeeFileUserId?: string;
  employeeFileCategory?: MhdEmployeeFileTypeKey | null;
  taskPrefillValues?: Record<string, unknown>;
  userPrefillValues?: Record<string, unknown>;
  onSubmitted?: (submissionId: string, form: MhdForm) => void;
  /**
   * Read-only mode (e.g. the Viewer role): the form renders for inspection
   * only — no draft submission is created, and draft-save, submit, and file
   * upload affordances are suppressed.
   */
  readOnly?: boolean;
  previewDefinition?: MhdFormDefinition;
  previewName?: string;
  previewDescription?: string;
}

function readQueryPrefill(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const values: Record<string, string> = {};
  params.forEach((entry, key) => {
    values[key] = entry;
  });
  return values;
}

export function MhdFormRenderer({
  formId,
  submissionId: initialSubmissionId,
  taskId,
  employeeFilePersonId,
  employeeFileUserId,
  employeeFileCategory,
  taskPrefillValues,
  userPrefillValues,
  onSubmitted,
  readOnly = false,
  previewDefinition,
  previewName,
  previewDescription,
}: MhdFormRendererProps) {
  const [form, setForm] = useState<MhdForm | null>(null);
  const [submissionId, setSubmissionId] = useState<string | undefined>(initialSubmissionId);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(!previewDefinition);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const draftSubmissionPromiseRef = useRef<Promise<string> | null>(null);
  // Fields whose resumed draft value came back as a masked encrypted wrapper.
  // They render as an empty input with a "stored encrypted" hint; while left
  // empty they are omitted from outbound saves so the ciphertext row survives.
  const [encryptedDraftFieldIds, setEncryptedDraftFieldIds] = useState<Set<string>>(new Set());
  const isPreview = Boolean(previewDefinition);

  useEffect(() => {
    if (isPreview) return;

    let isCancelled = false;

    const load = async () => {
      try {
        const loadedForm = await mhdFormService.getFormById(formId);
        if (isCancelled) return;

        setForm(loadedForm);
        let prefill: Record<string, unknown> = {
          ...readQueryPrefill(),
          ...(employeeFileCategory ? { employeeFileCategory } : {}),
          ...(employeeFilePersonId ? { employeeFilePersonId, personId: employeeFilePersonId } : {}),
          ...(employeeFileUserId ? { employeeFileUserId, userId: employeeFileUserId } : {}),
          ...(taskPrefillValues ?? {}),
          ...(userPrefillValues ?? {}),
        };

        if (initialSubmissionId) {
          const submission = await mhdFormService.getSubmissionById(initialSubmissionId);
          if (isCancelled) return;
          // Encrypted fields come back as masked wrappers (never the cipher or
          // plaintext). Render them as empty inputs with a re-enter hint.
          const maskedFieldIds = new Set<string>();
          const resumedValues: Record<string, unknown> = {};
          for (const [fieldId, fieldValue] of Object.entries(submission.values)) {
            if (mhdIsEncryptedFormValue(fieldValue)) {
              maskedFieldIds.add(fieldId);
              resumedValues[fieldId] = '';
            } else {
              resumedValues[fieldId] = fieldValue;
            }
          }
          prefill = { ...prefill, ...resumedValues };
          setEncryptedDraftFieldIds(maskedFieldIds);
          setSubmissionId(submission.id);
        } else if (!readOnly && loadedForm.definition.settings.allowDraft) {
          draftSubmissionPromiseRef.current ??= mhdFormService
            .createSubmission(loadedForm.id, {
              taskId,
              employeeFilePersonId,
              employeeFileUserId,
              employeeFileCategory,
            })
            .then((submission) => submission.id);
          const draftSubmissionId = await draftSubmissionPromiseRef.current;
          if (isCancelled) return;
          setSubmissionId(draftSubmissionId);
        }

        if (!isCancelled) {
          setValues(prefill);
          setIsLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          setSubmitError(error instanceof Error ? error.message : 'Unable to load form');
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [
    formId,
    initialSubmissionId,
    employeeFileCategory,
    employeeFilePersonId,
    employeeFileUserId,
    isPreview,
    readOnly,
    taskId,
    taskPrefillValues,
    userPrefillValues,
  ]);

  const definition = previewDefinition ?? form?.definition ?? null;
  const displayName = previewName ?? form?.name ?? '';
  const displayDescription = previewDescription ?? form?.description ?? '';

  const calculatedValues = useMemo(() => {
    if (!definition || definition.calculations.length === 0) return {};
    return mhdFormCalculationEngine.evaluateAllCalculations(definition.calculations, values);
  }, [definition, values]);

  const effectiveValues = useMemo(
    () => ({ ...values, ...calculatedValues }),
    [calculatedValues, values],
  );

  // Encrypted-resumed fields left empty (untouched) are omitted from outbound
  // draft saves and submits so the stored ciphertext row is never overwritten;
  // typing a value re-includes the field and the RPC re-encrypts it.
  const outboundValues = useMemo(() => {
    if (encryptedDraftFieldIds.size === 0) return effectiveValues;
    const next: Record<string, unknown> = {};
    for (const [fieldId, fieldValue] of Object.entries(effectiveValues)) {
      if (
        encryptedDraftFieldIds.has(fieldId) &&
        (fieldValue === '' || fieldValue === null || fieldValue === undefined)
      ) {
        continue;
      }
      next[fieldId] = fieldValue;
    }
    return next;
  }, [effectiveValues, encryptedDraftFieldIds]);

  const logicResult = useMemo(() => {
    if (!definition) {
      return { hiddenFields: new Set<string>(), requiredFields: new Set<string>() };
    }

    const result = mhdFormLogicEngine.evaluateAllLogic(definition.logic, effectiveValues, []);
    // Planning posture: add/edit sessions must expose every configured field so
    // logic, calculations, and branching can be inspected in context. Keep
    // evaluating logic for dynamic requiredness, but do not let default-hidden
    // flags or HIDE rules suppress rendering or validation inputs.
    return { hiddenFields: new Set<string>(), requiredFields: result.requiredFields };
  }, [definition, effectiveValues]);

  const pages = useMemo(() => {
    if (!definition) return [];
    if (definition.pages.length > 0) return definition.pages;
    return [
      {
        id: 'page-1',
        title: displayName,
        fields: definition.fields.map((field) => field.id),
        order: 1,
      },
    ];
  }, [definition, displayName]);

  const calculatedFieldIds = useMemo(
    () => new Set((definition?.calculations ?? []).map((calculation) => calculation.targetFieldId)),
    [definition],
  );

  // Encrypted-resumed fields render with a hint explaining the empty input.
  const fieldsForRender = useMemo(() => {
    if (!definition) return [];
    if (encryptedDraftFieldIds.size === 0) return definition.fields;
    return definition.fields.map((field) =>
      encryptedDraftFieldIds.has(field.id)
        ? { ...field, helpText: 'Stored encrypted — re-enter to change' }
        : field,
    );
  }, [definition, encryptedDraftFieldIds]);

  const handleFieldChange = (fieldId: string, nextValue: unknown) => {
    setValues((current) => ({ ...current, [fieldId]: nextValue }));
    setErrors((current) => {
      if (!current[fieldId]) return current;
      const nextErrors = { ...current };
      delete nextErrors[fieldId];
      return nextErrors;
    });
  };

  const validatePage = (pageIndex: number): boolean => {
    if (!definition) return true;
    const page = pages[pageIndex];
    if (!page) return true;

    const fieldsById = new Map(definition.fields.map((field) => [field.id, field]));
    const pageFields = page.fields
      .map((fieldId) => fieldsById.get(fieldId))
      .filter((field): field is NonNullable<typeof field> => Boolean(field))
      .filter((field) => !logicResult.hiddenFields.has(field.id))
      .map((field) => ({
        ...field,
        // An encrypted-resumed field left empty still holds its stored
        // ciphertext server-side, so required-ness is satisfied without
        // forcing the user to re-enter the value.
        required:
          (field.required || logicResult.requiredFields.has(field.id)) &&
          !(
            encryptedDraftFieldIds.has(field.id) &&
            (effectiveValues[field.id] === '' ||
              effectiveValues[field.id] === null ||
              effectiveValues[field.id] === undefined)
          ),
      }));

    const schema = mhdBuildFormValuesSchema(pageFields);
    const result = schema.safeParse(effectiveValues);
    if (result.success) {
      setErrors({});
      return true;
    }

    const nextErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const fieldId = String(issue.path[0] ?? '');
      if (!nextErrors[fieldId]) {
        nextErrors[fieldId] = issue.message;
      }
    }
    setErrors(nextErrors);
    return false;
  };

  const ensureSubmission = async (): Promise<string> => {
    if (submissionId) return submissionId;
    if (!form) throw new Error('Form not loaded');
    const submission = await mhdFormService.createSubmission(form.id, {
      taskId,
      employeeFilePersonId,
      employeeFileUserId,
      employeeFileCategory,
    });
    setSubmissionId(submission.id);
    return submission.id;
  };

  const handleUploadFieldFile = async (fieldId: string, file: File): Promise<MhdFormFileValue> => {
    // Uploads must land on a submission owned by the current user (RLS insert
    // policy), so a draft submission is created on demand if none exists yet.
    const id = await ensureSubmission();
    return mhdFormService.uploadSubmissionFile(id, fieldId, file);
  };

  const handleSubmit = async () => {
    if (isPreview || readOnly) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const id = await ensureSubmission();
      const submitted = await mhdFormService.submitForm(id, outboundValues);
      if (form) {
        onSubmitted?.(submitted.id, form);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading form...</div>;
  }

  if (!definition) {
    return (
      <div className="p-6 text-sm text-red-600">{submitError ?? 'Form could not be loaded.'}</div>
    );
  }

  const currentPage = pages[currentPageIndex];
  const isMultiPage = pages.length > 1;
  const canWrite = !isPreview && !readOnly;

  return (
    <form
      className="space-y-6 p-6"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{displayName}</h2>
        {displayDescription ? (
          <MhdRichTextRenderer html={displayDescription} className="mt-1" />
        ) : null}
      </div>

      {readOnly && !isPreview ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          You have read-only access to this form.
        </p>
      ) : null}

      {isMultiPage && definition.settings.progressBar ? (
        <MhdFormProgress currentPageIndex={currentPageIndex} totalPages={pages.length} />
      ) : null}

      {currentPage ? (
        <MhdFormPage
          page={currentPage}
          fields={fieldsForRender}
          values={effectiveValues}
          onFieldChange={handleFieldChange}
          hiddenFieldIds={logicResult.hiddenFields}
          requiredFieldIds={logicResult.requiredFields}
          errors={errors}
          readOnlyFieldIds={calculatedFieldIds}
          onUploadFieldFile={canWrite ? handleUploadFieldFile : undefined}
        />
      ) : null}

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      {canWrite && definition.settings.allowDraft && submissionId ? (
        <MhdFormDraftSave submissionId={submissionId} values={outboundValues} />
      ) : null}

      {isMultiPage ? (
        <MhdFormPageManager
          pages={pages}
          currentPageIndex={currentPageIndex}
          onNavigate={setCurrentPageIndex}
          validateCurrentPage={() => (canWrite ? validatePage(currentPageIndex) : true)}
          values={effectiveValues}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          showSubmit={canWrite}
        />
      ) : canWrite ? (
        <button
          type="button"
          onClick={() => {
            if (validatePage(0)) {
              void handleSubmit();
            }
          }}
          disabled={isSubmitting}
          className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      ) : null}
    </form>
  );
}
