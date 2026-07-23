import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import type { MhdNoteVisibility } from '../Types';

const VISIBILITY_VARIANTS: Record<MhdNoteVisibility, MhdBadgeVariant> = {
  PUBLIC: 'success',
  ADMIN: 'accent',
  PRIVATE: 'neutral',
};

export function MhdNoteVisibilityBadge({ visibility }: { visibility: MhdNoteVisibility }) {
  return <MhdBadge variant={VISIBILITY_VARIANTS[visibility]}>{visibility}</MhdBadge>;
}
