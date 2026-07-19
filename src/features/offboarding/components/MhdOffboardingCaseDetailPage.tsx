import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Loader2,
  Package,
  PenLine,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { mhdCanMutateOffboarding } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdActivities } from '@/features/activities/Hook';
import {
  mhdCaseCancelSchema,
  mhdExitInterviewQuickCreateSchema,
  type MhdCaseCancelSchemaInput,
  type MhdCaseFormSchemaInput,
  type MhdExitInterviewQuickCreateSchemaInput,
} from '../Schemas';
import {
  useMhdExitDocumentCeremony,
  useMhdOffboardingCase,
  useMhdOffboardingCaseActions,
  useMhdOffboardingItems,
  useMhdOffboardingOutstandingProperty,
  useMhdOffboardingPeople,
  useMhdOffboardingUsers,
} from '../Hook';
import type { MhdExitCeremonyStepState } from '../Types';
import { MhdCaseStatusBadge } from './MhdCaseStatusBadge';
import { MhdOffboardingCaseForm } from './MhdOffboardingCaseForm';
import { MhdOffboardingChecklist } from './MhdOffboardingChecklist';
import { MhdSeparationTypeBadge } from './MhdSeparationTypeBadge';

function MhdCeremonyStepIcon({ step }: { step: MhdExitCeremonyStepState }) {
  if (step.status === 'DONE')
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Done" />;
  if (step.status === 'RUNNING')
    return <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-label="Running" />;
  if (step.status === 'ERROR')
    return <XCircle className="h-4 w-4 text-red-600" aria-label="Failed" />;
  return <Circle className="h-4 w-4 text-neutral-300" aria-label="Pending" />;
}

