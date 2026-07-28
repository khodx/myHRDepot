import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdBreadcrumb } from './MhdBreadcrumb';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdTaskService } from '@/features/tasks/Service';
import { MhdTaskNotesPanel } from '@/features/notes/components/MhdTaskNotesPanel';
import { MhdTaskAttachmentsPanel } from '@/features/attachments/components/MhdTaskAttachmentsPanel';
import { MhdTaskActivitiesPanel } from '@/features/activities/components/MhdTaskActivitiesPanel';
import { mhdWorkflowService } from '@/features/workflow/Service';
import { MhdStatusTransitionButton } from '@/features/workflow/components/MhdStatusTransitionButton';
import { MhdSLAStatus } from '@/features/workflow/components/MhdSLAStatus';
import { MhdWorkflowStateVisualization } from '@/features/workflow/components/MhdWorkflowStateVisualization';
import { MhdWorkflowTransitionHistory } from '@/features/workflow/components/MhdWorkflowTransitionHistory';
import { MhdApprovalRequest } from '@/features/approvals/components/MhdApprovalRequest';
import { MhdApprovalHistory } from '@/features/approvals/components/MhdApprovalHistory';
import { mhdCanMutateWorkflowApprovals } from '@/appshell/mhdRouteAccess';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml } from '@/components/ui/MhdRichTextUtils';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdTaskRecordTabs } from './MhdTaskRecordTabs';
import { useState } from 'react';

export function MhdTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const [workflowRefreshKey, setWorkflowRefreshKey] = useState(0);
  const canMutateWorkflowApprovals = mhdCanMutateWorkflowApprovals(roles);

  const {
    data: task,
    isLoading,
    error,
    refetch: refetchTask,
  } = useQuery({
    queryKey: ['mhd-task', taskId, workflowRefreshKey],
    queryFn: () => mhdTaskService.getTaskById(taskId!),
    enabled: !!taskId,
  });

  const { data: availableTransitions = [] } = useQuery({
    queryKey: ['mhd-workflow-available-transitions', taskId, workflowRefreshKey],
    queryFn: () => mhdWorkflowService.getAvailableTransitions(taskId!),
    enabled: !!taskId,
  });

  const { data: approverOptions = [] } = useQuery({
    queryKey: ['mhd-task-approver-options', task?.companyId],
    queryFn: async () => {
      const users = await mhdTaskService.listAssignableUsers(task!.companyId);
      return users.map((user) => ({ id: user.id, displayName: user.displayName }));
    },
    enabled: !!task?.companyId,
  });

  async function refreshWorkflowAndApprovals() {
    await refetchTask();
    setWorkflowRefreshKey((current) => current + 1);
  }

  async function handleDeleteTask() {
    if (!task || !profile?.userId) return;
    await mhdTaskService.deleteTask(task.id, { actorUserId: profile.userId });
    navigate('/tasks');
  }

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
        <p className="text-sm text-red-600">{(error as Error)?.message ?? 'Task not found'}</p>
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
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <MhdBreadcrumb items={[{ label: 'Tasks', to: '/tasks' }, { label: task.referenceId }]} />

      <MhdTaskRecordTabs taskId={task.id} active="detail" />

      <div className="rounded-lg border border-neutral-200 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">{task.referenceId}</p>
            <h1 className="mt-0.5 text-xl font-semibold text-neutral-900">{task.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">{task.companyName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <MhdDetailActions
              editTo={`/tasks/${task.id}/edit`}
              onDelete={profile?.userId ? handleDeleteTask : undefined}
              deleteConfirmMessage={`Delete task "${task.title}"? This cannot be undone.`}
            />
            <MhdStatusTransitionButton
              taskId={task.id}
              currentStatusId={task.statusId}
              currentStatusName={task.statusName}
              onTransitionSuccess={refreshWorkflowAndApprovals}
              disabled={!canMutateWorkflowApprovals || !profile?.userId}
            />
            <div className="flex flex-col items-end gap-1 text-sm text-neutral-600">
              <span>{task.priorityName ?? 'No priority'}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
          {task.dueDate ? <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span> : null}
          {task.assignedDisplayNames.length > 0 ? (
            <span>Assigned: {task.assignedDisplayNames.join(', ')}</span>
          ) : null}
          <span>Progress: {progressPercent}%</span>
          <span>Notes: {task.noteCount}</span>
          <span>Attachments: {task.attachmentCount}</span>
        </div>

        {task.descriptionRichText || task.descriptionPlainText ? (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <MhdRichTextRenderer
              html={mhdDocumentToRichHtml(
                task.descriptionRichText,
                task.descriptionPlainText ?? '',
              )}
              className="text-neutral-700"
            />
          </div>
        ) : null}

        <div className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-400">
          <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Workflow</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Live status, transition path, and SLA state for this task.
                </p>
              </div>
              <MhdSLAStatus key={`sla-${task.id}-${workflowRefreshKey}`} taskId={task.id} />
            </div>

            <div className="mt-6 space-y-6">
              <MhdWorkflowStateVisualization
                currentStatusName={task.statusName}
                availableTransitions={availableTransitions}
              />
              <MhdWorkflowTransitionHistory
                key={`history-${task.id}-${workflowRefreshKey}`}
                taskId={task.id}
              />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Approvals</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Request approval on this task and review all approval activity tied to it.
                </p>
              </div>
              {canMutateWorkflowApprovals ? (
                <MhdApprovalRequest
                  companyId={task.companyId}
                  entityType="TASK"
                  entityId={task.id}
                  taskId={task.id}
                  approverOptions={approverOptions}
                  onSuccess={() => {
                    void refreshWorkflowAndApprovals();
                  }}
                />
              ) : (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  Read-only
                </span>
              )}
            </div>

            {!canMutateWorkflowApprovals ? (
              <p className="mt-4 text-sm text-neutral-500">
                Your current role can review approval history but cannot request or action
                approvals.
              </p>
            ) : null}

            <div className="mt-6">
              <MhdApprovalHistory
                key={`approvals-${task.id}-${workflowRefreshKey}`}
                entityType="TASK"
                entityId={task.id}
              />
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900">Notes & Comments</h2>
            <MhdTaskNotesPanel taskId={task.id} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900">Activities</h2>
            <div className="rounded-lg border border-neutral-200 bg-card p-4 shadow-sm">
              <MhdTaskActivitiesPanel taskId={task.id} companyId={task.companyId} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900">Attachments</h2>
            <div className="rounded-lg border border-neutral-200 bg-card p-4 shadow-sm">
              <MhdTaskAttachmentsPanel taskId={task.id} />
            </div>
          </section>

          <div className="rounded-lg border border-neutral-200 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Access Context</h2>
            <div className="mt-4 space-y-2 text-sm text-neutral-600">
              <p>Signed in as: {profile?.displayName || profile?.email || 'Unknown user'}</p>
              <p>Task company: {task.companyName}</p>
              <p>Workflow actions: {canMutateWorkflowApprovals ? 'Enabled' : 'Read-only'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end border-t border-neutral-200 pt-4">
        <MhdDetailActions
          editTo={`/tasks/${task.id}/edit`}
          onDelete={profile?.userId ? handleDeleteTask : undefined}
          deleteConfirmMessage={`Delete task "${task.title}"? This cannot be undone.`}
        />
      </div>
    </div>
  );
}
