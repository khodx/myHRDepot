import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import { mhdTaskService } from '@/features/tasks/Service';
import type { MhdUpdateActivityInput } from '@/features/activities/Types';
import type {
  MhdCoachingPlanFilters,
  MhdCreateCoachingPlanInput,
  MhdCreateCoachingPlanItemInput,
  MhdCreatePerformanceReviewInput,
  MhdFinalizeReviewForSignatureInput,
  MhdPerformanceReviewFilters,
  MhdTransitionCoachingPlanInput,
  MhdTransitionPerformanceReviewInput,
  MhdUpdateCoachingPlanInput,
  MhdUpdateCoachingPlanItemInput,
  MhdUpdatePerformanceReviewInput,
} from './Types';
import { mhdPerformanceService } from './Service';
import type { MhdReviewFinalizeStepState } from './Types';

export const mhdPerformanceQueryKeys = {
  reviews: (filters: MhdPerformanceReviewFilters) =>
    ['mhd-performance', 'reviews', filters] as const,
  reviewDetail: (reviewId: string | null) =>
    ['mhd-performance', 'review-detail', reviewId ?? ''] as const,
  coachingPlans: (filters: MhdCoachingPlanFilters) =>
    ['mhd-performance', 'coaching-plans', filters] as const,
  coachingPlanDetail: (planId: string | null) =>
    ['mhd-performance', 'coaching-plan-detail', planId ?? ''] as const,
  coachingPlanItems: (planId: string | null) =>
    ['mhd-performance', 'coaching-plan-items', planId ?? ''] as const,
  personActivities: (
    companyId: string | null,
    personId: string | null,
    activityType: 'ONE_ON_ONE' | 'COACHING_SESSION',
  ) =>
    [
      'mhd-performance',
      'person-activities',
      companyId ?? '',
      personId ?? '',
      activityType,
    ] as const,
  people: (companyId: string | null) => ['mhd-performance', 'people', companyId ?? 'ALL'] as const,
  users: (companyId: string | null) => ['mhd-performance', 'users', companyId ?? 'ALL'] as const,
};

export function useMhdPerformanceReviews(filters: MhdPerformanceReviewFilters) {
  return useQuery({
    queryKey: mhdPerformanceQueryKeys.reviews(filters),
    queryFn: () => mhdPerformanceService.listReviews(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdPerformanceReview(reviewId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceQueryKeys.reviewDetail(reviewId),
    queryFn: () => mhdPerformanceService.getReviewById(reviewId!),
    enabled: Boolean(reviewId),
  });
}

export function useMhdCoachingPlans(filters: MhdCoachingPlanFilters) {
  return useQuery({
    queryKey: mhdPerformanceQueryKeys.coachingPlans(filters),
    queryFn: () => mhdPerformanceService.listCoachingPlans(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdCoachingPlan(planId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceQueryKeys.coachingPlanDetail(planId),
    queryFn: () => mhdPerformanceService.getCoachingPlanById(planId!),
    enabled: Boolean(planId),
  });
}

export function useMhdCoachingPlanItems(planId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceQueryKeys.coachingPlanItems(planId),
    queryFn: () => mhdPerformanceService.listCoachingPlanItems(planId!),
    enabled: Boolean(planId),
  });
}

/** Person-scoped ONE_ON_ONE / COACHING_SESSION surface (Activities contract, rule 8). */
export function useMhdPerformancePersonActivities(
  companyId: string | null,
  personId: string | null,
  activityType: 'ONE_ON_ONE' | 'COACHING_SESSION',
  enabled = true,
) {
  return useQuery({
    queryKey: mhdPerformanceQueryKeys.personActivities(companyId, personId, activityType),
    queryFn: () => mhdPerformanceService.listPersonActivities(companyId!, personId!, activityType),
    enabled: enabled && Boolean(companyId) && Boolean(personId),
  });
}

/** Subject picker (People directory). */
export function useMhdPerformancePeople(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdPerformanceQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId ?? 'ALL', searchTerm: '' }),
    enabled: enabled && Boolean(companyId),
  });
}

