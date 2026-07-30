import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import type {
  MhdCreateSubtaskInput,
  MhdSubtask,
  MhdTaskMutationContext,
  MhdUpdateSubtaskInput,
} from './Types';

type MhdSubtaskRow = {
  id: string;
  reference_id: string;
  task_id: string;
  title: string;
  description_plain_text: string | null;
  description_rich_text: unknown | null;
  status_id: string;
  status_name: string;
  status_color_token: string | null;
  status_category: string;
  priority_id: string | null;
  priority_name: string | null;
  priority_color_token: string | null;
  due_date: string | null;
  manual_progress_percent: number;
  calculated_progress_percent: number;
  overall_progress_percent: number;
  sort_order: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

type MhdSubtaskMutationResultRow = {
  id: string;
  reference_id: string;
};

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapSubtaskRow(row: MhdSubtaskRow): MhdSubtask {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdSubtask['referenceId'],
    taskId: row.task_id,
    title: row.title,
    descriptionPlainText: row.description_plain_text,
    descriptionRichText: row.description_rich_text,
    statusId: row.status_id,
    statusName: row.status_name,
    statusColorToken: row.status_color_token,
    statusCategory: row.status_category,
    priorityId: row.priority_id,
    priorityName: row.priority_name,
    priorityColorToken: row.priority_color_token,
    dueDate: row.due_date,
    manualProgressPercent: row.manual_progress_percent,
    calculatedProgressPercent: row.calculated_progress_percent,
    overallProgressPercent: row.overall_progress_percent,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export const mhdSubtaskService = {
  async listForTask(taskId: string): Promise<MhdSubtask[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_subtasks_for_task', { p_task_id: taskId })
      .returns<MhdSubtaskRow[]>();

    if (error) {
      throw new Error(`Unable to load subtasks: ${error.message}`);
    }

    return (data ?? []).map(mapSubtaskRow);
  },

  async createSubtask(
    input: MhdCreateSubtaskInput,
    context: MhdTaskMutationContext,
  ): Promise<MhdSubtaskMutationResultRow> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_subtask', {
        p_task_id: input.taskId,
        p_title: input.title.trim(),
        p_description_plain_text: emptyToUndefined(input.descriptionPlainText ?? ''),
        p_description_rich_text: (input.descriptionRichText ?? undefined) as Json | undefined,
        p_status_id: input.statusId?.trim() === '' ? undefined : input.statusId,
        p_priority_id: input.priorityId?.trim() === '' ? undefined : input.priorityId,
        p_due_date: emptyToUndefined(input.dueDate ?? ''),
        p_manual_progress_percent: input.manualProgressPercent,
        p_sort_order: input.sortOrder,
        p_actor_user_id: context.actorUserId,
      })
      .returns<MhdSubtaskMutationResultRow[]>();

    if (error) {
      throw new Error(`Unable to create subtask: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create subtask: no record returned.');
    }
    return row;
  },

  async updateSubtask(
    input: MhdUpdateSubtaskInput,
    context: MhdTaskMutationContext,
  ): Promise<MhdSubtaskMutationResultRow> {
    const { data, error } = await supabaseClient
      .rpc('mhd_update_subtask', {
        p_subtask_id: input.subtaskId,
        p_title: input.title.trim(),
        p_description_plain_text: emptyToUndefined(input.descriptionPlainText ?? ''),
        p_description_rich_text: (input.descriptionRichText ?? undefined) as Json | undefined,
        p_status_id: input.statusId?.trim() === '' ? undefined : input.statusId,
        p_priority_id: input.priorityId?.trim() === '' ? undefined : input.priorityId,
        p_due_date: emptyToUndefined(input.dueDate ?? ''),
        p_manual_progress_percent: input.manualProgressPercent,
        p_sort_order: input.sortOrder,
        p_actor_user_id: context.actorUserId,
      })
      .returns<MhdSubtaskMutationResultRow[]>();

    if (error) {
      throw new Error(`Unable to update subtask: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to update subtask: no record returned.');
    }
    return row;
  },

  async deleteSubtask(subtaskId: string, context: MhdTaskMutationContext): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_subtask', {
      p_subtask_id: subtaskId,
      p_actor_user_id: context.actorUserId,
    });

    if (error) {
      throw new Error(`Unable to delete subtask: ${error.message}`);
    }
  },
};
