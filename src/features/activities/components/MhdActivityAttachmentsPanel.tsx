import { Paperclip, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml } from '@/components/ui/MhdRichTextUtils';
import { useMhdAttachments } from '@/features/attachments/Hook';
import { mhdFormatFileSize, type MhdAttachment } from '@/features/attachments/Types';
import { MhdAttachmentUploader } from '@/components/ui/MhdAttachmentUploader';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS } from '@/features/drafts/Types';
import { mhdFormatDateTime } from '@/utils/mhdDateFormat';

interface Props {
  activityId: string;
  readOnly?: boolean;
}

export function MhdActivityAttachmentsPanel({ activityId, readOnly = false }: Props) {
  const {
    attachments,
    isLoading,
    error,
    isUploading,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useMhdAttachments('ACTIVITY', activityId);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const draft = useMhdDraft({
    draftKind: MHD_DRAFT_KINDS.activityAttachment,
    draftKey: activityId,
    enabled: isUploadOpen,
  });

  async function handleDelete(attachment: MhdAttachment) {
    if (!window.confirm(`Delete "${attachment.originalFileName}"? This cannot be undone.`)) return;
    try {
      await deleteAttachment(attachment.id);
    } catch {
      // Surfaced through the hook's error state.
    }
  }

  function handleUpload(file: File, descriptionRichText: unknown, descriptionPlainText: string) {
    uploadAttachment(file, descriptionRichText, descriptionPlainText)
      .then(async () => {
        await draft.discard();
        setIsUploadOpen(false);
      })
      .catch(() => {
        // Surfaced through the hook's error state.
      });
  }

  if (isLoading) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Loading attachments…</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {readOnly ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          You have read-only access to activity attachments.
        </div>
      ) : (
        <Button type="button" className="gap-1.5" onClick={() => setIsUploadOpen(true)}>
          <Upload className="h-4 w-4" />
          Upload Attachment
        </Button>
      )}

      {isUploadOpen && !readOnly ? (
        <MhdFormModal
          title="Upload Attachment"
          description="Add a file to this activity with a short description."
          onClose={() => setIsUploadOpen(false)}
        >
          <MhdAttachmentUploader isUploading={isUploading} onUpload={handleUpload} draft={draft} />
        </MhdFormModal>
      ) : null}

      {attachments.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState icon={Paperclip} title="No attachments yet." />
        </MhdCard>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <MhdCard key={attachment.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {attachment.originalFileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mhdFormatFileSize(attachment.fileSizeBytes)} • Uploaded{' '}
                    {mhdFormatDateTime(attachment.uploadedAt)}
                    {attachment.uploaderDisplayName ? ` by ${attachment.uploaderDisplayName}` : ''}
                  </p>
                  {attachment.descriptionPlainText && (
                    <MhdRichTextRenderer
                      html={mhdDocumentToRichHtml(
                        attachment.descriptionRichText,
                        attachment.descriptionPlainText,
                      )}
                      className="mt-1 line-clamp-2 text-xs"
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5"
                    onClick={() => void downloadAttachment(attachment)}
                  >
                    Open
                  </Button>
                  {!readOnly && attachment.canDelete ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(attachment)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </MhdCard>
          ))}
        </div>
      )}
    </div>
  );
}
