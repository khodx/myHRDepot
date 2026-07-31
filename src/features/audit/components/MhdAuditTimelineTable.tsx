import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  mhdAuditRowHasKnownLinkShape,
  resolveMhdAuditRowLink,
  type MhdAuditRowLinkContext,
} from '../resolveAuditRowLink';

/** Normalized shape both MhdTaskAuditEntry (per-task) and MhdAuditEvent
 *  (company-wide) satisfy, so this table never needs to know which page it
 *  is rendering for. `performedByName` is optional on this shared interface
 *  for defensiveness only — both mhd_get_task_audit_timeline (migration
 *  0103) and mhd_list_audit_events resolve it via the same users -> people
 *  join today; the `?? performedBy` fallback below just guards against a
 *  future RPC in this shape that doesn't. */
export interface MhdAuditTimelineRow {
  id: string;
  entityType: string;
  entityId: string;
  actionType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string | null;
  performedByName?: string | null;
  performedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  sourceModule: string | null;
}

export function formatMhdAuditDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

/**
 * Column header descriptions, shown as a native `title` tooltip on hover.
 * This mirrors the codebase's existing tooltip convention — a plain `title`
 * attribute (see e.g. MhdTable's truncated-value cells, MhdRichText's
 * toolbar buttons, MhdSidebar's collapse toggle) — rather than introducing a
 * new Tooltip component; no shared Tooltip primitive exists in
 * src/components/ui today.
 */
const MHD_AUDIT_COLUMNS: { label: string; description: string }[] = [
  {
    label: 'Performed At',
    description: 'Date and time the event occurred, shown in your local timezone.',
  },
  {
    label: 'Performed By',
    description: 'The user who performed the action, or the automated process that recorded it.',
  },
  {
    label: 'Entity',
    description:
      'The type of record this event is about — e.g. the task itself, or one of its linked notes, attachments, or activities.',
  },
  {
    label: 'Action',
    description: 'What happened — e.g. a field change, a creation, or a deletion.',
  },
  {
    label: 'Field',
    description: 'For a field-level change, the name of the field that was modified.',
  },
  {
    label: 'Old Value',
    description: 'The value before the change, when this event represents a field-level change.',
  },
  {
    label: 'New Value',
    description: 'The value after the change, when this event represents a field-level change.',
  },
  {
    label: 'Source Module',
    description: 'The application module that recorded this event.',
  },
  {
    label: 'IP Address',
    description:
      "The actor's IP address at the time of the event, when captured (not recorded for every action type).",
  },
  {
    label: 'User Agent',
    description:
      "The actor's browser/client identifying string at the time of the event, when captured.",
  },
];

interface MhdAuditTimelineTableProps<T extends MhdAuditTimelineRow> {
  entries: T[];
  emptyMessage: string;
  /** Resolves NOTE/ATTACHMENT rows to a parent task; per-task callers pass
   *  { taskId } directly, the company-wide page omits it (see
   *  resolveAuditRowLink.ts for why no cross-lookup exists yet). */
  linkContext?: MhdAuditRowLinkContext;
  /** Called when a NOTE/ATTACHMENT row is clicked but resolveMhdAuditRowLink
   *  could not resolve a parent task (company-wide page, no linkContext).
   *  The caller (MhdAuditReportsPage) surfaces this as an inline message —
   *  there is no toast system in this codebase to route it to instead. */
  onUnresolvedRowClick?: (entry: T) => void;
}

/**
 * Shared audit timeline table — table-rendering logic extracted out of
 * MhdTaskAuditPage so the company-wide MhdAuditReportsPage can reuse it
 * verbatim. Rows navigate to their linked record on click anywhere in the
 * row (MhdTr's built-in `to` support, which already ignores clicks on
 * nested interactive controls) — see resolveAuditRowLink.ts for the
 * entity_type -> route mapping.
 */
export function MhdAuditTimelineTable<T extends MhdAuditTimelineRow>({
  entries,
  emptyMessage,
  linkContext,
  onUnresolvedRowClick,
}: MhdAuditTimelineTableProps<T>) {
  if (entries.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <MhdTable>
      <thead>
        <tr>
          {MHD_AUDIT_COLUMNS.map((column) => (
            <MhdTh key={column.label} title={column.description}>
              {column.label}
            </MhdTh>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const link = resolveMhdAuditRowLink(entry, linkContext);
          const canFallBack = !link && mhdAuditRowHasKnownLinkShape(entry.entityType);
          return (
            <MhdTr
              key={entry.id}
              to={link ?? undefined}
              onClick={canFallBack ? () => onUnresolvedRowClick?.(entry) : undefined}
            >
              <MhdTd className="whitespace-nowrap">{formatMhdAuditDateTime(entry.performedAt)}</MhdTd>
              <MhdTd>{entry.performedByName ?? entry.performedBy ?? '—'}</MhdTd>
              <MhdTd>{entry.entityType}</MhdTd>
              <MhdTd>{entry.actionType}</MhdTd>
              <MhdTd>{entry.fieldName ?? '—'}</MhdTd>
              <MhdTd className="max-w-xs truncate" title={entry.oldValue ?? undefined}>
                {entry.oldValue ?? '—'}
              </MhdTd>
              <MhdTd className="max-w-xs truncate" title={entry.newValue ?? undefined}>
                {entry.newValue ?? '—'}
              </MhdTd>
              <MhdTd>{entry.sourceModule ?? '—'}</MhdTd>
              <MhdTd>{entry.ipAddress ?? '—'}</MhdTd>
              <MhdTd className="max-w-xs truncate" title={entry.userAgent ?? undefined}>
                {entry.userAgent ?? '—'}
              </MhdTd>
            </MhdTr>
          );
        })}
      </tbody>
    </MhdTable>
  );
}
