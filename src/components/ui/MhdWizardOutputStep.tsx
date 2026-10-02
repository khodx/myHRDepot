import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import {
  useMhdDocumentPreviewHtml,
  useMhdDocumentTemplateByKey,
  useMhdDocumentTemplateWizardSettings,
  useMhdEnqueueDocument,
  useMhdGenerateQueuedDocument,
} from '@/features/documents/Hook';
import { mhdDocumentProhibitedMedicalDetailPattern } from '@/features/documents/Schemas';
import {
  MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES,
  MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS,
  type MhdDocumentEmployeeFileCategory,
  type MhdDocumentMergeOverrides,
  type MhdDocumentNarrativeSections,
  type MhdDocumentOutputFormat,
  type MhdDocumentSourceWizard,
} from '@/features/documents/Types';

/** How a wizard's Generate A Document step ended. */
export type MhdWizardOutputOutcome =
  | {
      outcome: 'GENERATED';
      queueId: string;
      generationId: string;
      documentHash: string | null;
      outputDriveFileId: string | null;
      esignatureRequestId: string | null;
    }
  | { outcome: 'QUEUED'; queueId: string }
  | { outcome: 'SKIPPED' };

interface MhdWizardOutputSigning {
  createRequest: (generated: {
    generationId: string;
    documentHash: string;
  }) => Promise<{ requestId: string; invitationErrors: string[] }>;
}

interface MhdWizardOutputStepProps {
  companyId: string;
  sourceWizard: MhdDocumentSourceWizard;
  /** The stable `template_key` of the document this wizard produces. */
  templateKey: string;
  /** The saved record the document is about (registered in document_entity_types or built in). */
  entityType: string;
  entityId: string;
  /** Names the record in the step's copy, e.g. "corrective action". */
  recordLabel: string;
  /** The wizard's answers; they become the document's `custom` block. */
  wizardInputs?: Record<string, unknown>;
  /** Present when the document must be signed once generated; the wizard knows the signers. */
  signing?: MhdWizardOutputSigning | null;
  onResolved: (outcome: MhdWizardOutputOutcome) => void;
}

const EDITABLE_SOURCES = new Set(['person', 'company', 'record', 'custom']);
const GATE_MESSAGE_FRAGMENT = 'blocked by the pre-live compliance review gate';
const NOT_FILED = 'NONE';

const FORMAT_LABELS: Record<MhdDocumentOutputFormat, string> = {
  PDF: 'PDF',
  DOCX: 'Word (DOCX)',
  HTML: 'Web Page (HTML)',
};

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function readPath(source: Record<string, unknown>, path: string): string {
  let current: unknown = source;
  for (const part of path.split('.')) {
    if (typeof current !== 'object' || current === null) return '';
    current = (current as Record<string, unknown>)[part];
  }
  if (current === null || current === undefined) return '';
  return typeof current === 'string' || typeof current === 'number' || typeof current === 'boolean'
    ? String(current)
    : '';
}

/** A compliance-gate refusal gets a plain explanation; anything else shows the server's own words. */
function mhdDocumentOutputErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  return message.includes(GATE_MESSAGE_FRAGMENT)
    ? 'This document is blocked until its compliance content has been approved. Ask a Platform Admin to review it. You can still save it to generate later.'
    : message;
}

/**
 * The step every wizard ends with: turn the saved record into a document now, save the request
 * to generate later, or skip. Generation never gates the wizard — the record is already saved.
 *
 * "Generate now" and "Generate later" share one path (the request is queued either way), so
 * every wizard-origin document has the same auditable trail. People can review the rendered
 * preview, change the merged values the template declares editable, and add the narrative
 * sections it offers; they cannot rewrite the template body.
 */
