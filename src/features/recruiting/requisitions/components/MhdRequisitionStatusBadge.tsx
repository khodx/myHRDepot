import {
  mhdFormatRequisitionStatus,
  type MhdRecruitingRequisitionStatus,
} from '../Types';

// The requisition lifecycle status, coloured by what it means for the opening.
// This badge only RENDERS the server's status — transitions are enforced
// server-side by `requisition_transition`. DRAFT / PENDING_APPROVAL read neutral
// (not yet live), OPEN green (accepting applicants), ON_HOLD amber (paused),
// FILLED sky (a hire landed), CLOSED / CANCELLED muted (terminal, no longer open).
const STATUS_STYLES: Record<MhdRecruitingRequisitionStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  PENDING_APPROVAL: 'bg-violet-100 text-violet-800',
  OPEN: 'bg-emerald-100 text-emerald-800',
  ON_HOLD: 'bg-amber-100 text-amber-800',
  FILLED: 'bg-sky-100 text-sky-800',
  CLOSED: 'bg-neutral-200 text-neutral-600',
  CANCELLED: 'bg-neutral-200 text-neutral-500',
};

interface Props {
  status: MhdRecruitingRequisitionStatus;
}

export function MhdRequisitionStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatRequisitionStatus(status)}
    </span>
  );
}
