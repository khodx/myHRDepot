import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ClipboardList, Lock, Paperclip, StickyNote } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Json } from '@/types/database.types';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { mhdCanMutateActivities } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCompleteActivitySchema, mhdCreateFollowUpTaskSchema, type MhdActivityFormSchemaInput, type MhdCompleteActivitySchemaInput, type MhdCreateFollowUpTaskSchemaInput } from '../Schemas';
import { useMhdActivity, useMhdActivityActions, useMhdActivityParticipants, useMhdActivityPeople, useMhdActivityTasks, useMhdActivityUsers, useMhdSubActivities } from '../Hook';
import { MHD_ACTIVITY_PARTICIPANT_ROLES, type MhdActivityParticipantRole, type MhdSubActivity, type MhdUpdateActivityInput, mhdFormatActivityParticipantRole } from '../Types';
import { MhdActivityAttachmentsPanel } from './MhdActivityAttachmentsPanel';
import { MhdActivityForm } from './MhdActivityForm';
import { MhdActivityNotesPanel } from './MhdActivityNotesPanel';
import { MhdActivityParticipantChips } from './MhdActivityParticipantChips';
import { MhdActivityStatusBadge } from './MhdActivityStatusBadge';
import { MhdActivityTypeBadge } from './MhdActivityTypeBadge';
import { MhdSubActivityChecklist } from './MhdSubActivityChecklist';

type ParticipantKind = 'USER' | 'PERSON';

function toActivityMutationInput(input: MhdActivityFormSchemaInput): MhdUpdateActivityInput {
  return {
    ...input,
    descriptionRichText: (input.descriptionRichText ?? null) as Json | null,
  };
}

function MhdCompleteActivityForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (input: MhdCompleteActivitySchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdCompleteActivitySchemaInput>({
    resolver: zodResolver(mhdCompleteActivitySchema),
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Occurred Date &amp; Time</label>
          <input type="datetime-local" className="w-full rounded border px-3 py-2" {...register('occurredAt')} />
          {errors.occurredAt ? <p className="mt-1 text-xs text-red-600">{errors.occurredAt.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Duration (minutes)</label>
          <input type="number" min={1} className="w-full rounded border px-3 py-2" {...register('durationMinutes', { valueAsNumber: true })} />
          {errors.durationMinutes ? <p className="mt-1 text-xs text-red-600">{errors.durationMinutes.message}</p> : null}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Outcome Summary</label>
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={3}
          placeholder="What was the result of this interaction?"
          {...register('outcomeSummary')}
        />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {isSubmitting ? 'Completing…' : 'Mark Completed'}
        </button>
        <button type="button" onClick={onCancel} className="rounded border px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

function MhdFollowUpTaskForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (input: MhdCreateFollowUpTaskSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdCreateFollowUpTaskSchemaInput>({
    resolver: zodResolver(mhdCreateFollowUpTaskSchema),
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1 block text-sm font-medium">Follow-up Task Title</label>
        <input className="w-full rounded border px-3 py-2" {...register('title')} />
        {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description (optional)</label>
        <textarea className="w-full rounded border px-3 py-2" rows={2} {...register('descriptionPlainText')} />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50">
          {isSubmitting ? 'Creating…' : 'Create Follow-up Task'}
        </button>
        <button type="button" onClick={onCancel} className="rounded border px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function MhdActivityDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateActivities(roles);

  const [isEditing, setIsEditing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newParticipantKind, setNewParticipantKind] = useState<ParticipantKind>('USER');
  const [newParticipantSubjectId, setNewParticipantSubjectId] = useState('');
  const [newParticipantRole, setNewParticipantRole] = useState<MhdActivityParticipantRole>('PARTICIPANT');

  const activityQuery = useMhdActivity(activityId ?? null);
  const participantsQuery = useMhdActivityParticipants(activityId ?? null);
  const subActivitiesQuery = useMhdSubActivities(activityId ?? null);
  const activity = activityQuery.data ?? null;
  const actions = useMhdActivityActions();

  const peopleQuery = useMhdActivityPeople(activity?.companyId ?? null, Boolean(activity?.companyId));
  const usersQuery = useMhdActivityUsers(activity?.companyId ?? null, Boolean(activity?.companyId));
  const tasksQuery = useMhdActivityTasks(activity?.companyId ?? null, Boolean(activity?.companyId));

  const participants = participantsQuery.data ?? [];
  const subActivities = subActivitiesQuery.data ?? [];
  const isTerminal = activity?.status === 'COMPLETED' || activity?.status === 'CANCELLED' || activity?.status === 'NO_SHOW';

  async function handleUpdate(input: MhdActivityFormSchemaInput) {
    if (!activity) return;
    setActionError(null);
    try {
      await actions.updateActivity.mutateAsync({ activityId: activity.id, input: toActivityMutationInput(input) });
      setIsEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update activity.');
    }
  }

  async function handleComplete(input: MhdCompleteActivitySchemaInput) {
    if (!activity) return;
    setActionError(null);
    try {
      await actions.updateActivity.mutateAsync({
        activityId: activity.id,
        input: {
          companyId: activity.companyId,
          activityType: activity.activityType,
          title: activity.title,
          personId: activity.personId,
          parentTaskId: activity.parentTaskId,
          descriptionPlainText: activity.descriptionPlainText,
          descriptionRichText: activity.descriptionRichText,
          status: 'COMPLETED',
          scheduledAt: activity.scheduledAt,
          occurredAt: input.occurredAt,
          durationMinutes: input.durationMinutes,
          location: activity.location,
          outcomeSummary: input.outcomeSummary,
          followUpTaskId: activity.followUpTaskId,
          isConfidential: activity.isConfidential,
        },
      });
      setIsCompleting(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to complete activity.');
    }
  }

  async function handleCreateFollowUp(input: MhdCreateFollowUpTaskSchemaInput) {
    if (!activity || !profile?.userId) return;
    setActionError(null);
    try {
      await actions.createFollowUpTask.mutateAsync({
        activityId: activity.id,
        input,
        context: { actorUserId: profile.userId },
      });
      setIsCreatingFollowUp(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create follow-up task.');
    }
  }

  async function handleDelete() {
    if (!activity) return;
    if (!window.confirm(`Delete activity ${activity.referenceId}? Sub-activities and participants are deleted with it.`)) return;
    setActionError(null);
    try {
      await actions.deleteActivity.mutateAsync({ activityId: activity.id, actorUserId: profile?.userId ?? undefined });
      navigate('/activities');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete activity.');
    }
  }

  async function handleAddParticipant(event: FormEvent) {
    event.preventDefault();
    if (!activity || !newParticipantSubjectId) return;
    setActionError(null);
    try {
      await actions.addParticipant.mutateAsync({
        activityId: activity.id,
        input: {
          ...(newParticipantKind === 'USER' ? { userId: newParticipantSubjectId } : { personId: newParticipantSubjectId }),
          role: newParticipantRole,
        },
      });
      setNewParticipantSubjectId('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to add participant.');
    }
  }

  async function handleRemoveParticipant(participantId: string) {
    setActionError(null);
    try {
      await actions.removeParticipant.mutateAsync(participantId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to remove participant.');
    }
  }

  async function handleToggleSubActivity(subActivity: MhdSubActivity) {
    setActionError(null);
    try {
      await actions.updateSubActivity.mutateAsync({
        subActivityId: subActivity.id,
        input: { status: subActivity.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED' },
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update checklist item.');
    }
  }

  async function handleAddSubActivity(title: string) {
    if (!activity) return;
    setActionError(null);
    try {
      const maxSortOrder = subActivities.reduce((max, item) => Math.max(max, item.sortOrder), 0);
      await actions.createSubActivity.mutateAsync({ activityId: activity.id, title, sortOrder: maxSortOrder + 1 });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to add checklist item.');
    }
  }

  async function handleDeleteSubActivity(subActivity: MhdSubActivity) {
    setActionError(null);
    try {
      await actions.deleteSubActivity.mutateAsync(subActivity.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete checklist item.');
    }
  }

  async function handleReorderSubActivity(subActivity: MhdSubActivity, direction: 'up' | 'down') {
    const ordered = [...subActivities].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((item) => item.id === subActivity.id);
    const swapWith = direction === 'up' ? ordered[index - 1] : ordered[index + 1];
    if (!swapWith) return;
    setActionError(null);
    try {
      await actions.updateSubActivity.mutateAsync({ subActivityId: subActivity.id, input: { sortOrder: swapWith.sortOrder } });
      await actions.updateSubActivity.mutateAsync({ subActivityId: swapWith.id, input: { sortOrder: subActivity.sortOrder } });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to reorder checklist.');
    }
  }

  if (activityQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading activity…</div>;
  }

  if (activityQuery.error || !activity) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {activityQuery.error instanceof Error ? activityQuery.error.message : 'Activity not found or you do not have access to it.'}
        </p>
        <button type="button" onClick={() => navigate('/activities')} className="text-sm text-blue-700 hover:underline">
          Back to Activities
        </button>
      </div>
    );
  }

  const subActivityMutating = actions.createSubActivity.isPending || actions.updateSubActivity.isPending || actions.deleteSubActivity.isPending;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <MhdBreadcrumb items={[{ label: 'Activities', to: '/activities' }, { label: activity.referenceId }]} />

        {actionError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}

        <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs text-slate-400">{activity.referenceId}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">{activity.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <MhdActivityTypeBadge activityType={activity.activityType} />
                <MhdActivityStatusBadge status={activity.status} />
                {activity.isConfidential ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    <Lock className="h-3 w-3" />
                    Confidential
                  </span>
                ) : null}
                {activity.personId ? (
                  <span>
                    About{' '}
                    <Link to={`/people/${activity.personId}`} className="text-blue-700 hover:underline">
                      {activity.personDisplayName ?? 'View person'}
                    </Link>
                  </span>
                ) : null}
                {activity.parentTaskId ? (
                  <span>
                    Supports task{' '}
                    <Link to={`/tasks/${activity.parentTaskId}`} className="text-blue-700 hover:underline">
                      View task
                    </Link>
                  </span>
                ) : null}
              </div>
            </div>

            {canMutate ? (
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setIsEditing((current) => !current)} className="rounded-md border border-slate-300 bg-card px-4 py-2 text-sm font-semibold text-slate-700">
                  {isEditing ? 'Close Edit' : 'Edit Activity'}
                </button>
                <button type="button" onClick={() => void handleDelete()} className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white">
                  Delete
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</p>
              <p className="mt-2">{activity.scheduledAt ? new Date(activity.scheduledAt).toLocaleString() : 'Not scheduled'}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Occurred</p>
              <p className="mt-2">{activity.occurredAt ? new Date(activity.occurredAt).toLocaleString() : 'Not yet recorded'}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</p>
              <p className="mt-2">{activity.durationMinutes != null ? `${activity.durationMinutes} minutes` : 'Not recorded'}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
              <p className="mt-2">{activity.location || 'Not recorded'}</p>
            </div>
          </div>

          {activity.descriptionPlainText ? (
            <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-2 whitespace-pre-wrap">{activity.descriptionPlainText}</p>
            </div>
          ) : null}

          <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <p>Created: {new Date(activity.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(activity.updatedAt).toLocaleString()}</p>
          </div>
        </section>

        {isEditing && canMutate ? (
          <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit Activity</h2>
            <MhdActivityForm
              mode="edit"
              companyId={activity.companyId}
              initial={activity}
              currentUserId={profile?.userId ?? ''}
              people={(peopleQuery.data ?? []).map((person) => ({ id: person.id, label: person.displayName }))}
              users={(usersQuery.data ?? []).map((user) => ({ id: user.id, label: user.displayName }))}
              tasks={(tasksQuery.data ?? []).map((task) => ({ id: task.id, label: `${task.referenceId} — ${task.title}` }))}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isSubmitting={actions.updateActivity.isPending}
            />
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Participants</h2>
              <div className="mt-4">
                <MhdActivityParticipantChips
                  participants={participants.map((participant) => ({
                    id: participant.id,
                    displayName: participant.displayName ?? 'Unknown participant',
                    role: participant.participantRole,
                  }))}
                  onRemove={canMutate ? handleRemoveParticipant : undefined}
                />
              </div>

              {canMutate ? (
                <form className="mt-4 flex flex-wrap items-center gap-2" onSubmit={handleAddParticipant}>
                  <select
                    value={newParticipantKind}
                    onChange={(event) => {
                      setNewParticipantKind(event.target.value as ParticipantKind);
                      setNewParticipantSubjectId('');
                    }}
                    className="rounded border px-2 py-2 text-sm"
                    aria-label="Participant kind"
                  >
                    <option value="USER">Internal user</option>
                    <option value="PERSON">Person</option>
                  </select>

                  <select
                    value={newParticipantSubjectId}
                    onChange={(event) => setNewParticipantSubjectId(event.target.value)}
                    className="min-w-48 rounded border px-2 py-2 text-sm"
                    aria-label={newParticipantKind === 'USER' ? 'Participant user' : 'Participant person'}
                  >
                    <option value="">{newParticipantKind === 'USER' ? 'Select user…' : 'Select person…'}</option>
                    {(newParticipantKind === 'USER'
                      ? (usersQuery.data ?? []).map((user) => ({ id: user.id, label: user.displayName }))
                      : (peopleQuery.data ?? []).map((person) => ({ id: person.id, label: person.displayName }))
                    ).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={newParticipantRole}
                    onChange={(event) => setNewParticipantRole(event.target.value as MhdActivityParticipantRole)}
                    className="rounded border px-2 py-2 text-sm"
                    aria-label="Participant role"
                  >
                    {MHD_ACTIVITY_PARTICIPANT_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {mhdFormatActivityParticipantRole(role)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={actions.addParticipant.isPending || !newParticipantSubjectId}
                    className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
                  >
                    {actions.addParticipant.isPending ? 'Adding…' : 'Add Participant'}
                  </button>
                </form>
              ) : null}
            </section>

            <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <ClipboardList className="h-5 w-5 text-slate-400" />
                Checklist
              </h2>
              <div className="mt-4">
                <MhdSubActivityChecklist
                  subActivities={subActivities}
                  canMutate={canMutate}
                  isSubmitting={subActivityMutating}
                  onToggleComplete={handleToggleSubActivity}
                  onAdd={handleAddSubActivity}
                  onDelete={handleDeleteSubActivity}
                  onReorder={handleReorderSubActivity}
                />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <CheckCircle2 className="h-5 w-5 text-slate-400" />
                Outcome
              </h2>

              {activity.outcomeSummary ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{activity.outcomeSummary}</p>
              ) : (
                <p className="mt-3 text-sm text-slate-400">No outcome recorded yet.</p>
              )}

              {activity.followUpTaskId ? (
                <p className="mt-3 text-sm">
                  Follow-up task:{' '}
                  <Link to={`/tasks/${activity.followUpTaskId}`} className="text-blue-700 hover:underline">
                    View task
                  </Link>
                </p>
              ) : null}

              {canMutate ? (
                <div className="mt-4 space-y-4">
                  {!isTerminal && !isCompleting ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingFollowUp(false);
                        setIsCompleting(true);
                      }}
                      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Mark Completed
                    </button>
                  ) : null}

                  {isCompleting ? (
                    <MhdCompleteActivityForm
                      onSubmit={handleComplete}
                      onCancel={() => setIsCompleting(false)}
                      isSubmitting={actions.updateActivity.isPending}
                    />
                  ) : null}

                  {!activity.followUpTaskId && !isCreatingFollowUp ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCompleting(false);
                        setIsCreatingFollowUp(true);
                      }}
                      className="rounded-md border border-slate-300 bg-card px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Create Follow-up Task
                    </button>
                  ) : null}

                  {isCreatingFollowUp ? (
                    <MhdFollowUpTaskForm
                      onSubmit={handleCreateFollowUp}
                      onCancel={() => setIsCreatingFollowUp(false)}
                      isSubmitting={actions.createFollowUpTask.isPending}
                    />
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <StickyNote className="h-5 w-5 text-neutral-400" />
                Notes
              </h2>
              <div className="rounded-lg border border-neutral-200 bg-card p-4 shadow-sm">
                <MhdActivityNotesPanel activityId={activity.id} readOnly={!canMutate} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <Paperclip className="h-5 w-5 text-neutral-400" />
                Attachments
              </h2>
              <div className="rounded-lg border border-neutral-200 bg-card p-4 shadow-sm">
                <MhdActivityAttachmentsPanel activityId={activity.id} readOnly={!canMutate} />
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
