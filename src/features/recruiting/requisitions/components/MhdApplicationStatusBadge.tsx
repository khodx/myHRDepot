import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import {
  mhdFormatApplicationLifecycle,
  type MhdRecruitingApplicationLifecycle,
} from '../Types';

// The application lifecycle, coloured by where it sits in the funnel. This badge
// only RENDERS the server-synced lifecycle — it is mirrored from the current
// stage's category by `move_stage` / `reject`, never recomputed on the client.
// INVITED reads neutral (link sent, not yet submitted), ACTIVE green (in the
// pipeline), HIRED info-blue (won), REJECTED red, WITHDRAWN neutral.
const LIFECYCLE_VARIANTS: Record<MhdRecruitingApplicationLifecycle, MhdBadgeVariant> = {
  INVITED: 'neutral',
  ACTIVE: 'success',
  HIRED: 'info',
  REJECTED: 'error',
  WITHDRAWN: 'neutral',
};

interface Props {
  lifecycle: MhdRecruitingApplicationLifecycle;
}

export function MhdApplicationStatusBadge({ lifecycle }: Props) {
  return (
    <MhdBadge variant={LIFECYCLE_VARIANTS[lifecycle] ?? 'neutral'} hideIcon>
      {mhdFormatApplicationLifecycle(lifecycle)}
    </MhdBadge>
  );
}
