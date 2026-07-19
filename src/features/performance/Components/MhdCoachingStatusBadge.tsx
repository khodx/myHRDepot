import { mhdFormatCoachingPlanStatus, type MhdCoachingPlanStatus } from '../Types';

const STATUS_STYLES: Record<MhdCoachingPlanStatus, string> = {
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-neutral-100 text-neutral-600',
};

interface Props {
  status: MhdCoachingPlanStatus;
}

export function MhdCoachingStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {mhdFormatCoachingPlanStatus(status)}
    </span>
  );
}
