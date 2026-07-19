import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  PenLine,
  Target,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { mhdCanMutatePerformance } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdActivities } from '@/features/activities/Hook';
import { useMhdEsignatureGeneratedDocuments } from '@/features/esignature/Hook';
import { mhdBuildGoogleDriveViewUrl } from '@/features/esignature/Types';
import { mhdReviewWaiverSchema, type MhdReviewFormSchemaInput, type MhdReviewWaiverSchemaInput } from '../Schemas';
import {
  useMhdPerformancePeople,
  useMhdPerformanceReview,
  useMhdPerformanceReviewActions,
  useMhdPerformanceUsers,
  useMhdReviewFinalize,
} from '../Hook';
import type { MhdReviewFinalizeStepState } from '../Types';
import { MhdRatingStars } from './MhdRatingStars';
import { MhdReviewForm } from './MhdReviewForm';
import { MhdReviewStatusBadge } from './MhdReviewStatusBadge';
import { MhdReviewTypeBadge } from './MhdReviewTypeBadge';

function MhdWaiverForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (input: MhdReviewWaiverSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdReviewWaiverSchemaInput>({
    resolver: zodResolver(mhdReviewWaiverSchema),
  });

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="mhd-review-waiver-reason" className="mb-1 block text-sm font-medium">
          Waiver Reason (required)
        </label>
        <textarea
          id="mhd-review-waiver-reason"
          className="w-full rounded border px-3 py-2"
          rows={3}
          placeholder="e.g. Employee declined to sign; acknowledgment discussed in person on…"
          {...register('waiverReason')}
        />
        {errors.waiverReason ? <p className="mt-1 text-xs text-red-600">{errors.waiverReason.message}</p> : null}
      </div>
      <p className="text-xs text-neutral-500">
        Completing via waiver is audited distinctly (ACKNOWLEDGMENT_WAIVED) and closes the review without a signed acknowledgment.
      </p>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Completing…' : 'Complete via Waiver'}
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

function MhdFinalizeStepIcon({ step }: { step: MhdReviewFinalizeStepState }) {
  if (step.status === 'DONE') return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Done" />;
  if (step.status === 'RUNNING') return <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-label="Running" />;
  if (step.status === 'ERROR') return <XCircle className="h-4 w-4 text-red-600" aria-label="Failed" />;
  return <Circle className="h-4 w-4 text-neutral-300" aria-label="Pending" />;
}

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

export function MhdReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const { roles } = useMhdAuth();
  const canMutate = mhdCanMutatePerformance(roles);

  const [isEditing, setIsEditing] = useState(false);
  const [isWaiving, setIsWaiving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const reviewQuery = useMhdPerformanceReview(reviewId ?? null);
  const review = reviewQuery.data ?? null;
  const actions = useMhdPerformanceReviewActions();
  const finalize = useMhdReviewFinalize();

  const peopleQuery = useMhdPerformancePeople(review?.companyId ?? null, Boolean(review?.companyId));
  const usersQuery = useMhdPerformanceUsers(review?.companyId ?? null, Boolean(review?.companyId));
  const generatedDocumentsQuery = useMhdEsignatureGeneratedDocuments(
    review?.companyId ?? null,
    review?.personId ?? null,
  );
  const subjectSigner = useMemo(
    () => (usersQuery.data ?? []).find((user) => user.personId === review?.personId) ?? null,
    [review?.personId, usersQuery.data],
  );
  const generatedDocument = useMemo(
    () => (generatedDocumentsQuery.data ?? []).find((document) => document.id === review?.documentGenerationId) ?? null,
    [generatedDocumentsQuery.data, review?.documentGenerationId],
  );
  const generatedDocumentUrl = mhdBuildGoogleDriveViewUrl(generatedDocument?.outputDriveFileId);

  // Eligible review-meeting activities: ONE_ON_ONE or MEETING for the subject (validation rule).
  const activitiesQuery = useMhdActivities({
    companyId: review?.companyId ?? 'ALL',
    personId: review?.personId ?? 'ALL',
    taskId: 'ALL',
    activityType: 'ALL',
    status: 'ALL',
    searchTerm: '',
    from: '',
    to: '',
  });
  const meetingActivities = useMemo(
    () =>
      (activitiesQuery.data ?? [])
        .filter((activity) => activity.activityType === 'ONE_ON_ONE' || activity.activityType === 'MEETING')
        .map((activity) => ({ id: activity.id, label: `${activity.referenceId} — ${activity.title}` })),
    [activitiesQuery.data],
  );

  const isContentEditable = review?.status === 'DRAFT' || review?.status === 'IN_REVIEW';
  const isFinalizeInFlight = finalize.isFinalizing;
  const finalizeHasError = finalize.steps.some((step) => step.status === 'ERROR');
  const showFinalizePanel = isFinalizeInFlight || finalizeHasError;

  async function handleUpdate(input: MhdReviewFormSchemaInput) {
    if (!review) return;
    setActionError(null);
    try {
      await actions.updateReview.mutateAsync({ reviewId: review.id, input });
      setIsEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update review.');
    }
  }

  async function handleTransition(newStatus: 'IN_REVIEW' | 'CANCELLED') {
    if (!review) return;
    if (newStatus === 'CANCELLED' && !window.confirm(`Cancel review ${review.referenceId}? This is terminal and cannot be undone.`)) {
      return;
    }
    setActionError(null);
    try {
      await actions.transitionReview.mutateAsync({ reviewId: review.id, newStatus });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update review status.');
    }
  }

  async function handleFinalize() {
    if (!review) return;
    if (!subjectSigner) {
      setActionError('The review subject does not have an active internal user account, so an acknowledgment cannot be sent.');
      return;
    }
    setActionError(null);
    setIsEditing(false);
    try {
      // Orchestration lives in the Hook: generate document -> render -> create
      // signature request -> link documents -> transition to PENDING_SIGNATURE.
      // Step progress and per-step errors surface via finalize.steps below.
      await finalize.finalize(review.id, subjectSigner.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Finalize did not complete. Review the step progress below — no signature request was sent unless that step shows done.');
    }
  }

  async function handleWaiver(input: MhdReviewWaiverSchemaInput) {
    if (!review) return;
    setActionError(null);
    try {
      await actions.transitionReview.mutateAsync({
        reviewId: review.id,
        newStatus: 'COMPLETED',
        waiverReason: input.waiverReason,
      });
      setIsWaiving(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to complete review via waiver.');
    }
  }

  async function handleDelete() {
    if (!review) return;
    if (!window.confirm(`Delete draft review ${review.referenceId}? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await actions.deleteReview.mutateAsync({ reviewId: review.id });
      navigate('/performance');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete review.');
    }
  }

  if (reviewQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading review…</div>;
  }

  if (reviewQuery.error || !review) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {reviewQuery.error instanceof Error ? reviewQuery.error.message : 'Review not found or you do not have access to it.'}
        </p>
        <button type="button" onClick={() => navigate('/performance')} className="text-sm text-blue-700 hover:underline">
          Back to Performance
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <MhdBreadcrumb items={[{ label: 'Performance', to: '/performance' }, { label: review.referenceId }]} />

        {actionError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs text-slate-400">{review.referenceId}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                {review.personDisplayName ?? 'Performance Review'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <MhdReviewTypeBadge reviewType={review.reviewType} />
                <MhdReviewStatusBadge status={review.status} />
                <span>
                  Subject{' '}
                  <Link to={`/people/${review.personId}`} className="text-blue-700 hover:underline">
                    {review.personDisplayName ?? 'View person'}
                  </Link>
                </span>
                <span>Reviewer: {review.reviewerDisplayName ?? '—'}</span>
              </div>
            </div>

            {canMutate ? (
              <div className="flex flex-wrap gap-3">
                {review.status === 'DRAFT' ? (
                  <button
                    type="button"
                    onClick={() => void handleTransition('IN_REVIEW')}
                    disabled={actions.transitionReview.isPending}
                    className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Begin Review
                  </button>
                ) : null}

                {review.status === 'IN_REVIEW' ? (
                  <button
                    type="button"
                    onClick={() => void handleFinalize()}
                    disabled={isFinalizeInFlight}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <PenLine className="h-4 w-4" />
                    {isFinalizeInFlight ? 'Finalizing…' : 'Finalize & Send for Signature'}
                  </button>
                ) : null}

                {review.status === 'PENDING_SIGNATURE' ? (
                  <button
                    type="button"
                    onClick={() => setIsWaiving((current) => !current)}
                    className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800"
                  >
                    {isWaiving ? 'Close Waiver' : 'Complete via Waiver'}
                  </button>
                ) : null}

                {isContentEditable ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing((current) => !current)}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    {isEditing ? 'Close Edit' : 'Edit Review'}
                  </button>
                ) : null}

                {review.status !== 'COMPLETED' && review.status !== 'CANCELLED' ? (
                  <button
                    type="button"
                    onClick={() => void handleTransition('CANCELLED')}
                    disabled={actions.transitionReview.isPending}
                    className="rounded-md border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                  >
                    Cancel Review
                  </button>
                ) : null}

                {review.status === 'DRAFT' ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={actions.deleteReview.isPending}
                    className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Delete Draft
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review Period</p>
              <p className="mt-2">
                {formatDate(review.reviewPeriodStart)} – {formatDate(review.reviewPeriodEnd)}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due</p>
              <p className="mt-2">{formatDate(review.dueDate)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Rating</p>
              <p className="mt-2">
                <MhdRatingStars value={review.overallRating} size="sm" />
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acknowledged</p>
              <p className="mt-2">
                {review.acknowledgedAt
                  ? new Date(review.acknowledgedAt).toLocaleString()
                  : review.waiverReason
                    ? 'Waived'
                    : 'Not yet acknowledged'}
              </p>
            </div>
          </div>

          {review.waiverReason ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                <AlertTriangle className="h-3.5 w-3.5" />
                Acknowledgment Waived
              </p>
              <p className="mt-2 whitespace-pre-wrap">{review.waiverReason}</p>
            </div>
          ) : null}

          <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <p>Created: {new Date(review.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(review.updatedAt).toLocaleString()}</p>
          </div>
        </section>

        {showFinalizePanel ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Finalize &amp; Send for Signature</h2>
            <p className="mt-1 text-sm text-slate-600">
              Rendering the review document and creating the signature request. Each step reports its own result; if a step
              fails, nothing after it ran.
            </p>
            <ol className="mt-4 space-y-2">
              {finalize.steps.map((step) => (
                <li key={step.key} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">
                    <MhdFinalizeStepIcon step={step} />
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
            {finalizeHasError && !isFinalizeInFlight ? (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleFinalize()}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Retry Finalize
                </button>
                <button
                  type="button"
                  onClick={() => finalize.reset()}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {isWaiving && canMutate && review.status === 'PENDING_SIGNATURE' ? (
          <section className="rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Complete via Waiver</h2>
            <MhdWaiverForm
              onSubmit={handleWaiver}
              onCancel={() => setIsWaiving(false)}
              isSubmitting={actions.transitionReview.isPending}
            />
          </section>
        ) : null}

        {isEditing && canMutate && isContentEditable ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit Review</h2>
            <MhdReviewForm
              mode="edit"
              companyId={review.companyId}
              initial={review}
              people={(peopleQuery.data ?? []).map((person) => ({ id: person.id, label: person.displayName }))}
              reviewers={(usersQuery.data ?? []).map((user) => ({ id: user.id, label: user.displayName }))}
              meetingActivities={meetingActivities}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isSubmitting={actions.updateReview.isPending}
            />
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Review Content</h2>
              <dl className="mt-4 space-y-4 text-sm text-slate-600">
                {[
                  ['Strengths', review.strengthsSummary],
                  ['Areas for Improvement', review.improvementSummary],
                  ['Goals', review.goalsSummary],
                  ['Reviewer Comments', review.reviewerComments],
                  ['Employee Comments', review.employeeComments],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="mt-2 whitespace-pre-wrap">
                      {value || <span className="text-slate-400">Not recorded</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {canMutate && (review.status === 'COMPLETED' || review.status === 'PENDING_SIGNATURE' || review.status === 'IN_REVIEW') ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Target className="h-5 w-5 text-slate-400" />
                  Coaching
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Open a coaching plan from this review's improvement areas.
                </p>
                <Link
                  to={`/performance?tab=coaching&fromReview=${review.id}`}
                  className="mt-3 inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Start Coaching Plan from this Review
                </Link>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <CalendarClock className="h-5 w-5 text-slate-400" />
                Review Meeting
              </h2>
              {review.reviewActivityId ? (
                <p className="mt-3 text-sm">
                  <Link to={`/activities/${review.reviewActivityId}`} className="text-blue-700 hover:underline">
                    {review.reviewActivityTitle ?? 'View meeting activity'}
                  </Link>
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-400">No meeting activity linked. Link one from Edit Review.</p>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-slate-400" />
                Review Document
              </h2>
              {review.documentGenerationId ? (
                generatedDocumentUrl ? (
                  <a
                    href={generatedDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm text-blue-700 hover:underline"
                  >
                    {review.documentGenerationReferenceId ?? 'View generated document'}
                  </a>
                ) : (
                  <Link to="/esignature" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
                    {review.documentGenerationReferenceId ?? 'Generated document'}
                  </Link>
                )
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  Generated when the review is finalized and sent for signature.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <PenLine className="h-5 w-5 text-slate-400" />
                Acknowledgment Signature
              </h2>
              {review.esignatureRequestId ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <Link to={`/esignature/${review.esignatureRequestId}`} className="text-blue-700 hover:underline">
                      {review.esignatureRequestReferenceId ?? 'View signature request'}
                    </Link>
                  </p>
                  <p className="text-slate-600">
                    Status: <span className="font-medium">{review.signatureStatus ?? 'Unknown'}</span>
                  </p>
                  {review.signatureStatus === 'DECLINED' ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                      The employee declined the acknowledgment. A declined acknowledgment does not cancel the review — it can
                      still be completed via waiver with a documented reason.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  Created when the review is finalized. The review completes when the request is signed (or via waiver).
                </p>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
