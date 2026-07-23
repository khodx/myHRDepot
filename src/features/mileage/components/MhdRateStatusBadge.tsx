import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatRateStatus, type MhdMileageRateStatus } from '../Types';

// Semantic mapping (MHD Design System §5): PROPOSED still needs confirmation
// (warning), ACTIVE is the live rate (success), SUPERSEDED is history (neutral).
const STATUS_VARIANTS: Record<MhdMileageRateStatus, MhdBadgeVariant> = {
  PROPOSED: 'warning',
  ACTIVE: 'success',
  SUPERSEDED: 'neutral',
};

interface Props {
  status: MhdMileageRateStatus;
}

export function MhdRateStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
      {mhdFormatRateStatus(status)}
    </MhdBadge>
  );
}
