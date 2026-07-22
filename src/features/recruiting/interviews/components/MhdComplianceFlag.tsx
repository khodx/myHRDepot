import {
  mhdFormatComplianceStatus,
  type MhdInterviewComplianceStatus,
} from '../Types';

// The compliance flag on a bank question, shown wherever a question appears (the
// bank, the guide builder, the worksheet). CAUTION reads red — a legally risky
// question the interviewer should avoid or rephrase; REVIEW amber — unreviewed
// content awaiting the attorney/SME channel; APPROVED neutral — cleared. When
// `guidance` is supplied for a CAUTION/REVIEW item the panel expands to show WHY,
// so an interviewer is never left to ask a flagged question unprepared.
const STATUS_STYLES: Record<MhdInterviewComplianceStatus, string> = {
  APPROVED: 'bg-neutral-100 text-neutral-600',
  REVIEW: 'bg-amber-100 text-amber-800',
  CAUTION: 'bg-rose-100 text-rose-800',
};

const GUIDANCE_STYLES: Record<MhdInterviewComplianceStatus, string> = {
  APPROVED: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  REVIEW: 'border-amber-200 bg-amber-50 text-amber-800',
  CAUTION: 'border-rose-200 bg-rose-50 text-rose-800',
};

interface Props {
  status: MhdInterviewComplianceStatus;
  /** The compliance guidance (why to avoid / how to ask legally). Shown when present and not APPROVED. */
  guidance?: string | null;
}

export function MhdComplianceFlag({ status, guidance }: Props) {
  const showGuidance = Boolean(guidance) && status !== 'APPROVED';
  return (
    <div className="space-y-1">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-600'
        }`}
      >
        {status === 'CAUTION' ? '⚠ ' : ''}
        {mhdFormatComplianceStatus(status)}
      </span>
      {showGuidance ? (
        <p className={`rounded-md border px-2 py-1 text-xs ${GUIDANCE_STYLES[status]}`}>
          {guidance}
        </p>
      ) : null}
    </div>
  );
}
