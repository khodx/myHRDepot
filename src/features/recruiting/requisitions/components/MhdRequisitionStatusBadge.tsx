import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import {
  mhdFormatRequisitionStatus,
  type MhdRecruitingRequisitionStatus,
} from '../Types';

// The requisition lifecycle status, coloured by what it means for the opening.
// This badge only RENDERS the server's status — transitions are enforced
// server-side by `requisition_transition`. DRAFT reads neutral (not yet live),
// PENDING_APPROVAL amber (awaiting sign-off), OPEN green (accepting applicants),
// ON_HOLD amber (paused), FILLED info-blue (a hire landed), CLOSED / CANCELLED
// neutral (terminal, no longer open).
const STATUS_VARIANTS: Record<MhdRecruitingRequisitionStatus, MhdBadgeVariant> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  OPEN: 'success',
  ON_HOLD: 'warning',
  FILLED: 'info',
  CLOSED: 'neutral',
  CANCELLED: 'neutral',
};

interface Props {
  status: MhdRecruitingRequisitionStatus;
}

export function MhdRequisitionStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'} hideIcon>
      {mhdFormatRequisitionStatus(status)}
    </MhdBadge>
  );
}
