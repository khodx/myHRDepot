import type { MhdPropertyItemStatus } from '../Types';
import { mhdFormatPropertyItemStatus } from '../Types';

interface MhdPropertyStatusBadgeProps {
  status: MhdPropertyItemStatus;
}

const STATUS_CLASSES: Record<MhdPropertyItemStatus, string> = {
  IN_STOCK: 'bg-emerald-100 text-emerald-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  RETIRED: 'bg-slate-200 text-slate-700',
  LOST: 'bg-amber-100 text-amber-800',
  DAMAGED: 'bg-rose-100 text-rose-800',
};

export function MhdPropertyStatusBadge({ status }: MhdPropertyStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}>
      {mhdFormatPropertyItemStatus(status)}
    </span>
  );
}
