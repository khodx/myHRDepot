import type { MhdPropertyAssignmentStatus } from '../Types';
import { mhdFormatPropertyAssignmentStatus } from '../Types';

interface MhdPropertyAssignmentBadgeProps {
  status: MhdPropertyAssignmentStatus;
}

const STATUS_CLASSES: Record<MhdPropertyAssignmentStatus, string> = {
  ISSUED: 'bg-blue-100 text-blue-800',
  RETURNED: 'bg-emerald-100 text-emerald-800',
  LOST: 'bg-amber-100 text-amber-800',
  DAMAGED: 'bg-rose-100 text-rose-800',
};

export function MhdPropertyAssignmentBadge({ status }: MhdPropertyAssignmentBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}>
      {mhdFormatPropertyAssignmentStatus(status)}
    </span>
  );
}
