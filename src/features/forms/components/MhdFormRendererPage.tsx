import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateForms } from '@/appshell/mhdRouteAccess';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdEsignatureService } from '@/features/esignature/Service';
import { mhdOnboardingService } from '@/features/onboarding/Service';
import {
  MHD_ONBOARDING_PACKET_BY_KEY,
  mhdIsOnboardingDocumentKey,
} from '@/features/onboarding/Types';
import { mhdIsEmployeeFileTypeKey } from '@/features/employee-files/Types';
import type { MhdForm, MhdFormSubmission } from '../Types';
import { mhdFormService } from '../Service';
import { MhdFormRenderer } from './MhdFormRenderer';
import { MhdFormResumeDrafts } from './MhdFormDraftSave';

const RENDER_DOCUMENT_FUNCTION_NAME = 'render-document';
const DEFAULT_GENERATION_POLL_ATTEMPTS = 10;
const DEFAULT_GENERATION_POLL_INTERVAL_MS = 1500;

interface RenderDocumentResponse {
  success?: boolean;
  error?: string;
}

interface SubmissionGenerationPollRow {
  id: string;
  status: string;
  output_drive_file_id: string | null;
  output_document_hash: string | null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function fetchSubmissionGenerationUntilGenerated(
  generationId: string,
): Promise<SubmissionGenerationPollRow> {
  let generation: SubmissionGenerationPollRow | null = null;

  for (let attempt = 0; attempt < DEFAULT_GENERATION_POLL_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await delay(DEFAULT_GENERATION_POLL_INTERVAL_MS);
    }

    const { data, error } = await supabaseClient
      .from('document_generations')
      .select('id, status, output_drive_file_id, output_document_hash')
      .eq('id', generationId)
      .maybeSingle<SubmissionGenerationPollRow>();

    if (error) {
      throw new Error(`Unable to check document generation status: ${error.message}`);
    }
    if (!data) {
      throw new Error(`Document generation not found: ${generationId}`);
    }

    generation = data;
    if (generation.status === 'GENERATED') {
      return generation;
    }
    if (generation.status === 'FAILED') {
      throw new Error('Document generation failed - see generation history for details.');
    }
  }

  throw new Error(
    `Document generation did not complete in time (last status: ${generation?.status ?? 'PENDING'}).`,
  );
}

interface MhdFormRendererPageProps {
  /**
   * True when rendered inside `MhdFormModalRoute`'s `MhdModal` shell rather
   * than as the standalone full-page route. Suppresses the page-level
   * `MhdPageHeader` (back link + Open Builder/View Submissions actions,
   * which duplicate the modal's own close affordance and would navigate the
   * background page out from under the dialog) while leaving the actual
   * form-field rendering logic untouched.
   */
  embedded?: boolean;
}

