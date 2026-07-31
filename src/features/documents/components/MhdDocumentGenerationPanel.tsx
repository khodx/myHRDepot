import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdDocumentGenerationActions,
  useMhdDocumentGenerations,
  useMhdDocumentTemplateByKey,
  useMhdDocumentTemplates,
} from '../Hook';
import { mhdDocumentService } from '../Service';
import type { MhdDocumentContentFormat, MhdDocumentTemplate } from '../Types';

interface MhdDocumentGenerationPanelProps {
  entityType: string;
  entityId: string;
  companyId: string;
  /**
   * The reusable "default/master template" hook — a stable template_key
   * (e.g. TASK_MASTER_ALL_FIELDS) this module seeded via migration. When it
   * resolves, that template is pinned at the top of the page as the
   * recommended download/customize/upload-back starting point. Any module
   * can adopt this same pattern with its own key; no new component code
   * needed.
   */
  masterTemplateKey?: string;
  /** Field values already known from the caller's loaded record (e.g. Task
   *  detail passes its own title/reference id/due date). Used silently to
   *  merge on Generate — never shown as editable code. */
  defaultMergeData?: Record<string, string>;
}

const MHD_CONTENT_FORMAT_EXTENSION: Record<MhdDocumentContentFormat, string> = {
  HTML: 'html',
  DOCX: 'docx',
  MARKDOWN: 'md',
};

// The project-wide Customize/Generate/Upload button colors (2026-07-31) — named
// here once so every instance (master card and both modal confirm buttons)
// stays in sync if the color is ever revised.
const MHD_CUSTOMIZE_BUTTON_CLASS = 'bg-[#00007A] text-white font-bold';
const MHD_GENERATE_BUTTON_CLASS = 'bg-[#D6A300] text-white font-bold';
const MHD_UPLOAD_BUTTON_CLASS = 'bg-[#397822] text-white font-bold';

function mhdDocumentStatusClass(status: string): string {
  switch (status) {
    case 'GENERATED':
    case 'SIGNED':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'FAILED':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'VOIDED':
      return 'bg-neutral-100 text-neutral-500 border-neutral-200';
    default:
      return 'bg-amber-100 text-amber-700 border-amber-200';
  }
}

