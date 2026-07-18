import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import { mhdTaskService } from '@/features/tasks/Service';
import type { MhdTaskMutationContext } from '@/features/tasks/Types';
import type {
  MhdActivityBoardFilters,
  MhdActivityParticipantInput,
  MhdCreateFollowUpTaskInput,
  MhdCreateSubActivityInput,
  MhdUpdateActivityInput,
  MhdUpdateSubActivityInput,
} from './Types';
import { mhdActivityService } from './Service';

const DEFAULT_TASK_FILTERS = {
  companyId: 'ALL',
  statusId: 'ALL',
  priorityId: 'ALL',
  assignedUserId: 'ALL',
  searchTerm: '',
  dueFrom: '',
  dueTo: '',
} as const;

export const mhdActivityQueryKeys = {
  board: (filters: MhdActivityBoardFilters) => ['mhd-activities', 'board', filters] as const,
  detail: (activityId: string | null) => ['mhd-activities', 'detail', activityId ?? ''] as const,
  participants: (activityId: string | null) => ['mhd-activities', 'participants', activityId ?? ''] as const,
  subActivities: (activityId: string | null) => ['mhd-activities', 'sub-activities', activityId ?? ''] as const,
  people: (companyId: string | null) => ['mhd-activities', 'people', companyId ?? 'ALL'] as const,
  users: (companyId: string | null) => ['mhd-activities', 'users', companyId ?? 'ALL'] as const,
  tasks: (companyId: string | null) => ['mhd-activities', 'tasks', companyId ?? 'ALL'] as const,
};

export function useMhdActivities(filters: MhdActivityBoardFilters) {
  return useQuery({
    queryKey: mhdActivityQueryKeys.board(filters),
    queryFn: () => mhdActivityService.listActivities(filters),
  });
}

export function useMhdActivity(activityId: string | null) {
  return useQuery({
    queryKey: mhdActivityQueryKeys.detail(activityId),
    queryFn: () => mhdActivityService.getActivityById(activityId!),
    enabled: Boolean(activityId),
  });
}

export function useMhdActivityParticipants(activityId: string | null) {
  return useQuery({
    queryKey: mhdActivityQueryKeys.participants(activityId),
    queryFn: () => mhdActivityService.listParticipants(activityId!),
    enabled: Boolean(activityId),
  });
}

export function useMhdSubActivities(activityId: string | null) {
  return useQuery({
    queryKey: mhdActivityQueryKeys.subActivities(activityId),
    queryFn: () => mhdActivityService.listSubActivities(activityId!),
    enabled: Boolean(activityId),
  });
}

export function useMhdActivityPeople(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdActivityQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId ?? 'ALL', searchTerm: '' }),
    enabled: enabled && Boolean(companyId),
  });
}

export function useMhdActivityUsers(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdActivityQueryKeys.users(companyId),
    queryFn: () => mhdTaskService.listAssignableUsers(companyId ?? 'ALL'),
    enabled: enabled && Boolean(companyId),
  });
}

export function useMhdActivityTasks(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdActivityQueryKeys.tasks(companyId),
    queryFn: () =>
      mhdTaskService.listTasks({
        ...DEFAULT_TASK_FILTERS,
        companyId: companyId ?? 'ALL',
      }),
    enabled: enabled && Boolean(companyId),
  });
}

export function useMhdActivityActions() {
  const queryClient = useQueryClient();

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mhd-activities'] }),
      queryClient.invalidateQueries({ queryKey: ['mhd-person'] }),
    ]);
  }

  const createActivity = useMutation({
    mutationFn: (input: MhdUpdateActivityInput) => mhdActivityService.createActivity(input),
    onSuccess: invalidate,
  });

  const updateActivity = useMutation({
    mutationFn: ({ activityId, input }: { activityId: string; input: MhdUpdateActivityInput }) =>
      mhdActivityService.updateActivity(activityId, input),
    onSuccess: invalidate,
  });

  const deleteActivity = useMutation({
    mutationFn: ({ activityId, actorUserId }: { activityId: string; actorUserId?: string | null }) =>
      mhdActivityService.deleteActivity(activityId, actorUserId),
    onSuccess: invalidate,
  });

  const addParticipant = useMutation({
    mutationFn: ({ activityId, input }: { activityId: string; input: MhdActivityParticipantInput }) =>
      mhdActivityService.addParticipant(activityId, input),
    onSuccess: invalidate,
  });

  const removeParticipant = useMutation({
    mutationFn: (participantId: string) => mhdActivityService.removeParticipant(participantId),
    onSuccess: invalidate,
  });

  const createSubActivity = useMutation({
    mutationFn: (input: MhdCreateSubActivityInput) => mhdActivityService.createSubActivity(input),
    onSuccess: invalidate,
  });

  const updateSubActivity = useMutation({
    mutationFn: ({ subActivityId, input }: { subActivityId: string; input: MhdUpdateSubActivityInput }) =>
      mhdActivityService.updateSubActivity(subActivityId, input),
    onSuccess: invalidate,
  });

  const deleteSubActivity = useMutation({
    mutationFn: (subActivityId: string) => mhdActivityService.deleteSubActivity(subActivityId),
    onSuccess: invalidate,
  });

  const createFollowUpTask = useMutation({
    mutationFn: ({
      activityId,
      input,
      context,
    }: {
      activityId: string;
      input: MhdCreateFollowUpTaskInput;
      context: MhdTaskMutationContext;
    }) => mhdActivityService.createFollowUpTask(activityId, input, context),
    onSuccess: invalidate,
  });

  return {
    createActivity,
    updateActivity,
    deleteActivity,
    addParticipant,
    removeParticipant,
    createSubActivity,
    updateSubActivity,
    deleteSubActivity,
    createFollowUpTask,
  };
}
