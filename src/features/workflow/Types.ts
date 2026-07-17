export interface MhdWorkflowTransitionRow {
  id: string;
  company_id: string;
  task_id: string;
  from_status_id: string | null;
  to_status_id: string;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export interface MhdWorkflowTransition {
  id: string;
  taskId: string;
  companyId: string;
  fromStatusId: string | null;
  toStatusId: string;
  fromStatusName: string | null;
  toStatusName: string;
  fromStatusColor: string | null;
  toStatusColor: string | null;
  reason: string | null;
  createdByName: string;
  createdAt: string;
}

export interface MhdWorkflowSLAStatus {
  taskId: string;
  slaDays: number;
  slaDueDate: string;
  isOverdue: boolean;
  daysUntilDue: number;
  slaStatus: 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
}

export interface MhdWorkflowTransitionAllowed {
  allowed: boolean;
  reason?: string;
}

export interface MhdWorkflowAvailableTransition {
  statusId: string;
  statusName: string;
  colorToken: string | null;
}

export interface MhdWorkflowOverdueTask {
  taskId: string;
  title: string;
  daysOverdue: number;
}

export interface MhdTransitionTaskInput {
  taskId: string;
  toStatusId: string;
  reason?: string;
}

export interface MhdTransitionResponse {
  id: string;
  taskId: string;
  fromStatusId: string;
  toStatusId: string;
  createdAt: string;
  success: boolean;
}
