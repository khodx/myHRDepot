import { mhdFormatCaseStatus, type MhdOffboardingCaseStatus } from '../Types';

const STATUS_STYLES: Record<MhdOffboardingCaseStatus, string> = {
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

interface Props {
  status: MhdOffboardingCaseStatus;
}

export function MhdCaseStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {mhdFormatCaseStatus(status)}
    </span>
  );
}
