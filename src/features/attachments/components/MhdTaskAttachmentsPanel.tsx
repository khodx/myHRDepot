import { useMhdAttachments } from '../Hook';
import type { MhdAttachment } from '../Types';
import { MhdAttachmentList } from './MhdAttachmentList';
import { MhdAttachmentUploader } from '@/components/ui/MhdAttachmentUploader';

interface Props {
  taskId: string;
}

/**
 * Polymorphic attachments panel bound to a TASK entity, embedded on the task
 * detail page (package name: MhdTaskAttachmentsPage — renamed *Panel here since
 * it is embedded rather than routed).
 *
 * Errors (including `mhd-drive-upload` edge-function failures while Google
 * Drive is not configured yet) render as an inline banner instead of replacing
 * the panel, so the uploader and existing list stay usable — the upload code
 * path itself is intact.
 */
export function MhdTaskAttachmentsPanel({ taskId }: Props) {
  const {
    attachments,
    isLoading,
    error,
    isUploading,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useMhdAttachments('TASK', taskId);

  // Per-row delete permission (uploader, platform admin, or Client Admin) comes from
  // attachment.canDelete, as computed server-side by mhd_list_attachments_for_entity -- there is
  // no page-level role check here, since different rows in the same list can have different
  // delete permissions (ATT-03 / business rule 9).
  async function handleDelete(attachment: MhdAttachment) {
    if (!window.confirm(`Delete "${attachment.originalFileName}"? This cannot be undone.`)) return;
    try {
      await deleteAttachment(attachment.id);
    } catch {
      // Surfaced via the hook's error state.
    }
  }

  function handleUpload(file: File, descriptionRichText: unknown, descriptionPlainText: string) {
    uploadAttachment(file, descriptionRichText, descriptionPlainText).catch(() => {
      // Surfaced via the hook's error state (e.g. Drive edge function not configured yet).
    });
  }

  if (isLoading) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Loading attachments…</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <MhdAttachmentUploader isUploading={isUploading} onUpload={handleUpload} />
      <MhdAttachmentList
        attachments={attachments}
        onDownload={(attachment) => void downloadAttachment(attachment)}
        onDelete={(attachment) => void handleDelete(attachment)}
      />
    </div>
  );
}
