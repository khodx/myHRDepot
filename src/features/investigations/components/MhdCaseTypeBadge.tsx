import { mhdFormatInvestigationCaseType, type MhdInvestigationCaseType } from '../Types';

// Case type is descriptive, not a status, so these stay muted and uniform — a
// board of investigations should not read as a heat map of allegation kinds.
// The label carries the meaning; the chip is just a quiet container.
const CASE_TYPE_STYLES: Record<MhdInvestigationCaseType, string> = {
  HARASSMENT: 'bg-neutral-100 text-neutral-700',
  DISCRIMINATION: 'bg-neutral-100 text-neutral-700',
  HOSTILE_WORK: 'bg-neutral-100 text-neutral-700',
  GRIEVANCE: 'bg-neutral-100 text-neutral-700',
  COMPLAINT: 'bg-neutral-100 text-neutral-700',
  ACCIDENT: 'bg-neutral-100 text-neutral-700',
  SAFETY: 'bg-neutral-100 text-neutral-700',
  OTHER: 'bg-neutral-100 text-neutral-700',
};

interface Props {
  caseType: MhdInvestigationCaseType;
}

export function MhdCaseTypeBadge({ caseType }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        CASE_TYPE_STYLES[caseType] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatInvestigationCaseType(caseType)}
    </span>
  );
}
