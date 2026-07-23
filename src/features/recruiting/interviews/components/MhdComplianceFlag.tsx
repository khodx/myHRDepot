import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
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
const STATUS_VARIANTS: Record<MhdInterviewComplianceStatus, MhdBadgeVariant> = {
  APPROVED: 'neutral',
  REVIEW: 'warning',
  CAUTION: 'error',
};

const GUIDANCE_STYLES: Record<MhdInterviewComplianceStatus, string> = {
  APPROVED: 'border-border bg-muted text-muted-foreground',
  REVIEW: 'border-amber-200 bg-amber-50 text-amber-800',
  CAUTION: 'border-red-200 bg-red-50 text-red-700',
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
      <MhdBadge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
        {mhdFormatComplianceStatus(status)}
      </MhdBadge>
      {showGuidance ? (
        <p className={`rounded-md border px-2 py-1 text-xs ${GUIDANCE_STYLES[status]}`}>
          {guidance}
        </p>
      ) : null}
    </div>
  );
}
