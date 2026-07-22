import { mhdFormatRateStatus, type MhdMileageRateStatus } from '../Types';

const STATUS_STYLES: Record<MhdMileageRateStatus, string> = {
  PROPOSED: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  SUPERSEDED: 'bg-neutral-100 text-neutral-700',
};

interface Props {
  status: MhdMileageRateStatus;
}

export function MhdRateStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {mhdFormatRateStatus(status)}
    </span>
  );
}
