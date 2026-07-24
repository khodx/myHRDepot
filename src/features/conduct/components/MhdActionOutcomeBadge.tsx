import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatConductActionStatus, type MhdConductActionStatus } from '../Types';

// ACKNOWLEDGED is deliberately styled as an informational "received" state, not a
// green "agreed/approved" one — the colour must not imply the employee assented.
// The label (from mhdFormatConductActionStatus) reads "Acknowledged (Receipt)".
const STATUS_VARIANTS: Record<MhdConductActionStatus, MhdBadgeVariant> = {
  DRAFT: 'neutral',
  ISSUED: 'info',
  ACKNOWLEDGED: 'info',
  REFUSED: 'error',
  WAIVED: 'warning',
};

interface Props {
  status: MhdConductActionStatus;
}

export function MhdActionOutcomeBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status]}>{mhdFormatConductActionStatus(status)}</MhdBadge>
  );
}
