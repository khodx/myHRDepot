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
import { Button } from '@/components/ui/Button';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { MhdSystemFieldsCard } from '@/components/ui/MhdSystemFieldsCard';
import { cn } from '@/utils/cn';
import { MhdReviewRecordTabs } from '@/appshell/components/MhdReviewRecordTabs';
import { mhdCanMutatePerformance } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdActivities } from '@/features/activities/Hook';
import { useMhdEsignatureGeneratedDocuments } from '@/features/esignature/Hook';
import { mhdBuildGoogleDriveViewUrl } from '@/features/esignature/Types';
import { useMhdJobDescriptionDisclaimersCurrent } from '@/features/jobs/Hook';
import { mhdFormatJobDescriptionDisclaimerKey } from '@/features/jobs/Types';
import {
  mhdReviewWaiverSchema,
  type MhdReviewFormSchemaInput,
  type MhdReviewWaiverSchemaInput,
} from '../Schemas';
import {
  useMhdPerformancePeople,
  useMhdPerformanceReview,
  useMhdPerformanceReviewActions,
  useMhdPerformanceUsers,
  useMhdReviewFinalize,
} from '../Hook';
import type { MhdReviewFinalizeStepState } from '../Types';
import { useMhdFeedbackThreshold } from '../Hook-v2';
import { MhdReviewCompetencyPanel } from './MhdReviewCompetencyPanel';
import { MhdParticipantPanel } from './MhdParticipantPanel';
import { Mhd360FeedbackPanel } from './Mhd360FeedbackPanel';
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
        {errors.waiverReason ? (
          <p className="mt-1 text-xs text-red-600">{errors.waiverReason.message}</p>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Completing via waiver is audited distinctly (ACKNOWLEDGMENT_WAIVED) and closes the review
        without a signed acknowledgment.
      </p>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(buttonBaseClasses, 'bg-amber-700 text-white focus-visible:ring-amber-700')}
        >
          {isSubmitting ? 'Completing…' : 'Complete via Waiver'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function MhdFinalizeStepIcon({ step }: { step: MhdReviewFinalizeStepState }) {
  if (step.status === 'DONE')
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Done" />;
  if (step.status === 'RUNNING')
    return <Loader2 className="h-4 w-4 animate-spin text-accent" aria-label="Running" />;
  if (step.status === 'ERROR')
    return <XCircle className="h-4 w-4 text-red-600" aria-label="Failed" />;
  return <Circle className="h-4 w-4 text-muted-foreground" aria-label="Pending" />;
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

  // v2 (PRF2): the company release threshold gates the 360 aggregate panel below.
  const feedbackThresholdQuery = useMhdFeedbackThreshold(review?.companyId ?? null);
  const peopleQuery = useMhdPerformancePeople(
    review?.companyId ?? null,
    Boolean(review?.companyId),
  );
  const usersQuery = useMhdPerformanceUsers(review?.companyId ?? null, Boolean(review?.companyId));
  const generatedDocumentsQuery = useMhdEsignatureGeneratedDocuments(
    review?.companyId ?? null,
    review?.personId ?? null,
  );
  // The same registry the Job Description document draws from -- shown here
  // before finalize so a reviewer sees exactly what will be stamped into the
  // signed document, not just discovers it after the fact.
  const disclaimersQuery = useMhdJobDescriptionDisclaimersCurrent(review?.companyId ?? null);
  const subjectSigner = useMemo(
    () => (usersQuery.data ?? []).find((user) => user.personId === review?.personId) ?? null,
    [review?.personId, usersQuery.data],
  );
  const generatedDocument = useMemo(
    () =>
      (generatedDocumentsQuery.data ?? []).find(
        (document) => document.id === review?.documentGenerationId,
      ) ?? null,
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
        .filter(
          (activity) =>
            activity.activityType === 'ONE_ON_ONE' || activity.activityType === 'MEETING',
        )
        .map((activity) => ({
          id: activity.id,
          label: `${activity.referenceId} — ${activity.title}`,
        })),
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

  async function handleTransition(newStatus: 'IN_REVIEW' | 'CANCELLED' | 'COMPLETED') {
    if (!review) return;
    if (
      newStatus === 'CANCELLED' &&
      !window.confirm(`Cancel review ${review.referenceId}? This is terminal and cannot be undone.`)
    ) {
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
      setActionError(
        'The review subject does not have an active internal user account, so an acknowledgment cannot be sent.',
      );
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
      setActionError(
        error instanceof Error
          ? error.message
          : 'Finalize did not complete. Review the step progress below — no signature request was sent unless that step shows done.',
      );
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
      setActionError(
        error instanceof Error ? error.message : 'Unable to complete review via waiver.',
      );
    }
  }

  async function handleDelete() {
    if (!review) return;
    setActionError(null);
    try {
      await actions.deleteReview.mutateAsync({ reviewId: review.id });
      navigate('/performance');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete review.');
    }
  }

  if (reviewQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading review…
      </div>
    );
  }

  if (reviewQuery.error || !review) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          Review not found or you do not have access to it.
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
      <MhdPageHeader
        backTo="/performance"
        backLabel="Performance"
        title={review.personDisplayName ?? 'Performance Review'}
        description={
          <>
            {review.referenceId} · Subject{' '}
            <Link to={`/people/${review.personId}`} className="text-accent hover:text-accent-hover">
              {review.personDisplayName ?? 'View person'}
            </Link>{' '}
            · Reviewer: {review.reviewerDisplayName ?? '—'}
          </>
        }
        chips={
          <>
            <MhdReviewTypeBadge reviewType={review.reviewType} />
            <MhdReviewStatusBadge status={review.status} />
          </>
        }
      />

      <MhdReviewRecordTabs
        reviewId={review.id}
        active="detail"
        actions={
          canMutate ? (
            <>
              {review.status === 'DRAFT' ? (
                <Button
                  onClick={() => void handleTransition('IN_REVIEW')}
                  disabled={actions.transitionReview.isPending}
                >
                  Begin Review
                </Button>
              ) : null}

              {review.status === 'IN_REVIEW' ? (
                <Button
                  onClick={() => void handleFinalize()}
                  disabled={isFinalizeInFlight}
                  className="gap-1.5"
                >
                  <PenLine className="h-4 w-4" />
                  {isFinalizeInFlight ? 'Finalizing…' : 'Finalize & Send for Signature'}
                </Button>
              ) : null}

              {review.status === 'PENDING_SIGNATURE' && review.signatureStatus === 'COMPLETED' ? (
                <button
                  type="button"
                  onClick={() => void handleTransition('COMPLETED')}
                  disabled={actions.transitionReview.isPending}
                  className={cn(
                    buttonBaseClasses,
                    'bg-emerald-700 text-white focus-visible:ring-emerald-700',
                  )}
                >
                  {actions.transitionReview.isPending ? 'Completing…' : 'Complete Review (Signed)'}
                </button>
              ) : null}

              {review.status === 'PENDING_SIGNATURE' ? (
                <button
                  type="button"
                  onClick={() => setIsWaiving((current) => !current)}
                  className={cn(
                    buttonBaseClasses,
                    'border border-amber-300 bg-amber-50 text-amber-800 focus-visible:ring-amber-700',
                  )}
                >
                  {isWaiving ? 'Close Waiver' : 'Complete via Waiver'}
                </button>
              ) : null}

              {isContentEditable ? (
                <Button
                  type="button"
                  variant="warning"
                  onClick={() => setIsEditing((current) => !current)}
                >
                  {isEditing ? 'Close Edit' : 'Edit Review'}
                </Button>
              ) : null}

              {review.status !== 'COMPLETED' && review.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  onClick={() => void handleTransition('CANCELLED')}
                  disabled={actions.transitionReview.isPending}
                  className={cn(
                    buttonBaseClasses,
                    'border border-rose-300 bg-card text-rose-700 focus-visible:ring-rose-700',
                  )}
                >
                  Cancel Review
                </button>
              ) : null}

              <MhdDetailActions
                onDelete={review.status === 'DRAFT' ? handleDelete : undefined}
                deleteLabel="Delete Draft"
                deleteConfirmMessage={`Delete draft review ${review.referenceId}? This cannot be undone.`}
              />
            </>
          ) : null
        }
      />

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <MhdCard className="p-6">
        <dl className="space-y-4 text-sm text-muted-foreground">
          <MhdDetailField label="Review Period" value={`${formatDate(review.reviewPeriodStart)} – ${formatDate(review.reviewPeriodEnd)}`} />
          <MhdDetailField label="Due" value={formatDate(review.dueDate)} />
          <MhdDetailField label="Overall Rating" value={<MhdRatingStars value={review.overallRating} size="sm" />} />
          <MhdDetailField
            label="Acknowledged"
            value={review.acknowledgedAt ? new Date(review.acknowledgedAt).toLocaleString() : review.waiverReason ? 'Waived' : 'Not yet acknowledged'}
          />
        </dl>

        {review.waiverReason ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" />
              Acknowledgment Waived
            </p>
            <p className="mt-2 whitespace-pre-wrap">{review.waiverReason}</p>
          </div>
        ) : null}

        <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <p>Created: {new Date(review.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(review.updatedAt).toLocaleString()}</p>
        </div>
      </MhdCard>

      {review.status === 'IN_REVIEW' ? (
        <MhdCard className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Disclaimers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stamped into the review document when it's finalized and sent for signature. Edit them
            for every module at{' '}
            <Link to="/jobs/disclaimers" className="underline">
              Job description disclaimers
            </Link>
            .
          </p>
          <div className="mt-4 space-y-4">
            {disclaimersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (disclaimersQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No disclaimer text has been published yet.
              </p>
            ) : (
              (disclaimersQuery.data ?? []).map((disclaimer) => (
                <div key={disclaimer.disclaimerKey}>
                  <h3 className="text-sm font-medium text-foreground">
                    {mhdFormatJobDescriptionDisclaimerKey(disclaimer.disclaimerKey)}
                  </h3>
                  <MhdRichTextRenderer
                    html={disclaimer.body}
                    className="mt-1 rounded-md border border-border bg-muted/30 p-3 text-sm"
                  />
                </div>
              ))
            )}
          </div>
        </MhdCard>
      ) : null}

      {showFinalizePanel ? (
        <MhdCard className="p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Finalize &amp; Send for Signature
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rendering the review document and creating the signature request. Each step reports its
            own result; if a step fails, nothing after it ran.
          </p>
          <ol className="mt-4 space-y-2">
            {finalize.steps.map((step) => (
              <li key={step.key} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5">
                  <MhdFinalizeStepIcon step={step} />
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
          {finalizeHasError && !isFinalizeInFlight ? (
            <div className="mt-4 flex gap-3">
              <Button onClick={() => void handleFinalize()}>Retry Finalize</Button>
              <button
                type="button"
                onClick={() => finalize.reset()}
                className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
              >
                Dismiss
              </button>
            </div>
          ) : null}
        </MhdCard>
      ) : null}

      {isWaiving && canMutate && review.status === 'PENDING_SIGNATURE' ? (
        <MhdCard className="border-amber-200 p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Complete via Waiver</h2>
          <MhdWaiverForm
            onSubmit={handleWaiver}
            onCancel={() => setIsWaiving(false)}
            isSubmitting={actions.transitionReview.isPending}
          />
        </MhdCard>
      ) : null}

      {isEditing && canMutate && isContentEditable ? (
        <MhdCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Edit Review</h2>
          <MhdReviewForm
            mode="edit"
            companyId={review.companyId}
            initial={review}
            people={(peopleQuery.data ?? []).map((person) => ({
              id: person.id,
              label: person.displayName,
            }))}
            reviewers={(usersQuery.data ?? []).map((user) => ({
              id: user.id,
              label: user.displayName,
            }))}
            meetingActivities={meetingActivities}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSubmitting={actions.updateReview.isPending}
          />
        </MhdCard>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <MhdCard className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Review Content</h2>
            <dl className="mt-4 space-y-4 text-sm text-muted-foreground">
              {[
                ['Strengths', review.strengthsSummary],
                ['Areas for Improvement', review.improvementSummary],
                ['Goals', review.goalsSummary],
                ['Reviewer Comments', review.reviewerComments],
                ['Employee Comments', review.employeeComments],
              ].map(([label, value]) => (
                <MhdDetailField key={String(label)} label={String(label)} value={value} className="whitespace-pre-wrap" />
              ))}
            </dl>
          </MhdCard>

          {canMutate &&
          (review.status === 'COMPLETED' ||
            review.status === 'PENDING_SIGNATURE' ||
            review.status === 'IN_REVIEW') ? (
            <MhdCard className="p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Target className="h-5 w-5 text-muted-foreground" />
                Coaching
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Open a coaching plan from this review's improvement areas.
              </p>
              <Link
                to={`/performance?tab=coaching&fromReview=${review.id}`}
                className={cn(buttonBaseClasses, buttonVariantClasses.secondary, 'mt-3')}
              >
                Start Coaching Plan from this Review
              </Link>
            </MhdCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <MhdCard className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Review Meeting
            </h2>
            {review.reviewActivityId ? (
              <p className="mt-3 text-sm">
                <Link
                  to={`/activities/${review.reviewActivityId}`}
                  className="text-accent hover:text-accent-hover"
                >
                  {review.reviewActivityTitle ?? 'View meeting activity'}
                </Link>
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No meeting activity linked. Link one from Edit Review.
              </p>
            )}
          </MhdCard>

          <MhdCard className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Review Document
            </h2>
            {review.documentGenerationId ? (
              generatedDocumentUrl ? (
                <a
                  href={generatedDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-hover"
                >
                  {review.documentGenerationReferenceId ?? 'View generated document'}
                </a>
              ) : (
                <Link
                  to="/esignature"
                  className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-hover"
                >
                  {review.documentGenerationReferenceId ?? 'Generated document'}
                </Link>
              )
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Generated when the review is finalized and sent for signature.
              </p>
            )}
          </MhdCard>

          <MhdCard className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <PenLine className="h-5 w-5 text-muted-foreground" />
              Acknowledgment Signature
            </h2>
            {review.esignatureRequestId ? (
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <Link
                    to={`/esignature/${review.esignatureRequestId}`}
                    className="text-accent hover:text-accent-hover"
                  >
                    {review.esignatureRequestReferenceId ?? 'View signature request'}
                  </Link>
                </p>
                <p className="text-muted-foreground">
                  Status: <span className="font-medium">{review.signatureStatus ?? 'Unknown'}</span>
                </p>
                {review.signatureStatus === 'DECLINED' ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                    The employee declined the acknowledgment. A declined acknowledgment does not
                    cancel the review — it can still be completed via waiver with a documented
                    reason.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Created when the review is finalized. The review completes when the request is
                signed (or via waiver).
              </p>
            )}
          </MhdCard>
        </div>
      </section>

      {/*
          v2 (PRF2) additive surface — competencies, 360 participants, and the
          threshold-gated aggregate. Rendered for the reviewer/HR (canMutate); the
          panels call v2 RPCs that enforce their own access, and the aggregate panel
          NEVER shows an individual peer or upward response (it renders the withheld
          message below the release threshold rather than an empty section). This is
          purely additive to the existing v1 review surface above.
        */}
      {canMutate ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <MhdCard className="p-6">
              <MhdReviewCompetencyPanel
                reviewId={review.id}
                canRate={review.status === 'DRAFT' || review.status === 'IN_REVIEW'}
              />
            </MhdCard>
            <MhdCard className="p-6">
              <Mhd360FeedbackPanel
                reviewId={review.id}
                threshold={feedbackThresholdQuery.data ?? 3}
              />
            </MhdCard>
          </div>
          <div className="space-y-6">
            <MhdCard className="p-6">
              <MhdParticipantPanel
                reviewId={review.id}
                people={(peopleQuery.data ?? []).map((person) => ({
                  id: person.id,
                  displayName: person.displayName,
                }))}
              />
            </MhdCard>
          </div>
        </section>
      ) : null}

      <MhdSystemFieldsCard
        id={review.id}
        referenceId={review.referenceId}
        createdAt={review.createdAt}
        createdBy={review.createdBy}
        updatedAt={review.updatedAt}
        updatedBy={review.updatedBy}
      />
    </div>
  );
}
