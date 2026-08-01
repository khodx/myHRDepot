import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  mhdDocumentQueryKeys,
  useMhdDocumentGenerationActions,
  useMhdDocumentGenerations,
  useMhdDocumentTemplateByKey,
} from '@/features/documents/Hook';
import { mhdDocumentService } from '@/features/documents/Service';
import type {
  MhdDocumentContentFormat,
  MhdDocumentTemplateDetail,
} from '@/features/documents/Types';

const MHD_CONTENT_FORMAT_EXTENSION: Record<MhdDocumentContentFormat, string> = {
  HTML: 'html',
  DOCX: 'docx',
  MARKDOWN: 'md',
};

// Matches MhdDocumentGenerationPanel's status colors exactly
// (src/features/documents/components/), for the same reason: one Generation
// History list, wherever it's embedded, should look identical everywhere.
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

/** Panel accepts at most 3 additional system report keys alongside the
 *  master — a fixed, small, known set (the Task Audit system report set,
 *  migration 0105), not an arbitrary/dynamic template list. React hooks
 *  can't be called in a loop, so this fetches each by a fixed number of
 *  useMhdDocumentTemplateByKey calls rather than iterating; raise this
 *  constant (and add matching hook calls below) if a 4th is ever added. */
const MHD_AUDIT_REPORT_PANEL_MAX_SYSTEM_TEMPLATES = 3;

interface MhdAuditReportPanelProps {
  /** document_templates.template_key for the default/master template. */
  masterTemplateKey: string;
  /** Up to MHD_AUDIT_REPORT_PANEL_MAX_SYSTEM_TEMPLATES additional template
   *  keys, shown in "All Templates" below the master. Empty when a scope has
   *  no narrower report set yet (e.g. the company-wide AUDIT_REPORT today). */
  systemReportTemplateKeys: string[];
  /** Same (entityType, entityId) pair Generate/Upload/Generation History all
   *  key off — 'TASK'/taskId for the per-task page, 'AUDIT_REPORT'/companyId
   *  for the company-wide page (see mhdAuditService). */
  entityType: string;
  entityId: string;
  companyId: string;
  /** Delegates the actual generation to the page, which knows how to build
   *  this scope's merge_data (task fields + filtered audit.timeline for the
   *  per-task page, filters.* + audit.timeline for the company-wide page) —
   *  this panel only knows which template_key was picked. */
  onGenerateTemplate: (templateKey: string) => Promise<{ status: string } | void>;
}

export function MhdAuditReportPanel({
  masterTemplateKey,
  systemReportTemplateKeys,
  entityType,
  entityId,
  companyId,
  onGenerateTemplate,
}: MhdAuditReportPanelProps) {
  const { profile } = useMhdAuth();
  const actorContext = profile?.userId ? { actorUserId: profile.userId } : null;

  const masterTemplateQuery = useMhdDocumentTemplateByKey(masterTemplateKey, companyId);
  const systemTemplateQuery0 = useMhdDocumentTemplateByKey(
    systemReportTemplateKeys[0] ?? null,
    companyId,
  );
  const systemTemplateQuery1 = useMhdDocumentTemplateByKey(
    systemReportTemplateKeys[1] ?? null,
    companyId,
  );
  const systemTemplateQuery2 = useMhdDocumentTemplateByKey(
    systemReportTemplateKeys[2] ?? null,
    companyId,
  );
  const systemTemplateEntries: Array<{ key: string; template: MhdDocumentTemplateDetail }> = [
    { key: systemReportTemplateKeys[0], template: systemTemplateQuery0.data },
    { key: systemReportTemplateKeys[1], template: systemTemplateQuery1.data },
    { key: systemReportTemplateKeys[2], template: systemTemplateQuery2.data },
  ]
    .slice(0, MHD_AUDIT_REPORT_PANEL_MAX_SYSTEM_TEMPLATES)
    .filter(
      (entry): entry is { key: string; template: MhdDocumentTemplateDetail } =>
        Boolean(entry.key) && Boolean(entry.template),
    );

  const queryClient = useQueryClient();
  const generationsQuery = useMhdDocumentGenerations(entityType, entityId);
  const { uploadCompleted } = useMhdDocumentGenerationActions(entityType, entityId, actorContext);

  const [uploadTemplate, setUploadTemplate] = useState<MhdDocumentTemplateDetail | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [generatingTemplateId, setGeneratingTemplateId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const masterTemplate = masterTemplateQuery.data ?? null;
  const generations = generationsQuery.data ?? [];

  async function handleDownload(templateId: string) {
    setDownloadError(null);
    try {
      const detail = await mhdDocumentService.getTemplate(templateId);
      const extension = MHD_CONTENT_FORMAT_EXTENSION[detail.contentFormat] ?? 'txt';
      const blob = new Blob([detail.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${detail.name.replace(/[^\w.-]+/g, '_')}.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Unable to download template.');
    }
  }

  async function handleGenerate(templateKey: string, templateId: string) {
    setFormError(null);
    setGeneratingTemplateId(templateId);
    try {
      const result = await onGenerateTemplate(templateKey);
      if (result && result.status === 'FAILED') {
        setFormError('Report generation failed — see Generation History below for details.');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to generate report.');
    } finally {
      setGeneratingTemplateId(null);
      // onGenerateTemplate drives mhdAuditService.requestTaskAuditReport /
      // requestAuditReport directly (bypassing useMhdDocumentGenerationActions'
      // own `generate` mutation, since those need dynamic audit.timeline array
      // merge_data this hook's flat-mergeData mutation can't carry) — so unlike
      // that mutation's own onSuccess, nothing else invalidates this list.
      void queryClient.invalidateQueries({
        queryKey: mhdDocumentQueryKeys.generations(entityType, entityId),
      });
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

  function templateRow(templateKey: string, template: MhdDocumentTemplateDetail) {
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
            disabled={generatingTemplateId === template.id}
            onClick={() => void handleGenerate(templateKey, template.id)}
            className="text-xs font-medium text-accent-hover hover:underline disabled:opacity-50"
          >
            {generatingTemplateId === template.id ? 'Generating…' : 'Generate'}
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

      {formError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
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
              variant="secondary"
              onClick={() => void handleDownload(masterTemplate.id)}
            >
              Customize
            </Button>
            <Button
              type="button"
              disabled={generatingTemplateId === masterTemplate.id}
              onClick={() => void handleGenerate(masterTemplateKey, masterTemplate.id)}
            >
              {generatingTemplateId === masterTemplate.id ? 'Generating…' : 'Generate'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setUploadTemplate(masterTemplate)}>
              Upload
            </Button>
          </div>
        </div>
      )}

      {systemTemplateEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground">All Templates</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Additional report templates for this scope — different lenses on the same audit data.
          </p>
          <div className="mt-3">
            <ul className="divide-y divide-border rounded-md border border-border">
              {systemTemplateEntries.map((entry) => templateRow(entry.key, entry.template))}
            </ul>
          </div>
        </div>
      )}

      {uploadTemplate && (
        <MhdModal onClose={() => setUploadTemplate(null)} title="Upload Completed Document">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Upload Completed Document</h2>
            <p className="text-sm text-muted-foreground">
              Downloaded <strong>{uploadTemplate.name}</strong>, customized it, and finished it
              offline? Upload the finished PDF or Word file here to use it as this report.
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

            <div className="flex gap-2">
              <Button
                type="button"
                disabled={uploadCompleted.isPending}
                onClick={() => void handleUpload()}
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
          <p className="mt-2 text-sm text-muted-foreground">No reports generated yet.</p>
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
