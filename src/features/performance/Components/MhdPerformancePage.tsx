import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTabs } from '@/components/ui/MhdTabs';
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
import { MhdCoachingPlanForm } from './MhdCoachingPlanForm';
import { MhdCoachingPlanList } from './MhdCoachingPlanList';
import { MhdOneOnOneTab } from './MhdOneOnOneTab';
import { MhdReviewFilterBar } from './MhdReviewFilterBar';
import { MhdReviewForm } from './MhdReviewForm';
import { MhdReviewList } from './MhdReviewList';

// companyId starts at 'ALL' (matching the Clear button's reset) so the
// cross-company fallback resolves to the signed-in user's company — an empty
// string would query an empty company id and render a blank board.
const DEFAULT_REVIEW_FILTERS: MhdReviewBoardFilters = {
  companyId: 'ALL',
  personId: 'ALL',
  reviewerUserId: 'ALL',
  reviewType: 'ALL',
  status: 'ALL',
  searchTerm: '',
  dueFrom: '',
  dueTo: '',
};
const DEFAULT_PLAN_FILTERS: MhdCoachingPlanBoardFilters = {
  companyId: '',
  personId: 'ALL',
  coachUserId: 'ALL',
  status: 'ALL',
  searchTerm: '',
};

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
  const activeTab: PerformanceTab =
    tabParam === 'coaching' || tabParam === 'one-on-ones' ? tabParam : 'reviews';
  const fromReviewId = searchParams.get('fromReview');

  const [reviewFilters, setReviewFilters] = useState<MhdReviewBoardFilters>(DEFAULT_REVIEW_FILTERS);
  const [isCreatingReview, setIsCreatingReview] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [planFormDismissed, setPlanFormDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedCompanyId = canCrossCompanyFilter
    ? reviewFilters.companyId !== 'ALL'
      ? reviewFilters.companyId
      : (profile?.companyId ?? null)
    : (profile?.companyId ?? null);

  const effectiveReviewFilters = useMemo<MhdReviewBoardFilters>(
    () => ({
      ...reviewFilters,
      companyId: canCrossCompanyFilter ? reviewFilters.companyId : (profile?.companyId ?? 'ALL'),
    }),
    [canCrossCompanyFilter, reviewFilters, profile?.companyId],
  );

  const planFilters = useMemo<MhdCoachingPlanBoardFilters>(
    () => ({
      ...DEFAULT_PLAN_FILTERS,
      // Same contract as the reviews query: the RPC needs a concrete company.
      companyId: selectedCompanyId ?? '',
    }),
    [selectedCompanyId],
  );

  // The list RPC takes a concrete company id — 'ALL' resolves to the signed-in
  // user's company via selectedCompanyId (the filter bar still displays 'ALL').
  const reviewQueryFilters = useMemo<MhdReviewBoardFilters>(
    () => ({ ...effectiveReviewFilters, companyId: selectedCompanyId ?? '' }),
    [effectiveReviewFilters, selectedCompanyId],
  );
  const reviewsQuery = useMhdPerformanceReviews(reviewQueryFilters);
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
  const peopleOptions = (peopleQuery.data ?? []).map((person) => ({
    id: person.id,
    label: person.displayName,
  }));
  const userOptions = (usersQuery.data ?? []).map((user) => ({
    id: user.id,
    label: user.displayName,
  }));

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Performance"
        description="Reviews, coaching plans, and one-on-ones: how employees are evaluated and developed."
        actions={
          <>
            {canMutate && activeTab === 'reviews' ? (
              <Button onClick={() => setIsCreatingReview((current) => !current)}>
                <Plus className="mr-1.5 h-4 w-4" />
                {isCreatingReview ? 'Close Form' : 'New Review'}
              </Button>
            ) : null}
            {canMutate && activeTab === 'coaching' ? (
              <Button
                onClick={() => {
                  if (showPlanCreateForm) {
                    handleCancelPlanForm();
                  } else {
                    setPlanFormDismissed(false);
                    setIsCreatingPlan(true);
                  }
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {showPlanCreateForm ? 'Close Form' : 'New Coaching Plan'}
              </Button>
            ) : null}
          </>
        }
      />

      <MhdTabs
        tabs={TABS.map((tab) => ({ value: tab.key, label: tab.label }))}
        value={activeTab}
        onChange={selectTab}
      />

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {activeTab === 'reviews' ? (
        <>
          {reviewsQuery.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {reviewsQuery.error instanceof Error
                ? reviewsQuery.error.message
                : 'Unable to load reviews.'}
            </div>
          ) : null}

          {isCreatingReview && canMutate && selectedCompanyId ? (
            <MhdCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">New Review</h2>
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
            </MhdCard>
          ) : null}

          <MhdReviewFilterBar
            filters={effectiveReviewFilters}
            onChange={setReviewFilters}
            companies={companyOptions}
            people={peopleOptions}
            reviewers={userOptions}
          />

          {reviewsQuery.isLoading ? (
            <MhdCard className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading reviews…
            </MhdCard>
          ) : (
            <MhdReviewList reviews={reviews} />
          )}
        </>
      ) : null}

      {activeTab === 'coaching' ? (
        <>
          {plansQuery.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {plansQuery.error instanceof Error
                ? plansQuery.error.message
                : 'Unable to load coaching plans.'}
            </div>
          ) : null}

          {showPlanCreateForm && canMutate && selectedCompanyId ? (
            <MhdCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">New Coaching Plan</h2>
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
            </MhdCard>
          ) : null}

          {plansQuery.isLoading ? (
            <MhdCard className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading coaching plans…
            </MhdCard>
          ) : (
            <MhdCoachingPlanList plans={plans} />
          )}
        </>
      ) : null}

      {activeTab === 'one-on-ones' && selectedCompanyId ? (
        <MhdCard>
          <MhdOneOnOneTab
            companyId={selectedCompanyId}
            currentUserId={profile?.userId ?? ''}
            canMutate={canMutate}
            people={peopleOptions}
          />
        </MhdCard>
      ) : null}
    </div>
  );
}
