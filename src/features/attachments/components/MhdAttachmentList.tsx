import { Paperclip } from 'lucide-react';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import type { MhdAttachment } from '../Types';
import { MhdAttachmentItem } from './MhdAttachmentItem';

interface Props {
  attachments: MhdAttachment[];
  onDownload: (attachment: MhdAttachment) => void;
  onDelete: (attachment: MhdAttachment) => void;
}

// Note: whether the delete button renders is decided per-row inside MhdAttachmentItem via
// attachment.canDelete (uploaded_by = current user OR mhd_is_platform_admin(), as computed by
// mhd_list_attachments_for_entity) -- there is no single page-level canDelete flag, since
// different rows in the same list can have different delete permissions.
export function MhdAttachmentList({ attachments, onDownload, onDelete }: Props) {
  if (attachments.length === 0) {
    return <MhdEmptyState icon={Paperclip} title="No attachments yet" className="py-10" />;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <MhdAttachmentItem
          key={attachment.id}
          attachment={attachment}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
