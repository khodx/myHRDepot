import {
  mhdFormatApplicationLifecycle,
  type MhdRecruitingApplicationLifecycle,
} from '../Types';

// The application lifecycle, coloured by where it sits in the funnel. This badge
// only RENDERS the server-synced lifecycle — it is mirrored from the current
// stage's category by `move_stage` / `reject`, never recomputed on the client.
// INVITED reads neutral (link sent, not yet submitted), ACTIVE green (in the
// pipeline), HIRED sky (won), REJECTED rose, WITHDRAWN muted.
const LIFECYCLE_STYLES: Record<MhdRecruitingApplicationLifecycle, string> = {
  INVITED: 'bg-neutral-100 text-neutral-700',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  HIRED: 'bg-sky-100 text-sky-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  WITHDRAWN: 'bg-neutral-200 text-neutral-500',
};

interface Props {
  lifecycle: MhdRecruitingApplicationLifecycle;
}

export function MhdApplicationStatusBadge({ lifecycle }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        LIFECYCLE_STYLES[lifecycle] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatApplicationLifecycle(lifecycle)}
    </span>
  );
}
