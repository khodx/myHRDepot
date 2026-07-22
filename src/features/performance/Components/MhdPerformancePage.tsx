import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mhdCanMutatePerformance } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { type MhdCoachingPlanFormSchemaInput, type MhdReviewFormSchemaInput } from '../Schemas';
import {
  useMhdCoachingPlanActions,
  useMhdCoachingPlans,
  useMhdPerformancePeople,
  useMhdPerformanceReview,
  useMhdPerformanceReviewActions,
  useMhdPerformanceReviews,
  useMhdPerformanceUsers,
} from '../Hook';
import type { MhdCoachingPlanBoardFilters, MhdReviewBoardFilters } from '../Types';
import { mhdIsReviewOverdue } from '../Types';
import { MhdCoachingPlanForm } from './MhdCoachingPlanForm';
import { MhdCoachingPlanList } from './MhdCoachingPlanList';
import { MhdOneOnOneTab } from './MhdOneOnOneTab';
import { MhdReviewFilterBar } from './MhdReviewFilterBar';
import { MhdReviewForm } from './MhdReviewForm';
import { MhdReviewList } from './MhdReviewList';

const DEFAULT_REVIEW_FILTERS: MhdReviewBoardFilters = { companyId: '', personId: 'ALL', reviewerUserId: 'ALL', reviewType: 'ALL', status: 'ALL', searchTerm: '', dueFrom: '', dueTo: '' };
const DEFAULT_PLAN_FILTERS: MhdCoachingPlanBoardFilters = { companyId: '', personId: 'ALL', coachUserId: 'ALL', status: 'ALL', searchTerm: '' };

type PerformanceTab = 'reviews' | 'coaching' | 'one-on-ones';

const TABS: { key: PerformanceTab; label: string }[] = [
  { key: 'reviews', label: 'Reviews' },
  { key: 'coaching', label: 'Coaching' },
  { key: 'one-on-ones', label: 'One-on-Ones' },
];

/**
 * /performance — route excludes Viewer entirely (first Viewer-less route), so no
 * Viewer read-only handling is needed here; mhdCanMutatePerformance gates mutations.
 */
