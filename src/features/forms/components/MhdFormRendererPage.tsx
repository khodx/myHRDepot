import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateForms } from '@/appshell/mhdRouteAccess';
import { mhdOnboardingService } from '@/features/onboarding/Service';
import { MHD_ONBOARDING_PACKET_BY_KEY, mhdIsOnboardingDocumentKey } from '@/features/onboarding/Types';
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
  const [syncError, setSyncError] = useState<string | null>(null);

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
  const onboardingPersonId = searchParams.get('personId') ?? undefined;
  const onboardingPersonName = searchParams.get('personName') ?? undefined;
  const onboardingDocumentKeyValue = searchParams.get('documentKey');
  const onboardingDocumentKey = mhdIsOnboardingDocumentKey(onboardingDocumentKeyValue)
    ? onboardingDocumentKeyValue
    : null;
  const onboardingPacket = onboardingDocumentKey ? MHD_ONBOARDING_PACKET_BY_KEY[onboardingDocumentKey] : null;
  const shouldRouteToEsignature =
    !!onboardingPersonId && !!onboardingPacket?.requiresSignature && !!onboardingPacket.generatedDocumentRequired;
  const userPrefillValues = useMemo(
    () => ({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      displayName: profile?.displayName ?? '',
      email: profile?.email ?? '',
    }),
    [profile],
  );

  async function handleSubmissionSuccess(nextSubmissionId: string) {
    setSyncError(null);

    if (onboardingPersonId && onboardingDocumentKey && profile?.userId && profile?.companyId) {
      try {
        await mhdOnboardingService.upsertChecklistItemFromSubmittedForm({
          companyId: profile.companyId,
          personId: onboardingPersonId,
          documentKey: onboardingDocumentKey,
          submissionId: nextSubmissionId,
          actorUserId: profile.userId,
        });
        setMessage('Submission submitted and onboarding checklist updated.');
      } catch (error) {
        setMessage('Submission submitted successfully.');
        setSyncError(error instanceof Error ? error.message : 'Unable to sync onboarding checklist.');
      }
    } else {
      setMessage('Submission submitted successfully.');
    }

    const allDrafts = await mhdFormService.listMyDraftSubmissions();
    setDrafts(allDrafts.filter((draft) => draft.formId === formId));
  }

  if (!formId) {
    return <div className="p-6 text-sm text-red-600">No form id was provided.</div>;
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/forms"
        backLabel="Forms"
        title="Form Renderer"
        description="This route exercises the same `mhd_get_form`, draft, and submit RPC surface that Stage 3 will verify locally."
        actions={
          <>
            {onboardingPersonId ? (
              <Link
                to={`/people/${onboardingPersonId}`}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
              >
                Back to Person
              </Link>
            ) : null}
            <Link to={`/forms/${formId}`} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
              {canMutate ? 'Open Builder' : 'View Form'}
            </Link>
            <Link to={`/forms/${formId}/submissions`} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
              View Submissions
            </Link>
          </>
        }
      />
      <div className="space-y-6">

        {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
        {syncError ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{syncError}</div> : null}

        {onboardingPersonId && onboardingPacket ? (
          <div className="rounded-lg border border-border bg-accent-tint p-4 text-sm text-foreground">
            <p className="font-semibold">Onboarding packet context</p>
            <p className="mt-1">
              Rendering <span className="font-semibold">{onboardingPacket.label}</span>
              {onboardingPersonName ? ` for ${onboardingPersonName}` : ''}. After submit, the page syncs `onboarding_checklist_items` for this person.
            </p>
            {shouldRouteToEsignature ? (
              <p className="mt-2">
                This packet item also requires a generated document plus a Stage 6 e-signature request. Once the document is generated, route it from the{' '}
                <Link
                  to={`/esignature?personId=${encodeURIComponent(onboardingPersonId)}&personName=${encodeURIComponent(onboardingPersonName ?? 'Person')}`}
                  className="font-semibold text-accent underline hover:text-accent-hover"
                >
                  E-Signature Center
                </Link>.
              </p>
            ) : null}
          </div>
        ) : null}

        {shouldRouteToEsignature ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Post-submit handoff</p>
            <p className="mt-1">
              Submitting this form does not itself create the signature request. After document generation completes, use the{' '}
              <Link
                to={`/esignature?personId=${encodeURIComponent(onboardingPersonId!)}&personName=${encodeURIComponent(onboardingPersonName ?? 'Person')}`}
                className="font-semibold underline"
              >
                E-Signature Center
              </Link>{' '}
              to route the generated document into the signer workflow.
            </p>
          </div>
        ) : null}

        <MhdFormResumeDrafts
          drafts={drafts.map((draft) => ({
            id: draft.id,
            referenceId: draft.referenceId,
            formId: draft.formId,
            updatedAt: draft.updatedAt,
          }))}
          onResume={(nextSubmissionId) => navigate(`/forms/${formId}/render?submissionId=${nextSubmissionId}`)}
        />

        <MhdCard className="p-0">
          <MhdFormRenderer
            formId={formId}
            submissionId={submissionId}
            taskId={taskId}
            readOnly={!canMutate}
            userPrefillValues={userPrefillValues}
            onSubmitted={(nextSubmissionId) => {
              void handleSubmissionSuccess(nextSubmissionId);
            }}
          />
        </MhdCard>
      </div>
    </div>
  );
}
