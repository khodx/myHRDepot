import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatConductCaseStatus, type MhdConductCaseStatus } from '../Types';

const STATUS_VARIANTS: Record<MhdConductCaseStatus, MhdBadgeVariant> = {
  OPEN: 'info',
  CLOSED: 'success',
  RESCINDED: 'neutral',
};

interface Props {
  status: MhdConductCaseStatus;
}

export function MhdConductCaseStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status]}>{mhdFormatConductCaseStatus(status)}</MhdBadge>
  );
}
