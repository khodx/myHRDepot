import { mhdTaskService } from '@/features/tasks/Service';
import type { MhdTaskMutationContext } from '@/features/tasks/Types';
import type { Json } from '@/types/database.types';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdActivity,
  MhdActivityBoardFilters,
  MhdActivityMutationResultRow,
  MhdActivityParticipant,
  MhdActivityParticipantInput,
  MhdActivityParticipantListRow,
  MhdActivityListRow,
  MhdCreateFollowUpTaskInput,
  MhdCreateSubActivityInput,
  MhdSubActivity,
  MhdSubActivityListRow,
  MhdUpdateActivityInput,
  MhdUpdateSubActivityInput,
} from './Types';

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function filterValueOrUndefined(value?: string | null): string | undefined {
  if (!value || value === 'ALL') return undefined;
  return value;
}

function dateFilterBoundary(value: string, boundary: 'start' | 'end'): string {
  return boundary === 'start' ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`;
}

function formatDateOnly(isoLike: string | null | undefined): string {
  if (!isoLike) return new Date().toISOString().slice(0, 10);
  return new Date(isoLike).toISOString().slice(0, 10);
}

function mapParticipantInput(participant: MhdActivityParticipantInput): Json {
  return {
    ...(participant.userId ? { user_id: participant.userId } : {}),
    ...(participant.personId ? { person_id: participant.personId } : {}),
    role: participant.role,
  } as Json;
}

function mapActivityRow(row: MhdActivityListRow): MhdActivity {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdActivity['referenceId'],
    companyId: row.company_id,
    companyName: row.company_name,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    parentTaskId: row.parent_task_id,
    activityType: row.activity_type as MhdActivity['activityType'],
    title: row.title,
    descriptionPlainText: row.description_plain_text,
    descriptionRichText: (row.description_rich_text ?? null) as Json | null,
    status: row.status as MhdActivity['status'],
    scheduledAt: row.scheduled_at,
    occurredAt: row.occurred_at,
    durationMinutes: row.duration_minutes,
    location: row.location,
    outcomeSummary: row.outcome_summary,
    followUpTaskId: row.follow_up_task_id,
    isConfidential: row.is_confidential,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    participantDisplayNames: row.participant_display_names ?? [],
    subActivityTotalCount: Number(row.sub_activity_total_count),
    subActivityDoneCount: Number(row.sub_activity_done_count),
    noteCount: Number(row.note_count),
    attachmentCount: Number(row.attachment_count),
  };
}

function mapParticipantRow(row: MhdActivityParticipantListRow): MhdActivityParticipant {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdActivityParticipant['referenceId'],
    activityId: row.activity_id,
    userId: row.user_id,
    personId: row.person_id,
    participantRole: row.participant_role as MhdActivityParticipant['participantRole'],
    displayName: row.display_name,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapSubActivityRow(row: MhdSubActivityListRow): MhdSubActivity {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdSubActivity['referenceId'],
    activityId: row.activity_id,
    title: row.title,
    descriptionPlainText: row.description_plain_text,
    status: row.status as MhdSubActivity['status'],
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

async function getDefaultTaskStatusId(): Promise<string> {
  const { data, error } = await supabaseClient.rpc('mhd_get_default_task_status_id');
  if (error) {
    throw new Error(`Unable to load default task status: ${error.message}`);
  }
  if (!data) {
    throw new Error('Unable to load default task status: no id returned.');
  }
  return data;
}

async function getDefaultTaskPriorityId(): Promise<string> {
  const { data, error } = await supabaseClient.rpc('mhd_get_default_task_priority_id');
  if (error) {
    throw new Error(`Unable to load default task priority: ${error.message}`);
  }
  return data ?? '';
}

export const mhdActivityService = {
  async listActivities(filters: MhdActivityBoardFilters): Promise<MhdActivity[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_activity_board', {
        ...(filterValueOrUndefined(filters.companyId)
          ? { p_company_id: filterValueOrUndefined(filters.companyId) }
          : {}),
        ...(filterValueOrUndefined(filters.personId)
          ? { p_person_id: filterValueOrUndefined(filters.personId) }
          : {}),
        ...(filterValueOrUndefined(filters.taskId)
          ? { p_task_id: filterValueOrUndefined(filters.taskId) }
          : {}),
        ...(filters.activityType !== 'ALL' ? { p_activity_type: filters.activityType } : {}),
        ...(filters.status !== 'ALL' ? { p_status: filters.status } : {}),
        ...(trimmedOrUndefined(filters.searchTerm)
          ? { p_search_term: trimmedOrUndefined(filters.searchTerm) }
          : {}),
        ...(trimmedOrUndefined(filters.from)
          ? { p_from: dateFilterBoundary(filters.from, 'start') }
          : {}),
        ...(trimmedOrUndefined(filters.to) ? { p_to: dateFilterBoundary(filters.to, 'end') } : {}),
      })
      .returns<MhdActivityListRow[]>();

    if (error) {
      throw new Error(`Unable to load activities: ${error.message}`);
    }

    return (data ?? []).map(mapActivityRow);
  },

  async getActivityById(activityId: string): Promise<MhdActivity> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_activity_by_id', { p_activity_id: activityId })
      .returns<MhdActivityListRow[]>();

    if (error) {
      throw new Error(`Unable to load activity: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    return mapActivityRow(row);
  },

  async createActivity(input: MhdUpdateActivityInput): Promise<MhdActivity> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_activity', {
        p_company_id: input.companyId,
        p_activity_type: input.activityType,
        p_title: input.title.trim(),
        ...(input.personId ? { p_person_id: input.personId } : {}),
        ...(input.parentTaskId ? { p_parent_task_id: input.parentTaskId } : {}),
        ...(trimmedOrUndefined(input.descriptionPlainText)
          ? { p_description_plain_text: trimmedOrUndefined(input.descriptionPlainText) }
          : {}),
        ...(input.descriptionRichText != null
          ? { p_description_rich_text: input.descriptionRichText }
          : {}),
        ...(trimmedOrUndefined(input.scheduledAt)
          ? { p_scheduled_at: trimmedOrUndefined(input.scheduledAt) }
          : {}),
        ...(trimmedOrUndefined(input.location)
          ? { p_location: trimmedOrUndefined(input.location) }
          : {}),
        ...(input.isConfidential !== undefined ? { p_is_confidential: input.isConfidential } : {}),
        ...(input.participants && input.participants.length > 0
          ? { p_participants: input.participants.map(mapParticipantInput) }
          : {}),
        ...(input.actorUserId ? { p_actor_user_id: input.actorUserId } : {}),
      })
      .returns<MhdActivityMutationResultRow[]>();

    if (error) {
      throw new Error(`Unable to create activity: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create activity: no record returned.');
    }

    return mhdActivityService.getActivityById(row.id);
  },

  async updateActivity(activityId: string, input: MhdUpdateActivityInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_activity', {
      p_activity_id: activityId,
      p_activity_type: input.activityType,
      p_title: input.title.trim(),
      ...(input.personId ? { p_person_id: input.personId } : {}),
      ...(input.parentTaskId ? { p_parent_task_id: input.parentTaskId } : {}),
      ...(trimmedOrUndefined(input.descriptionPlainText)
        ? { p_description_plain_text: trimmedOrUndefined(input.descriptionPlainText) }
        : {}),
      ...(input.descriptionRichText != null
        ? { p_description_rich_text: input.descriptionRichText }
        : {}),
      ...(trimmedOrUndefined(input.scheduledAt)
        ? { p_scheduled_at: trimmedOrUndefined(input.scheduledAt) }
        : {}),
      ...(trimmedOrUndefined(input.location)
        ? { p_location: trimmedOrUndefined(input.location) }
        : {}),
      ...(input.isConfidential !== undefined ? { p_is_confidential: input.isConfidential } : {}),
      ...(input.status ? { p_status: input.status } : {}),
      ...(trimmedOrUndefined(input.occurredAt)
        ? { p_occurred_at: trimmedOrUndefined(input.occurredAt) }
        : {}),
      ...(input.durationMinutes != null ? { p_duration_minutes: input.durationMinutes } : {}),
      ...(trimmedOrUndefined(input.outcomeSummary)
        ? { p_outcome_summary: trimmedOrUndefined(input.outcomeSummary) }
        : {}),
      ...(input.followUpTaskId ? { p_follow_up_task_id: input.followUpTaskId } : {}),
    });

    if (error) {
      throw new Error(`Unable to update activity: ${error.message}`);
    }
  },

  async deleteActivity(activityId: string, actorUserId?: string | null): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_activity', {
      p_activity_id: activityId,
      ...(actorUserId ? { p_actor_user_id: actorUserId } : {}),
    });

    if (error) {
      throw new Error(`Unable to delete activity: ${error.message}`);
    }
  },

  async listParticipants(activityId: string): Promise<MhdActivityParticipant[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_activity_participants', { p_activity_id: activityId })
      .returns<MhdActivityParticipantListRow[]>();

    if (error) {
      throw new Error(`Unable to load activity participants: ${error.message}`);
    }

    return (data ?? []).map(mapParticipantRow);
  },

  async addParticipant(activityId: string, input: MhdActivityParticipantInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_add_activity_participant', {
      p_activity_id: activityId,
      ...(input.userId ? { p_user_id: input.userId } : {}),
      ...(input.personId ? { p_person_id: input.personId } : {}),
      p_role: input.role,
    });

    if (error) {
      throw new Error(`Unable to add activity participant: ${error.message}`);
    }
  },

  async removeParticipant(participantId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_remove_activity_participant', {
      p_participant_id: participantId,
    });

    if (error) {
      throw new Error(`Unable to remove activity participant: ${error.message}`);
    }
  },

  async listSubActivities(activityId: string): Promise<MhdSubActivity[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_sub_activities', { p_activity_id: activityId })
      .returns<MhdSubActivityListRow[]>();

    if (error) {
      throw new Error(`Unable to load sub-activities: ${error.message}`);
    }

    return (data ?? []).map(mapSubActivityRow);
  },

  async createSubActivity(input: MhdCreateSubActivityInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_create_sub_activity', {
      p_activity_id: input.activityId,
      p_title: input.title.trim(),
      ...(trimmedOrUndefined(input.descriptionPlainText)
        ? { p_description_plain_text: trimmedOrUndefined(input.descriptionPlainText) }
        : {}),
      ...(trimmedOrUndefined(input.scheduledAt)
        ? { p_scheduled_at: trimmedOrUndefined(input.scheduledAt) }
        : {}),
      ...(input.sortOrder !== undefined ? { p_sort_order: input.sortOrder } : {}),
    });

    if (error) {
      throw new Error(`Unable to create sub-activity: ${error.message}`);
    }
  },

  async updateSubActivity(subActivityId: string, input: MhdUpdateSubActivityInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_sub_activity', {
      p_sub_activity_id: subActivityId,
      ...(trimmedOrUndefined(input.title) ? { p_title: trimmedOrUndefined(input.title) } : {}),
      ...(trimmedOrUndefined(input.descriptionPlainText)
        ? { p_description_plain_text: trimmedOrUndefined(input.descriptionPlainText) }
        : {}),
      ...(input.status ? { p_status: input.status } : {}),
      ...(trimmedOrUndefined(input.scheduledAt)
        ? { p_scheduled_at: trimmedOrUndefined(input.scheduledAt) }
        : {}),
      ...(input.sortOrder !== undefined ? { p_sort_order: input.sortOrder } : {}),
    });

    if (error) {
      throw new Error(`Unable to update sub-activity: ${error.message}`);
    }
  },

  async deleteSubActivity(subActivityId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_sub_activity', {
      p_sub_activity_id: subActivityId,
    });

    if (error) {
      throw new Error(`Unable to delete sub-activity: ${error.message}`);
    }
  },

  async createFollowUpTask(
    activityId: string,
    input: MhdCreateFollowUpTaskInput,
    context: MhdTaskMutationContext,
  ): Promise<MhdActivity> {
    const activity = await mhdActivityService.getActivityById(activityId);
    const [statusId, priorityId] = await Promise.all([
      getDefaultTaskStatusId(),
      getDefaultTaskPriorityId(),
    ]);

    const task = await mhdTaskService.createTask(
      {
        companyId: activity.companyId,
        title: input.title.trim(),
        descriptionPlainText:
          trimmedOrUndefined(input.descriptionPlainText) ??
          activity.outcomeSummary ??
          activity.title,
        descriptionRichText: input.descriptionRichText ?? null,
        detailedInstructionsPlainText: '',
        statusId,
        priorityId,
        startDate: formatDateOnly(activity.occurredAt ?? activity.scheduledAt),
        dueDate: '',
        manualProgressPercent: 0,
        assignedUserIds: [],
      },
      context,
    );

    await mhdActivityService.updateActivity(activityId, {
      companyId: activity.companyId,
      activityType: activity.activityType,
      title: activity.title,
      personId: activity.personId,
      parentTaskId: activity.parentTaskId,
      descriptionPlainText: activity.descriptionPlainText,
      descriptionRichText: activity.descriptionRichText,
      status: activity.status,
      scheduledAt: activity.scheduledAt,
      occurredAt: activity.occurredAt,
      durationMinutes: activity.durationMinutes,
      location: activity.location,
      outcomeSummary: activity.outcomeSummary,
      followUpTaskId: task.id,
      isConfidential: activity.isConfidential,
    });

    return mhdActivityService.getActivityById(activityId);
  },
};
