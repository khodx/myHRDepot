import { useCallback, useEffect, useState } from 'react';
import { mhdSubtaskService } from './SubtaskService';
import type {
  MhdCreateSubtaskInput,
  MhdSubtask,
  MhdTaskMutationContext,
  MhdUpdateSubtaskInput,
} from './Types';

export function useMhdSubtasks(taskId: string, context: MhdTaskMutationContext | null) {
  const [subtasks, setSubtasks] = useState<MhdSubtask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSubtasks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const rows = await mhdSubtaskService.listForTask(taskId);
      setSubtasks(rows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load subtasks.');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: fetch-on-mount with loading state
    void loadSubtasks();
  }, [loadSubtasks]);

  const createSubtask = useCallback(
    async (input: MhdCreateSubtaskInput) => {
      if (!context) throw new Error('Cannot create subtask without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdSubtaskService.createSubtask(input, context);
        await loadSubtasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadSubtasks],
  );

  const updateSubtask = useCallback(
    async (input: MhdUpdateSubtaskInput) => {
      if (!context) throw new Error('Cannot update subtask without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdSubtaskService.updateSubtask(input, context);
        await loadSubtasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadSubtasks],
  );

  const deleteSubtask = useCallback(
    async (subtaskId: string) => {
      if (!context) throw new Error('Cannot delete subtask without an authenticated user context.');
      setIsSaving(true);
      try {
        await mhdSubtaskService.deleteSubtask(subtaskId, context);
        await loadSubtasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, loadSubtasks],
  );

  const reorderSubtask = useCallback(
    async (subtask: MhdSubtask, direction: 'up' | 'down') => {
      if (!context) throw new Error('Cannot reorder subtasks without an authenticated user context.');
      const ordered = [...subtasks].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = ordered.findIndex((item) => item.id === subtask.id);
      const swapWith = direction === 'up' ? ordered[index - 1] : ordered[index + 1];
      if (!swapWith) return;

      setIsSaving(true);
      try {
        await mhdSubtaskService.updateSubtask(toUpdateInput(subtask, swapWith.sortOrder), context);
        await mhdSubtaskService.updateSubtask(toUpdateInput(swapWith, subtask.sortOrder), context);
        await loadSubtasks();
      } finally {
        setIsSaving(false);
      }
    },
    [context, subtasks, loadSubtasks],
  );

  return {
    subtasks,
    isLoading,
    isSaving,
    errorMessage,
    refresh: loadSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtask,
  };
}

function toUpdateInput(subtask: MhdSubtask, sortOrder: number): MhdUpdateSubtaskInput {
  return {
    subtaskId: subtask.id,
    taskId: subtask.taskId,
    title: subtask.title,
    descriptionPlainText: subtask.descriptionPlainText,
    descriptionRichText: subtask.descriptionRichText,
    statusId: subtask.statusId,
    priorityId: subtask.priorityId ?? '',
    dueDate: subtask.dueDate ?? undefined,
    manualProgressPercent: subtask.manualProgressPercent,
    sortOrder,
  };
}
