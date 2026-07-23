import { MhdBadge } from '@/components/ui/MhdBadge';
import { mhdFormatInvestigationCaseType, type MhdInvestigationCaseType } from '../Types';

// Case type is descriptive, not a status, so every type stays muted and uniform
// (the neutral variant) — a board of investigations should not read as a heat
// map of allegation kinds. The label carries the meaning; the chip is just a
// quiet container.
interface Props {
  caseType: MhdInvestigationCaseType;
}

export function MhdCaseTypeBadge({ caseType }: Props) {
  return <MhdBadge variant="neutral">{mhdFormatInvestigationCaseType(caseType)}</MhdBadge>;
}