function MhdCancelCaseForm({
  referenceId,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  referenceId: string;
  onSubmit: (input: MhdCaseCancelSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdCaseCancelSchemaInput>({
    resolver: zodResolver(mhdCaseCancelSchema),
  });

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="mhd-offboarding-cancel-reason" className="mb-1 block text-sm font-medium">
          Cancellation Reason (required)
        </label>
        <textarea
          id="mhd-offboarding-cancel-reason"
          className="w-full rounded border px-3 py-2"
          rows={3}
          placeholder="e.g. Resignation rescinded — employee is staying on."
          {...register('cancelReason')}
        />
        {errors.cancelReason ? (
          <p className="mt-1 text-xs text-red-600">{errors.cancelReason.message}</p>
        ) : null}
      </div>
      <p className="text-xs text-neutral-500">
        Cancelling {referenceId} is terminal: the case and its checklist become immutable. The
        change is audited.
      </p>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Cancelling…' : 'Cancel Case'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Keep Case Open
        </button>
      </div>
    </form>
  );
}

function MhdExitInterviewQuickCreateForm({
  defaultTitle,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  defaultTitle: string;
  onSubmit: (input: MhdExitInterviewQuickCreateSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdExitInterviewQuickCreateSchemaInput>({
    resolver: zodResolver(mhdExitInterviewQuickCreateSchema),
    defaultValues: { title: defaultTitle },
  });

  return (
    <form className="mt-3 space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label
          htmlFor="mhd-offboarding-exit-interview-title"
          className="mb-1 block text-sm font-medium"
        >
          Title
        </label>
        <input
          id="mhd-offboarding-exit-interview-title"
          type="text"
          className="w-full rounded border px-3 py-2"
          {...register('title')}
        />
        {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
      </div>
      <div>
        <label
          htmlFor="mhd-offboarding-exit-interview-date"
          className="mb-1 block text-sm font-medium"
        >
          Date
        </label>
        <input
          id="mhd-offboarding-exit-interview-date"
          type="date"
          className="w-full rounded border px-3 py-2"
          {...register('activityDate')}
        />
        {errors.activityDate ? (
          <p className="mt-1 text-xs text-red-600">{errors.activityDate.message}</p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create & Link Exit Interview'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

/** /offboarding/:caseId — admits the same three privileged roles as the board route. */
export function MhdOffboardingCaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { roles } = useMhdAuth();
  const canMutate = mhdCanMutateOffboarding(roles);

  const [isEditing, setIsEditing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isQuickCreatingInterview, setIsQuickCreatingInterview] = useState(false);
  const [linkInterviewActivityId, setLinkInterviewActivityId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const caseQuery = useMhdOffboardingCase(caseId ?? null);
  const offboardingCase = caseQuery.data ?? null;
  const itemsQuery = useMhdOffboardingItems(caseId ?? null);
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const actions = useMhdOffboardingCaseActions();
  const ceremony = useMhdExitDocumentCeremony();

  const peopleQuery = useMhdOffboardingPeople(
    offboardingCase?.companyId ?? null,
    Boolean(offboardingCase?.companyId),
  );
  const usersQuery = useMhdOffboardingUsers(
    offboardingCase?.companyId ?? null,
    Boolean(offboardingCase?.companyId),
  );
  // Live outstanding property via the Property contract (ISSUED assignments; rule 6).
  const outstandingPropertyQuery = useMhdOffboardingOutstandingProperty(
    offboardingCase?.personId ?? null,
    Boolean(offboardingCase),
  );
  const outstandingProperty = outstandingPropertyQuery.data ?? [];

  // Eligible exit-interview activities: EXIT_INTERVIEW or MEETING for the subject (rule 8).
  const activitiesQuery = useMhdActivities({
    companyId: offboardingCase?.companyId ?? 'ALL',
    personId: offboardingCase?.personId ?? 'ALL',
    taskId: 'ALL',
    activityType: 'ALL',
    status: 'ALL',
    searchTerm: '',
    from: '',
    to: '',
  });
  const interviewActivities = useMemo(
    () =>
      (activitiesQuery.data ?? [])
        .filter(
          (activity) =>
            activity.activityType === 'EXIT_INTERVIEW' || activity.activityType === 'MEETING',
        )
        .map((activity) => ({
          id: activity.id,
          label: `${activity.referenceId} — ${activity.title}`,
        })),
    [activitiesQuery.data],
  );

  const exitAcknowledgmentItem = useMemo(
    () => items.find((item) => item.itemKey === 'exit_acknowledgment') ?? null,
    [items],
  );
  const outstandingRequiredItems = useMemo(
    () => items.filter((item) => item.isRequired && item.status === 'PENDING'),
    [items],
  );
  const hasCompletedItems = items.some((item) => item.status === 'COMPLETED');

  const isActive = offboardingCase?.status === 'ACTIVE';
  const completeBlocked = outstandingRequiredItems.length > 0;
  const completeBlockedTooltip = completeBlocked
    ? `Cannot complete: ${outstandingRequiredItems.length} required item${outstandingRequiredItems.length === 1 ? '' : 's'} outstanding (${outstandingRequiredItems.map((item) => item.title).join('; ')}). Complete or waive each required item first.`
    : undefined;

  const isCeremonyInFlight = ceremony.isLaunching;
  const ceremonyHasError = ceremony.steps.some((step) => step.status === 'ERROR');
  const showCeremonyPanel = isCeremonyInFlight || ceremonyHasError;
  const canLaunchCeremony =
    canMutate &&
    isActive &&
    exitAcknowledgmentItem !== null &&
    exitAcknowledgmentItem.status === 'PENDING' &&
    !exitAcknowledgmentItem.linkedEntityId;

  async function handleUpdate(input: MhdCaseFormSchemaInput) {
    if (!offboardingCase) return;
    setActionError(null);
    try {
      await actions.updateCase.mutateAsync({
        caseId: offboardingCase.id,
        input: {
          ...input,
          eligibleForRehire:
            input.eligibleForRehire === '' ? null : input.eligibleForRehire === 'YES',
        },
      });
      setIsEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update the case.');
    }
  }

  async function handleComplete() {
    if (!offboardingCase) return;
    setActionError(null);
    try {
      await actions.transitionCase.mutateAsync({
        caseId: offboardingCase.id,
        newStatus: 'COMPLETED',
      });
    } catch (error) {
      // The server re-checks the required-items gate; surface its refusal verbatim.
      setActionError(error instanceof Error ? error.message : 'Unable to complete the case.');
    }
  }

  async function handleCancelCase(input: MhdCaseCancelSchemaInput) {
    if (!offboardingCase) return;
    setActionError(null);
    try {
      await actions.transitionCase.mutateAsync({
        caseId: offboardingCase.id,
        newStatus: 'CANCELLED',
        cancelReason: input.cancelReason,
      });
      setIsCancelling(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to cancel the case.');
    }
  }

  async function handleDelete() {
    if (!offboardingCase) return;
    if (!window.confirm(`Delete case ${offboardingCase.referenceId}? This cannot be undone.`))
      return;
    setActionError(null);
    try {
      await actions.deleteCase.mutateAsync({ caseId: offboardingCase.id });
      navigate('/offboarding');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete the case.');
    }
  }

  async function handleLaunchCeremony() {
    if (!offboardingCase) return;
    setActionError(null);
    setIsEditing(false);
    try {
      // Orchestration lives in the Hook: resolve template -> generate OFFBOARDING_CASE
      // document -> render -> verify hash -> signature request with the subject as
      // external signer (primary email) -> link the exit_acknowledgment item.
      // Step progress and per-step errors surface via ceremony.steps below.
      await ceremony.launch(offboardingCase.id);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'The exit-document ceremony did not complete. Review the step progress below — no signature request was sent unless that step shows done.',
      );
    }
  }

  async function handleQuickCreateInterview(input: MhdExitInterviewQuickCreateSchemaInput) {
    if (!offboardingCase) return;
    setActionError(null);
    try {
      await actions.createAndLinkExitInterview.mutateAsync({
        caseId: offboardingCase.id,
        title: input.title,
        activityDate: input.activityDate,
      });
      setIsQuickCreatingInterview(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to create the exit interview.',
      );
    }
  }

  async function handleLinkInterview() {
    if (!offboardingCase || !linkInterviewActivityId) return;
    setActionError(null);
    try {
      await actions.linkExitInterview.mutateAsync({
        caseId: offboardingCase.id,
        activityId: linkInterviewActivityId,
      });
      setLinkInterviewActivityId('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to link the exit interview.');
    }
  }

  if (caseQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading offboarding case…
      </div>
    );
  }

  if (caseQuery.error || !offboardingCase) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {caseQuery.error instanceof Error
            ? caseQuery.error.message
            : 'Case not found or you do not have access to it.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/offboarding')}
          className="text-sm text-blue-700 hover:underline"
        >
          Back to Offboarding
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <MhdBreadcrumb
          items={[
            { label: 'Offboarding', to: '/offboarding' },
            { label: offboardingCase.referenceId },
          ]}
        />

        {actionError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}
        {itemsQuery.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {itemsQuery.error instanceof Error
              ? itemsQuery.error.message
              : 'Unable to load the checklist.'}
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs text-slate-400">{offboardingCase.referenceId}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                {offboardingCase.personDisplayName ?? 'Offboarding Case'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <MhdSeparationTypeBadge separationType={offboardingCase.separationType} />
                <MhdCaseStatusBadge status={offboardingCase.status} />
                <span>
                  Person{' '}
                  <Link
                    to={`/people/${offboardingCase.personId}`}
                    className="text-blue-700 hover:underline"
                  >
                    {offboardingCase.personDisplayName ?? 'View person'}
                  </Link>
                </span>
                <span>Initiated by: {offboardingCase.initiatorDisplayName ?? '—'}</span>
              </div>
            </div>

            {canMutate ? (
              <div className="flex flex-wrap gap-3">
                {isActive ? (
                  <span title={completeBlockedTooltip}>
                    <button
                      type="button"
                      onClick={() => void handleComplete()}
                      disabled={completeBlocked || actions.transitionCase.isPending}
                      aria-disabled={completeBlocked}
                      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {actions.transitionCase.isPending ? 'Completing…' : 'Complete Case'}
                    </button>
                  </span>
                ) : null}

                {isActive ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing((current) => !current)}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    {isEditing ? 'Close Edit' : 'Edit Case'}
                  </button>
                ) : null}

                {isActive ? (
                  <button
                    type="button"
                    onClick={() => setIsCancelling((current) => !current)}
                    className="rounded-md border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    {isCancelling ? 'Close Cancel' : 'Cancel Case'}
                  </button>
                ) : null}

                {isActive && !hasCompletedItems ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={actions.deleteCase.isPending}
                    className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Delete Case
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {isActive && completeBlocked ? (
            <p className="mt-3 text-xs text-slate-500">
              Complete is unavailable while {outstandingRequiredItems.length} required checklist
              item
              {outstandingRequiredItems.length === 1 ? ' is' : 's are'} outstanding.
            </p>
          ) : null}

          <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Separation Date
              </p>
              <p className="mt-2">{formatDate(offboardingCase.separationDate)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last Working Day
              </p>
              <p className="mt-2">{formatDate(offboardingCase.lastWorkingDay)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Eligible for Rehire
              </p>
              <p className="mt-2">
                {offboardingCase.eligibleForRehire === null
                  ? 'Undetermined'
                  : offboardingCase.eligibleForRehire
                    ? 'Yes'
                    : 'No'}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Completed
              </p>
              <p className="mt-2">
                {offboardingCase.completedAt
                  ? new Date(offboardingCase.completedAt).toLocaleString()
                  : 'Not completed'}
              </p>
            </div>
          </div>

          {offboardingCase.reasonSummary ? (
            <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason Summary
              </p>
              <p className="mt-2 whitespace-pre-wrap">{offboardingCase.reasonSummary}</p>
            </div>
          ) : null}

          {offboardingCase.cancelReason ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <p className="text-xs font-semibold uppercase tracking-wide">Cancelled</p>
              <p className="mt-2 whitespace-pre-wrap">{offboardingCase.cancelReason}</p>
            </div>
          ) : null}

          <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <p>Created: {new Date(offboardingCase.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(offboardingCase.updatedAt).toLocaleString()}</p>
          </div>
        </section>

        {isCancelling && canMutate && isActive ? (
          <section className="rounded-lg border border-rose-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Cancel Case</h2>
            <MhdCancelCaseForm
              referenceId={offboardingCase.referenceId}
              onSubmit={handleCancelCase}
              onCancel={() => setIsCancelling(false)}
              isSubmitting={actions.transitionCase.isPending}
            />
          </section>
        ) : null}

        {isEditing && canMutate && isActive ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit Case</h2>
            <MhdOffboardingCaseForm
              mode="edit"
              companyId={offboardingCase.companyId}
              initial={offboardingCase}
              people={(peopleQuery.data ?? []).map((person) => ({
                id: person.id,
                label: person.displayName,
              }))}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isSubmitting={actions.updateCase.isPending}
            />
          </section>
        ) : null}

        {showCeremonyPanel ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Exit Acknowledgment — Generate &amp; Send
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Rendering the exit acknowledgment and creating the signature request for the departing
              employee. Each step reports its own result; if a step fails, nothing after it ran.
            </p>
            <ol className="mt-4 space-y-2">
              {ceremony.steps.map((step) => (
                <li key={step.key} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">
                    <MhdCeremonyStepIcon step={step} />
                  </span>
                  <span className={step.status === 'ERROR' ? 'text-red-700' : 'text-slate-700'}>
                    {step.label}
                    {step.status === 'ERROR' && step.errorMessage ? (
                      <span className="mt-0.5 block text-xs text-red-600">{step.errorMessage}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
            {ceremonyHasError && !isCeremonyInFlight ? (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleLaunchCeremony()}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => ceremony.reset()}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              {itemsQuery.isLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  Loading checklist…
                </div>
              ) : (
                <MhdOffboardingChecklist
                  caseId={offboardingCase.id}
                  caseStatus={offboardingCase.status}
                  items={items}
                  assignees={(usersQuery.data ?? []).map((user) => ({
                    id: user.id,
                    label: user.displayName,
                  }))}
                  canMutate={canMutate}
                />
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Package className="h-5 w-5 text-slate-400" />
                Outstanding Property
              </h2>
              {outstandingPropertyQuery.error ? (
                <p className="mt-3 text-sm text-red-600">
                  {outstandingPropertyQuery.error instanceof Error
                    ? outstandingPropertyQuery.error.message
                    : 'Unable to load property assignments.'}
                </p>
              ) : outstandingPropertyQuery.isLoading ? (
                <p className="mt-3 text-sm text-slate-500">Loading property assignments…</p>
              ) : outstandingProperty.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No issued property outstanding — the property-return item can be completed.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-amber-800">
                    {outstandingProperty.length} issued assignment
                    {outstandingProperty.length === 1 ? '' : 's'} outstanding. The property-return
                    item cannot be completed until these are returned (or the item is waived with a
                    reason).
                  </p>
                  <ul className="mt-3 divide-y divide-slate-100 text-sm">
                    {outstandingProperty.map((assignment) => (
                      <li key={assignment.id} className="flex items-center justify-between py-2">
                        <span className="text-slate-700">{assignment.itemName}</span>
                        <span className="text-slate-500">
                          Qty {assignment.quantity} · {assignment.referenceId}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <Link
                to="/property"
                className="mt-3 inline-block text-sm text-blue-700 hover:underline"
              >
                Manage in Property
              </Link>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <PenLine className="h-5 w-5 text-slate-400" />
                Exit Acknowledgment
              </h2>
              {exitAcknowledgmentItem?.linkedEntityType === 'ESIGNATURE_REQUEST' &&
              exitAcknowledgmentItem.linkedEntityId ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <Link
                      to={`/esignature/${exitAcknowledgmentItem.linkedEntityId}`}
                      className="text-blue-700 hover:underline"
                    >
                      View signature request
                    </Link>
                  </p>
                  <p className="text-slate-600">
                    Status:{' '}
                    <span className="font-medium">
                      {exitAcknowledgmentItem.linkedEsignatureStatus ?? 'Unknown'}
                    </span>
                  </p>
                  {exitAcknowledgmentItem.linkedEsignatureStatus === 'DECLINED' ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                      The employee declined the acknowledgment. The checklist item can still be
                      waived with a documented reason so the case can complete.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  Not yet sent. The ceremony generates the acknowledgment, stamps its hash, and
                  routes it to the employee's primary email for signature.
                </p>
              )}
              {canLaunchCeremony ? (
                <button
                  type="button"
                  onClick={() => void handleLaunchCeremony()}
                  disabled={isCeremonyInFlight}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <PenLine className="h-4 w-4" />
                  {isCeremonyInFlight ? 'Sending…' : 'Generate & Send for Signature'}
                </button>
              ) : null}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <CalendarClock className="h-5 w-5 text-slate-400" />
                Exit Interview
              </h2>
              {offboardingCase.exitInterviewActivityId ? (
                <p className="mt-3 text-sm">
                  <Link
                    to={`/activities/${offboardingCase.exitInterviewActivityId}`}
                    className="text-blue-700 hover:underline"
                  >
                    View exit interview activity
                  </Link>
                </p>
              ) : (
                <>
                  <p className="mt-3 text-sm text-slate-400">No exit interview linked.</p>
                  {canMutate && isActive ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-48 flex-1">
                          <label
                            htmlFor="mhd-offboarding-link-interview"
                            className="mb-1 block text-xs font-medium text-neutral-500"
                          >
                            Link Existing Activity
                          </label>
                          <select
                            id="mhd-offboarding-link-interview"
                            value={linkInterviewActivityId}
                            onChange={(event) => setLinkInterviewActivityId(event.target.value)}
                            className="w-full rounded border px-3 py-2 text-sm"
                          >
                            <option value="">Select activity…</option>
                            {interviewActivities.map((activity) => (
                              <option key={activity.id} value={activity.id}>
                                {activity.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleLinkInterview()}
                          disabled={!linkInterviewActivityId || actions.linkExitInterview.isPending}
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Link
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsQuickCreatingInterview((current) => !current)}
                        className="text-sm text-blue-700 hover:underline"
                      >
                        {isQuickCreatingInterview
                          ? 'Close quick create'
                          : 'Or quick-create an exit interview…'}
                      </button>
                      {isQuickCreatingInterview ? (
                        <MhdExitInterviewQuickCreateForm
                          defaultTitle={`Exit interview — ${offboardingCase.personDisplayName ?? 'employee'}`}
                          onSubmit={handleQuickCreateInterview}
                          onCancel={() => setIsQuickCreatingInterview(false)}
                          isSubmitting={actions.createAndLinkExitInterview.isPending}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
