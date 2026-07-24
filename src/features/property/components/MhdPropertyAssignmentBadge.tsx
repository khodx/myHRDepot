import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import type { MhdPropertyAssignmentStatus } from '../Types';
import { mhdFormatPropertyAssignmentStatus } from '../Types';

interface MhdPropertyAssignmentBadgeProps {
  status: MhdPropertyAssignmentStatus;
}

const STATUS_VARIANTS: Record<MhdPropertyAssignmentStatus, MhdBadgeVariant> = {
  ISSUED: 'info',
  RETURNED: 'success',
  LOST: 'warning',
  DAMAGED: 'error',
};

export function MhdPropertyAssignmentBadge({ status }: MhdPropertyAssignmentBadgeProps) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status]}>
      {mhdFormatPropertyAssignmentStatus(status)}
    </MhdBadge>
  );
}
