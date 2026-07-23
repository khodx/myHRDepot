import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatReviewStatus, type MhdReviewStatus } from '../Types';

const STATUS_VARIANTS: Record<MhdReviewStatus, MhdBadgeVariant> = {
  DRAFT: 'neutral',
  IN_REVIEW: 'warning',
  PENDING_SIGNATURE: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

interface Props {
  status: MhdReviewStatus;
}

export function MhdReviewStatusBadge({ status }: Props) {
  return <MhdBadge variant={STATUS_VARIANTS[status]}>{mhdFormatReviewStatus(status)}</MhdBadge>;
}
