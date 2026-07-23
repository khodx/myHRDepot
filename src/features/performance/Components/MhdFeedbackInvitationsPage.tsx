import { useMemo, useState } from 'react';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdFeedbackThreshold, useMhdMyInvitations } from '../Hook-v2';
import { MHD_FEEDBACK_THRESHOLD_FLOOR } from '../Types-v2';
import { MhdMyFeedbackInvitations } from './MhdMyFeedbackInvitations';
import { MhdFeedbackForm } from './MhdFeedbackForm';

/**
 * /performance/invitations — the invited rater's entire surface.
 *
 * This page NEVER loads the review. A peer or upward rater cannot read the review
 * behind their invitation (RLS refuses it, and `mhd_performance_list_review_competencies`
 * asserts review access before returning a row), so nothing here calls
 * `useMhdPerformanceReview` or `useMhdReviewCompetencies`. It reads only
 * `mhd_performance_my_invitations` (scoped to `auth.uid()`) and the caller's own
 * company threshold — both safe for a principal who can see nothing else about the
 * review. A component that tried to load the review would surface a permission
 * error to someone who has done nothing wrong.
 */
export function MhdFeedbackInvitationsPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;

  const [openParticipantId, setOpenParticipantId] = useState<string | null>(null);

  const invitationsQuery = useMhdMyInvitations();
  const thresholdQuery = useMhdFeedbackThreshold(companyId);
  const threshold = thresholdQuery.data ?? MHD_FEEDBACK_THRESHOLD_FLOOR;

  const openInvitation = useMemo(
    () => (invitationsQuery.data ?? []).find((invitation) => invitation.participantId === openParticipantId) ?? null,
    [invitationsQuery.data, openParticipantId],
  );

  if (openInvitation) {
    return (
      <div className="mx-auto max-w-3xl">
          <div>
            <button
              type="button"
              onClick={() => setOpenParticipantId(null)}
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              ← Back to feedback requests
            </button>
          </div>
          {/*
            The rater's questions are attached to the review by the reviewer. They are
            not fetchable here because the rater cannot read the review — so the form
            is opened with no pre-loaded competency cards; the rater can record their
            answer or decline. The specific competency/section items are supplied by
            the review context when that becomes rater-safe to fetch (see report).
          */}
          <MhdFeedbackForm
            participantId={openInvitation.participantId}
            reviewId={openInvitation.reviewId}
            participantType={openInvitation.participantType}
            threshold={threshold}
            items={[]}
            onDone={() => setOpenParticipantId(null)}
          />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <MhdMyFeedbackInvitations onOpen={setOpenParticipantId} />
    </div>
  );
}
