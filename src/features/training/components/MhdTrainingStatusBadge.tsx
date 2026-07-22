import {
  mhdFormatTrainingComplianceStatus,
  type MhdTrainingComplianceStatus,
} from '../Types';

// The DERIVED compliance status, coloured by what it means for the person. This
// badge only ever RENDERS a status the server computed — it never recomputes
// compliance or expiry from dates. CURRENT reads green (trained, unexpired),
// EXPIRED red (evidence lapsed — the "silently expired into a lie" case the whole
// module exists to prevent), OVERDUE amber (assigned, past due, act now),
// ASSIGNED neutral (on the list, not yet due), NONE muted (nothing on record).
const STATUS_STYLES: Record<MhdTrainingComplianceStatus, string> = {
  CURRENT: 'bg-emerald-100 text-emerald-800',
  EXPIRED: 'bg-rose-100 text-rose-800',
  OVERDUE: 'bg-amber-100 text-amber-800',
  ASSIGNED: 'bg-neutral-100 text-neutral-700',
  NONE: 'bg-neutral-50 text-neutral-500',
};

interface Props {
  status: MhdTrainingComplianceStatus;
}

export function MhdTrainingStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatTrainingComplianceStatus(status)}
    </span>
  );
}
