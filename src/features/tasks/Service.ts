import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import type {
  MhdCreateTaskInput,
  MhdTask,
  MhdTaskAssignableUser,
  MhdTaskListFilters,
  MhdTaskMutationContext,
  MhdTaskPriorityOption,
  MhdTaskStatusOption,
  MhdUpdateTaskInput,
} from './Types';

type MhdTaskBoardRow = {
  id: string;
  reference_id: string;
  company_id: string;
  company_name: string;
  title: string;
  description_plain_text: string | null;
  description_rich_text: unknown | null;
  detailed_instructions_plain_text: string | null;
  detailed_instructions_rich_text: unknown | null;
  status_id: string;
  status_name: string;
  status_color_token: string | null;
  priority_id: string | null;
  priority_name: string | null;
  priority_color_token: string | null;
  assigned_date: string;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  manual_progress_percent: number;
  // Null when the task has zero subtasks; maintained by
  // mhd_trg_recalculate_task_progress, never set by create/update RPCs.
  calculated_progress_percent: number | null;
  assigned_user_ids: string[] | null;
  assigned_display_names: string[] | null;
  note_count: number;
  attachment_count: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

// Matches mhd_list_task_status_options: statuses is a flat shared lookup
// with a `category` column and no reference_id (see Types.ts / database.types.ts).
type MhdStatusOptionRow = {
  id: string;
  status_name: string;
  category: string;
  display_order: number;
  color_token: string | null;
};

// Matches mhd_list_task_priority_options: no reference_id column.
type MhdPriorityOptionRow = {
  id: string;
  priority_name: string;
  display_order: number;
  color_token: string | null;
};

type MhdAssignableUserRow = {
  id: string;
  person_id: string;
  company_id: string;
  display_name: string;
  email: string | null;
};

type MhdTaskMutationResultRow = {
  id: string;
  reference_id: string;
};

// RPC args are typed optional (`p_x?: string`) in the generated
// database.types.ts — omitted args fall back to their SQL default of NULL, so
// blank strings are converted to `undefined` rather than `null` here.
function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function dateToUndefined(value: string): string | undefined {
  return value.trim().length > 0 ? value.trim() : undefined;
}

function mapTaskRow(row: MhdTaskBoardRow): MhdTask {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTask['referenceId'],
    companyId: row.company_id,
    companyName: row.company_name,
    title: row.title,
    descriptionPlainText: row.description_plain_text,
    descriptionRichText: row.description_rich_text,
    detailedInstructionsPlainText: row.detailed_instructions_plain_text,
    detailedInstructionsRichText: row.detailed_instructions_rich_text,
    statusId: row.status_id,
    statusName: row.status_name,
    statusColorToken: row.status_color_token,
    priorityId: row.priority_id,
    priorityName: row.priority_name,
    priorityColorToken: row.priority_color_token,
    assignedDate: row.assigned_date,
    startDate: row.start_date,
    dueDate: row.due_date,
    completedDate: row.completed_date,
    manualProgressPercent: row.manual_progress_percent,
    calculatedProgressPercent: row.calculated_progress_percent,
    assignedUserIds: row.assigned_user_ids ?? [],
    assignedDisplayNames: row.assigned_display_names ?? [],
    noteCount: Number(row.note_count),
    attachmentCount: Number(row.attachment_count),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export const mhdTaskService = {
  async getTaskById(taskId: string): Promise<MhdTask> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_task_by_id', { p_task_id: taskId })
      .returns<MhdTaskBoardRow[]>();

    if (error) {
      throw new Error(`Unable to load task: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return mapTaskRow(row);
  },

  async listTasks(filters: MhdTaskListFilters): Promise<MhdTask[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_task_board', {
        p_company_id: filters.companyId === 'ALL' ? undefined : filters.companyId,
        p_status_id: filters.statusId === 'ALL' ? undefined : filters.statusId,
        p_priority_id: filters.priorityId === 'ALL' ? undefined : filters.priorityId,
        p_assigned_user_id: filters.assignedUserId === 'ALL' ? undefined : filters.assignedUserId,
        p_search_term: emptyToUndefined(filters.searchTerm),
        p_due_from: dateToUndefined(filters.dueFrom),
        p_due_to: dateToUndefined(filters.dueTo),
      })
      .returns<MhdTaskBoardRow[]>();

    if (error) {
      throw new Error(`Unable to load tasks: ${error.message}`);
    }

    return (data ?? []).map(mapTaskRow);
  },

  async listStatusOptions(): Promise<MhdTaskStatusOption[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_task_status_options')
      .returns<MhdStatusOptionRow[]>();

    if (error) {
      throw new Error(`Unable to load task statuses: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      statusName: row.status_name,
      category: row.category,
      displayOrder: row.display_order,
      colorToken: row.color_token,
    }));
  },

  async listPriorityOptions(): Promise<MhdTaskPriorityOption[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_task_priority_options')
      .returns<MhdPriorityOptionRow[]>();

    if (error) {
      throw new Error(`Unable to load task priorities: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      priorityName: row.priority_name,
      displayOrder: row.display_order,
      colorToken: row.color_token,
    }));
  },

  async listAssignableUsers(companyId: string | 'ALL'): Promise<MhdTaskAssignableUser[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_task_assignable_users', {
        p_company_id: companyId === 'ALL' ? undefined : companyId,
      })
      .returns<MhdAssignableUserRow[]>();

    if (error) {
      throw new Error(`Unable to load assignable users: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      personId: row.person_id,
      companyId: row.company_id,
      displayName: row.display_name,
      email: row.email ?? '',
    }));
  },

  async createTask(
    input: MhdCreateTaskInput,
    context: MhdTaskMutationContext,
  ): Promise<MhdTaskMutationResultRow> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_task', {
        p_company_id: input.companyId,
        p_title: input.title.trim(),
        p_description_plain_text: emptyToUndefined(input.descriptionPlainText),
        p_status_id: input.statusId,
        p_priority_id: input.priorityId.trim() === '' ? undefined : input.priorityId,
        p_start_date: dateToUndefined(input.startDate),
        p_due_date: dateToUndefined(input.dueDate),
        p_manual_progress_percent: input.manualProgressPercent,
        p_assigned_user_ids: input.assignedUserIds,
        p_actor_user_id: context.actorUserId,
        p_description_rich_text: (input.descriptionRichText ?? undefined) as Json | undefined,
        p_detailed_instructions_plain_text: emptyToUndefined(input.detailedInstructionsPlainText),
        p_detailed_instructions_rich_text: (input.detailedInstructionsRichText ??
          undefined) as Json | undefined,
      })
      .returns<MhdTaskMutationResultRow[]>();

    if (error) {
      throw new Error(`Unable to create task: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create task: no record returned.');
    }
    return row;
  },

  async updateTask(
    input: MhdUpdateTaskInput,
    context: MhdTaskMutationContext,
  ): Promise<MhdTaskMutationResultRow> {
    const { data, error } = await supabaseClient
      .rpc('mhd_update_task', {
        p_task_id: input.taskId,
        p_company_id: input.companyId,
        p_title: input.title.trim(),
        p_description_plain_text: emptyToUndefined(input.descriptionPlainText),
        p_status_id: input.statusId,
        p_priority_id: input.priorityId.trim() === '' ? undefined : input.priorityId,
        p_start_date: dateToUndefined(input.startDate),
        p_due_date: dateToUndefined(input.dueDate),
        p_completed_date: dateToUndefined(input.completedDate),
        p_manual_progress_percent: input.manualProgressPercent,
        p_assigned_user_ids: input.assignedUserIds,
        p_actor_user_id: context.actorUserId,
        p_description_rich_text: (input.descriptionRichText ?? undefined) as Json | undefined,
        p_detailed_instructions_plain_text: emptyToUndefined(input.detailedInstructionsPlainText),
        p_detailed_instructions_rich_text: (input.detailedInstructionsRichText ??
          undefined) as Json | undefined,
      })
      .returns<MhdTaskMutationResultRow[]>();

    if (error) {
      throw new Error(`Unable to update task: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to update task: no record returned.');
    }
    return row;
  },

  async deleteTask(taskId: string, context: MhdTaskMutationContext): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_task', {
      p_task_id: taskId,
      p_actor_user_id: context.actorUserId,
    });

    if (error) {
      throw new Error(`Unable to delete task: ${error.message}`);
    }
  },
};
