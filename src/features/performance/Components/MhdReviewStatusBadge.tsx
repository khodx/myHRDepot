import { mhdFormatReviewStatus, type MhdReviewStatus } from '../Types';

const STATUS_STYLES: Record<MhdReviewStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  IN_REVIEW: 'bg-amber-100 text-amber-800',
  PENDING_SIGNATURE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

interface Props {
  status: MhdReviewStatus;
}

export function MhdReviewStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {mhdFormatReviewStatus(status)}
    </span>
  );
}
