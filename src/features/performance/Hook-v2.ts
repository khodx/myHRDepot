import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MhdAddReviewCompetencyInput,
  MhdCloseFeedbackInput,
  MhdDeclineParticipationInput,
  MhdInviteParticipantInput,
  MhdRateCompetencyInput,
  MhdSubmitFeedbackInput,
} from './Types-v2';
import { mhdPerformanceV2Service } from './Service-v2';

/**
 * Namespaced under `mhd-performance-v2` so these keys sit alongside the v1
 * `mhd-performance` keys without colliding. Review CRUD invalidation still lives
 * in `Hook.ts`; nothing here touches it.
 */
export const mhdPerformanceV2QueryKeys = {
  feedbackThreshold: (companyId: string | null) =>
    ['mhd-performance-v2', 'feedback-threshold', companyId ?? ''] as const,
  feedbackAggregate: (reviewId: string | null) =>
    ['mhd-performance-v2', 'feedback-aggregate', reviewId ?? ''] as const,
  participants: (reviewId: string | null) =>
    ['mhd-performance-v2', 'participants', reviewId ?? ''] as const,
  reviewCompetencies: (reviewId: string | null) =>
    ['mhd-performance-v2', 'review-competencies', reviewId ?? ''] as const,
  myInvitations: () => ['mhd-performance-v2', 'my-invitations'] as const,
  templates: (companyId: string | null) =>
    ['mhd-performance-v2', 'templates', companyId ?? ''] as const,
  settings: (companyId: string | null) =>
    ['mhd-performance-v2', 'settings', companyId ?? ''] as const,
};

// ---------------------------------------------------------------------------
// Feedback settings and aggregation
// ---------------------------------------------------------------------------

export function useMhdFeedbackThreshold(companyId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceV2QueryKeys.feedbackThreshold(companyId),
    queryFn: () => mhdPerformanceV2Service.feedbackThreshold(companyId!),
    enabled: Boolean(companyId),
  });
}

/**
 * Aggregated 360 feedback.
 *
 * An empty result is a valid, expected state — the threshold withholding
 * everything below it, not an error and not "nobody answered". Render it with
 * `mhdFeedbackReleaseState` against the participant list so the panel can say
 * *why* a group is missing; never let an empty array become a blank section that
 * reads as silence.
 */
export function useMhdFeedbackAggregate(reviewId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceV2QueryKeys.feedbackAggregate(reviewId),
    queryFn: () => mhdPerformanceV2Service.feedbackAggregate(reviewId!),
    enabled: Boolean(reviewId),
  });
}

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------

export function useMhdReviewParticipants(reviewId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceV2QueryKeys.participants(reviewId),
    queryFn: () => mhdPerformanceV2Service.listParticipants(reviewId!),
    enabled: Boolean(reviewId),
  });
}

export function useMhdInviteParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdInviteParticipantInput) =>
      mhdPerformanceV2Service.inviteParticipant(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.participants(input.reviewId),
      });
    },
  });
}

export function useMhdApproveParticipant(reviewId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) =>
      mhdPerformanceV2Service.approveParticipant(participantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.participants(reviewId),
      });
    },
  });
}

/**
 * A rater submitting their own feedback.
 *
 * Invalidates the aggregate as well as the participant list: a new response can
 * carry an anonymous group across the release threshold, at which point the
 * withheld panel must become the real one. It also refreshes `myInvitations`,
 * since the submitting rater's own status moves to RESPONDED.
 */
export function useMhdSubmitFeedback(reviewId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSubmitFeedbackInput) => mhdPerformanceV2Service.submitFeedback(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.participants(reviewId),
      });
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.feedbackAggregate(reviewId),
      });
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.myInvitations(),
      });
    },
  });
}

export function useMhdDeclineParticipation(reviewId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdDeclineParticipationInput) =>
      mhdPerformanceV2Service.declineParticipation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.participants(reviewId),
      });
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.myInvitations(),
      });
    },
  });
}

export function useMhdCloseFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCloseFeedbackInput) => mhdPerformanceV2Service.closeFeedback(input),
    onSuccess: (_result, input) => {
      // Closing does not change the responses already in, but it changes what the
      // review is allowed to do next (it may now leave IN_REVIEW), so the
      // participant list is refreshed to surface the closed state.
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.participants(input.reviewId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Competencies on a review
// ---------------------------------------------------------------------------

export function useMhdReviewCompetencies(reviewId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceV2QueryKeys.reviewCompetencies(reviewId),
    queryFn: () => mhdPerformanceV2Service.listReviewCompetencies(reviewId!),
    enabled: Boolean(reviewId),
  });
}

/**
 * Seeding is keyed by review id rather than taking an argument at call time,
 * because seeding is idempotent (the RPC upserts) and always targets the review
 * whose competency list this hook then invalidates.
 */
export function useMhdSeedCompetencies(reviewId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mhdPerformanceV2Service.seedCompetencies(reviewId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.reviewCompetencies(reviewId),
      });
    },
  });
}

export function useMhdAddReviewCompetency(reviewId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAddReviewCompetencyInput) =>
      mhdPerformanceV2Service.addReviewCompetency(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.reviewCompetencies(reviewId),
      });
    },
  });
}

export function useMhdRateCompetency(reviewId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRateCompetencyInput) => mhdPerformanceV2Service.rateCompetency(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.reviewCompetencies(reviewId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// The invited rater's own view
// ---------------------------------------------------------------------------

/**
 * The one read an invited peer or direct report can make: their own outstanding
 * and answered invitations. They cannot see the reviews behind them, so this is
 * the entire surface such a user has.
 */
export function useMhdMyInvitations(enabled = true) {
  return useQuery({
    queryKey: mhdPerformanceV2QueryKeys.myInvitations(),
    queryFn: () => mhdPerformanceV2Service.myInvitations(),
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Templates and feedback settings (privileged config)
// ---------------------------------------------------------------------------

export function useMhdReviewTemplates(companyId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceV2QueryKeys.templates(companyId),
    queryFn: () => mhdPerformanceV2Service.listTemplates(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdCreateReviewTemplate(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdPerformanceV2Service.createTemplate>[0]) =>
      mhdPerformanceV2Service.createTemplate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.templates(companyId),
      });
    },
  });
}

export function useMhdPublishReviewTemplate(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, effectiveFrom }: { templateId: string; effectiveFrom?: string | null }) =>
      mhdPerformanceV2Service.publishTemplate(templateId, effectiveFrom),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.templates(companyId),
      });
    },
  });
}

export function useMhdFeedbackSettings(companyId: string | null) {
  return useQuery({
    queryKey: mhdPerformanceV2QueryKeys.settings(companyId),
    queryFn: () => mhdPerformanceV2Service.getSettings(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdUpsertFeedbackSettings(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      minResponsesForRelease,
      releaseVerbatimComments,
    }: {
      minResponsesForRelease: number;
      releaseVerbatimComments: boolean;
    }) =>
      mhdPerformanceV2Service.upsertSettings(
        companyId!,
        minResponsesForRelease,
        releaseVerbatimComments,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdPerformanceV2QueryKeys.settings(companyId),
      });
      // The threshold changing affects what every aggregate on this company releases.
      void queryClient.invalidateQueries({ queryKey: ['mhd-performance-v2', 'feedback-aggregate'] });
    },
  });
}
