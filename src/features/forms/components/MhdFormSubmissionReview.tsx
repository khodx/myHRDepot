import type { MhdFormSubmission } from '../Types';

interface MhdFormSubmissionReviewProps {
  submission: MhdFormSubmission | null;
}

export function MhdFormSubmissionReview({ submission }: MhdFormSubmissionReviewProps) {
  if (!submission) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Select a submission to review its answers.
      </div>
    );
  }

  const entries = Object.entries(submission.values);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{submission.referenceId}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{submission.status}</h3>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Created {new Date(submission.createdAt).toLocaleString()}</p>
          {submission.submittedAt ? <p>Submitted {new Date(submission.submittedAt).toLocaleString()}</p> : null}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No submission values were recorded.</p>
        ) : (
          <dl className="grid gap-3">
            {entries.map(([fieldId, value]) => (
              <div key={fieldId} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{fieldId}</dt>
                <dd className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
