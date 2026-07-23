import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatRecommendation, type MhdInterviewRecommendation } from '../Types';

// The hiring recommendation atop the evaluation. The four-point scale maps to the
// semantic set (hire = success, no-hire = error), with the STRONG endpoints
// deepened via a class override so the scale still reads at a glance; `null` is a
// DRAFT evaluation that has not yet recorded a decision. Renders the server value only.
const RECOMMENDATION_VARIANTS: Record<MhdInterviewRecommendation, MhdBadgeVariant> = {
  STRONG_HIRE: 'success',
  HIRE: 'success',
  NO_HIRE: 'error',
  STRONG_NO_HIRE: 'error',
};

const STRONG_OVERRIDES: Partial<Record<MhdInterviewRecommendation, string>> = {
  STRONG_HIRE: 'bg-green-600 text-white',
  STRONG_NO_HIRE: 'bg-red-600 text-white',
};

interface Props {
  recommendation: MhdInterviewRecommendation | null;
}

export function MhdRecommendationBadge({ recommendation }: Props) {
  if (!recommendation) {
    return <MhdBadge variant="neutral">No recommendation</MhdBadge>;
  }
  return (
    <MhdBadge
      variant={RECOMMENDATION_VARIANTS[recommendation] ?? 'neutral'}
      hideIcon
      className={STRONG_OVERRIDES[recommendation]}
    >
      {mhdFormatRecommendation(recommendation)}
    </MhdBadge>
  );
}
