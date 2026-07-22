import { mhdFormatInterviewStatus, type MhdInterviewStatus } from '../Types';

// An interview instance's status. Server-managed: born SCHEDULED (amber, awaiting
// the scorecard), flipped to COMPLETED (emerald) when the interviewer submits, or
// CANCELLED (muted). This badge only RENDERS the server status — never recomputes it.
const STATUS_STYLES: Record<MhdInterviewStatus, string> = {
  SCHEDULED: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-neutral-200 text-neutral-500',
};

interface Props {
  status: MhdInterviewStatus;
}

export function MhdInterviewStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatInterviewStatus(status)}
    </span>
  );
}
