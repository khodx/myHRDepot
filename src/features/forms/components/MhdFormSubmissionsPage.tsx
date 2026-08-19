import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanAccessFormsStudio } from '@/appshell/mhdRouteAccess';
import type { MhdForm, MhdFormSubmission } from '../Types';
import { mhdFormService } from '../Service';
import { MhdFormSubmissionReview } from './MhdFormSubmissionReview';
import { MhdFormRecordTabs } from './MhdFormRecordTabs';

export function MhdFormSubmissionsPage() {
  const { formId } = useParams<{ formId: string }>();
  const location = useLocation();
  const { roles, profile } = useMhdAuth();
  const canMutate = mhdCanAccessFormsStudio(roles);
  const [searchParams] = useSearchParams();
  const requestedSubmissionId = searchParams.get('submissionId');
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
          setSelectedSubmissionId(
            (current) =>
              current ??
              loadedSubmissions.find((submission) => submission.id === requestedSubmissionId)?.id ??
              loadedSubmissions[0]?.id ??
              null,
          );
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
  }, [formId, requestedSubmissionId]);

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  );

  if (!formId) {
    return <div className="p-6 text-sm text-red-600">No form id was provided.</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/forms"
        backLabel="Forms"
        title={form ? `${form.name} Submissions` : 'Form Submissions'}
        description="Review runtime submissions returned by `mhd_list_submissions_for_form` and `mhd_get_submission`."
        actions={
          <Link
            to={`/forms/${formId}/render`}
            state={{ backgroundLocation: location }}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
          >
            Open Renderer
          </Link>
        }
      />

      <MhdFormRecordTabs formId={formId} active="submissions" canMutate={canMutate} />

      <div className="space-y-6">
        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
          <MhdCard>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Submission List
            </h2>
            <div className="mt-3 space-y-2">
              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(submission.id)}
                  className={`w-full rounded-md border px-3 py-3 text-left ${
                    selectedSubmissionId === submission.id
                      ? 'border-accent bg-accent-tint'
                      : 'border-border bg-card hover:border-accent'
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">{submission.referenceId}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {submission.status}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(submission.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions recorded yet.</p>
              ) : null}
            </div>
          </MhdCard>

          <MhdFormSubmissionReview
            submission={selectedSubmission}
            companyId={form?.companyId ?? null}
            currentUserId={profile?.userId ?? null}
          />
        </div>
      </div>
    </div>
  );
}
