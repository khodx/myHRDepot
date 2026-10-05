import type { MhdBadgeVariant } from '@/components/ui/MhdBadge';
import type {
  MhdRetentionDecision,
  MhdRetentionDispositionStatus,
  MhdRetentionReviewItem,
} from '../Types';

/** "I9_RECORD" -> "I9 Record". */
export function humaniseRetentionEntityType(entityType: string): string {
  return entityType
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) =>
      /^i\d+$/.test(word) ? word.toUpperCase() : word[0]!.toUpperCase() + word.slice(1),
    )
    .join(' ');
}

export const RETENTION_STATUS_LABEL: Record<MhdRetentionDispositionStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  EXTENDED: 'Extended',
  LEGAL_HOLD: 'Legal Hold',
  APPROVED_FOR_DISPOSAL: 'Approved For Disposal',
  DISPOSED: 'Disposed',
};

export const RETENTION_STATUS_VARIANT: Record<MhdRetentionDispositionStatus, MhdBadgeVariant> = {
  PENDING_REVIEW: 'warning',
  EXTENDED: 'info',
  LEGAL_HOLD: 'error',
  APPROVED_FOR_DISPOSAL: 'accent',
  DISPOSED: 'neutral',
};

export const RETENTION_DECISION_LABEL: Record<MhdRetentionDecision, string> = {
  EXTEND: 'Extend',
  HOLD: 'Legal Hold',
  RELEASE_HOLD: 'Release Hold',
  APPROVE_DISPOSAL: 'Approve Disposal',
  CONFIRM_DISPOSED: 'Confirm Disposed',
};

/** Plain statement of what each decision does, shown in its modal. */
export const RETENTION_DECISION_EXPLANATION: Record<MhdRetentionDecision, string> = {
  EXTEND: 'Keeps this record for longer. The new date survives any recomputation of the schedule.',
  HOLD: 'Places the record under legal hold. It cannot be disposed of until the hold is released.',
  RELEASE_HOLD: 'Releases the legal hold and returns the record to review.',
  APPROVE_DISPOSAL:
    'Records your approval to dispose of this record. Nothing is deleted by this application; the record must be purged outside it.',
  CONFIRM_DISPOSED:
    'Records that the disposal was carried out. Describe how and where the record was destroyed.',
};

export const RETENTION_REASON_LABEL: Record<MhdRetentionDecision, string> = {
  EXTEND: 'Reason',
  HOLD: 'Reason / Reference',
  RELEASE_HOLD: 'Reason',
  APPROVE_DISPOSAL: 'Reason',
  CONFIRM_DISPOSED: 'How Disposal Was Carried Out',
};

/** Decisions available for a schedule in its current status. */
export function availableRetentionDecisions(
  status: MhdRetentionDispositionStatus,
): MhdRetentionDecision[] {
  switch (status) {
    case 'PENDING_REVIEW':
    case 'EXTENDED':
      return ['EXTEND', 'HOLD', 'APPROVE_DISPOSAL'];
    case 'LEGAL_HOLD':
      return ['RELEASE_HOLD'];
    case 'APPROVED_FOR_DISPOSAL':
      return ['CONFIRM_DISPOSED', 'HOLD'];
    case 'DISPOSED':
      return [];
  }
}

/** Date-only values (YYYY-MM-DD) are shown without a timezone shift. */
export function formatRetentionDate(value: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(dateOnly ? `${value}T00:00:00` : value).toLocaleDateString();
}

export function formatRetentionDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function localIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The note shown beside a row: hold reference, extension, or last decision. */
export function retentionRowNote(item: MhdRetentionReviewItem): string | null {
  if (item.dispositionStatus === 'LEGAL_HOLD') {
    return item.holdReference ?? item.decisionReason;
  }
  return item.decisionReason;
}
