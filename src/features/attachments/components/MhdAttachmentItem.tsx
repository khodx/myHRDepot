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
    <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-3">
      <div className="text-neutral-400 shrink-0">
        <MhdAttachmentFileIcon mimeType={attachment.mimeType} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">{attachment.originalFileName}</p>
        <p className="text-xs text-neutral-500">
          {mhdFormatFileSize(attachment.fileSizeBytes)} · {attachment.uploaderDisplayName} · {uploadedAt}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onDownload(attachment)}
          title="Download"
          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
        >
          <Download className="h-4 w-4" />
        </button>

        {attachment.canDelete && (
          <button
            type="button"
            onClick={() => onDelete(attachment)}
            title="Delete"
            className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
