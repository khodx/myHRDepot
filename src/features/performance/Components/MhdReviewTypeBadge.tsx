import { mhdFormatReviewType, type MhdReviewType } from '../Types';

const TYPE_STYLES: Record<MhdReviewType, string> = {
  INTRODUCTORY: 'bg-sky-100 text-sky-800',
  ANNUAL: 'bg-indigo-100 text-indigo-800',
};

interface Props {
  reviewType: MhdReviewType;
}

export function MhdReviewTypeBadge({ reviewType }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[reviewType]}`}>
      {mhdFormatReviewType(reviewType)}
    </span>
  );
}
