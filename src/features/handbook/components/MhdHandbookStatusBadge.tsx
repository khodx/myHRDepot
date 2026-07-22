import { mhdFormatHandbookStatus, type MhdHandbookStatus } from '../Types';

// The handbook lifecycle status, coloured by what it means. DRAFT reads neutral
// (still editable), PUBLISHED green (a frozen, live version exists), ARCHIVED
// muted (retired, superseded). This badge only RENDERS the server's status — the
// lifecycle is enforced server-side (only a DRAFT is editable, publishing freezes
// a version).
const STATUS_STYLES: Record<MhdHandbookStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-neutral-200 text-neutral-500',
};

interface Props {
  status: MhdHandbookStatus;
}

export function MhdHandbookStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatHandbookStatus(status)}
    </span>
  );
}
