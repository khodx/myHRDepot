import { mhdFormatInvestigationDisposition, type MhdInvestigationDisposition } from '../Types';

// Disposition is the finding, so it carries weight. SUBSTANTIATED reads rose —
// a finding against the respondent is the consequential one to spot. The cleared
// outcomes (UNSUBSTANTIATED, UNFOUNDED) read emerald, INCONCLUSIVE amber, and
// WITHDRAWN neutral. A null disposition (still open) renders as a quiet
// "not yet dispositioned" chip rather than nothing, so an undecided case is
// visibly undecided.
const DISPOSITION_STYLES: Record<MhdInvestigationDisposition, string> = {
  SUBSTANTIATED: 'bg-rose-100 text-rose-800',
  UNSUBSTANTIATED: 'bg-emerald-100 text-emerald-800',
  INCONCLUSIVE: 'bg-amber-100 text-amber-800',
  UNFOUNDED: 'bg-emerald-100 text-emerald-800',
  WITHDRAWN: 'bg-neutral-100 text-neutral-700',
};

interface Props {
  disposition: MhdInvestigationDisposition | null;
}

export function MhdDispositionBadge({ disposition }: Props) {
  const style =
    disposition == null
      ? 'bg-neutral-50 text-neutral-500'
      : (DISPOSITION_STYLES[disposition] ?? 'bg-neutral-100 text-neutral-700');
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {mhdFormatInvestigationDisposition(disposition)}
    </span>
  );
}