async function downloadTemplateContent(templateId: string) {
  const detail = await mhdDocumentService.getTemplate(templateId);
  const extension = MHD_CONTENT_FORMAT_EXTENSION[detail.contentFormat] ?? 'txt';
  const blob = new Blob([detail.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${detail.name.replace(/[^\w.-]+/g, '_')}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * The polymorphic "generate a report" embed point — any module drops this
 * in with its own entityType/entityId/companyId (and optionally a
 * masterTemplateKey). Every template — the pinned default plus however many
 * others exist — is listed directly on the page with its own Download /
 * Generate / Upload actions; the only modals are those two "new record"
 * actions themselves, and Generate never shows raw merge-data code.
 */
export function MhdDocumentGenerationPanel({
  entityType,
  entityId,
  companyId,
  masterTemplateKey,
  defaultMergeData,
}: MhdDocumentGenerationPanelProps) {
  const { profile } = useMhdAuth();
  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );

  const masterTemplateQuery = useMhdDocumentTemplateByKey(masterTemplateKey ?? null, companyId);
  const templatesQuery = useMhdDocumentTemplates(companyId, undefined, false, entityType);
  const generationsQuery = useMhdDocumentGenerations(entityType, entityId);
  const { generate, uploadCompleted } = useMhdDocumentGenerationActions(
    entityType,
    entityId,
    actorContext,
  );

  const [generateTemplate, setGenerateTemplate] = useState<MhdDocumentTemplate | null>(null);
  const [uploadTemplate, setUploadTemplate] = useState<MhdDocumentTemplate | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const masterTemplate = masterTemplateQuery.data ?? null;
  const otherTemplates = (templatesQuery.data ?? []).filter(
    (template) => template.id !== masterTemplate?.id,
  );
  const generations = generationsQuery.data ?? [];
  // Every module's merge data is automatically extended with the same system
  // fields (who generated it, and when) — no caller needs to supply these.
  const mergeData = useMemo(
    () => ({
      ...defaultMergeData,
      'system.generated_by_name': profile?.displayName ?? profile?.email ?? '',
      'system.current_date': new Date().toISOString().slice(0, 10),
    }),
    [defaultMergeData, profile],
  );
  const mergeEntries = Object.entries(mergeData);

  async function handleDownload(templateId: string) {
    setDownloadError(null);
    try {
      await downloadTemplateContent(templateId);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Unable to download template.');
    }
  }

  async function handleGenerate() {
    if (!generateTemplate) return;
    setFormError(null);
    try {
      await generate.mutateAsync({
        templateId: generateTemplate.id,
        companyId,
        entityType,
        entityId,
        mergeData,
      });
      setGenerateTemplate(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to generate document.');
    }
  }

  async function handleUpload() {
    if (!uploadTemplate) return;
    setFormError(null);
    if (!uploadFile) {
      setFormError('Choose a PDF or Word file to upload.');
      return;
    }

    try {
      await uploadCompleted.mutateAsync({
        input: {
          templateId: uploadTemplate.id,
          companyId,
          entityType,
          entityId,
          mergeData: {},
        },
        file: uploadFile,
      });
      setUploadTemplate(null);
      setUploadFile(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to upload document.');
    }
  }

  function templateRow(template: MhdDocumentTemplate) {
    return (
      <li key={template.id} className="flex flex-wrap items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
          <p className="text-xs text-muted-foreground">
            {template.templateType} · {template.contentFormat}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleDownload(template.id)}
            className="text-xs font-medium text-accent-hover hover:underline"
          >
            Download
          </button>
          <button
            type="button"
            onClick={() => setGenerateTemplate(template)}
            className="text-xs font-medium text-accent-hover hover:underline"
          >
            Generate
          </button>
          <button
            type="button"
            onClick={() => setUploadTemplate(template)}
            className="text-xs font-medium text-accent-hover hover:underline"
          >
            Upload
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      {downloadError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {downloadError}
        </div>
      )}

      {masterTemplate && (
        <div className="rounded-md border-2 border-accent/40 bg-accent/5 p-4">
          <span className="inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-on">
            Default Template
          </span>
          <h3 className="mt-2 text-sm font-semibold text-foreground">{masterTemplate.name}</h3>
          {masterTemplate.description && (
            <p className="mt-1 text-xs text-muted-foreground">{masterTemplate.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleDownload(masterTemplate.id)}
              className={MHD_CUSTOMIZE_BUTTON_CLASS}
            >
              Customize
            </Button>
            <Button
              type="button"
              onClick={() => setGenerateTemplate(masterTemplate)}
              className={MHD_GENERATE_BUTTON_CLASS}
            >
              Generate
            </Button>
            <Button
              type="button"
              onClick={() => setUploadTemplate(masterTemplate)}
              className={MHD_UPLOAD_BUTTON_CLASS}
            >
              Upload
            </Button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground">All Templates</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Every template available for this record — there can be more than one, built different
          ways, for different purposes.
        </p>
        <div className="mt-3">
          {templatesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          ) : otherTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {masterTemplate ? 'No other templates yet.' : 'No templates available yet.'}
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {otherTemplates.map((template) => templateRow(template))}
            </ul>
          )}
        </div>
      </div>

      {generateTemplate && (
        <MhdModal onClose={() => setGenerateTemplate(null)} title="Generate Report">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Generate Report</h2>
            <p className="text-sm text-muted-foreground">
              From <strong>{generateTemplate.name}</strong>, using this record's current data:
            </p>

            {mergeEntries.length > 0 ? (
              <dl className="divide-y divide-border rounded-md border border-border text-sm">
                {mergeEntries.map(([field, value]) => (
                  <div key={field} className="flex justify-between gap-4 px-3 py-2">
                    <dt className="text-muted-foreground">{field}</dt>
                    <dd className="truncate text-right text-foreground">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                disabled={generate.isPending}
                onClick={() => void handleGenerate()}
                className={MHD_GENERATE_BUTTON_CLASS}
              >
                {generate.isPending ? 'Generating…' : 'Generate'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setGenerateTemplate(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </MhdModal>
      )}

      {uploadTemplate && (
        <MhdModal onClose={() => setUploadTemplate(null)} title="Upload Completed Document">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Upload Completed Document</h2>
            <p className="text-sm text-muted-foreground">
              Downloaded <strong>{uploadTemplate.name}</strong>, customized it, and finished it
              offline? Upload the finished PDF or Word file here to use it as this record's
              report.
            </p>

            <label className="block text-sm font-medium text-foreground">
              File (PDF or Word)
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="mt-1 w-full text-sm text-foreground"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              />
            </label>

            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                disabled={uploadCompleted.isPending}
                onClick={() => void handleUpload()}
                className={MHD_UPLOAD_BUTTON_CLASS}
              >
                {uploadCompleted.isPending ? 'Uploading…' : 'Upload'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setUploadTemplate(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </MhdModal>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground">Generation History</h3>
        {generations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No documents generated yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-md border border-border">
            {generations.map((generation) => (
              <li key={generation.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {generation.templateName}
                  </p>
                  <p className="text-xs text-muted-foreground">{generation.referenceId}</p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${mhdDocumentStatusClass(generation.status)}`}
                >
                  {generation.status}
                </span>
                {generation.outputDriveFileId ? (
                  <a
                    href={`https://drive.google.com/file/d/${generation.outputDriveFileId}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-accent-hover hover:underline"
                  >
                    Download
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
