import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatReviewType, type MhdReviewType } from '../Types';

// Type/category tags take the module accent and the informational blue —
// the label carries the distinction.
const TYPE_VARIANTS: Record<MhdReviewType, MhdBadgeVariant> = {
  INTRODUCTORY: 'info',
  ANNUAL: 'accent',
};

interface Props {
  reviewType: MhdReviewType;
}

export function MhdReviewTypeBadge({ reviewType }: Props) {
  return <MhdBadge variant={TYPE_VARIANTS[reviewType]}>{mhdFormatReviewType(reviewType)}</MhdBadge>;
}
