import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatInvestigationStatus, type MhdInvestigationStatus } from '../Types';

// The lifecycle reads left-to-right as it warms: INTAKE is neutral (nothing
// decided yet), the active middle states (OPEN, INVESTIGATING) read info-blue
// so a live case stands out on a board, PENDING_REVIEW is a warning (it needs a
// decision), and CLOSED is neutral — done, filed, retained.
const STATUS_VARIANTS: Record<MhdInvestigationStatus, MhdBadgeVariant> = {
  INTAKE: 'neutral',
  OPEN: 'info',
  INVESTIGATING: 'info',
  PENDING_REVIEW: 'warning',
  CLOSED: 'neutral',
};

interface Props {
  status: MhdInvestigationStatus;
}

export function MhdInvestigationStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
      {mhdFormatInvestigationStatus(status)}
    </MhdBadge>
  );
}
