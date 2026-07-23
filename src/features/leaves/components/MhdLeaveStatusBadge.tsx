import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatLeaveCaseStatus, type MhdLeaveCaseStatus } from '../Types';

// Semantic mapping (MHD Design System §5): DENIED is the terminal-negative
// state (error); CANCELLED is a neutral end state; the live states (APPROVED,
// ACTIVE) read success. REQUESTED is warning — it still needs a decision.
const STATUS_VARIANTS: Record<MhdLeaveCaseStatus, MhdBadgeVariant> = {
  REQUESTED: 'warning',
  APPROVED: 'success',
  ACTIVE: 'success',
  COMPLETED: 'neutral',
  DENIED: 'error',
  CANCELLED: 'neutral',
};

interface Props {
  status: MhdLeaveCaseStatus;
}

export function MhdLeaveStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
      {mhdFormatLeaveCaseStatus(status)}
    </MhdBadge>
  );
}
