import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdDocumentService } from '@/features/documents/Service';
import type { MhdDocumentGenerationDetailRow } from '@/features/documents/Service';
import type { MhdDocumentMutationContext } from '@/features/documents/Types';
import type { MhdTask } from '@/features/tasks/Types';
import type {
  MhdTaskAuditEntry,
  MhdTaskAuditReportTimelineRow,
  MhdTaskAuditTimelineRpcRow,
} from './Types';

// supabaseClient.rpc is called directly rather than bound to a local alias,
// mirroring the documented Leaves Service pattern (src/features/leaves/Service.ts):
// binding instantiates the whole generated rpc overload set at once, which
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema
// size. A direct call instantiates only the matching overload.

const TASK_AUDIT_REPORT_TEMPLATE_KEY = 'TASK_AUDIT_REPORT';

function mapAuditRow(row: MhdTaskAuditTimelineRpcRow): MhdTaskAuditEntry {
  return {
    id: row.id,
    entityType: row.entity_type as MhdTaskAuditEntry['entityType'],
    entityId: row.entity_id,
    actionType: row.action_type,
    fieldName: row.field_name ?? null,
    oldValue: row.old_value ?? null,
    newValue: row.new_value ?? null,
    summary: row.summary ?? null,
    performedBy: row.performed_by ?? null,
    performedAt: row.performed_at,
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    sourceModule: row.source_module ?? null,
    metadata: row.metadata ?? null,
  };
}

export const mhdAuditService = {
  /**
   * Ordered `performed_at desc` by the RPC. Raises 42501 (via
   * mhd_assert_task_audit_timeline_access) for anyone who is not Platform
   * Admin / HR Partner — this call is the actual enforcement; the route
   * guard and tab visibility are UX only.
   */
  async listTaskAuditTimeline(taskId: string): Promise<MhdTaskAuditEntry[]> {
    const { data, error } = await supabaseClient.rpc('mhd_get_task_audit_timeline', {
      p_task_id: taskId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTaskAuditTimelineRpcRow[]).map(mapAuditRow);
  },

  /**
   * Requests a TASK_AUDIT_REPORT generation. Copies the request/render/poll
   * sequence from mhdDocumentService.generateAndPoll exactly (see
   * src/features/documents/Service.ts) — the only addition is building the
   * `audit.*` merge_data the template's `{{#each audit.timeline}}` block and
   * summary fields need, by re-fetching the FULL (unfiltered) timeline right
   * before generating, independent of whatever date/action/performer filters
   * are active on the page. A report is meant to be the complete record, not
   * whatever slice happens to be on screen.
   */
  async requestTaskAuditReport(
    task: Pick<
      MhdTask,
      'id' | 'companyId' | 'referenceId' | 'title' | 'assignedDate' | 'startDate' | 'dueDate' | 'completedDate' | 'statusName'
    >,
    context: MhdDocumentMutationContext,
    generatedByDisplayName: string,
  ): Promise<MhdDocumentGenerationDetailRow> {
    const template = await mhdDocumentService.getTemplateByKey(
      TASK_AUDIT_REPORT_TEMPLATE_KEY,
      task.companyId,
    );
    if (!template) {
      throw new Error(
        `No "${TASK_AUDIT_REPORT_TEMPLATE_KEY}" report template is available for this company.`,
      );
    }

    const timeline = await mhdAuditService.listTaskAuditTimeline(task.id);
    const timelineRows: MhdTaskAuditReportTimelineRow[] = timeline.map((entry) => ({
      performed_at: entry.performedAt,
      performed_by: entry.performedBy ?? '',
      action_type: entry.actionType,
      field_name: entry.fieldName ?? '',
      old_value: entry.oldValue ?? '',
      new_value: entry.newValue ?? '',
      ip_address: entry.ipAddress ?? '',
      user_agent: entry.userAgent ?? '',
      source_module: entry.sourceModule ?? '',
    }));
    // performed_at desc from the RPC, so the first row is latest and the last is first.
    const firstPerformedAt = timeline.length > 0 ? timeline[timeline.length - 1].performedAt : '';
    const latestPerformedAt = timeline.length > 0 ? timeline[0].performedAt : '';

    return mhdDocumentService.generateAndPoll(
      {
        templateId: template.id,
        companyId: task.companyId,
        entityType: 'TASK',
        entityId: task.id,
        mergeData: {
          'task.reference_id': task.referenceId,
          'task.title': task.title,
          'task.assigned_date': task.assignedDate,
          'task.start_date': task.startDate ?? '',
          'task.due_date': task.dueDate ?? '',
          'task.completed_date': task.completedDate ?? '',
          'task.status_name': task.statusName,
          'audit.total_entry_count': String(timeline.length),
          'audit.displayed_entry_count': String(timeline.length),
          'audit.first_performed_at': firstPerformedAt,
          'audit.latest_performed_at': latestPerformedAt,
          'audit.timeline': timelineRows,
          'system.performed_by': generatedByDisplayName,
          'system.timestamp': new Date().toISOString(),
        },
      },
      context,
    );
  },
};
