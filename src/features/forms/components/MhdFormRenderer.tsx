import { useEffect, useMemo, useState } from 'react';
import { mhdBuildFormValuesSchema } from '../Schemas';
import { mhdFormCalculationEngine, mhdFormLogicEngine, mhdFormService } from '../Service';
import type { MhdForm, MhdFormDefinition } from '../Types';
import { MhdFormDraftSave } from './MhdFormDraftSave';
import { MhdFormPage } from './MhdFormPage';
import { MhdFormPageManager } from './MhdFormPageManager';
import { MhdFormProgress } from './MhdFormProgress';

interface MhdFormRendererProps {
  formId: string;
  submissionId?: string;
  taskId?: string;
  taskPrefillValues?: Record<string, unknown>;
  userPrefillValues?: Record<string, unknown>;
  onSubmitted?: (submissionId: string) => void;
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
  taskPrefillValues,
  userPrefillValues,
  onSubmitted,
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
          ...(taskPrefillValues ?? {}),
          ...(userPrefillValues ?? {}),
        };

        if (initialSubmissionId) {
          const submission = await mhdFormService.getSubmissionById(initialSubmissionId);
          if (isCancelled) return;
          prefill = { ...prefill, ...submission.values };
          setSubmissionId(submission.id);
        } else if (loadedForm.definition.settings.allowDraft) {
          const submission = await mhdFormService.createSubmission(loadedForm.id, taskId);
          if (isCancelled) return;
          setSubmissionId(submission.id);
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
  }, [formId, initialSubmissionId, isPreview, taskId, taskPrefillValues, userPrefillValues]);

  const definition = previewDefinition ?? form?.definition ?? null;
  const displayName = previewName ?? form?.name ?? '';
  const displayDescription = previewDescription ?? form?.description ?? '';

  const defaultHiddenFieldIds = useMemo(
    () => (definition ? definition.fields.filter((field) => field.hidden).map((field) => field.id) : []),
    [definition],
  );

  const calculatedValues = useMemo(() => {
    if (!definition || definition.calculations.length === 0) return {};
    return mhdFormCalculationEngine.evaluateAllCalculations(definition.calculations, values);
  }, [definition, values]);

  const effectiveValues = useMemo(() => ({ ...values, ...calculatedValues }), [calculatedValues, values]);

  const logicResult = useMemo(() => {
    if (!definition) {
      return { hiddenFields: new Set<string>(), requiredFields: new Set<string>() };
    }

    const result = mhdFormLogicEngine.evaluateAllLogic(definition.logic, effectiveValues, defaultHiddenFieldIds);
    return { hiddenFields: result.hiddenFields, requiredFields: result.requiredFields };
  }, [defaultHiddenFieldIds, definition, effectiveValues]);

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
        required: field.required || logicResult.requiredFields.has(field.id),
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
    const submission = await mhdFormService.createSubmission(form.id, taskId);
    setSubmissionId(submission.id);
    return submission.id;
  };

  const handleSubmit = async () => {
    if (isPreview) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const id = await ensureSubmission();
      const submitted = await mhdFormService.submitForm(id, effectiveValues);
      onSubmitted?.(submitted.id);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading form...</div>;
  }

  if (!definition) {
    return <div className="p-6 text-sm text-red-600">{submitError ?? 'Form could not be loaded.'}</div>;
  }

  const currentPage = pages[currentPageIndex];
  const isMultiPage = pages.length > 1;

  return (
    <form
      className="space-y-6 p-6"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{displayName}</h2>
        {displayDescription ? <p className="mt-1 text-sm text-slate-600">{displayDescription}</p> : null}
      </div>

      {isMultiPage && definition.settings.progressBar ? (
        <MhdFormProgress currentPageIndex={currentPageIndex} totalPages={pages.length} />
      ) : null}

      {currentPage ? (
        <MhdFormPage
          page={currentPage}
          fields={definition.fields}
          values={effectiveValues}
          onFieldChange={handleFieldChange}
          hiddenFieldIds={logicResult.hiddenFields}
          requiredFieldIds={logicResult.requiredFields}
          errors={errors}
          readOnlyFieldIds={calculatedFieldIds}
        />
      ) : null}

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      {!isPreview && definition.settings.allowDraft && submissionId ? (
        <MhdFormDraftSave submissionId={submissionId} values={effectiveValues} />
      ) : null}

      {!isPreview ? (
        isMultiPage ? (
          <MhdFormPageManager
            pages={pages}
            currentPageIndex={currentPageIndex}
            onNavigate={setCurrentPageIndex}
            validateCurrentPage={() => validatePage(currentPageIndex)}
            values={effectiveValues}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (validatePage(0)) {
                void handleSubmit();
              }
            }}
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        )
      ) : null}
    </form>
  );
}
