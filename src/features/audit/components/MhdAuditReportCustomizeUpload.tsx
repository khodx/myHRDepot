import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdDocumentGenerationActions, useMhdDocumentTemplateByKey } from '@/features/documents/Hook';
import { mhdDocumentService } from '@/features/documents/Service';
import type { MhdDocumentContentFormat } from '@/features/documents/Types';

const MHD_CONTENT_FORMAT_EXTENSION: Record<MhdDocumentContentFormat, string> = {
  HTML: 'html',
  DOCX: 'docx',
  MARKDOWN: 'md',
};

interface MhdAuditReportCustomizeUploadProps {
  /** document_templates.template_key — TASK_AUDIT_REPORT or AUDIT_REPORT. */
  templateKey: string;
  /** Same (entityType, entityId) pair the corresponding Generate call uses,
   *  so an uploaded document lands in the same generation history as a
   *  system-generated one — 'TASK'/taskId for the per-task report,
   *  'AUDIT_REPORT'/companyId for the company-wide report (see
   *  mhdAuditService.requestTaskAuditReport / requestAuditReport). */
  entityType: string;
  entityId: string;
  companyId: string;
}

/**
 * The same Download-template-to-customize-offline / Upload-the-finished-file
 * pattern already used project-wide for report generation
 * (MhdDocumentGenerationPanel, src/features/documents/components/) — for the
 * two audit report templates specifically, since those need dynamic
 * `audit.timeline` array merge data at Generate time that the generic panel's
 * flat Record<string, string> mergeData can't carry, and the panel itself is
 * a components/ file that can't be imported across the feature boundary
 * (only Service.ts/Types.ts/Hook.ts/Schemas.ts are — see eslint.config.js's
 * mhd-feature-boundary rule). This component recreates just the
 * Customize/Upload half using the
 * same underlying documents feature calls (mhdDocumentService.getTemplate,
 * useMhdDocumentGenerationActions().uploadCompleted); Generate stays the
 * audit feature's own flow (MhdTaskAuditPage / MhdAuditReportsPage).
 */
export function MhdAuditReportCustomizeUpload({
  templateKey,
  entityType,
  entityId,
  companyId,
}: MhdAuditReportCustomizeUploadProps) {
  const { profile } = useMhdAuth();
  const actorContext = profile?.userId ? { actorUserId: profile.userId } : null;
  const templateQuery = useMhdDocumentTemplateByKey(templateKey, companyId);
  const { uploadCompleted } = useMhdDocumentGenerationActions(entityType, entityId, actorContext);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const template = templateQuery.data ?? null;

  async function handleDownload() {
    if (!template) return;
    setError(null);
    try {
      const detail = await mhdDocumentService.getTemplate(template.id);
      const extension = MHD_CONTENT_FORMAT_EXTENSION[detail.contentFormat] ?? 'txt';
      const blob = new Blob([detail.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${detail.name.replace(/[^\w.-]+/g, '_')}.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download template.');
    }
  }

  async function handleUpload() {
    if (!template) return;
    setError(null);
    if (!uploadFile) {
      setError('Choose a PDF or Word file to upload.');
      return;
    }
    try {
      await uploadCompleted.mutateAsync({
        input: { templateId: template.id, companyId, entityType, entityId, mergeData: {} },
        file: uploadFile,
      });
      setUploadOpen(false);
      setUploadFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload document.');
    }
  }

  if (!template) return null;

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => void handleDownload()}>
        Customize
      </Button>
      <Button type="button" variant="secondary" onClick={() => setUploadOpen(true)}>
        Upload
      </Button>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {uploadOpen && (
        <MhdModal onClose={() => setUploadOpen(false)} title="Upload Completed Document">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Upload Completed Document</h2>
            <p className="text-sm text-muted-foreground">
              Downloaded <strong>{template.name}</strong>, customized it, and finished it offline?
              Upload the finished PDF or Word file here to use it as this report.
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
              <Button type="button" variant="secondary" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </MhdModal>
      )}
    </>
  );
}
