import { mhdFormatClaimStatus, type MhdMileageClaimStatus } from '../Types';

const STATUS_STYLES: Record<MhdMileageClaimStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
  EXPORTED: 'bg-violet-100 text-violet-800',
};

interface Props {
  status: MhdMileageClaimStatus;
}

export function MhdClaimStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {mhdFormatClaimStatus(status)}
    </span>
  );
}
