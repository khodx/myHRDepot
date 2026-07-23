import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatOfferStatus, type MhdOfferStatus } from '../Types';

// The offer lifecycle status, coloured by what it means for the hire. This badge
// only RENDERS the server's status — transitions are enforced server-side by the
// offer RPCs. DRAFT reads neutral (not yet out), PENDING_APPROVAL amber (awaiting
// sign-off), EXTENDED info-blue (with the candidate), ACCEPTED green (the hire
// landed — a job_assignment exists), DECLINED red, RESCINDED / EXPIRED neutral
// (terminal, no hire).
const STATUS_VARIANTS: Record<MhdOfferStatus, MhdBadgeVariant> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  EXTENDED: 'info',
  ACCEPTED: 'success',
  DECLINED: 'error',
  RESCINDED: 'neutral',
  EXPIRED: 'neutral',
};

interface Props {
  status: MhdOfferStatus;
}

export function MhdOfferStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'} hideIcon>
      {mhdFormatOfferStatus(status)}
    </MhdBadge>
  );
}
