import { mhdFormatOfferStatus, type MhdOfferStatus } from '../Types';

// The offer lifecycle status, coloured by what it means for the hire. This badge
// only RENDERS the server's status — transitions are enforced server-side by the
// offer RPCs. DRAFT / PENDING_APPROVAL read neutral/violet (not yet out), EXTENDED
// blue (with the candidate), ACCEPTED green (the hire landed — a job_assignment
// exists), DECLINED / RESCINDED / EXPIRED muted-rose/neutral (terminal, no hire).
const STATUS_STYLES: Record<MhdOfferStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  PENDING_APPROVAL: 'bg-violet-100 text-violet-800',
  EXTENDED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-emerald-100 text-emerald-800',
  DECLINED: 'bg-rose-100 text-rose-800',
  RESCINDED: 'bg-neutral-200 text-neutral-600',
  EXPIRED: 'bg-neutral-200 text-neutral-500',
};

interface Props {
  status: MhdOfferStatus;
}

export function MhdOfferStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatOfferStatus(status)}
    </span>
  );
}
