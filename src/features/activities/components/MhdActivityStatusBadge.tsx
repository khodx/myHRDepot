import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatActivityStatus, type MhdActivityStatus } from '../Types';

// Semantic mapping (MHD Design System §5): PLANNED is informational, IN_PROGRESS
// is pending (warning), COMPLETED is success, CANCELLED is neutral, NO_SHOW is
// the failure state (error).
const STATUS_VARIANTS: Record<MhdActivityStatus, MhdBadgeVariant> = {
  PLANNED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'error',
};

interface Props {
  status: MhdActivityStatus;
}

export function MhdActivityStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
      {mhdFormatActivityStatus(status)}
    </MhdBadge>
  );
}
