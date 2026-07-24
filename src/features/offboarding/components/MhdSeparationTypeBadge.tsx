import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatSeparationType, type MhdSeparationType } from '../Types';

// Separation type is mostly a category tag (module accent), but the charged
// separations keep their semantic weight: TERMINATION reads as error and
// LAYOFF as warning.
const TYPE_VARIANTS: Record<MhdSeparationType, MhdBadgeVariant> = {
  RESIGNATION: 'accent',
  TERMINATION: 'error',
  LAYOFF: 'warning',
  END_OF_CONTRACT: 'accent',
  RETIREMENT: 'accent',
  OTHER: 'neutral',
};

interface Props {
  separationType: MhdSeparationType;
}

export function MhdSeparationTypeBadge({ separationType }: Props) {
  return (
    <MhdBadge variant={TYPE_VARIANTS[separationType]}>
      {mhdFormatSeparationType(separationType)}
    </MhdBadge>
  );
}
