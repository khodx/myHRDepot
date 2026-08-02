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
  summary: string | null;
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
