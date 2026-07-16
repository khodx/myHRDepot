/**
 * MhdTaskDetailPage
 *
 * Route: /tasks/:taskId
 * Read-only task detail view anchored to the real Tasks service.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdBreadcrumb } from './MhdBreadcrumb';
import { mhdTaskService } from '@/features/tasks/Service';
import { MhdTaskNotesPanel } from '@/features/notes/components/MhdTaskNotesPanel';
import { MhdTaskAttachmentsPanel } from '@/features/attachments/components/MhdTaskAttachmentsPanel';

export function MhdTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['mhd-task', taskId],
    queryFn: () => mhdTaskService.getTaskById(taskId!),
    enabled: !!taskId,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading task...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {(error as Error)?.message ?? 'Task not found'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  const progressPercent = task.calculatedProgressPercent ?? task.manualProgressPercent;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <MhdBreadcrumb items={[{ label: 'Tasks', to: '/tasks' }, { label: task.referenceId }]} />

      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">{task.referenceId}</p>
            <h1 className="mt-0.5 text-xl font-semibold text-neutral-900">{task.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">{task.companyName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-sm text-neutral-600">
            <span>{task.statusName}</span>
            <span>{task.priorityName ?? 'No priority'}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
          {task.dueDate ? <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span> : null}
          {task.assignedDisplayNames.length > 0 ? <span>Assigned: {task.assignedDisplayNames.join(', ')}</span> : null}
          <span>Progress: {progressPercent}%</span>
          <span>Notes: {task.noteCount}</span>
          <span>Attachments: {task.attachmentCount}</span>
        </div>

        {task.descriptionPlainText ? (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="whitespace-pre-wrap text-sm text-neutral-700">{task.descriptionPlainText}</p>
          </div>
        ) : null}

        <div className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-400">
          <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Polymorphic panels (entity_type = 'TASK'): notes/comments and Drive-backed attachments. */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Attachments</h2>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <MhdTaskAttachmentsPanel taskId={task.id} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Notes & Comments</h2>
        <MhdTaskNotesPanel taskId={task.id} />
      </section>
    </div>
  );
}
