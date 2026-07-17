import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateForms } from '@/appshell/mhdRouteAccess';
import type { MhdFormSubmission } from '../Types';
import { mhdFormService } from '../Service';
import { MhdFormRenderer } from './MhdFormRenderer';
import { MhdFormResumeDrafts } from './MhdFormDraftSave';

export function MhdFormRendererPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateForms(roles);
  const [searchParams] = useSearchParams();
  const [drafts, setDrafts] = useState<MhdFormSubmission[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadDrafts = async () => {
      if (!formId) return;
      try {
        const allDrafts = await mhdFormService.listMyDraftSubmissions();
        if (!isCancelled) {
          setDrafts(allDrafts.filter((draft) => draft.formId === formId));
        }
      } catch {
        if (!isCancelled) {
          setDrafts([]);
        }
      }
    };

    void loadDrafts();

    return () => {
      isCancelled = true;
    };
  }, [formId]);

  const submissionId = searchParams.get('submissionId') ?? undefined;
  const taskId = searchParams.get('taskId') ?? undefined;
  const userPrefillValues = useMemo(
    () => ({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      displayName: profile?.displayName ?? '',
      email: profile?.email ?? '',
    }),
    [profile],
  );

  if (!formId) {
    return <div className="p-6 text-sm text-red-600">No form id was provided.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/forms" className="font-semibold text-blue-700 hover:underline">
                Forms
              </Link>
              <span>/</span>
              <span>Runtime Renderer</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Form Renderer</h1>
            <p className="mt-1 text-sm text-slate-600">
              This route exercises the same `mhd_get_form`, draft, and submit RPC surface that Stage 3 will verify locally.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={`/forms/${formId}`} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              {canMutate ? 'Open Builder' : 'View Form'}
            </Link>
            <Link to={`/forms/${formId}/submissions`} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              View Submissions
            </Link>
          </div>
        </div>

        {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}

        <MhdFormResumeDrafts
          drafts={drafts.map((draft) => ({
            id: draft.id,
            referenceId: draft.referenceId,
            formId: draft.formId,
            updatedAt: draft.updatedAt,
          }))}
          onResume={(nextSubmissionId) => navigate(`/forms/${formId}/render?submissionId=${nextSubmissionId}`)}
        />

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <MhdFormRenderer
            formId={formId}
            submissionId={submissionId}
            taskId={taskId}
            readOnly={!canMutate}
            userPrefillValues={userPrefillValues}
            onSubmitted={() => {
              setMessage('Submission saved successfully.');
              void mhdFormService.listMyDraftSubmissions().then((allDrafts) => {
                setDrafts(allDrafts.filter((draft) => draft.formId === formId));
              });
            }}
          />
        </div>
      </div>
    </main>
  );
}