export function MhdFormRendererPage({ embedded = false }: MhdFormRendererPageProps = {}) {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
  const employeeFilePersonId = searchParams.get('employeeFilePersonId') ?? undefined;
  const employeeFileUserId = searchParams.get('employeeFileUserId') ?? undefined;
  const employeeFileCategoryValue = searchParams.get('employeeFileCategory');
  const employeeFileCategory = mhdIsEmployeeFileTypeKey(employeeFileCategoryValue)
    ? employeeFileCategoryValue
    : null;
  const onboardingPersonId = searchParams.get('personId') ?? undefined;
  const onboardingPersonName = searchParams.get('personName') ?? undefined;
  const onboardingDocumentKeyValue = searchParams.get('documentKey');
  const onboardingDocumentKey = mhdIsOnboardingDocumentKey(onboardingDocumentKeyValue)
    ? onboardingDocumentKeyValue
    : null;
  const onboardingPacket = onboardingDocumentKey
    ? MHD_ONBOARDING_PACKET_BY_KEY[onboardingDocumentKey]
    : null;
  // SME review addition (Stage 6b review): MHD_ONBOARDING_PACKET_BY_KEY is a
  // static frontend config, entirely decoupled from the new forms.requires_esignature
  // DB column added in 0113/0115. Several onboarding packets have
  // requiresSignature: true here without any form having its own new
  // "Requires E-Signature" toggle configured yet, so the automatic
  // generate-and-sign trigger below won't fire for them. Restoring this
  // pre-submission guidance so those flows aren't left with zero signal
  // once a form is actually configured via the Builder, this banner and
  // the automatic trigger simply both apply — redundant, not harmful.
  const shouldRouteToEsignature =
    !!onboardingPersonId &&
    !!onboardingPacket?.requiresSignature &&
    !!onboardingPacket.generatedDocumentRequired;
  const userPrefillValues = useMemo(
    () => ({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      displayName: profile?.displayName ?? '',
      email: profile?.email ?? '',
    }),
    [profile],
  );

  async function handleSubmissionSuccess(nextSubmissionId: string, submittedForm: MhdForm) {
    setSyncError(null);
    let nextMessage = 'Submission submitted successfully.';

    if (onboardingPersonId && onboardingDocumentKey && profile?.userId && profile?.companyId) {
      try {
        await mhdOnboardingService.upsertChecklistItemFromSubmittedForm({
          companyId: profile.companyId,
          personId: onboardingPersonId,
          documentKey: onboardingDocumentKey,
          submissionId: nextSubmissionId,
          actorUserId: profile.userId,
        });
        nextMessage = 'Submission submitted and onboarding checklist updated.';
      } catch (error) {
        setSyncError(
          error instanceof Error ? error.message : 'Unable to sync onboarding checklist.',
        );
      }
    }

    setMessage(nextMessage);

    try {
      if (!submittedForm.requiresEsignature) return;

      if (!profile?.companyId) {
        throw new Error('Unable to create signature request: no company context is available.');
      }
      if (!profile.email) {
        throw new Error('Unable to create signature request: your profile has no email address.');
      }

      const { data: generationData, error: generationError } = await supabaseClient
        .rpc('mhd_request_submission_document_generation', {
          p_submission_id: nextSubmissionId,
        })
        .returns<
          Array<{ generation_id: string; generation_reference_id: string; status: string }>
        >();

      if (generationError) {
        throw new Error(`Document generation request failed: ${generationError.message}`);
      }

      const generationId = generationData?.[0]?.generation_id;
      if (!generationId) {
        throw new Error('Document generation request failed: no generation id returned.');
      }

      const { data: renderData, error: renderError } =
        await supabaseClient.functions.invoke<RenderDocumentResponse>(
          RENDER_DOCUMENT_FUNCTION_NAME,
          { body: { generation_id: generationId } },
        );

      if (renderError) {
        throw new Error(`Document render failed: ${renderError.message}`);
      }
      if (renderData?.success === false) {
        throw new Error(`Document render failed: ${renderData.error ?? 'unknown render error.'}`);
      }

      const generation = await fetchSubmissionGenerationUntilGenerated(generationId);
      const documentHash = trimmedOrUndefined(generation.output_document_hash);
      if (!documentHash) {
        throw new Error('Document generation completed without an output document hash.');
      }

      const signerName =
        trimmedOrUndefined(profile.displayName) ??
        trimmedOrUndefined(`${profile.firstName ?? ''} ${profile.lastName ?? ''}`) ??
        profile.email;
      const result = await mhdEsignatureService.createRequestFromGeneratedDocument({
        companyId: profile.companyId,
        generationId,
        documentHash,
        signers: [
          {
            kind: 'external',
            externalEmail: profile.email,
            externalName: signerName,
          },
        ],
        signingOrder: 'SEQUENTIAL',
      });

      const { error: linkError } = await supabaseClient.rpc(
        'mhd_link_submission_esignature_request',
        {
          p_submission_id: nextSubmissionId,
          p_esignature_request_id: result.request.id,
        },
      );

      if (linkError) {
        throw new Error(`Unable to link signature request to submission: ${linkError.message}`);
      }

      setMessage('Submission submitted - a signature request has been sent to your email.');
      if (result.invitationErrors.length > 0) {
        setSyncError(
          `Signature request created, but email delivery reported: ${result.invitationErrors.join('; ')}`,
        );
      }
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? `Submission submitted, but e-signature routing failed: ${error.message}`
          : 'Submission submitted, but e-signature routing failed.',
      );
    }

    const allDrafts = await mhdFormService.listMyDraftSubmissions();
    setDrafts(allDrafts.filter((draft) => draft.formId === formId));
  }

  if (!formId) {
    return <div className="p-6 text-sm text-red-600">No form id was provided.</div>;
  }

  return (
    <div className="space-y-6">
      {embedded ? (
        <h2 className="text-lg font-semibold text-foreground">Form Renderer</h2>
      ) : (
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
              <Link
                to={canMutate ? `/forms/${formId}/edit` : `/forms/${formId}`}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
              >
                {canMutate ? 'Open Builder' : 'View Form'}
              </Link>
              <Link
                to={`/forms/${formId}/submissions`}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
              >
                View Submissions
              </Link>
            </>
          }
        />
      )}
      <div className="space-y-6">
        {message ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        {syncError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {syncError}
          </div>
        ) : null}

        {onboardingPersonId && onboardingPacket ? (
          <div className="rounded-lg border border-border bg-accent-tint p-4 text-sm text-foreground">
            <p className="font-semibold">Onboarding packet context</p>
            <p className="mt-1">
              Rendering <span className="font-semibold">{onboardingPacket.label}</span>
              {onboardingPersonName ? ` for ${onboardingPersonName}` : ''}. After submit, the page
              syncs `onboarding_checklist_items` for this person.
            </p>
            {shouldRouteToEsignature ? (
              <p className="mt-2">
                This packet item also requires a generated document plus an e-signature
                request. If this form has not been configured with the Builder&apos;s
                &quot;Requires E-Signature&quot; option yet, route it manually from the{' '}
                <Link
                  to={`/esignature?personId=${encodeURIComponent(onboardingPersonId)}&personName=${encodeURIComponent(onboardingPersonName ?? 'Person')}`}
                  className="font-semibold text-accent underline hover:text-accent-hover"
                >
                  E-Signature Center
                </Link>
                .
              </p>
            ) : null}
          </div>
        ) : null}

        <MhdFormResumeDrafts
          drafts={drafts.map((draft) => ({
            id: draft.id,
            referenceId: draft.referenceId,
            formId: draft.formId,
            updatedAt: draft.updatedAt,
          }))}
          onResume={(nextSubmissionId) =>
            // Preserve location.state (in particular `backgroundLocation`) so
            // resuming a draft from inside the modal doesn't drop the
            // background route and fall back to a full-page render.
            navigate(`/forms/${formId}/render?submissionId=${nextSubmissionId}`, {
              state: location.state,
            })
          }
        />

        <MhdCard className="p-0">
          <MhdFormRenderer
            formId={formId}
            submissionId={submissionId}
            taskId={taskId}
            employeeFilePersonId={employeeFilePersonId}
            employeeFileUserId={employeeFileUserId}
            employeeFileCategory={employeeFileCategory}
            readOnly={!canMutate}
            userPrefillValues={userPrefillValues}
            onSubmitted={(nextSubmissionId, submittedForm) => {
              void handleSubmissionSuccess(nextSubmissionId, submittedForm);
            }}
          />
        </MhdCard>
      </div>
    </div>
  );
}
