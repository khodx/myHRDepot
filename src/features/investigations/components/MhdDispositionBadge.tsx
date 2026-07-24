import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatInvestigationDisposition, type MhdInvestigationDisposition } from '../Types';

// Disposition is the finding, so it carries weight. SUBSTANTIATED reads as the
// error red — a finding against the respondent is the consequential one to spot.
// The cleared outcomes (UNSUBSTANTIATED, UNFOUNDED) read success green,
// INCONCLUSIVE warning amber, and WITHDRAWN neutral. A null disposition (still
// open) renders as a quiet "not yet dispositioned" chip rather than nothing, so
// an undecided case is visibly undecided.
const DISPOSITION_VARIANTS: Record<MhdInvestigationDisposition, MhdBadgeVariant> = {
  SUBSTANTIATED: 'error',
  UNSUBSTANTIATED: 'success',
  INCONCLUSIVE: 'warning',
  UNFOUNDED: 'success',
  WITHDRAWN: 'neutral',
};

interface Props {
  disposition: MhdInvestigationDisposition | null;
}

export function MhdDispositionBadge({ disposition }: Props) {
  const variant =
    disposition == null ? 'neutral' : (DISPOSITION_VARIANTS[disposition] ?? 'neutral');
  return <MhdBadge variant={variant}>{mhdFormatInvestigationDisposition(disposition)}</MhdBadge>;
}
