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
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdSystemFieldsCard } from '@/components/ui/MhdSystemFieldsCard';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { MhdOffboardingCaseRecordTabs } from '@/appshell/components/MhdOffboardingCaseRecordTabs';
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
  return <Circle className="h-4 w-4 text-muted-foreground" aria-label="Pending" />;
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
      <p className="text-xs text-muted-foreground">
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
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
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
    control,
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
        <Controller
          name="activityDate"
          control={control}
          render={({ field }) => (
            <MhdDateField
              id="mhd-offboarding-exit-interview-date"
              className="w-full"
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
        {errors.activityDate ? (
          <p className="mt-1 text-xs text-red-600">{errors.activityDate.message}</p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create & Link Exit Interview'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
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
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading offboarding case…
      </div>
    );
  }

  if (caseQuery.error || !offboardingCase) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          Case not found or you do not have access to it.
        </p>
        <button
          type="button"
          onClick={() => navigate('/offboarding')}
          className="text-sm text-accent hover:text-accent-hover"
        >
          Back to Offboarding
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdBreadcrumb
        items={[
          { label: 'Offboarding', to: '/offboarding' },
          { label: offboardingCase.referenceId },
        ]}
      />

      <MhdOffboardingCaseRecordTabs
        caseId={offboardingCase.id}
        active="detail"
        onEdit={
          canMutate && isActive ? () => setIsEditing((current) => !current) : undefined
        }
        editLabel={isEditing ? 'Close Edit' : 'Edit Case'}
        onDelete={canMutate && isActive && !hasCompletedItems ? handleDelete : undefined}
        deleteLabel="Delete Case"
        deleteConfirmMessage={`Delete case ${offboardingCase.referenceId}? This cannot be undone.`}
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

      <MhdPageHeader
        title={offboardingCase.personDisplayName ?? 'Offboarding Case'}
        chips={
          <>
            <MhdSeparationTypeBadge separationType={offboardingCase.separationType} />
            <MhdCaseStatusBadge status={offboardingCase.status} />
          </>
        }
        actions={
          canMutate && isActive ? (
            <>
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

              <button
                type="button"
                onClick={() => setIsCancelling((current) => !current)}
                className="rounded-md border border-rose-300 bg-card px-4 py-2 text-sm font-semibold text-rose-700"
              >
                {isCancelling ? 'Close Cancel' : 'Cancel Case'}
              </button>
            </>
          ) : undefined
        }
        description={
          <>
            <span>{offboardingCase.referenceId}</span>
            <span className="mx-2">·</span>
            <span>
              Person{' '}
              <Link
                to={`/people/${offboardingCase.personId}`}
                className="text-accent hover:text-accent-hover"
              >
                {offboardingCase.personDisplayName ?? 'View person'}
              </Link>
            </span>
            <span className="mx-2">·</span>
            <span>Initiated by: {offboardingCase.initiatorDisplayName ?? '—'}</span>
          </>
        }
      />

      <MhdCard>
        {isActive && completeBlocked ? (
          <p className="mb-4 text-xs text-muted-foreground">
            Complete is unavailable while {outstandingRequiredItems.length} required checklist item
            {outstandingRequiredItems.length === 1 ? ' is' : 's are'} outstanding.
          </p>
        ) : null}

        <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Separation Date
            </p>
            <p className="mt-2">{formatDate(offboardingCase.separationDate)}</p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Last Working Day
            </p>
            <p className="mt-2">{formatDate(offboardingCase.lastWorkingDay)}</p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
          <div className="mt-4 rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

        <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <p>Created: {new Date(offboardingCase.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(offboardingCase.updatedAt).toLocaleString()}</p>
        </div>
      </MhdCard>

      {isCancelling && canMutate && isActive ? (
        <MhdCard className="border-rose-200">
          <MhdCardHeader title="Cancel Case" />
          <MhdCancelCaseForm
            referenceId={offboardingCase.referenceId}
            onSubmit={handleCancelCase}
            onCancel={() => setIsCancelling(false)}
            isSubmitting={actions.transitionCase.isPending}
          />
        </MhdCard>
      ) : null}

      {isEditing && canMutate && isActive ? (
        <MhdCard>
          <MhdCardHeader title="Edit Case" />
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
        </MhdCard>
      ) : null}

      {showCeremonyPanel ? (
        <MhdCard>
          <MhdCardHeader title="Exit Acknowledgment — Generate & Send" />
          <p className="mt-1 text-sm text-muted-foreground">
            Rendering the exit acknowledgment and creating the signature request for the departing
            employee. Each step reports its own result; if a step fails, nothing after it ran.
          </p>
          <ol className="mt-4 space-y-2">
            {ceremony.steps.map((step) => (
              <li key={step.key} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5">
                  <MhdCeremonyStepIcon step={step} />
                </span>
                <span className={step.status === 'ERROR' ? 'text-red-700' : 'text-foreground'}>
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
              <Button
                type="button"
                onClick={() => void handleLaunchCeremony()}
                className="font-semibold"
              >
                Retry
              </Button>
              <button
                type="button"
                onClick={() => ceremony.reset()}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
              >
                Dismiss
              </button>
            </div>
          ) : null}
        </MhdCard>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <MhdCard>
            {itemsQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
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
          </MhdCard>
        </div>

        <div className="space-y-6">
          <MhdCard>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Package className="h-5 w-5 text-muted-foreground" />
              Outstanding Property
            </h2>
            {outstandingPropertyQuery.error ? (
              <p className="mt-3 text-sm text-red-600">
                {outstandingPropertyQuery.error instanceof Error
                  ? outstandingPropertyQuery.error.message
                  : 'Unable to load property assignments.'}
              </p>
            ) : outstandingPropertyQuery.isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading property assignments…</p>
            ) : outstandingProperty.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
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
                <ul className="mt-3 divide-y divide-border text-sm">
                  {outstandingProperty.map((assignment) => (
                    <li key={assignment.id} className="flex items-center justify-between py-2">
                      <span className="text-foreground">{assignment.itemName}</span>
                      <span className="text-muted-foreground">
                        Qty {assignment.quantity} · {assignment.referenceId}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link
              to="/property"
              className="mt-3 inline-block text-sm text-accent hover:text-accent-hover"
            >
              Manage in Property
            </Link>
          </MhdCard>

          <MhdCard>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <PenLine className="h-5 w-5 text-muted-foreground" />
              Exit Acknowledgment
            </h2>
            {exitAcknowledgmentItem?.linkedEntityType === 'ESIGNATURE_REQUEST' &&
            exitAcknowledgmentItem.linkedEntityId ? (
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <Link
                    to={`/esignature/${exitAcknowledgmentItem.linkedEntityId}`}
                    className="text-accent hover:text-accent-hover"
                  >
                    View signature request
                  </Link>
                </p>
                <p className="text-muted-foreground">
                  Status:{' '}
                  <span className="font-medium">
                    {exitAcknowledgmentItem.linkedEsignatureStatus ?? 'Unknown'}
                  </span>
                </p>
                {exitAcknowledgmentItem.linkedEsignatureStatus === 'DECLINED' ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                    The employee declined the acknowledgment. The checklist item can still be waived
                    with a documented reason so the case can complete.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Not yet sent. The ceremony generates the acknowledgment, stamps its hash, and routes
                it to the employee's primary email for signature.
              </p>
            )}
            {canLaunchCeremony ? (
              <Button
                type="button"
                onClick={() => void handleLaunchCeremony()}
                disabled={isCeremonyInFlight}
                className="mt-3 gap-1.5 font-semibold"
              >
                <PenLine className="h-4 w-4" />
                {isCeremonyInFlight ? 'Sending…' : 'Generate & Send for Signature'}
              </Button>
            ) : null}
          </MhdCard>

          <MhdCard>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Exit Interview
            </h2>
            {offboardingCase.exitInterviewActivityId ? (
              <p className="mt-3 text-sm">
                <Link
                  to={`/activities/${offboardingCase.exitInterviewActivityId}`}
                  className="text-accent hover:text-accent-hover"
                >
                  View exit interview activity
                </Link>
              </p>
            ) : (
              <>
                <p className="mt-3 text-sm text-muted-foreground">No exit interview linked.</p>
                {canMutate && isActive ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-48 flex-1">
                        <label
                          htmlFor="mhd-offboarding-link-interview"
                          className="mb-1 block text-xs font-medium text-muted-foreground"
                        >
                          Link Existing Activity
                        </label>
                        <select
                          id="mhd-offboarding-link-interview"
                          value={linkInterviewActivityId}
                          onChange={(event) => setLinkInterviewActivityId(event.target.value)}
                          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                        className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
                      >
                        Link
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuickCreatingInterview((current) => !current)}
                      className="text-sm text-accent hover:text-accent-hover"
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
          </MhdCard>
        </div>
      </section>

      {canMutate && isActive ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="warning" onClick={() => setIsEditing((current) => !current)}>
            {isEditing ? 'Close Edit' : 'Edit Case'}
          </Button>
          <MhdDetailActions
            onDelete={!hasCompletedItems ? handleDelete : undefined}
            deleteLabel="Delete Case"
            deleteConfirmMessage={`Delete case ${offboardingCase.referenceId}? This cannot be undone.`}
          />
        </div>
      ) : null}

      <MhdSystemFieldsCard
        id={offboardingCase.id}
        referenceId={offboardingCase.referenceId}
        createdAt={offboardingCase.createdAt}
        createdBy={offboardingCase.createdBy}
        updatedAt={offboardingCase.updatedAt}
        updatedBy={offboardingCase.updatedBy}
      />
    </div>
  );
}
