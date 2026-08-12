import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mhdTaskService } from './Service';
import type { MhdCompanyId } from '@/features/companies/Types';
import { mhdToIsoDateString } from '@/utils/mhdDateFormat';
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

const DEFAULT_FILTERS: MhdTaskListFilters = {
  companyId: 'ALL',
  statusId: 'ALL',
  priorityId: 'ALL',
  assignedUserIds: [],
  searchTerm: '',
  dateFilterField: 'due',
  dateFrom: '',
  dateTo: '',
};

export function useMhdTasks(
  context: MhdTaskMutationContext | null,
  initialCompanyId?: MhdCompanyId | '',
) {
  const [tasks, setTasks] = useState<MhdTask[]>([]);
  const [statuses, setStatuses] = useState<MhdTaskStatusOption[]>([]);
  const [priorities, setPriorities] = useState<MhdTaskPriorityOption[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<MhdTaskAssignableUser[]>([]);
  const [filters, setFilters] = useState<MhdTaskListFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialCompanyAppliedRef = useRef(false);

  useEffect(() => {
    if (initialCompanyAppliedRef.current || !initialCompanyId) return;
    setFilters((current) => {
      initialCompanyAppliedRef.current = true;
      return current.companyId === 'ALL' ? { ...current, companyId: initialCompanyId } : current;
    });
  }, [initialCompanyId]);

  const loadReferences = useCallback(async () => {
    const [statusRows, priorityRows, userRows] = await Promise.all([
      mhdTaskService.listStatusOptions(),
      mhdTaskService.listPriorityOptions(),
      mhdTaskService.listAssignableUsers(filters.companyId),
    ]);
    setStatuses(statusRows);
    setPriorities(priorityRows);
    setAssignableUsers(userRows);
  }, [filters.companyId]);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const rows = await mhdTaskService.listTasks(filters);
      setTasks(rows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: fetch-on-mount with loading state
    void loadReferences().catch((error) =>
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load task references.'),
    );
  }, [loadReferences]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: fetch-on-mount with loading state
    void loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(
    async (input: MhdCreateTaskInput) => {
      if (!context) throw new Error('Cannot create task without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdTaskService.createTask(input, context);
        await loadTasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadTasks],
  );

  const updateTask = useCallback(
    async (input: MhdUpdateTaskInput) => {
      if (!context) throw new Error('Cannot update task without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdTaskService.updateTask(input, context);
        await loadTasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadTasks],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!context) throw new Error('Cannot delete task without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdTaskService.deleteTask(taskId, context);
        await loadTasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadTasks],
  );

  const deleteTasks = useCallback(
    async (taskIds: string[]) => {
      if (!context) throw new Error('Cannot delete tasks without an authenticated user context.');
      setIsSaving(true);
      try {
        await Promise.all(taskIds.map((taskId) => mhdTaskService.deleteTask(taskId, context)));
        await loadTasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadTasks],
  );

  const bulkUpdateStatus = useCallback(
    async (taskIds: string[], statusId: string) => {
      if (!context) throw new Error('Cannot update tasks without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdTaskService.bulkUpdateTaskFields({ taskIds, statusId }, context);
        await loadTasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadTasks],
  );

  const bulkUpdatePriority = useCallback(
    async (taskIds: string[], priorityId: string | null) => {
      if (!context) throw new Error('Cannot update tasks without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdTaskService.bulkUpdateTaskFields(
          { taskIds, updatePriority: true, priorityId },
          context,
        );
        await loadTasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadTasks],
  );

  const bulkUpdateAssignees = useCallback(
    async (taskIds: string[], userIds: string[]) => {
      if (!context) throw new Error('Cannot update tasks without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdTaskService.bulkUpdateTaskFields(
          { taskIds, updateAssignees: true, assignedUserIds: userIds },
          context,
        );
        await loadTasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadTasks],
  );

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      overdue: tasks.filter(
        (task) =>
          task.dueDate &&
          !task.completedDate &&
          task.dueDate < mhdToIsoDateString(),
      ).length,
      completed: tasks.filter(
        (task) => task.completedDate !== null || task.statusName === 'Completed',
      ).length,
      unassigned: tasks.filter((task) => task.assignedUserIds.length === 0).length,
    };
  }, [tasks]);

  return {
    tasks,
    statuses,
    priorities,
    assignableUsers,
    filters,
    setFilters,
    isLoading,
    isSaving,
    errorMessage,
    summary,
    refresh: loadTasks,
    createTask,
    updateTask,
    deleteTask,
    deleteTasks,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkUpdateAssignees,
  };
}
