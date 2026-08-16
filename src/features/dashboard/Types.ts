// All interfaces below match exactly what Service.ts's mhdDashboardService
// methods construct and return (matching Database.sql's mhd_dashboard_*
// function output columns), and what Hook.ts's useMhdDashboard() returns to
// consumers.

// mhd_dashboard_task_summary() returns ONE flat row (not one row per status).
// Service.getTaskSummary() maps that single row into this flat object.
export interface MhdDashboardTaskSummary {
  totalTasks: number;
  notStarted: number;
  inProgress: number;
  onHold: number;
  waitingOnClient: number;
  completed: number;
  cancelled: number;
  overdueCount: number;
  completionRate: number;
}

// mhd_dashboard_my_tasks() row, as mapped by Service.getMyTasks().
export interface MhdDashboardMyTask {
  taskId: string;
  referenceId: string;
  title: string;
  statusName: string;
  statusColorToken: string | null;
  priorityName: string | null;
  priorityColorToken: string | null;
  dueDate: string | null;
  isOverdue: boolean;
  companyName: string;
  overallProgressPercent: number;
}

// mhd_dashboard_recent_activity() row, as mapped by Service.getRecentActivity().
export interface MhdDashboardActivityItem {
  eventId: string;
  entityType: string;
  actionType: string;
  summary: string;
  performedBy: string;
  performedAt: string;
  referenceId: string | null;
}

// mhd_dashboard_module_alerts() returns ONE flat row — one "needs attention"
// count per module. Only Tasks/Approvals/Leaves are covered in this first
// pass (see MhdDashboardModuleLinks.tsx); a module absent here has no
// attention-count concept and never gets a badge.
export interface MhdDashboardModuleAlerts {
  tasksNeedsAttention: number;
  approvalsNeedsAttention: number;
  leavesNeedsAttention: number;
}

// Matches what Hook.ts's useMhdDashboard() actually returns.
// taskSummary is a single object (or null before/without data), not an array —
// there is exactly one summary row for the whole dashboard, not one per status.
export interface MhdDashboardState {
  taskSummary: MhdDashboardTaskSummary | null;
  myTasks: MhdDashboardMyTask[];
  recentActivity: MhdDashboardActivityItem[];
  moduleAlerts: MhdDashboardModuleAlerts | null;
  isLoading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
}

// action_type is sourced directly from audit_events.action_type (TBL-010
// locked spec), which is a free-form text column, not a fixed enum — keep
// this as documentation of known values rather than a strict union so
// unexpected values don't fail to type-check.
export type MhdDashboardActionType =
  'CREATE' | 'UPDATE' | 'DELETE' | 'ATTACHMENT_ADD' | 'ATTACHMENT_REMOVE' | 'NOTIFY' | string;

export function mhdGetActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    CREATE: 'created',
    UPDATE: 'updated',
    DELETE: 'deleted',
    ATTACHMENT_ADD: 'attached a file to',
    ATTACHMENT_REMOVE: 'removed a file from',
    NOTIFY: 'sent a notification for',
  };
  return labels[actionType] ?? actionType.toLowerCase();
}
