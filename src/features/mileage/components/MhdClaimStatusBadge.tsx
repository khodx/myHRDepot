import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatClaimStatus, type MhdMileageClaimStatus } from '../Types';

// Semantic mapping (MHD Design System §5). EXPORTED was formerly violet; the
// semantic set has no violet, so it reads as informational blue.
const STATUS_VARIANTS: Record<MhdMileageClaimStatus, MhdBadgeVariant> = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
  EXPORTED: 'info',
};

interface Props {
  status: MhdMileageClaimStatus;
}

export function MhdClaimStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
      {mhdFormatClaimStatus(status)}
    </MhdBadge>
  );
}
