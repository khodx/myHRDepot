import { mhdFormatItemStatus, type MhdOffboardingItemStatus } from '../Types';

const STATUS_STYLES: Record<MhdOffboardingItemStatus, string> = {
  PENDING: 'bg-neutral-100 text-neutral-600',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  WAIVED: 'bg-amber-100 text-amber-800',
  NOT_APPLICABLE: 'bg-neutral-100 text-neutral-500',
};

interface Props {
  status: MhdOffboardingItemStatus;
}

export function MhdItemStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {mhdFormatItemStatus(status)}
    </span>
  );
}
