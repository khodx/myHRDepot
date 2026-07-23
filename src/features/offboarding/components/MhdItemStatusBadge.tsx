import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatItemStatus, type MhdOffboardingItemStatus } from '../Types';

const STATUS_VARIANTS: Record<MhdOffboardingItemStatus, MhdBadgeVariant> = {
  PENDING: 'neutral',
  COMPLETED: 'success',
  WAIVED: 'warning',
  NOT_APPLICABLE: 'neutral',
};

interface Props {
  status: MhdOffboardingItemStatus;
}

export function MhdItemStatusBadge({ status }: Props) {
  return <MhdBadge variant={STATUS_VARIANTS[status]}>{mhdFormatItemStatus(status)}</MhdBadge>;
}
