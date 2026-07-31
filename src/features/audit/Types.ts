// Frontend layer for Task Audit/History (Stage 3). The RPC
// (mhd_get_task_audit_timeline, migration added in the docs/Supabase repo's
// Stages 1-2, not here) merges a task's own audit trail with its linked
// notes/attachments/activities and is Platform Admin / HR Partner only —
// raises 42501 for anyone else. This module never re-derives that gate: the
// RPC is the enforcement, MHD_ROUTE_ACCESS + client-side hiding are only UX.

/** The polymorphic entity a timeline row actually describes — the task
 *  itself, or one of its linked notes/attachments/activities. */
export type MhdTaskAuditEntityType = 'TASK' | 'NOTE' | 'ATTACHMENT' | 'ACTIVITY';

/** Raw RPC row shape (mhd_get_task_audit_timeline), per the generated
 *  Database['public']['Functions'] Returns type. The generator marks every
 *  column non-nullable, but several genuinely come back NULL at runtime
 *  (e.g. field_name/old_value/new_value on a non-field-change event,
 *  ip_address/user_agent when the actor wasn't an interactive browser
 *  session) — MhdTaskAuditEntry below models those honestly. */
export interface MhdTaskAuditTimelineRpcRow {
  id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  field_name: string;
  old_value: string;
  new_value: string;
  summary: string;
  performed_by: string;
  performed_at: string;
  ip_address: string;
  user_agent: string;
  source_module: string;
  metadata: unknown;
}

export interface MhdTaskAuditEntry {
  id: string;
  entityType: MhdTaskAuditEntityType;
  entityId: string;
  actionType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  summary: string | null;
  /** Actor id (auth user). No display-name join exists on this RPC yet —
   *  rendered as the raw id in the timeline table. */
  performedBy: string | null;
  performedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  sourceModule: string | null;
  metadata: unknown;
}

export interface MhdTaskAuditFilters {
  from: string;
  to: string;
  actionType: string;
  performedBy: string;
  entityType: MhdTaskAuditEntityType | 'ALL';
}

export const MHD_TASK_AUDIT_DEFAULT_FILTERS: MhdTaskAuditFilters = {
  from: '',
  to: '',
  actionType: 'ALL',
  performedBy: '',
  entityType: 'ALL',
};

/** Fields the TASK_AUDIT_REPORT template's `{{#each audit.timeline}}` block
 *  reads (Timeline Entries table) — matches the template content verbatim. */
export interface MhdTaskAuditReportTimelineRow {
  performed_at: string;
  performed_by: string;
  action_type: string;
  field_name: string;
  old_value: string;
  new_value: string;
  ip_address: string;
  user_agent: string;
  source_module: string;
}
