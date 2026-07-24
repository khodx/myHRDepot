import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import type { MhdPropertyItemStatus } from '../Types';
import { mhdFormatPropertyItemStatus } from '../Types';

interface MhdPropertyStatusBadgeProps {
  status: MhdPropertyItemStatus;
}

const STATUS_VARIANTS: Record<MhdPropertyItemStatus, MhdBadgeVariant> = {
  IN_STOCK: 'success',
  ASSIGNED: 'info',
  RETIRED: 'neutral',
  LOST: 'warning',
  DAMAGED: 'error',
};

export function MhdPropertyStatusBadge({ status }: MhdPropertyStatusBadgeProps) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status]}>{mhdFormatPropertyItemStatus(status)}</MhdBadge>
  );
}
