import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MHD_NOTE_VISIBILITY_COPY, type MhdNoteVisibility } from '../Types';

const VISIBILITY_VARIANTS: Record<MhdNoteVisibility, MhdBadgeVariant> = {
  PUBLIC: 'success',
  ADMIN: 'accent',
  PRIVATE: 'neutral',
};

export function MhdNoteVisibilityBadge({ visibility }: { visibility: MhdNoteVisibility }) {
  return (
    <MhdBadge variant={VISIBILITY_VARIANTS[visibility]}>
      {MHD_NOTE_VISIBILITY_COPY[visibility].label}
    </MhdBadge>
  );
}
