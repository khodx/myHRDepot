import { mhdFormatConductCaseStatus, type MhdConductCaseStatus } from '../Types';

const STATUS_STYLES: Record<MhdConductCaseStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-emerald-100 text-emerald-800',
  RESCINDED: 'bg-neutral-100 text-neutral-500',
};

interface Props {
  status: MhdConductCaseStatus;
}

export function MhdConductCaseStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {mhdFormatConductCaseStatus(status)}
    </span>
  );
}
