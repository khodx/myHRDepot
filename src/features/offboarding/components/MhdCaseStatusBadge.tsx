import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatCaseStatus, type MhdOffboardingCaseStatus } from '../Types';

const STATUS_VARIANTS: Record<MhdOffboardingCaseStatus, MhdBadgeVariant> = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

interface Props {
  status: MhdOffboardingCaseStatus;
}

export function MhdCaseStatusBadge({ status }: Props) {
  return <MhdBadge variant={STATUS_VARIANTS[status]}>{mhdFormatCaseStatus(status)}</MhdBadge>;
}
