import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanSubmitForms } from '@/appshell/mhdRouteAccess';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import { mhdEsignatureService } from '@/features/esignature/Service';
import { mhdOnboardingService } from '@/features/onboarding/Service';
import { mhdLeavesService } from '@/features/leaves/Service';
import { mhdAccommodationsService } from '@/features/accommodations/Service';
import {
  MHD_ONBOARDING_PACKET_BY_KEY,
  mhdIsOnboardingDocumentKey,
} from '@/features/onboarding/Types';
import { mhdIsEmployeeFileTypeKey } from '@/features/employee-files/Types';
import { mhdPersonService } from '@/features/people/Service';
import { mhdPersonTaxIdentityService } from '@/features/person-tax-identity/Service';
import type {
  MhdCitizenshipStatus,
  MhdW4FilingStatus,
} from '@/features/person-tax-identity/Types';
import type { MhdForm, MhdFormField, MhdFormSubmission } from '../Types';
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

const I9_FIELD_KEY_PREFIX = 'targetPerson.i9.';
const W4_FIELD_KEY_PREFIX = 'targetPerson.w4.';

function stringFromSubmission(value: unknown): string | undefined {
  return typeof value === 'string' ? trimmedOrUndefined(value) : undefined;
}

function numberFromSubmission(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function booleanFromSubmission(value: unknown): boolean {
  return value === true || value === 'true';
}

/**
 * Writes the durable person_i9_identity/person_w4_withholding record from a
 * just-submitted form's values, the write-back counterpart to
 * targetPersonPrefillValues' read. Driven entirely by fieldKey convention
 * (targetPerson.i9.* / targetPerson.w4.*) rather than hardcoding "this is
 * THE I-9/W-4 form" -- any form authored with these fieldKeys gets write-back
 * automatically, matching how the prefill side already works. A no-op when
 * the submission carries no employeeFilePersonId (no target employee to
 * attribute the identity/withholding data to) or no matching fieldKeys.
 */
async function syncPersonTaxIdentityFromSubmission(
  submittedForm: MhdForm,
  submittedValues: Record<string, unknown>,
  personId: string | undefined,
): Promise<void> {
  if (!personId) return;

  const fieldByKey = new Map<string, MhdFormField>();
  for (const field of submittedForm.definition.fields) {
    if (field.fieldKey?.startsWith(I9_FIELD_KEY_PREFIX) || field.fieldKey?.startsWith(W4_FIELD_KEY_PREFIX)) {
      fieldByKey.set(field.fieldKey, field);
    }
  }
  if (fieldByKey.size === 0) return;

  const valueFor = (key: string): unknown => {
    const field = fieldByKey.get(key);
    return field ? submittedValues[field.id] : undefined;
  };

  const hasI9Fields = [...fieldByKey.keys()].some((key) => key.startsWith(I9_FIELD_KEY_PREFIX));
  if (hasI9Fields) {
    const citizenshipStatus = stringFromSubmission(
      valueFor(`${I9_FIELD_KEY_PREFIX}citizenshipStatus`),
    ) as MhdCitizenshipStatus | undefined;
    // citizenshipStatus is required by mhd_person_i9_identity_upsert; if the
    // form didn't collect it (e.g. an unrelated form reusing one targetPerson.i9.*
    // key on its own), there is nothing coherent to write back.
    if (citizenshipStatus) {
      await mhdPersonTaxIdentityService.upsertI9Identity({
        personId,
        ssn: stringFromSubmission(valueFor(`${I9_FIELD_KEY_PREFIX}ssn`)),
        dateOfBirth: stringFromSubmission(valueFor(`${I9_FIELD_KEY_PREFIX}dateOfBirth`)),
        mailingAddressStreet: stringFromSubmission(
          valueFor(`${I9_FIELD_KEY_PREFIX}mailingAddressStreet`),
        ),
        mailingAddressApt: stringFromSubmission(valueFor(`${I9_FIELD_KEY_PREFIX}mailingAddressApt`)),
        mailingAddressCity: stringFromSubmission(valueFor(`${I9_FIELD_KEY_PREFIX}mailingAddressCity`)),
        mailingAddressState: stringFromSubmission(
          valueFor(`${I9_FIELD_KEY_PREFIX}mailingAddressState`),
        ),
        mailingAddressZip: stringFromSubmission(valueFor(`${I9_FIELD_KEY_PREFIX}mailingAddressZip`)),
        citizenshipStatus,
        lawfulPermanentResidentNumber: stringFromSubmission(
          valueFor(`${I9_FIELD_KEY_PREFIX}lawfulPermanentResidentNumber`),
        ),
        alienUscisNumber: stringFromSubmission(valueFor(`${I9_FIELD_KEY_PREFIX}alienUscisNumber`)),
        alienI94Number: stringFromSubmission(valueFor(`${I9_FIELD_KEY_PREFIX}alienI94Number`)),
        alienForeignPassportNumber: stringFromSubmission(
          valueFor(`${I9_FIELD_KEY_PREFIX}alienForeignPassportNumber`),
        ),
        alienForeignPassportCountry: stringFromSubmission(
          valueFor(`${I9_FIELD_KEY_PREFIX}alienForeignPassportCountry`),
        ),
        alienWorkAuthorizedUntil: stringFromSubmission(
          valueFor(`${I9_FIELD_KEY_PREFIX}alienWorkAuthorizedUntil`),
        ),
      });
    }
  }

  const hasW4Fields = [...fieldByKey.keys()].some((key) => key.startsWith(W4_FIELD_KEY_PREFIX));
  if (hasW4Fields) {
    const filingStatus = stringFromSubmission(
      valueFor(`${W4_FIELD_KEY_PREFIX}filingStatus`),
    ) as MhdW4FilingStatus | undefined;
    // filingStatus is required by mhd_person_w4_withholding_upsert; same
    // guard rationale as citizenshipStatus above.
    if (filingStatus) {
      await mhdPersonTaxIdentityService.upsertW4Withholding({
        personId,
        taxYear: new Date().getFullYear(),
        filingStatus,
        multipleJobsCheckbox: booleanFromSubmission(valueFor(`${W4_FIELD_KEY_PREFIX}multipleJobsCheckbox`)),
        qualifyingChildrenCount: numberFromSubmission(
          valueFor(`${W4_FIELD_KEY_PREFIX}qualifyingChildrenCount`),
        ),
        otherDependentsCount: numberFromSubmission(
          valueFor(`${W4_FIELD_KEY_PREFIX}otherDependentsCount`),
        ),
        otherCreditsAmount: numberFromSubmission(valueFor(`${W4_FIELD_KEY_PREFIX}otherCreditsAmount`)),
        otherIncomeAmount: numberFromSubmission(valueFor(`${W4_FIELD_KEY_PREFIX}otherIncomeAmount`)),
        deductionsAmount: numberFromSubmission(valueFor(`${W4_FIELD_KEY_PREFIX}deductionsAmount`)),
        extraWithholdingAmount: numberFromSubmission(
          valueFor(`${W4_FIELD_KEY_PREFIX}extraWithholdingAmount`),
        ),
        exemptFromWithholding: booleanFromSubmission(
          valueFor(`${W4_FIELD_KEY_PREFIX}exemptFromWithholding`),
        ),
      });
    }
  }
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
  const canMutate = mhdCanSubmitForms(roles);
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
  // Generic cross-module intake hook (2026-08-19, Multi-Tenant Library
  // Architecture): a form launched with ?intakeAction=leaveCase or
  // ?intakeAction=accommodationCase will, on successful submission, call the
  // matching mhd_create_*_case_from_submission RPC and redirect to the new
  // record — the same "submission triggers a follow-up side effect" shape
  // already established by the onboarding checklist sync below, generalized
  // so other modules don't need their own copy of this page. Deliberately
  // additive: forms launched without this param behave exactly as before.
  const intakeActionValue = searchParams.get('intakeAction');
  const intakeAction =
    intakeActionValue === 'leaveCase' || intakeActionValue === 'accommodationCase'
      ? intakeActionValue
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

  // Prefill from the *target* employee's own record (People + the I-9/W-4
  // identity tables) -- distinct from userPrefillValues above, which is
  // always the logged-in actor and would be wrong here whenever HR fills a
  // form on someone else's behalf. Ciphertext-backed fields (SSN, A-number,
  // I-94 number, foreign passport number) are deliberately never included:
  // mhd_person_i9_identity_get only returns masked has* flags for those, the
  // same "start blank, re-enter" convention already used for every other
  // encrypted form field in this renderer.
  const [targetPersonPrefillValues, setTargetPersonPrefillValues] = useState<
    Record<string, unknown>
  >({});

  useEffect(() => {
    let isCancelled = false;

    const loadTargetPersonPrefill = async () => {
      if (!employeeFilePersonId) {
        if (!isCancelled) setTargetPersonPrefillValues({});
        return;
      }
      try {
        const [person, i9Identity, w4Withholding] = await Promise.all([
          mhdPersonService.getPersonById(employeeFilePersonId),
          mhdPersonTaxIdentityService.getI9Identity(employeeFilePersonId),
          mhdPersonTaxIdentityService.getW4Withholding(employeeFilePersonId),
        ]);
        if (isCancelled) return;
        setTargetPersonPrefillValues({
          'targetPerson.firstName': person.firstName,
          'targetPerson.middleName': person.middleName ?? '',
          'targetPerson.lastName': person.lastName,
          'targetPerson.email': person.primaryEmail ?? '',
          'targetPerson.phone': person.primaryPhone ?? '',
          ...(i9Identity
            ? {
                'targetPerson.i9.dateOfBirth': i9Identity.dateOfBirth ?? '',
                'targetPerson.i9.mailingAddressStreet': i9Identity.mailingAddressStreet ?? '',
                'targetPerson.i9.mailingAddressApt': i9Identity.mailingAddressApt ?? '',
                'targetPerson.i9.mailingAddressCity': i9Identity.mailingAddressCity ?? '',
                'targetPerson.i9.mailingAddressState': i9Identity.mailingAddressState ?? '',
                'targetPerson.i9.mailingAddressZip': i9Identity.mailingAddressZip ?? '',
                'targetPerson.i9.citizenshipStatus': i9Identity.citizenshipStatus,
                'targetPerson.i9.alienForeignPassportCountry':
                  i9Identity.alienForeignPassportCountry ?? '',
                'targetPerson.i9.alienWorkAuthorizedUntil':
                  i9Identity.alienWorkAuthorizedUntil ?? '',
              }
            : {}),
          ...(w4Withholding
            ? {
                'targetPerson.w4.filingStatus': w4Withholding.filingStatus,
                'targetPerson.w4.multipleJobsCheckbox': w4Withholding.multipleJobsCheckbox,
                'targetPerson.w4.qualifyingChildrenCount': w4Withholding.qualifyingChildrenCount,
                'targetPerson.w4.otherDependentsCount': w4Withholding.otherDependentsCount,
                'targetPerson.w4.otherCreditsAmount': w4Withholding.otherCreditsAmount,
                'targetPerson.w4.otherIncomeAmount': w4Withholding.otherIncomeAmount,
                'targetPerson.w4.deductionsAmount': w4Withholding.deductionsAmount,
                'targetPerson.w4.extraWithholdingAmount': w4Withholding.extraWithholdingAmount,
                'targetPerson.w4.exemptFromWithholding': w4Withholding.exemptFromWithholding,
              }
            : {}),
        });
      } catch {
        // Prefill is a convenience, not a requirement -- if the caller lacks
        // permission to view this person's tax identity data (RLS denies
        // it), the form still renders and can be filled in from scratch.
        if (!isCancelled) setTargetPersonPrefillValues({});
      }
    };

    void loadTargetPersonPrefill();

    return () => {
      isCancelled = true;
    };
  }, [employeeFilePersonId]);

  async function handleSubmissionSuccess(
    nextSubmissionId: string,
    submittedForm: MhdForm,
    submittedValues: Record<string, unknown>,
  ) {
    setSyncError(null);
    let nextMessage = 'Submission submitted successfully.';

    try {
      await syncPersonTaxIdentityFromSubmission(
        submittedForm,
        submittedValues,
        employeeFilePersonId,
      );
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? `Submission submitted, but saving identity/withholding data failed: ${error.message}`
          : 'Submission submitted, but saving identity/withholding data failed.',
      );
    }

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

    if (intakeAction === 'leaveCase') {
      try {
        const created = await mhdLeavesService.createCaseFromSubmission({
          submissionId: nextSubmissionId,
          // Form values are plain JSON-serializable data by construction;
          // Record<string, unknown> vs. the generated Json type is a type-
          // system gap, not a real mismatch (same idiom used elsewhere in
          // this codebase for RPC jsonb params).
          values: submittedValues as Json,
        });
        setMessage('Submission submitted and leave case opened.');
        navigate(`/leaves/${created.id}`);
        return;
      } catch (error) {
        setSyncError(
          error instanceof Error ? error.message : 'Unable to open a leave case from this submission.',
        );
      }
    } else if (intakeAction === 'accommodationCase') {
      try {
        const created = await mhdAccommodationsService.createCaseFromSubmission(
          nextSubmissionId,
          submittedValues as Json,
        );
        setMessage('Submission submitted and accommodation case opened.');
        navigate(`/accommodations/${created.id}`);
        return;
      } catch (error) {
        setSyncError(
          error instanceof Error
            ? error.message
            : 'Unable to open an accommodation case from this submission.',
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
            targetPersonPrefillValues={targetPersonPrefillValues}
            onSubmitted={(nextSubmissionId, submittedForm, submittedValues) => {
              void handleSubmissionSuccess(nextSubmissionId, submittedForm, submittedValues);
            }}
          />
        </MhdCard>
      </div>
    </div>
  );
}
