import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatHandbookStatus, type MhdHandbookStatus } from '../Types';

// The handbook lifecycle status, coloured by what it means. DRAFT reads neutral
// (still editable), PUBLISHED green (a frozen, live version exists), ARCHIVED
// muted (retired, superseded). This badge only RENDERS the server's status — the
// lifecycle is enforced server-side (only a DRAFT is editable, publishing freezes
// a version).
const STATUS_VARIANTS: Record<MhdHandbookStatus, MhdBadgeVariant> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

interface Props {
  status: MhdHandbookStatus;
}

export function MhdHandbookStatusBadge({ status }: Props) {
  return (
    <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
      {mhdFormatHandbookStatus(status)}
    </MhdBadge>
  );
}
