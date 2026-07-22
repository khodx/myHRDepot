import { mhdFormatTrainingCategory, type MhdTrainingCategory } from '../Types';

// Category is descriptive, not a status, so these stay muted and uniform — a
// catalog or a compliance board should not read as a heat map of training kinds.
// The label carries the meaning; the chip is just a quiet container.
const CATEGORY_STYLES: Record<MhdTrainingCategory, string> = {
  HARASSMENT: 'bg-neutral-100 text-neutral-700',
  SAFETY: 'bg-neutral-100 text-neutral-700',
  COMPLIANCE: 'bg-neutral-100 text-neutral-700',
  SKILLS: 'bg-neutral-100 text-neutral-700',
  ONBOARDING: 'bg-neutral-100 text-neutral-700',
  OTHER: 'bg-neutral-100 text-neutral-700',
};

interface Props {
  category: MhdTrainingCategory;
}

export function MhdCourseCategoryBadge({ category }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        CATEGORY_STYLES[category] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatTrainingCategory(category)}
    </span>
  );
}
