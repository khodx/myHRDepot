import { mhdFormatLeaveCaseStatus, type MhdLeaveCaseStatus } from '../Types';

// The terminal-negative states (DENIED, CANCELLED) read red so they are
// unmistakable in a board an administrator scans quickly; the live states
// (APPROVED, ACTIVE) read green. REQUESTED is amber — it is the state that
// still needs a decision.
const STATUS_STYLES: Record<MhdLeaveCaseStatus, string> = {
  REQUESTED: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-neutral-100 text-neutral-700',
  DENIED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

interface Props {
  status: MhdLeaveCaseStatus;
}

export function MhdLeaveStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatLeaveCaseStatus(status)}
    </span>
  );
}
