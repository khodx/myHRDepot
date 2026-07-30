import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskRecordTabs } from '@/appshell/components/MhdTaskRecordTabs';
import { mhdTaskService } from '@/features/tasks/Service';
import { MhdDocumentGenerationPanel } from './MhdDocumentGenerationPanel';

/**
 * Route: /tasks/:taskId/reports
 * Full-page Reports view for a task, next to Notes/Activities/Attachments.
 * Generate Report and Upload Completed Document are the only modals here
 * (see MhdDocumentGenerationPanel) — everything else renders inline.
 */
export function MhdTaskReportsPage() {
  const { taskId } = useParams<{ taskId: string }>();

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['mhd-task', taskId],
    queryFn: () => mhdTaskService.getTaskById(taskId!),
    enabled: !!taskId,
  });

  if (!taskId) return <Navigate to="/tasks" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader backTo={`/tasks/${taskId}`} backLabel="Task" title="Task Reports" />

      <MhdTaskRecordTabs taskId={taskId} active="reports" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading task...</p>
      ) : error || !task ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error)?.message ?? 'Task not found'}
        </p>
      ) : (
        <MhdDocumentGenerationPanel
          entityType="TASK"
          entityId={task.id}
          companyId={task.companyId}
          masterTemplateKey="TASK_MASTER_ALL_FIELDS"
          defaultMergeData={{
            'task.reference_id': task.referenceId,
            'task.title': task.title,
            'task.company_name': task.companyName,
            'task.status_name': task.statusName,
            'task.priority_name': task.priorityName ?? '',
            'task.assigned_date': task.assignedDate,
            'task.start_date': task.startDate ?? '',
            'task.due_date': task.dueDate ?? '',
            'task.completed_date': task.completedDate ?? '',
            'task.manual_progress_percent': String(task.manualProgressPercent),
            'task.calculated_progress_percent': String(task.calculatedProgressPercent ?? ''),
            'task.assigned_display_names': task.assignedDisplayNames.join(', '),
            'task.description_plain_text': task.descriptionPlainText ?? '',
            'task.detailed_instructions_plain_text': task.detailedInstructionsPlainText ?? '',
            'task.note_count': String(task.noteCount),
            'task.attachment_count': String(task.attachmentCount),
            'task.created_at': task.createdAt,
            'task.updated_at': task.updatedAt,
          }}
        />
      )}
    </div>
  );
}
