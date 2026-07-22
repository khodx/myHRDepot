import { mhdFormatRecommendation, type MhdInterviewRecommendation } from '../Types';

// The hiring recommendation atop the evaluation. The four-point scale runs from a
// strong hire (deep emerald) to a strong no-hire (deep rose); `null` is a DRAFT
// evaluation that has not yet recorded a decision. Renders the server value only.
const RECOMMENDATION_STYLES: Record<MhdInterviewRecommendation, string> = {
  STRONG_HIRE: 'bg-emerald-600 text-white',
  HIRE: 'bg-emerald-100 text-emerald-800',
  NO_HIRE: 'bg-rose-100 text-rose-800',
  STRONG_NO_HIRE: 'bg-rose-600 text-white',
};

interface Props {
  recommendation: MhdInterviewRecommendation | null;
}

export function MhdRecommendationBadge({ recommendation }: Props) {
  if (!recommendation) {
    return (
      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
        No recommendation
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        RECOMMENDATION_STYLES[recommendation] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatRecommendation(recommendation)}
    </span>
  );
}
