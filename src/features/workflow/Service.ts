import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdTransitionTaskSchema } from './Schemas';
import type {
  MhdTransitionTaskInput,
  MhdWorkflowAvailableTransition,
  MhdWorkflowOverdueTask,
  MhdWorkflowSLAStatus,
  MhdWorkflowTransition,
  MhdWorkflowTransitionAllowed,
} from './Types';

type WorkflowTransitionRow = {
  id: string;
  task_id: string;
  from_status_id: string | null;
  to_status_id: string;
  from_status_name: string | null;
  to_status_name: string;
  from_status_color: string | null;
  to_status_color: string | null;
  reason: string | null;
  created_by_name: string;
  created_at: string;
};

type SLAStatusRow = {
  task_id: string;
  sla_days: number;
  sla_due_date: string;
  is_overdue: boolean;
  days_until_due: number;
  sla_status: string;
};

type AvailableTransitionRow = {
  to_status_id: string;
  to_status_name: string;
  to_status_color: string | null;
};

type OverdueTaskRow = {
  task_id: string;
  title: string;
  days_overdue: number;
};

function isSlaStatusRow(value: unknown): value is SLAStatusRow {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.task_id === 'string' &&
    typeof row.sla_days === 'number' &&
    typeof row.sla_due_date === 'string' &&
    typeof row.is_overdue === 'boolean' &&
    typeof row.days_until_due === 'number' &&
    typeof row.sla_status === 'string'
  );
}

function mapTransitionRow(row: WorkflowTransitionRow): MhdWorkflowTransition {
  return {
    id: row.id,
    taskId: row.task_id,
    companyId: '',
    fromStatusId: row.from_status_id,
    toStatusId: row.to_status_id,
    fromStatusName: row.from_status_name,
    toStatusName: row.to_status_name,
    fromStatusColor: row.from_status_color,
    toStatusColor: row.to_status_color,
    reason: row.reason,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}

function mapSLARow(row: SLAStatusRow): MhdWorkflowSLAStatus {
  return {
    taskId: row.task_id,
    slaDays: row.sla_days,
    slaDueDate: row.sla_due_date,
    isOverdue: row.is_overdue,
    daysUntilDue: row.days_until_due,
    slaStatus: row.sla_status as MhdWorkflowSLAStatus['slaStatus'],
  };
}

function mapAvailableTransitionRow(row: AvailableTransitionRow): MhdWorkflowAvailableTransition {
  return {
    statusId: row.to_status_id,
    statusName: row.to_status_name,
    colorToken: row.to_status_color,
  };
}

function mapOverdueTaskRow(row: OverdueTaskRow): MhdWorkflowOverdueTask {
  return {
    taskId: row.task_id,
    title: row.title,
    daysOverdue: row.days_overdue,
  };
}

export const mhdWorkflowService = {
  async isTransitionAllowed(
    taskId: string,
    fromStatusId: string,
    toStatusId: string,
    userId: string,
  ): Promise<MhdWorkflowTransitionAllowed> {
    const { data, error } = await supabaseClient.rpc('mhd_workflow_transition_allowed', {
      p_task_id: taskId,
      p_from_status_id: fromStatusId,
      p_to_status_id: toStatusId,
      p_user_id: userId,
    });

    if (error) {
      return { allowed: false, reason: error.message };
    }

    return { allowed: data === true };
  },

  async transitionTask(input: MhdTransitionTaskInput): Promise<MhdWorkflowTransition> {
    const validInput = mhdTransitionTaskSchema.parse(input);

    const { data, error } = await supabaseClient.rpc('mhd_workflow_transition', {
      p_task_id: validInput.taskId,
      p_to_status_id: validInput.toStatusId,
      p_reason: validInput.reason,
    });

    if (error) {
      throw new Error(`Unable to transition task: ${error.message}`);
    }

    if (!data) {
      throw new Error('Unable to transition task: transition returned no data');
    }

    const history = await this.getTransitionHistory(validInput.taskId);
    if (history.length === 0) {
      throw new Error('Unable to transition task: transition was created but could not be retrieved');
    }

    return history[0];
  },

  async getTransitionHistory(taskId: string): Promise<MhdWorkflowTransition[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_workflow_get_transitions', { p_task_id: taskId })
      .returns<WorkflowTransitionRow[]>();

    if (error) {
      throw new Error(`Unable to load transition history: ${error.message}`);
    }

    return (data ?? []).map(mapTransitionRow);
  },

  async checkSLA(taskId: string): Promise<MhdWorkflowSLAStatus> {
    const { data, error } = await supabaseClient.rpc('mhd_workflow_check_sla', { p_task_id: taskId });

    if (error) {
      throw new Error(`Unable to check SLA: ${error.message}`);
    }

    if (!isSlaStatusRow(data)) {
      throw new Error('Unable to check SLA: SLA check returned an unexpected payload');
    }

    return mapSLARow(data);
  },

  async listOverdueTasksForCompany(companyId: string): Promise<MhdWorkflowOverdueTask[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_workflow_list_overdue_tasks', { p_company_id: companyId })
      .returns<OverdueTaskRow[]>();

    if (error) {
      throw new Error(`Unable to list overdue tasks: ${error.message}`);
    }

    return (data ?? []).map(mapOverdueTaskRow);
  },

  async getAvailableTransitions(taskId: string): Promise<MhdWorkflowAvailableTransition[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_workflow_get_available_transitions', { p_task_id: taskId })
      .returns<AvailableTransitionRow[]>();

    if (error) {
      throw new Error(`Unable to load available transitions: ${error.message}`);
    }

    return (data ?? []).map(mapAvailableTransitionRow);
  },
};
