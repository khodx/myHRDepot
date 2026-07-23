import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatOccurrenceType, type MhdOccurrenceType } from '../Types';

// Semantic mapping (MHD Design System §5): full absences and walk-offs read as
// error; the partial-day variances (tardy, early departure, partial absence)
// read as warning. The former per-type hue gradations collapse into the
// two-severity set — the label carries the distinction.
const TYPE_VARIANTS: Record<MhdOccurrenceType, MhdBadgeVariant> = {
  ABSENCE: 'error',
  TARDY: 'warning',
  EARLY_DEPARTURE: 'warning',
  PARTIAL_ABSENCE: 'warning',
  NO_CALL_NO_SHOW: 'error',
  LEFT_WITHOUT_NOTICE: 'error',
};

interface Props {
  occurrenceType: MhdOccurrenceType;
}

export function MhdOccurrenceTypeBadge({ occurrenceType }: Props) {
  return (
    <MhdBadge variant={TYPE_VARIANTS[occurrenceType]}>
      {mhdFormatOccurrenceType(occurrenceType)}
    </MhdBadge>
  );
}
