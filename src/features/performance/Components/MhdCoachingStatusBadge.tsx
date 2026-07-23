import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatCoachingPlanStatus, type MhdCoachingPlanStatus } from '../Types';

const STATUS_VARIANTS: Record<MhdCoachingPlanStatus, MhdBadgeVariant> = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

interface Props {
  status: MhdCoachingPlanStatus;
}

export function MhdCoachingStatusBadge({ status }: Props) {
  return <MhdBadge variant={STATUS_VARIANTS[status]}>{mhdFormatCoachingPlanStatus(status)}</MhdBadge>;
}
