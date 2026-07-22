import { mhdFormatInvestigationStatus, type MhdInvestigationStatus } from '../Types';

// The lifecycle reads left-to-right as it warms: INTAKE is neutral (nothing
// decided yet), the active middle states (OPEN, INVESTIGATING) read blue/indigo
// so a live case stands out on a board, PENDING_REVIEW is amber (it needs a
// decision), and CLOSED is neutral-grey — done, filed, retained.
const STATUS_STYLES: Record<MhdInvestigationStatus, string> = {
  INTAKE: 'bg-neutral-100 text-neutral-700',
  OPEN: 'bg-sky-100 text-sky-800',
  INVESTIGATING: 'bg-indigo-100 text-indigo-800',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  CLOSED: 'bg-neutral-200 text-neutral-700',
};

interface Props {
  status: MhdInvestigationStatus;
}

export function MhdInvestigationStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatInvestigationStatus(status)}
    </span>
  );
}
