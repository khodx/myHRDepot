import { mhdFormatFlsa, type MhdFlsaClassification } from '../Types';

// Unclassified is styled as a gap rather than a neutral state, because it is
// one: Time & Attendance v2 accrual needs this value, and a job without it
// cannot be processed correctly.
const FLSA_STYLES: Record<string, string> = {
  EXEMPT: 'bg-violet-100 text-violet-800',
  NON_EXEMPT: 'bg-sky-100 text-sky-800',
  UNCLASSIFIED: 'bg-amber-100 text-amber-800',
};

interface Props {
  flsaClassification: MhdFlsaClassification | null;
  /** Renders the safety-sensitive marker alongside, when the job carries it. */
  isSafetySensitive?: boolean;
}

export function MhdFlsaBadge({ flsaClassification, isSafetySensitive = false }: Props) {
  const key = flsaClassification ?? 'UNCLASSIFIED';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${FLSA_STYLES[key]}`}
      >
        {mhdFormatFlsa(flsaClassification)}
      </span>
      {isSafetySensitive ? (
        <span
          className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
          title="This role carries a safety-sensitive designation, which affects how it is treated under regulation."
        >
          Safety-sensitive
        </span>
      ) : null}
    </span>
  );
}