export function MhdPerformancePage() {
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutatePerformance(roles);
  const canCrossCompanyFilter = roles.includes('Platform Admin') || roles.includes('HR Partner');

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: PerformanceTab = tabParam === 'coaching' || tabParam === 'one-on-ones' ? tabParam : 'reviews';
  const fromReviewId = searchParams.get('fromReview');

  const [reviewFilters, setReviewFilters] = useState<MhdReviewBoardFilters>(DEFAULT_REVIEW_FILTERS);
  const [isCreatingReview, setIsCreatingReview] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [planFormDismissed, setPlanFormDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedCompanyId = canCrossCompanyFilter
    ? (reviewFilters.companyId !== 'ALL' ? reviewFilters.companyId : profile?.companyId ?? null)
    : (profile?.companyId ?? null);

  const effectiveReviewFilters = useMemo<MhdReviewBoardFilters>(
    () => ({
      ...reviewFilters,
      companyId: canCrossCompanyFilter ? reviewFilters.companyId : profile?.companyId ?? 'ALL',
    }),
    [canCrossCompanyFilter, reviewFilters, profile?.companyId],
  );

  const planFilters = useMemo<MhdCoachingPlanBoardFilters>(
    () => ({
      ...DEFAULT_PLAN_FILTERS,
      companyId: canCrossCompanyFilter ? 'ALL' : profile?.companyId ?? 'ALL',
    }),
    [canCrossCompanyFilter, profile?.companyId],
  );

  const reviewsQuery = useMhdPerformanceReviews(effectiveReviewFilters);
  const plansQuery = useMhdCoachingPlans(planFilters);
  const reviewActions = useMhdPerformanceReviewActions();
  const planActions = useMhdCoachingPlanActions();
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const peopleQuery = useMhdPerformancePeople(selectedCompanyId);
  const usersQuery = useMhdPerformanceUsers(selectedCompanyId);
  // Source-review context when the coaching form is opened from a review detail page.
  const sourceReviewQuery = useMhdPerformanceReview(fromReviewId);

  const reviews = useMemo(() => reviewsQuery.data ?? [], [reviewsQuery.data]);
  const plans = plansQuery.data ?? [];

  const counts = useMemo(() => {
    return {
      draft: reviews.filter((review) => review.status === 'DRAFT').length,
      inReview: reviews.filter((review) => review.status === 'IN_REVIEW').length,
      awaitingAcknowledgment: reviews.filter((review) => review.status === 'PENDING_SIGNATURE').length,
      overdue: reviews.filter((review) => mhdIsReviewOverdue(review)).length,
    };
  }, [reviews]);

  const showPlanCreateForm = isCreatingPlan || (Boolean(fromReviewId) && !planFormDismissed);

  function selectTab(tab: PerformanceTab) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  }

  function clearFromReviewParam() {
    const next = new URLSearchParams(searchParams);
    next.delete('fromReview');
    setSearchParams(next);
  }

  async function handleCreateReview(input: MhdReviewFormSchemaInput) {
    setActionError(null);
    try {
      await reviewActions.createReview.mutateAsync(input);
      setIsCreatingReview(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create review.');
    }
  }

  async function handleCreatePlan(input: MhdCoachingPlanFormSchemaInput) {
    setActionError(null);
    try {
      await planActions.createPlan.mutateAsync(input);
      setIsCreatingPlan(false);
      setPlanFormDismissed(true);
      clearFromReviewParam();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create coaching plan.');
    }
  }

  function handleCancelPlanForm() {
    setIsCreatingPlan(false);
    setPlanFormDismissed(true);
    clearFromReviewParam();
  }

  const companyOptions = canCrossCompanyFilter
    ? (companiesQuery.data ?? []).map((company) => ({ id: company.id, label: company.companyName }))
    : [];
  const peopleOptions = (peopleQuery.data ?? []).map((person) => ({ id: person.id, label: person.displayName }));
  const userOptions = (usersQuery.data ?? []).map((user) => ({ id: user.id, label: user.displayName }));

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Performance</h1>
            <p className="mt-1 text-sm text-slate-600">
              Reviews, coaching plans, and one-on-ones: how employees are evaluated and developed.
            </p>
          </div>

          {canMutate && activeTab === 'reviews' ? (
            <button
              type="button"
              onClick={() => setIsCreatingReview((current) => !current)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              {isCreatingReview ? 'Close Form' : 'New Review'}
            </button>
          ) : null}
          {canMutate && activeTab === 'coaching' ? (
            <button
              type="button"
              onClick={() => {
                if (showPlanCreateForm) {
                  handleCancelPlanForm();
                } else {
                  setPlanFormDismissed(false);
                  setIsCreatingPlan(true);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              {showPlanCreateForm ? 'Close Form' : 'New Coaching Plan'}
            </button>
          ) : null}
        </div>

        <nav aria-label="Performance sections" className="flex gap-1 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectTab(tab.key)}
              aria-current={activeTab === tab.key ? 'page' : undefined}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === tab.key
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {actionError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}

        {activeTab === 'reviews' ? (
          <>
            {reviewsQuery.error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {reviewsQuery.error instanceof Error ? reviewsQuery.error.message : 'Unable to load reviews.'}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{counts.draft}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">In Review</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{counts.inReview}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting Acknowledgment</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{counts.awaitingAcknowledgment}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overdue</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{counts.overdue}</p>
              </div>
            </div>

            {isCreatingReview && canMutate && selectedCompanyId ? (
              <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">New Review</h2>
                <MhdReviewForm
                  mode="create"
                  companyId={selectedCompanyId}
                  people={peopleOptions}
                  reviewers={userOptions}
                  meetingActivities={[]}
                  onSubmit={handleCreateReview}
                  onCancel={() => setIsCreatingReview(false)}
                  isSubmitting={reviewActions.createReview.isPending}
                />
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
              <MhdReviewFilterBar
                filters={effectiveReviewFilters}
                onChange={setReviewFilters}
                companies={companyOptions}
                people={peopleOptions}
                reviewers={userOptions}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
              {reviewsQuery.isLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading reviews…</div>
              ) : (
                <MhdReviewList reviews={reviews} />
              )}
            </section>
          </>
        ) : null}

        {activeTab === 'coaching' ? (
          <>
            {plansQuery.error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {plansQuery.error instanceof Error ? plansQuery.error.message : 'Unable to load coaching plans.'}
              </div>
            ) : null}

            {showPlanCreateForm && canMutate && selectedCompanyId ? (
              <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">New Coaching Plan</h2>
                <MhdCoachingPlanForm
                  mode="create"
                  companyId={selectedCompanyId}
                  sourceReviewId={fromReviewId}
                  sourceReviewLabel={sourceReviewQuery.data?.referenceId ?? null}
                  people={peopleOptions}
                  coaches={userOptions}
                  onSubmit={handleCreatePlan}
                  onCancel={handleCancelPlanForm}
                  isSubmitting={planActions.createPlan.isPending}
                />
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
              {plansQuery.isLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading coaching plans…</div>
              ) : (
                <MhdCoachingPlanList plans={plans} />
              )}
            </section>
          </>
        ) : null}

        {activeTab === 'one-on-ones' && selectedCompanyId ? (
          <section className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
            <MhdOneOnOneTab
              companyId={selectedCompanyId}
              currentUserId={profile?.userId ?? ''}
              canMutate={canMutate}
              people={peopleOptions}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
