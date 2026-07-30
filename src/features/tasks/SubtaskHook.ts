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

  return {
    subtasks,
    isLoading,
    isSaving,
    errorMessage,
    refresh: loadSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
  };
}
