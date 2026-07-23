import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatFlsa, type MhdFlsaClassification } from '../Types';

// Unclassified is styled as a gap rather than a neutral state, because it is
// one: Time & Attendance v2 accrual needs this value, and a job without it
// cannot be processed correctly.
const FLSA_VARIANTS: Record<string, MhdBadgeVariant> = {
  EXEMPT: 'accent',
  NON_EXEMPT: 'info',
  UNCLASSIFIED: 'warning',
};

interface Props {
  flsaClassification: MhdFlsaClassification | null;
  /** Renders the safety-sensitive marker alongside, when the job carries it. */
  isSafetySensitive?: boolean;
}

export function MhdFlsaBadge({ flsaClassification, isSafetySensitive = false }: Props) {
  const key = flsaClassification ?? 'UNCLASSIFIED';
  return (
    <span className="inline-flex items-center gap-1.5">
      <MhdBadge variant={FLSA_VARIANTS[key]}>{mhdFormatFlsa(flsaClassification)}</MhdBadge>
      {isSafetySensitive ? (
        <span title="This role carries a safety-sensitive designation, which affects how it is treated under regulation.">
          <MhdBadge variant="error">Safety-sensitive</MhdBadge>
        </span>
      ) : null}
    </span>
  );
}
