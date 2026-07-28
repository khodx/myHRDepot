import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatAccommodationValue, type MhdAccommodationStatus } from '../Types';

// Semantic mapping (MHD Design System §5), following the same convention as
// MhdLeaveStatusBadge: CLOSED is a neutral end state, ACTIVE reads success,
// statuses still awaiting a decision or action read warning/info.
const STATUS_VARIANTS: Record<MhdAccommodationStatus, MhdBadgeVariant> = {
  INTAKE: 'neutral',
  INTERACTIVE_PROCESS: 'info',
  DOCUMENTATION_PENDING: 'warning',
  EVALUATION: 'info',
  DECIDED: 'accent',
  IMPLEMENTING: 'info',
  ACTIVE: 'success',
  REVIEW_DUE: 'warning',
  CLOSED: 'neutral',
};

interface Props {
  status: MhdAccommodationStatus;
}

export function MhdAccommodationStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'} hideIcon>
      {mhdFormatAccommodationValue(status)}
    </MhdBadge>
  );
}
