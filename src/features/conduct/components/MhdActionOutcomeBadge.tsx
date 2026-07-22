import { mhdFormatConductActionStatus, type MhdConductActionStatus } from '../Types';

// ACKNOWLEDGED is deliberately styled as a neutral/blue "received" state, not a
// green "agreed/approved" one — the colour must not imply the employee assented.
// The label (from mhdFormatConductActionStatus) reads "Acknowledged (Receipt)".
const STATUS_STYLES: Record<MhdConductActionStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  ISSUED: 'bg-blue-100 text-blue-800',
  ACKNOWLEDGED: 'bg-sky-100 text-sky-800',
  REFUSED: 'bg-rose-100 text-rose-800',
  WAIVED: 'bg-amber-100 text-amber-800',
};

interface Props {
  status: MhdConductActionStatus;
}

export function MhdActionOutcomeBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {mhdFormatConductActionStatus(status)}
    </span>
  );
}
