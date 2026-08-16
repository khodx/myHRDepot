import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdDashboardTaskSummary,
  MhdDashboardMyTask,
  MhdDashboardActivityItem,
  MhdDashboardModuleAlerts,
} from './Types';

// getTaskSummary() reads the flat single-row output of
// mhd_dashboard_task_summary().

export const mhdDashboardService = {
  async getTaskSummary(): Promise<MhdDashboardTaskSummary> {
    const { data, error } = await supabaseClient.rpc('mhd_dashboard_task_summary');
    if (error) throw new Error(`Dashboard summary failed: ${error.message}`);
    // mhd_dashboard_task_summary() returns a single row (table function with 1 result)
    if (!data || data.length === 0) {
      // Return zero-state when no tasks exist yet — never throw on empty DB
      return {
        totalTasks: 0,
        notStarted: 0,
        inProgress: 0,
        onHold: 0,
        waitingOnClient: 0,
        completed: 0,
        cancelled: 0,
        overdueCount: 0,
        completionRate: 0,
      };
    }
    const row = data[0];
    return {
      totalTasks: Number(row.total_tasks),
      notStarted: Number(row.not_started),
      inProgress: Number(row.in_progress),
      onHold: Number(row.on_hold),
      waitingOnClient: Number(row.waiting_on_client),
      completed: Number(row.completed),
      cancelled: Number(row.cancelled),
      overdueCount: Number(row.overdue_count),
      completionRate: Number(row.completion_rate),
    };
  },

  async getMyTasks(limit = 20): Promise<MhdDashboardMyTask[]> {
    const { data, error } = await supabaseClient.rpc('mhd_dashboard_my_tasks', { p_limit: limit });
    if (error) throw new Error(`My tasks query failed: ${error.message}`);
    return (data ?? []).map((row: Record<string, unknown>): MhdDashboardMyTask => ({
      taskId: String(row.task_id),
      referenceId: String(row.reference_id),
      title: String(row.title),
      statusName: String(row.status_name),
      statusColorToken: row.status_color_token ? String(row.status_color_token) : null,
      priorityName: row.priority_name ? String(row.priority_name) : null,
      priorityColorToken: row.priority_color_token ? String(row.priority_color_token) : null,
      dueDate: row.due_date ? String(row.due_date) : null,
      isOverdue: Boolean(row.is_overdue),
      companyName: String(row.company_name),
      overallProgressPercent: Number(row.overall_progress_percent),
    }));
  },

  async getRecentActivity(limit = 20): Promise<MhdDashboardActivityItem[]> {
    const { data, error } = await supabaseClient.rpc('mhd_dashboard_recent_activity', {
      p_limit: limit,
    });
    if (error) throw new Error(`Recent activity query failed: ${error.message}`);
    return (data ?? []).map((row: Record<string, unknown>): MhdDashboardActivityItem => ({
      eventId: String(row.event_id),
      entityType: String(row.entity_type),
      actionType: String(row.action_type),
      summary: String(row.summary),
      performedBy: String(row.performed_by),
      performedAt: String(row.performed_at),
      referenceId: row.reference_id ? String(row.reference_id) : null,
    }));
  },

  async getModuleAlerts(): Promise<MhdDashboardModuleAlerts> {
    const { data, error } = await supabaseClient.rpc('mhd_dashboard_module_alerts');
    if (error) throw new Error(`Module alerts query failed: ${error.message}`);
    // mhd_dashboard_module_alerts() returns a single row (table function with 1 result)
    if (!data || data.length === 0) {
      // Return zero-state when nothing needs attention — never throw on empty DB
      return { tasksNeedsAttention: 0, approvalsNeedsAttention: 0, leavesNeedsAttention: 0 };
    }
    const row = data[0];
    return {
      tasksNeedsAttention: Number(row.tasks_needs_attention),
      approvalsNeedsAttention: Number(row.approvals_needs_attention),
      leavesNeedsAttention: Number(row.leaves_needs_attention),
    };
  },
};