/** Reviewer / coach pickers (`mhd_list_task_assignable_users` via the Tasks contract). */
export function useMhdPerformanceUsers(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdPerformanceQueryKeys.users(companyId),
    queryFn: () => mhdTaskService.listAssignableUsers(companyId ?? 'ALL'),
    enabled: enabled && Boolean(companyId),
  });
}

export function useMhdPerformanceActions() {
  const queryClient = useQueryClient();

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mhd-performance'] }),
      // One-on-one / coaching-session creation and linking mutate Activities data.
      queryClient.invalidateQueries({ queryKey: ['mhd-activities'] }),
    ]);
  }

  const createReview = useMutation({
    mutationFn: (input: MhdCreatePerformanceReviewInput) =>
      mhdPerformanceService.createReview(input),
    onSuccess: invalidate,
  });

  const updateReview = useMutation({
    mutationFn: ({
      reviewId,
      input,
    }: {
      reviewId: string;
      input: MhdUpdatePerformanceReviewInput;
    }) => mhdPerformanceService.updateReview(reviewId, input),
    onSuccess: invalidate,
  });

  const transitionReview = useMutation({
    mutationFn: ({
      reviewId,
      input,
    }: {
      reviewId: string;
      input: MhdTransitionPerformanceReviewInput;
    }) => mhdPerformanceService.transitionReview(reviewId, input),
    onSuccess: invalidate,
  });

  const deleteReview = useMutation({
    mutationFn: (reviewId: string) => mhdPerformanceService.deleteReview(reviewId),
    onSuccess: invalidate,
  });

  const finalizeReviewForSignature = useMutation({
    mutationFn: (input: MhdFinalizeReviewForSignatureInput) =>
      mhdPerformanceService.finalizeReviewForSignature(input),
    onSuccess: invalidate,
  });

  const createCoachingPlan = useMutation({
    mutationFn: (input: MhdCreateCoachingPlanInput) =>
      mhdPerformanceService.createCoachingPlan(input),
    onSuccess: invalidate,
  });

  const updateCoachingPlan = useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: MhdUpdateCoachingPlanInput }) =>
      mhdPerformanceService.updateCoachingPlan(planId, input),
    onSuccess: invalidate,
  });

  const transitionCoachingPlan = useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: MhdTransitionCoachingPlanInput }) =>
      mhdPerformanceService.transitionCoachingPlan(planId, input),
    onSuccess: invalidate,
  });

  const deleteCoachingPlan = useMutation({
    mutationFn: (planId: string) => mhdPerformanceService.deleteCoachingPlan(planId),
    onSuccess: invalidate,
  });

  const createCoachingPlanItem = useMutation({
    mutationFn: (input: MhdCreateCoachingPlanItemInput) =>
      mhdPerformanceService.createCoachingPlanItem(input),
    onSuccess: invalidate,
  });

  const updateCoachingPlanItem = useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: MhdUpdateCoachingPlanItemInput }) =>
      mhdPerformanceService.updateCoachingPlanItem(itemId, input),
    onSuccess: invalidate,
  });

  const deleteCoachingPlanItem = useMutation({
    mutationFn: (itemId: string) => mhdPerformanceService.deleteCoachingPlanItem(itemId),
    onSuccess: invalidate,
  });

  const createPersonActivity = useMutation({
    mutationFn: (input: MhdUpdateActivityInput) =>
      mhdPerformanceService.createPersonActivity(input),
    onSuccess: invalidate,
  });

  return {
    createReview,
    updateReview,
    transitionReview,
    deleteReview,
    finalizeReviewForSignature,
    createCoachingPlan,
    updateCoachingPlan,
    transitionCoachingPlan,
    deleteCoachingPlan,
    createCoachingPlanItem,
    updateCoachingPlanItem,
    deleteCoachingPlanItem,
    createPersonActivity,
  };
}