export function MhdWizardOutputStep({
  companyId,
  sourceWizard,
  templateKey,
  entityType,
  entityId,
  recordLabel,
  wizardInputs,
  signing = null,
  onResolved,
}: MhdWizardOutputStepProps) {
  const templateQuery = useMhdDocumentTemplateByKey(templateKey, companyId);
  const template = templateQuery.data ?? null;
  const settingsQuery = useMhdDocumentTemplateWizardSettings(template?.id ?? null);
  const settings = settingsQuery.data ?? null;

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [narrative, setNarrative] = useState<MhdDocumentNarrativeSections>({});
  const [appliedEdits, setAppliedEdits] = useState<{
    overrides: MhdDocumentMergeOverrides;
    narrative: MhdDocumentNarrativeSections;
  }>({ overrides: {}, narrative: {} });
  const [outputFormat, setOutputFormat] = useState<MhdDocumentOutputFormat>('PDF');
  const [filing, setFiling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MhdWizardOutputOutcome | null>(null);

  const enqueue = useMhdEnqueueDocument();
  const generate = useMhdGenerateQueuedDocument();
  const isWorking = enqueue.isPending || generate.isPending;

  const previewInput = useMemo(
    () =>
      template
        ? {
            templateId: template.id,
            companyId,
            entityType,
            entityId,
            custom: wizardInputs,
            overrides: appliedEdits.overrides,
            narrative: appliedEdits.narrative,
          }
        : null,
    [appliedEdits, companyId, entityId, entityType, template, wizardInputs],
  );
  const preview = useMhdDocumentPreviewHtml(previewInput);

  const editableFields = useMemo(
    () => (template?.mergeFields ?? []).filter((field) => EDITABLE_SOURCES.has(field.source)),
    [template],
  );
  const narrativeSlots = settings?.narrativeSlots ?? [];

  // The category the document files under: the person's choice, else the template's default.
  const defaultCategory: MhdDocumentEmployeeFileCategory | null =
    settings?.employeeFileCategory ?? null;
  const effectiveFiling = filing ?? defaultCategory ?? NOT_FILED;

  function currentOverrides(): MhdDocumentMergeOverrides {
    const base = preview.data?.mergeData ?? {};
    const overrides: MhdDocumentMergeOverrides = {};
    for (const field of editableFields) {
      const typed = fieldValues[field.path];
      if (typed === undefined) continue;
      if (typed !== readPath(base, field.path)) overrides[field.path] = typed;
    }
    return overrides;
  }

  function currentNarrative(): MhdDocumentNarrativeSections {
    return Object.fromEntries(
      Object.entries(narrative).filter(([, value]) => value.trim().length > 0),
    );
  }

  function screenText(): string | null {
    for (const [key, value] of [
      ...Object.entries(currentOverrides()),
      ...Object.entries(currentNarrative()),
    ]) {
      if (typeof value === 'string' && mhdDocumentProhibitedMedicalDetailPattern.test(value)) {
        return `"${key}" must not include a diagnosis, cause, genetic information or a medical record.`;
      }
    }
    return null;
  }

  function updatePreview() {
    const problem = screenText();
    setError(problem);
    if (problem) return;
    setAppliedEdits({ overrides: currentOverrides(), narrative: currentNarrative() });
  }

  async function enqueueRequest() {
    return enqueue.mutateAsync({
      companyId,
      templateKey,
      entityType,
      entityId,
      sourceWizard,
      wizardInputs,
      mergeOverrides: currentOverrides(),
      narrativeSections: currentNarrative(),
      outputFormat,
      employeeFileCategory:
        effectiveFiling === NOT_FILED
          ? 'NONE'
          : (effectiveFiling as MhdDocumentEmployeeFileCategory),
    });
  }

  async function handleGenerateLater() {
    setError(null);
    const problem = screenText();
    if (problem) {
      setError(problem);
      return;
    }
    try {
      const queued = await enqueueRequest();
      const outcome: MhdWizardOutputOutcome = { outcome: 'QUEUED', queueId: queued.id };
      setResult(outcome);
      onResolved(outcome);
    } catch (caught) {
      setError(mhdDocumentOutputErrorMessage(caught));
    }
  }

  async function handleGenerateNow() {
    setError(null);
    const problem = screenText();
    if (problem) {
      setError(problem);
      return;
    }
    try {
      const queued = await enqueueRequest();
      const generated = await generate.mutateAsync({ queueId: queued.id, entityType });

      let esignatureRequestId: string | null = null;
      if (signing && settings?.requiresSignature) {
        if (!generated.documentHash) {
          throw new Error(
            'The document was generated but has no integrity hash, so it cannot be sent for signature. Send it from E-Signature.',
          );
        }
        const request = await signing.createRequest({
          generationId: generated.generationId,
          documentHash: generated.documentHash,
        });
        esignatureRequestId = request.requestId;
      }

      const outcome: MhdWizardOutputOutcome = {
        outcome: 'GENERATED',
        queueId: queued.id,
        generationId: generated.generationId,
        documentHash: generated.documentHash,
        outputDriveFileId: generated.outputDriveFileId,
        esignatureRequestId,
      };
      setResult(outcome);
      onResolved(outcome);
    } catch (caught) {
      setError(mhdDocumentOutputErrorMessage(caught));
    }
  }

  function handleSkip() {
    const outcome: MhdWizardOutputOutcome = { outcome: 'SKIPPED' };
    setResult(outcome);
    onResolved(outcome);
  }

  if (result) {
    return (
      <MhdCard>
        <h2 className="text-lg font-semibold text-foreground">Generate A Document</h2>
        {result.outcome === 'GENERATED' ? (
          <div className="mt-3 space-y-2 text-sm">
            <p role="status" className="font-medium text-foreground">
              The document was generated.
            </p>
            {result.outputDriveFileId ? (
              <a
                className="font-medium text-accent hover:underline"
                href={`https://drive.google.com/file/d/${result.outputDriveFileId}/view`}
                target="_blank"
                rel="noreferrer"
              >
                View Document
              </a>
            ) : null}
            {result.esignatureRequestId ? (
              <p className="text-muted-foreground">It was sent out for signature.</p>
            ) : null}
          </div>
        ) : null}
        {result.outcome === 'QUEUED' ? (
          <p role="status" className="mt-3 text-sm text-foreground">
            Saved to Documents To Generate.{' '}
            <Link className="font-medium text-accent hover:underline" to="/reports/queue">
              Open The List
            </Link>
          </p>
        ) : null}
        {result.outcome === 'SKIPPED' ? (
          <p className="mt-3 text-sm text-muted-foreground">No document was generated.</p>
        ) : null}
      </MhdCard>
    );
  }

  const templateUnavailable = !templateQuery.isLoading && !template;
  // Only a compliance-gate refusal blocks generating now; saving it to generate later stays open.
  const gateBlocked =
    preview.isError &&
    preview.error instanceof Error &&
    preview.error.message.includes(GATE_MESSAGE_FRAGMENT);

  return (
    <MhdCard className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Generate A Document</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your {recordLabel} is saved. You can generate its document now, save the request to
          generate later, or skip.
        </p>
      </div>

      {templateQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading the document template…</p>
      ) : null}

      {templateUnavailable ? (
        <p className="text-sm text-muted-foreground">
          You can save this document to generate later; the template is prepared when it is
          generated.
        </p>
      ) : null}

      {template ? (
        <>
          {editableFields.length > 0 ? (
            <section aria-label="Review details" className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Review Details</h3>
              {editableFields.map((field) => (
                <label key={field.path} className="block text-sm font-medium">
                  {field.label}
                  <input
                    className={inputClass}
                    value={
                      fieldValues[field.path] ?? readPath(preview.data?.mergeData ?? {}, field.path)
                    }
                    onChange={(event) =>
                      setFieldValues((current) => ({
                        ...current,
                        [field.path]: event.target.value,
                      }))
                    }
                    maxLength={2000}
                  />
                </label>
              ))}
            </section>
          ) : null}

          {narrativeSlots.length > 0 ? (
            <section aria-label="Add text" className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Add Text</h3>
              {narrativeSlots.map((slot) => (
                <label key={slot.key} className="block text-sm font-medium">
                  {slot.label}
                  <textarea
                    className={`${inputClass} min-h-20`}
                    value={narrative[slot.key] ?? ''}
                    onChange={(event) =>
                      setNarrative((current) => ({ ...current, [slot.key]: event.target.value }))
                    }
                    maxLength={8000}
                  />
                  {slot.help ? (
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {slot.help}
                    </span>
                  ) : null}
                </label>
              ))}
            </section>
          ) : null}

          <section aria-label="Preview" className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Preview</h3>
              {editableFields.length > 0 || narrativeSlots.length > 0 ? (
                <Button variant="secondary" onClick={updatePreview} disabled={preview.isFetching}>
                  Update Preview
                </Button>
              ) : null}
            </div>
            {preview.isFetching ? (
              <p className="text-sm text-muted-foreground">Preparing the preview…</p>
            ) : null}
            {preview.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                {mhdDocumentOutputErrorMessage(preview.error)}
              </p>
            ) : null}
            {preview.data && !preview.isFetching ? (
              <iframe
                title="Document preview"
                sandbox=""
                srcDoc={preview.data.html}
                className="h-96 w-full rounded-md border border-border bg-white"
              />
            ) : null}
          </section>
        </>
      ) : null}

      <section aria-label="Output options" className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Format
          <select
            className={inputClass}
            value={outputFormat}
            onChange={(event) => setOutputFormat(event.target.value as MhdDocumentOutputFormat)}
          >
            {(Object.keys(FORMAT_LABELS) as MhdDocumentOutputFormat[]).map((format) => (
              <option key={format} value={format}>
                {FORMAT_LABELS[format]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          File Document In
          <select
            className={inputClass}
            value={effectiveFiling}
            onChange={(event) => setFiling(event.target.value)}
          >
            <option value={NOT_FILED}>Not Filed In An Employee File</option>
            {MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
      </section>

      {signing && settings?.requiresSignature ? (
        <p className="text-sm text-muted-foreground">
          This document is sent for signature as soon as it is generated.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={handleSkip} disabled={isWorking}>
          Skip
        </Button>
        <Button variant="secondary" onClick={() => void handleGenerateLater()} disabled={isWorking}>
          Generate Later
        </Button>
        <Button
          onClick={() => void handleGenerateNow()}
          disabled={isWorking || !template || gateBlocked}
        >
          {isWorking ? 'Working…' : 'Generate Now'}
        </Button>
      </div>
    </MhdCard>
  );
}
