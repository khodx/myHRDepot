import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatTrainingComplianceStatus, type MhdTrainingComplianceStatus } from '../Types';

// The DERIVED compliance status, coloured by what it means for the person. This
// badge only ever RENDERS a status the server computed — it never recomputes
// compliance or expiry from dates. CURRENT reads green (trained, unexpired),
// EXPIRED red (evidence lapsed — the "silently expired into a lie" case the whole
// module exists to prevent), OVERDUE amber (assigned, past due, act now),
// ASSIGNED neutral (on the list, not yet due), NONE muted (nothing on record).
const STATUS_VARIANTS: Record<MhdTrainingComplianceStatus, MhdBadgeVariant> = {
  CURRENT: 'success',
  EXPIRED: 'error',
  OVERDUE: 'warning',
  ASSIGNED: 'neutral',
  NONE: 'neutral',
};

interface Props {
  status: MhdTrainingComplianceStatus;
}

export function MhdTrainingStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
      {mhdFormatTrainingComplianceStatus(status)}
    </MhdBadge>
  );
}
