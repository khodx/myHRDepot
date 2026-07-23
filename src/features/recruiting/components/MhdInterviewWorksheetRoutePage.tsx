import { useNavigate, useParams } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdInterviewWorksheet } from '../interviews/components/MhdInterviewWorksheet';

/**
 * `/recruiting/interviews/:interviewId` — the interviewer worksheet (scorecard).
 *
 * The route is gated only to authenticated non-Viewer (see mhdRouteAccess); the
 * ACTUAL access is server-scoped: `mhd_interview_can_access_interview` (the
 * assigned interviewer OR a recruiter who can view the requisition), so a caller
 * who reaches the route but is not entitled simply loads an empty/denied worksheet.
 * `canSubmit` is left to the server — we render the affordance and the RPC decides.
 */
export function MhdInterviewWorksheetRoutePage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { profile } = useMhdAuth();
  const navigate = useNavigate();

  if (!interviewId) {
    return (
      <div className="text-sm text-muted-foreground">This interview could not be resolved.</div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-hover"
      >
        ← Back
      </button>
      <MhdPageHeader
        title="Interview scorecard"
        description="Score each question below. Compliance guidance rides inline with any flagged question."
      />
      <MhdInterviewWorksheet
        interviewId={interviewId}
        canSubmit={Boolean(profile)}
        onSubmitted={() => navigate(-1)}
      />
    </div>
  );
}
