import { Download, Trash2 } from 'lucide-react';
import { mhdFormatFileSize } from '../Types';
import type { MhdAttachment } from '../Types';
import { MhdAttachmentFileIcon } from './MhdAttachmentFileIcon';

interface Props {
  attachment: MhdAttachment;
  onDownload: (attachment: MhdAttachment) => void;
  onDelete: (attachment: MhdAttachment) => void;
}

export function MhdAttachmentItem({ attachment, onDownload, onDelete }: Props) {
  const uploadedAt = new Date(attachment.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
      <div className="text-muted-foreground shrink-0">
        <MhdAttachmentFileIcon mimeType={attachment.mimeType} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {attachment.originalFileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {mhdFormatFileSize(attachment.fileSizeBytes)} · {attachment.uploaderDisplayName} ·{' '}
          {uploadedAt}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onDownload(attachment)}
          title="Download"
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Download className="h-4 w-4" />
        </button>

        {attachment.canDelete && (
          <button
            type="button"
            onClick={() => onDelete(attachment)}
            title="Delete"
            className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
