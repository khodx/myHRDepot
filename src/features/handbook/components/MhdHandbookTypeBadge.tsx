import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatHandbookType, type MhdHandbookType } from '../Types';

// The content pack a handbook draws from. This is descriptive, not a status, so
// the two packs stay quietly distinct (module accent for Employee, warning amber
// for Safety) rather than reading as a heat map. The label carries the meaning.
const TYPE_VARIANTS: Record<MhdHandbookType, MhdBadgeVariant> = {
  EMPLOYEE: 'accent',
  SAFETY: 'warning',
};

interface Props {
  handbookType: MhdHandbookType;
}

export function MhdHandbookTypeBadge({ handbookType }: Props) {
  return (
    <MhdBadge variant={TYPE_VARIANTS[handbookType] ?? 'neutral'} hideIcon>
      {mhdFormatHandbookType(handbookType)}
    </MhdBadge>
  );
}
