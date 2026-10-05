import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdRetentionDecisionHistory } from '../Hook';
import type { MhdRetentionReviewItem } from '../Types';
import {
  RETENTION_DECISION_LABEL,
  RETENTION_STATUS_LABEL,
  RETENTION_STATUS_VARIANT,
  formatRetentionDate,
  formatRetentionDateTime,
  humaniseRetentionEntityType,
} from './MhdDocumentRetentionUtils';

interface MhdRetentionHistoryModalProps {
  item: MhdRetentionReviewItem;
  onClose: () => void;
}

export function MhdRetentionHistoryModal({ item, onClose }: MhdRetentionHistoryModalProps) {
  const history = useMhdRetentionDecisionHistory(item.scheduleId);
  const events = history.data ?? [];

  return (
    <MhdModal title="Decision History" onClose={onClose}>
      <h2 className="text-lg font-semibold">Decision History</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {humaniseRetentionEntityType(item.entityType)}
        {item.personName ? ` — ${item.personName}` : ''}
      </p>
      {history.error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {history.error instanceof Error
            ? history.error.message
            : 'Unable to load decision history.'}
        </div>
      ) : history.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No decisions have been recorded for this record.
        </p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.eventId} className="rounded-md border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{RETENTION_DECISION_LABEL[event.decision]}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRetentionDateTime(event.createdAt)}
                  {event.actorEmail ? ` · ${event.actorEmail}` : ''}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {event.fromStatus ? (
                  <>
                    <MhdBadge variant={RETENTION_STATUS_VARIANT[event.fromStatus]} hideIcon>
                      {RETENTION_STATUS_LABEL[event.fromStatus]}
                    </MhdBadge>
                    <span aria-hidden>→</span>
                  </>
                ) : null}
                <MhdBadge variant={RETENTION_STATUS_VARIANT[event.toStatus]} hideIcon>
                  {RETENTION_STATUS_LABEL[event.toStatus]}
                </MhdBadge>
              </div>
              <p className="mt-2">{event.reason}</p>
              {event.extendedUntil ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Extended until {formatRetentionDate(event.extendedUntil)}
                  {event.effectiveExpiryBefore
                    ? ` (was ${formatRetentionDate(event.effectiveExpiryBefore)})`
                    : ''}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </MhdModal>
  );
}
