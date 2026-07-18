import { mhdFormatActivityStatus, type MhdActivityStatus } from '../Types';

const STATUS_STYLES: Record<MhdActivityStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-neutral-100 text-neutral-600',
  NO_SHOW: 'bg-red-100 text-red-800',
};

interface Props {
  status: MhdActivityStatus;
}

export function MhdActivityStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {mhdFormatActivityStatus(status)}
    </span>
  );
}
