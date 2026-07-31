import { useMutation, useQuery } from '@tanstack/react-query';
import type { MhdDocumentMutationContext } from '@/features/documents/Types';
import type { MhdTask } from '@/features/tasks/Types';
import { mhdAuditService } from './Service';

export const mhdAuditQueryKeys = {
  taskTimeline: (taskId: string | null) => ['mhd-audit', 'task-timeline', taskId ?? ''] as const,
};

export function useMhdTaskAuditTimeline(taskId: string | null) {
  return useQuery({
    queryKey: mhdAuditQueryKeys.taskTimeline(taskId),
    queryFn: () => mhdAuditService.listTaskAuditTimeline(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useMhdRequestTaskAuditReport(context: MhdDocumentMutationContext | null) {
  return useMutation({
    mutationFn: ({
      task,
      generatedByDisplayName,
    }: {
      task: Pick<
        MhdTask,
        | 'id'
        | 'companyId'
        | 'referenceId'
        | 'title'
        | 'assignedDate'
        | 'startDate'
        | 'dueDate'
        | 'completedDate'
        | 'statusName'
      >;
      generatedByDisplayName: string;
    }) => {
      if (!context) {
        throw new Error('Cannot generate an audit report without an authenticated user.');
      }
      return mhdAuditService.requestTaskAuditReport(task, context, generatedByDisplayName);
    },
  });
}
