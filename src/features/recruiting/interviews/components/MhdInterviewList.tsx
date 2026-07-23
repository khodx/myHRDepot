import { useMhdInterviews } from '../Hook';
import { MhdInterviewStatusBadge } from './MhdInterviewStatusBadge';

interface Props {
  applicationId: string;
  /**
   * Open an interview's worksheet. On the recruiter/HM surface this opens any
   * interview; an interviewer reaches only their own (the worksheet RPC gates on
   * `mhd_interview_can_access_interview`, so a non-assigned open simply raises).
   */
  onOpenWorksheet?: (interviewId: string) => void;
}

/**
 * An application's interviews, with status. Visible to whoever can view the parent
 * requisition; interviewers are NOT anonymous, so each row names its interviewer.
 */
export function MhdInterviewList({ applicationId, onOpenWorksheet }: Props) {
  const interviews = useMhdInterviews(applicationId);

  if (interviews.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading interviews…</p>;
  }

  if ((interviews.data ?? []).length === 0) {
    return <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Interviews</h2>
      <ul className="space-y-2">
        {(interviews.data ?? []).map((interview) => (
          <li
            key={interview.id}
            className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenWorksheet?.(interview.id)}
                  className="text-left text-sm font-medium text-accent hover:text-accent-hover"
                >
                  {interview.interviewerName ?? 'Unassigned interviewer'}
                </button>
                <MhdInterviewStatusBadge status={interview.status} />
              </div>
              <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                {interview.referenceId}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {interview.interviewType ? <span>{interview.interviewType}</span> : null}
                {interview.scheduledDate ? <span>Scheduled {interview.scheduledDate}</span> : null}
                {interview.completedAt ? (
                  <span>Completed {new Date(interview.completedAt).toLocaleDateString()}</span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
