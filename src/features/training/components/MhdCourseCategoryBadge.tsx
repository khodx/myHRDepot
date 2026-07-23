import { MhdBadge } from '@/components/ui/MhdBadge';
import { mhdFormatTrainingCategory, type MhdTrainingCategory } from '../Types';

interface Props {
  category: MhdTrainingCategory;
}

// Category is descriptive, not a status, so every category renders the same
// quiet neutral chip — a catalog or a compliance board should not read as a
// heat map of training kinds. The label carries the meaning.
export function MhdCourseCategoryBadge({ category }: Props) {
  return <MhdBadge variant="neutral">{mhdFormatTrainingCategory(category)}</MhdBadge>;
}