/** Component-facing split contracts over the one shared invalidation domain. */
export function useMhdPerformanceReviewActions() {
  const actions = useMhdPerformanceActions();
  return {
    createReview: actions.createReview,
    updateReview: actions.updateReview,
    transitionReview: {
      ...actions.transitionReview,
      mutateAsync: ({
        reviewId,
        newStatus,
        waiverReason,
      }: {
        reviewId: string;
        newStatus: MhdTransitionPerformanceReviewInput['newStatus'];
        waiverReason?: string | null;
      }) => actions.transitionReview.mutateAsync({ reviewId, input: { newStatus, waiverReason } }),
    },
    deleteReview: {
      ...actions.deleteReview,
      mutateAsync: ({ reviewId }: { reviewId: string }) =>
        actions.deleteReview.mutateAsync(reviewId),
    },
  };
}
export function useMhdCoachingPlanActions() {
  const actions = useMhdPerformanceActions();
  return {
    createPlan: actions.createCoachingPlan,
    updatePlan: actions.updateCoachingPlan,
    transitionPlan: {
      ...actions.transitionCoachingPlan,
      mutateAsync: ({
        planId,
        newStatus,
        outcomeSummary,
      }: {
        planId: string;
        newStatus: MhdTransitionCoachingPlanInput['newStatus'];
        outcomeSummary?: string | null;
      }) =>
        actions.transitionCoachingPlan.mutateAsync({
          planId,
          input: { newStatus, outcomeSummary },
        }),
    },
    deletePlan: {
      ...actions.deleteCoachingPlan,
      mutateAsync: ({ planId }: { planId: string }) =>
        actions.deleteCoachingPlan.mutateAsync(planId),
    },
    createPlanItem: {
      ...actions.createCoachingPlanItem,
      mutateAsync: ({
        planId,
        input,
      }: {
        planId: string;
        input: Omit<MhdCreateCoachingPlanItemInput, 'planId'>;
      }) => actions.createCoachingPlanItem.mutateAsync({ planId, ...input }),
    },
    updatePlanItem: actions.updateCoachingPlanItem,
    deletePlanItem: {
      ...actions.deleteCoachingPlanItem,
      mutateAsync: ({ itemId }: { itemId: string }) =>
        actions.deleteCoachingPlanItem.mutateAsync(itemId),
    },
  };
}
export function useMhdReviewFinalize() {
  const actions = useMhdPerformanceActions();
  const [steps, setSteps] = useState<MhdReviewFinalizeStepState[]>([]);

  const reset = useCallback(() => {
    actions.finalizeReviewForSignature.reset();
    setSteps([]);
  }, [actions.finalizeReviewForSignature]);

  const finalize = useCallback(
    async (reviewId: string, signerUserId: string) => {
      if (!signerUserId) {
        throw new Error(
          'The review subject must have an active internal user account before an acknowledgment can be sent.',
        );
      }

      const initialSteps: MhdReviewFinalizeStepState[] = [
        ['resolve-template', 'Resolve review template'],
        ['request-generation', 'Request document generation'],
        ['render-document', 'Render document'],
        ['wait-for-generation', 'Verify generated document'],
        ['resolve-document-hash', 'Verify document hash'],
        ['create-signature-request', 'Create signature request'],
        ['link-documents', 'Link review documents'],
        ['transition-review', 'Move review to pending signature'],
      ].map(([key, label]) => ({ key, label, status: 'PENDING' }));
      setSteps(initialSteps);

      try {
        const result = await actions.finalizeReviewForSignature.mutateAsync({
          reviewId,
          signer: { kind: 'internal', userId: signerUserId },
          onStep: (stepNumber) => {
            setSteps((current) =>
              current.map((step, index) => ({
                ...step,
                status: index < stepNumber ? 'DONE' : index === stepNumber ? 'RUNNING' : 'PENDING',
              })),
            );
          },
        });
        setSteps((current) => current.map((step) => ({ ...step, status: 'DONE' })));
        return result;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        const match = /Finalize step (\d+)/.exec(message);
        const failedStep = match ? Number(match[1]) : 0;
        setSteps((current) =>
          current.map((step, index) => ({
            ...step,
            status: index < failedStep ? 'DONE' : index === failedStep ? 'ERROR' : 'PENDING',
            ...(index === failedStep ? { errorMessage: message } : {}),
          })),
        );
        throw cause;
      }
    },
    [actions.finalizeReviewForSignature],
  );

  return { finalize, reset, isFinalizing: actions.finalizeReviewForSignature.isPending, steps };
}
