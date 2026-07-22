import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { MhdForm, MhdFormSubmission } from '../Types';
import { mhdFormService } from '../Service';
import { MhdFormSubmissionReview } from './MhdFormSubmissionReview';

export function MhdFormSubmissionsPage() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<MhdForm | null>(null);
  const [submissions, setSubmissions] = useState<MhdFormSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;

    let isCancelled = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [loadedForm, loadedSubmissions] = await Promise.all([
          mhdFormService.getFormById(formId),
          mhdFormService.listSubmissionsForForm(formId),
        ]);

        if (!isCancelled) {
          setForm(loadedForm);
          setSubmissions(loadedSubmissions);
          setSelectedSubmissionId((current) => current ?? loadedSubmissions[0]?.id ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load submissions');
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [formId]);

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  );

  if (!formId) {
    return <div className="p-6 text-sm text-red-600">No form id was provided.</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading submissions...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/forms" className="font-semibold text-blue-700 hover:underline">
                Forms
              </Link>
              <span>/</span>
              <span>Submissions</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {form ? `${form.name} Submissions` : 'Form Submissions'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review runtime submissions returned by `mhd_list_submissions_for_form` and `mhd_get_submission`.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={`/forms/${formId}`} className="rounded-md border border-slate-300 bg-card px-4 py-2 text-sm font-semibold text-slate-700">
              Open Builder
            </Link>
            <Link to={`/forms/${formId}/render`} className="rounded-md border border-slate-300 bg-card px-4 py-2 text-sm font-semibold text-slate-700">
              Open Renderer
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
          <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Submission List</h2>
            <div className="mt-3 space-y-2">
              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(submission.id)}
                  className={`w-full rounded-md border px-3 py-3 text-left ${
                    selectedSubmissionId === submission.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-card hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{submission.referenceId}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{submission.status}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(submission.createdAt).toLocaleString()}</p>
                </button>
              ))}
              {submissions.length === 0 ? <p className="text-sm text-slate-500">No submissions recorded yet.</p> : null}
            </div>
          </div>

          <MhdFormSubmissionReview submission={selectedSubmission} />
        </div>
      </div>
    </main>
  );
}
