import { useCallback, useEffect, useMemo, useState } from 'react';
import { mhdTaskService } from './Service';
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
  assignedUserId: 'ALL',
  searchTerm: '',
  dueFrom: '',
  dueTo: '',
};

export function useMhdTasks(context: MhdTaskMutationContext | null) {
  const [tasks, setTasks] = useState<MhdTask[]>([]);
  const [statuses, setStatuses] = useState<MhdTaskStatusOption[]>([]);
  const [priorities, setPriorities] = useState<MhdTaskPriorityOption[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<MhdTaskAssignableUser[]>([]);
  const [filters, setFilters] = useState<MhdTaskListFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    void loadReferences().catch((error) => setErrorMessage(error instanceof Error ? error.message : 'Unable to load task references.'));
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

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      overdue: tasks.filter((task) => task.dueDate && !task.completedDate && task.dueDate < new Date().toISOString().slice(0, 10)).length,
      completed: tasks.filter((task) => task.completedDate !== null || task.statusName === 'Completed').length,
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
  };
}
