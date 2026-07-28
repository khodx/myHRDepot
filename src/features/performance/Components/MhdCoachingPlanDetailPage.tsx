import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Link2,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { mhdCanMutatePerformance } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdActivities, useMhdActivityActions } from '@/features/activities/Hook';
import {
  mhdCoachingPlanItemSchema,
  type MhdCoachingPlanFormSchemaInput,
  type MhdCoachingPlanItemSchemaInput,
} from '../Schemas';
import {
  useMhdCoachingPlan,
  useMhdCoachingPlanActions,
  useMhdCoachingPlanItems,
  useMhdPerformancePeople,
  useMhdPerformanceUsers,
} from '../Hook';
import type { MhdCoachingPlanItem } from '../Types';
import { mhdFormatCoachingPlanItemStatus } from '../Types';
import { MhdCoachingPlanForm } from './MhdCoachingPlanForm';
import { MhdCoachingStatusBadge } from './MhdCoachingStatusBadge';

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

function MhdCheckpointForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: MhdCoachingPlanItem;
  onSubmit: (input: MhdCoachingPlanItemSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdCoachingPlanItemSchemaInput>({
    resolver: zodResolver(mhdCoachingPlanItemSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description ?? undefined,
          dueDate: initial.dueDate ?? undefined,
        }
      : undefined,
  });

  const idPrefix = initial ? `mhd-checkpoint-edit-${initial.id}` : 'mhd-checkpoint-new';

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor={`${idPrefix}-title`} className="mb-1 block text-sm font-medium">
            Checkpoint
          </label>
          <input
            id={`${idPrefix}-title`}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Goal or milestone…"
            {...register('title')}
          />
          {errors.title ? (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-due`} className="mb-1 block text-sm font-medium">
            Due Date
          </label>
          <input
            id={`${idPrefix}-due`}
            type="date"
            className="rounded border px-3 py-2 text-sm"
            {...register('dueDate')}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-description`} className="mb-1 block text-sm font-medium">
          Description (optional)
        </label>
        <textarea
          id={`${idPrefix}-description`}
          className="w-full rounded border px-3 py-2 text-sm"
          rows={2}
          {...register('description')}
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initial ? 'Save Checkpoint' : 'Add Checkpoint'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function MhdCoachingPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutatePerformance(roles);

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null);
  const [linkActivityId, setLinkActivityId] = useState('');
  const [quickSessionTitle, setQuickSessionTitle] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const planQuery = useMhdCoachingPlan(planId ?? null);
  const plan = planQuery.data ?? null;
  const itemsQuery = useMhdCoachingPlanItems(planId ?? null);
  const items = useMemo(
    () => [...(itemsQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [itemsQuery.data],
  );
  const actions = useMhdCoachingPlanActions();
  const activityActions = useMhdActivityActions();

  const peopleQuery = useMhdPerformancePeople(plan?.companyId ?? null, Boolean(plan?.companyId));
  const usersQuery = useMhdPerformanceUsers(plan?.companyId ?? null, Boolean(plan?.companyId));

  // Existing COACHING_SESSION activities for the coached person, for the link action.
  const sessionsQuery = useMhdActivities({
    companyId: plan?.companyId ?? 'ALL',
    personId: plan?.personId ?? 'ALL',
    taskId: 'ALL',
    activityType: 'COACHING_SESSION',
    status: 'ALL',
    searchTerm: '',
    from: '',
    to: '',
  });
  const sessionOptions = (sessionsQuery.data ?? []).map((activity) => ({
    id: activity.id,
    label: `${activity.referenceId} — ${activity.title}`,
  }));

  const isPlanActive = plan?.status === 'ACTIVE';
  const completedItemCount = items.filter((item) => item.status === 'COMPLETED').length;
  const itemMutating =
    actions.createPlanItem.isPending ||
    actions.updatePlanItem.isPending ||
    actions.deletePlanItem.isPending;

  async function handleUpdatePlan(input: MhdCoachingPlanFormSchemaInput) {
    if (!plan) return;
    setActionError(null);
    try {
      await actions.updatePlan.mutateAsync({ planId: plan.id, input });
      setIsEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update coaching plan.');
    }
  }

  async function handleTransition(newStatus: 'COMPLETED' | 'CANCELLED') {
    if (!plan) return;
    const verb = newStatus === 'COMPLETED' ? 'Complete' : 'Cancel';
    if (!window.confirm(`${verb} coaching plan ${plan.referenceId}?`)) return;
    setActionError(null);
    try {
      await actions.transitionPlan.mutateAsync({ planId: plan.id, newStatus });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update plan status.');
    }
  }

  async function handleDeletePlan() {
    if (!plan) return;
    setActionError(null);
    try {
      await actions.deletePlan.mutateAsync({ planId: plan.id });
      navigate('/performance');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete coaching plan.');
    }
  }

  async function handleAddCheckpoint(input: MhdCoachingPlanItemSchemaInput) {
    if (!plan) return;
    setActionError(null);
    try {
      const maxSortOrder = items.reduce((max, item) => Math.max(max, item.sortOrder), 0);
      await actions.createPlanItem.mutateAsync({
        planId: plan.id,
        input: { ...input, sortOrder: maxSortOrder + 1 },
      });
      setIsAddingCheckpoint(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to add checkpoint.');
    }
  }

  async function handleEditCheckpoint(
    item: MhdCoachingPlanItem,
    input: MhdCoachingPlanItemSchemaInput,
  ) {
    setActionError(null);
    try {
      await actions.updatePlanItem.mutateAsync({ itemId: item.id, input });
      setEditingItemId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update checkpoint.');
    }
  }

  async function handleToggleCheckpoint(item: MhdCoachingPlanItem) {
    setActionError(null);
    try {
      await actions.updatePlanItem.mutateAsync({
        itemId: item.id,
        input: { status: item.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED' },
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to update checkpoint status.',
      );
    }
  }

  async function handleDeleteCheckpoint(item: MhdCoachingPlanItem) {
    if (!window.confirm(`Delete checkpoint "${item.title}"?`)) return;
    setActionError(null);
    try {
      await actions.deletePlanItem.mutateAsync({ itemId: item.id });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete checkpoint.');
    }
  }

  async function handleLinkExistingSession(event: FormEvent, item: MhdCoachingPlanItem) {
    event.preventDefault();
    if (!linkActivityId) return;
    setActionError(null);
    try {
      await actions.updatePlanItem.mutateAsync({
        itemId: item.id,
        input: { activityId: linkActivityId },
      });
      setLinkingItemId(null);
      setLinkActivityId('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to link coaching session.');
    }
  }

  async function handleQuickCreateSession(event: FormEvent, item: MhdCoachingPlanItem) {
    event.preventDefault();
    const title = quickSessionTitle.trim();
    if (!plan || !title) return;
    setActionError(null);
    try {
      // Quick-create through the Activities contract, then link the new session to the checkpoint.
      const created = await activityActions.createActivity.mutateAsync({
        companyId: plan.companyId,
        activityType: 'COACHING_SESSION',
        title,
        personId: plan.personId,
        status: 'PLANNED',
        participants: profile?.userId ? [{ userId: profile.userId, role: 'FACILITATOR' }] : [],
      });
      await actions.updatePlanItem.mutateAsync({
        itemId: item.id,
        input: { activityId: created.id },
      });
      setLinkingItemId(null);
      setQuickSessionTitle('');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to create and link coaching session.',
      );
    }
  }

  async function handleUnlinkSession(item: MhdCoachingPlanItem) {
    setActionError(null);
    try {
      await actions.updatePlanItem.mutateAsync({ itemId: item.id, input: { activityId: null } });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to unlink coaching session.');
    }
  }

  if (planQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading coaching plan…
      </div>
    );
  }

  if (planQuery.error || !plan) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          Coaching plan not found or you do not have access to it.
        </p>
        <button
          type="button"
          onClick={() => navigate('/performance')}
          className="text-sm font-medium text-accent hover:text-accent-hover"
        >
          Back to Performance
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdBreadcrumb
        items={[{ label: 'Performance', to: '/performance' }, { label: plan.referenceId }]}
      />

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <MhdCard className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{plan.referenceId}</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">{plan.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <MhdCoachingStatusBadge status={plan.status} />
              <span>
                Coaching{' '}
                <Link
                  to={`/people/${plan.personId}`}
                  className="text-accent hover:text-accent-hover"
                >
                  {plan.personDisplayName ?? 'View person'}
                </Link>
              </span>
              <span>Coach: {plan.coachDisplayName ?? '—'}</span>
              {plan.sourceReviewId ? (
                <span className="inline-flex items-center gap-1">
                  <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  From review{' '}
                  <Link
                    to={`/performance/reviews/${plan.sourceReviewId}`}
                    className="text-accent hover:text-accent-hover"
                  >
                    {plan.sourceReviewReferenceId ?? 'View review'}
                  </Link>
                </span>
              ) : null}
            </div>
          </div>

          {canMutate ? (
            <div className="flex flex-wrap gap-3">
              {isPlanActive ? (
                <>
                  <Button
                    type="button"
                    variant="warning"
                    onClick={() => setIsEditing((current) => !current)}
                  >
                    {isEditing ? 'Close Edit' : 'Edit Plan'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => void handleTransition('COMPLETED')}
                    disabled={actions.transitionPlan.isPending}
                    className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Complete Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleTransition('CANCELLED')}
                    disabled={actions.transitionPlan.isPending}
                    className="rounded-md border border-rose-300 bg-card px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                  >
                    Cancel Plan
                  </button>
                  <MhdDetailActions
                    onDelete={completedItemCount === 0 ? handleDeletePlan : undefined}
                    deleteLabel="Delete"
                    deleteConfirmMessage={`Delete coaching plan ${plan.referenceId}? This cannot be undone.`}
                  />
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Start
            </p>
            <p className="mt-2">{formatDate(plan.startDate)}</p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target
            </p>
            <p className="mt-2">{formatDate(plan.targetDate)}</p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Checkpoints
            </p>
            <p className="mt-2">
              {items.length > 0 ? `${completedItemCount} of ${items.length} done` : 'None yet'}
            </p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Coach
            </p>
            <p className="mt-2">{plan.coachDisplayName ?? '—'}</p>
          </div>
        </div>

        {plan.objective ? (
          <div className="mt-4 rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Objective
            </p>
            <p className="mt-2 whitespace-pre-wrap">{plan.objective}</p>
          </div>
        ) : null}

        {plan.outcomeSummary ? (
          <div className="mt-4 rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Outcome
            </p>
            <p className="mt-2 whitespace-pre-wrap">{plan.outcomeSummary}</p>
          </div>
        ) : null}

        <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <p>Created: {new Date(plan.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(plan.updatedAt).toLocaleString()}</p>
        </div>
      </MhdCard>

      {isEditing && canMutate && isPlanActive ? (
        <MhdCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Edit Coaching Plan</h2>
          <MhdCoachingPlanForm
            mode="edit"
            companyId={plan.companyId}
            initial={plan}
            people={(peopleQuery.data ?? []).map((person) => ({
              id: person.id,
              label: person.displayName,
            }))}
            coaches={(usersQuery.data ?? []).map((user) => ({
              id: user.id,
              label: user.displayName,
            }))}
            onSubmit={handleUpdatePlan}
            onCancel={() => setIsEditing(false)}
            isSubmitting={actions.updatePlan.isPending}
          />
        </MhdCard>
      ) : null}

      <MhdCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            Checkpoints
          </h2>
          {canMutate && isPlanActive && !isAddingCheckpoint ? (
            <button
              type="button"
              onClick={() => setIsAddingCheckpoint(true)}
              className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50"
            >
              <Plus className="h-4 w-4" />
              Add checkpoint
            </button>
          ) : null}
        </div>

        {isAddingCheckpoint && canMutate && isPlanActive ? (
          <div className="mt-4 rounded border p-4">
            <MhdCheckpointForm
              onSubmit={handleAddCheckpoint}
              onCancel={() => setIsAddingCheckpoint(false)}
              isSubmitting={actions.createPlanItem.isPending}
            />
          </div>
        ) : null}

        {items.length === 0 && !isAddingCheckpoint ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No checkpoints yet. Add ordered goals with due dates.
          </p>
        ) : null}

        <ol className="mt-4 space-y-2">
          {items.map((item) => {
            const isDone = item.status === 'COMPLETED';
            const isInactive = item.status === 'CANCELLED';
            const isEditingItem = editingItemId === item.id;
            const isLinkingItem = linkingItemId === item.id;
            return (
              <li key={item.id} className="rounded border px-3 py-2">
                <div className="flex items-start gap-2 text-sm">
                  {canMutate && isPlanActive ? (
                    <button
                      type="button"
                      onClick={() => void handleToggleCheckpoint(item)}
                      disabled={itemMutating || isInactive}
                      aria-label={isDone ? `Reopen ${item.title}` : `Complete ${item.title}`}
                      className="mt-0.5 text-muted-foreground hover:text-emerald-600 disabled:opacity-50"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                  ) : isDone ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  )}

                  <div className="min-w-0 flex-1">
                    <span
                      className={
                        isDone
                          ? 'text-muted-foreground line-through'
                          : isInactive
                            ? 'text-muted-foreground'
                            : ''
                      }
                    >
                      {item.title}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.referenceId}
                      {item.status !== 'PLANNED' && item.status !== 'COMPLETED'
                        ? ` · ${mhdFormatCoachingPlanItemStatus(item.status)}`
                        : ''}
                      {item.dueDate ? ` · due ${formatDate(item.dueDate)}` : ''}
                    </span>
                    {item.description ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-1 text-xs">
                      {item.activityId ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                          Session:{' '}
                          <Link
                            to={`/activities/${item.activityId}`}
                            className="text-accent hover:text-accent-hover"
                          >
                            {item.activityTitle ?? 'View session'}
                          </Link>
                          {canMutate && isPlanActive ? (
                            <button
                              type="button"
                              onClick={() => void handleUnlinkSession(item)}
                              disabled={itemMutating}
                              className="ml-1 text-muted-foreground hover:text-red-600 disabled:opacity-50"
                            >
                              Unlink
                            </button>
                          ) : null}
                        </span>
                      ) : canMutate && isPlanActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLinkingItemId(isLinkingItem ? null : item.id);
                            setLinkActivityId('');
                            setQuickSessionTitle('');
                          }}
                          className="inline-flex items-center gap-1 text-accent hover:text-accent-hover"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          {isLinkingItem ? 'Close link form' : 'Link coaching session'}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">No session linked</span>
                      )}
                    </div>
                  </div>

                  {canMutate && isPlanActive ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingItemId(isEditingItem ? null : item.id)}
                        disabled={itemMutating}
                        aria-label={`Edit ${item.title}`}
                        className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCheckpoint(item)}
                        disabled={itemMutating}
                        aria-label={`Delete ${item.title}`}
                        className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>

                {isEditingItem && canMutate && isPlanActive ? (
                  <div className="mt-3 border-t pt-3">
                    <MhdCheckpointForm
                      initial={item}
                      onSubmit={(input) => handleEditCheckpoint(item, input)}
                      onCancel={() => setEditingItemId(null)}
                      isSubmitting={actions.updatePlanItem.isPending}
                    />
                  </div>
                ) : null}

                {isLinkingItem && canMutate && isPlanActive ? (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <form
                      className="flex flex-wrap items-end gap-2"
                      onSubmit={(event) => void handleLinkExistingSession(event, item)}
                    >
                      <div className="min-w-64 flex-1">
                        <label
                          htmlFor={`mhd-checkpoint-link-${item.id}`}
                          className="mb-1 block text-xs font-medium text-muted-foreground"
                        >
                          Link an existing coaching session
                        </label>
                        <select
                          id={`mhd-checkpoint-link-${item.id}`}
                          value={linkActivityId}
                          onChange={(event) => setLinkActivityId(event.target.value)}
                          className="w-full rounded border px-2 py-2 text-sm"
                        >
                          <option value="">Select session…</option>
                          {sessionOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button type="submit" disabled={itemMutating || !linkActivityId}>
                        Link
                      </Button>
                    </form>

                    <form
                      className="flex flex-wrap items-end gap-2"
                      onSubmit={(event) => void handleQuickCreateSession(event, item)}
                    >
                      <div className="min-w-64 flex-1">
                        <label
                          htmlFor={`mhd-checkpoint-quick-${item.id}`}
                          className="mb-1 block text-xs font-medium text-muted-foreground"
                        >
                          Or quick-create a new session for{' '}
                          {plan.personDisplayName ?? 'this person'}
                        </label>
                        <input
                          id={`mhd-checkpoint-quick-${item.id}`}
                          value={quickSessionTitle}
                          onChange={(event) => setQuickSessionTitle(event.target.value)}
                          placeholder="Session title…"
                          className="w-full rounded border px-2 py-2 text-sm"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={
                          itemMutating ||
                          activityActions.createActivity.isPending ||
                          quickSessionTitle.trim().length === 0
                        }
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        {activityActions.createActivity.isPending ? 'Creating…' : 'Create & Link'}
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </MhdCard>

      {canMutate && isPlanActive ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="warning"
            onClick={() => setIsEditing((current) => !current)}
          >
            {isEditing ? 'Close Edit' : 'Edit Plan'}
          </Button>
          <MhdDetailActions
            onDelete={completedItemCount === 0 ? handleDeletePlan : undefined}
            deleteLabel="Delete"
            deleteConfirmMessage={`Delete coaching plan ${plan.referenceId}? This cannot be undone.`}
          />
        </div>
      ) : null}
    </div>
  );
}
