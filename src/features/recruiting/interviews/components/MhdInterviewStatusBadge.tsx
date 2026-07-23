import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatInterviewStatus, type MhdInterviewStatus } from '../Types';

// An interview instance's status. Server-managed: born SCHEDULED (amber, awaiting
// the scorecard), flipped to COMPLETED (green) when the interviewer submits, or
// CANCELLED (neutral). This badge only RENDERS the server status — never recomputes it.
const STATUS_VARIANTS: Record<MhdInterviewStatus, MhdBadgeVariant> = {
  SCHEDULED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

interface Props {
  status: MhdInterviewStatus;
}

export function MhdInterviewStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'} hideIcon>
      {mhdFormatInterviewStatus(status)}
    </MhdBadge>
  );
}
