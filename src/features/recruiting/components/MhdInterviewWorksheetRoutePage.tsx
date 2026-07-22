import { useNavigate, useParams } from 'react-router-dom';
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
      <div className="p-6 text-sm text-neutral-600">This interview could not be resolved.</div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-neutral-500 underline"
      >
        ← Back
      </button>
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Interview scorecard</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Score each question below. Compliance guidance rides inline with any flagged question.
        </p>
      </div>
      <MhdInterviewWorksheet
        interviewId={interviewId}
        canSubmit={Boolean(profile)}
        onSubmitted={() => navigate(-1)}
      />
    </div>
  );
}
