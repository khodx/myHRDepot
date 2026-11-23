import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import { mhdAccommodationsIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS, MHD_DRAFT_NEW_KEY, type MhdDraftPayload } from '@/features/drafts/Types';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import { noMedicalDetail } from '@/features/accommodations/Schemas';
import {
  useMhdBenefitIntakeRoute,
  useMhdSubmitBenefitIntake,
} from '@/features/benefit-intake/Hook';
import { mhdBenefitIntakePayloadSchema } from '@/features/benefit-intake/Schemas';
import {
  MHD_BENEFIT_INTAKE_REASONS,
  type MhdBenefitIntakeOutcome,
  type MhdBenefitIntakePayload,
  type MhdBenefitIntakeReason,
  type MhdBenefitIntakeResult,
} from '@/features/benefit-intake/Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground';
const HELPER_TEXT =
  'Do not enter a diagnosis, the cause of a condition, genetic information, or medical records.';
const RELATIONSHIPS = [
  ['CHILD', 'Child'],
  ['CHILD_ADULT', 'Adult child'],
  ['PARENT', 'Parent'],
  ['PARENT_IN_LAW', 'Parent-in-law'],
  ['SPOUSE', 'Spouse'],
  ['DOMESTIC_PARTNER', 'Domestic partner'],
  ['GRANDPARENT', 'Grandparent'],
  ['GRANDCHILD', 'Grandchild'],
  ['SIBLING', 'Sibling'],
  ['DESIGNATED_PERSON', 'Designated person'],
  ['NEXT_OF_KIN', 'Next of kin'],
] as const;

interface MhdBenefitIntakeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (result: MhdBenefitIntakeResult) => void;
}

interface FormState {
  personId: string;
  reason: MhdBenefitIntakeReason | '';
  needsTimeAway: boolean;
  needsWorkplaceChange: boolean;
  familyRelationship: string;
  requestedStart: string;
  requestedEnd: string;
  requestedMode: 'CONTINUOUS' | 'INTERMITTENT' | 'REDUCED_SCHEDULE';
  bondingEventType: 'BIRTH' | 'ADOPTION' | 'FOSTER';
  bondingEventDate: string;
  requestSummary: string;
  requestSource: string;
  requestChannel: string;
  limitationDuration: 'PERMANENT' | 'TEMPORARY' | 'UNKNOWN';
  anticipatedRecoveryDate: string;
  workersCompClaim: boolean;
  contactPhone: string;
  contactEmail: string;
  workLocation: string;
  supervisorName: string;
}

const initialState: FormState = {
  personId: '',
  reason: '',
  needsTimeAway: false,
  needsWorkplaceChange: false,
  familyRelationship: '',
  requestedStart: '',
  requestedEnd: '',
  requestedMode: 'CONTINUOUS',
  bondingEventType: 'BIRTH',
  bondingEventDate: '',
  requestSummary: '',
  requestSource: 'SELF',
  requestChannel: 'VERBAL',
  limitationDuration: 'UNKNOWN',
  anticipatedRecoveryDate: '',
  workersCompClaim: false,
  contactPhone: '',
  contactEmail: '',
  workLocation: '',
  supervisorName: '',
};

function yesNo(name: string, label: string, value: boolean, onChange: (value: boolean) => void) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} checked={value} onChange={() => onChange(true)} /> Yes
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={name} checked={!value} onChange={() => onChange(false)} /> No
        </label>
      </div>
    </fieldset>
  );
}

export function MhdBenefitIntakeModal({ open, onClose, onSubmitted }: MhdBenefitIntakeModalProps) {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const isAdministrator = mhdAccommodationsIsPrivileged(roles);
  const people = useMhdPeoplePicker(isAdministrator ? companyId : null);
  const route = useMhdBenefitIntakeRoute();
  const submit = useMhdSubmitBenefitIntake();
  const draft = useMhdDraft({
    draftKind: MHD_DRAFT_KINDS.benefitIntake,
    draftKey: MHD_DRAFT_NEW_KEY,
    companyId: companyId || null,
    enabled: open,
  });
  const [form, setForm] = useState<FormState>(initialState);
  const [outcome, setOutcome] = useState<MhdBenefitIntakeOutcome | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MhdBenefitIntakeResult | null>(null);

  const steps = useMemo<MhdStep[]>(
    () => [
      { id: 'who', title: 'Who', description: 'Choose the person.' },
      { id: 'need', title: 'Need', description: 'Describe the request.' },
      { id: 'routing', title: 'Routing', description: 'Review the request path.' },
      ...(outcome === 'LEAVE' || outcome === 'BOTH'
        ? [{ id: 'leave', title: 'Leave', description: 'Provide leave details.' }]
        : []),
      ...(outcome === 'ACCOMMODATION' || outcome === 'BOTH'
        ? [
            {
              id: 'accommodation',
              title: 'Accommodation',
              description: 'Provide workplace details.',
            },
          ]
        : []),
      { id: 'review', title: 'Review', description: 'Review and submit.' },
    ],
    [outcome],
  );
  const currentStep = steps[stepIndex] ?? steps[0]!;
  const subjectPersonId = isAdministrator ? form.personId : (profile?.personId ?? '');
  const personName =
    profile?.displayName ?? [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');

  function getDraftValues(): MhdDraftPayload {
    return { form, outcome };
  }

  function restoreDraft(payload: MhdDraftPayload, stepKey: string | null) {
    const savedForm = payload.form as Partial<FormState> | undefined;
    if (savedForm) setForm({ ...initialState, ...savedForm });
    const savedOutcome = (payload.outcome as MhdBenefitIntakeOutcome | null) ?? null;
    setOutcome(savedOutcome);
    const restoredSteps = [
      'who',
      'need',
      'routing',
      ...(savedOutcome === 'LEAVE' || savedOutcome === 'BOTH' ? ['leave'] : []),
      ...(savedOutcome === 'ACCOMMODATION' || savedOutcome === 'BOTH' ? ['accommodation'] : []),
      'review',
    ];
    const index = restoredSteps.indexOf(stepKey ?? '');
    setStepIndex(index >= 0 ? index : 0);
    setError(null);
  }

  function validateFreeText(values: string[]) {
    return values.some((value) => value.trim() && !noMedicalDetail(value));
  }

  function validateStep() {
    if (currentStep.id === 'who' && !subjectPersonId) {
      setError(
        isAdministrator ? 'Choose a person.' : 'Your account is not linked to a person record.',
      );
      return false;
    }
    if (currentStep.id === 'need') {
      if (!form.reason) {
        setError('Choose the reason for your request.');
        return false;
      }
      if (!form.needsTimeAway && !form.needsWorkplaceChange) {
        setError('Choose at least one type of help.');
        return false;
      }
      if (
        ['FAMILY_HEALTH', 'MILITARY_EXIGENCY', 'MILITARY_CAREGIVER'].includes(form.reason) &&
        !form.familyRelationship
      ) {
        setError('A family relationship is required.');
        return false;
      }
    }
    if (currentStep.id === 'routing' && outcome === 'NO_MATCH') {
      setError(
        'This request does not currently match leave or accommodation routing. Contact HR for guidance.',
      );
      return false;
    }
    if (currentStep.id === 'leave' && form.reason === 'BONDING' && !form.bondingEventDate) {
      setError('Enter the bonding event date.');
      return false;
    }
    if (currentStep.id === 'accommodation') {
      if (!form.requestSummary.trim()) {
        setError('Summarize the requested workplace change or assistance.');
        return false;
      }
      if (
        validateFreeText([
          form.requestSummary,
          form.contactPhone,
          form.contactEmail,
          form.workLocation,
          form.supervisorName,
        ])
      ) {
        setError(HELPER_TEXT);
        return false;
      }
    }
    if (currentStep.id === 'review' && outcome === 'NO_MATCH') {
      setError('Submit is unavailable until the request matches a leave or accommodation path.');
      return false;
    }
    setError(null);
    return true;
  }

  async function navigate(nextIndex: number) {
    if (nextIndex <= stepIndex) {
      setStepIndex(nextIndex);
      return;
    }
    if (!validateStep()) return;
    if (currentStep.id === 'need') {
      try {
        const nextOutcome = await route.mutateAsync({
          reason: form.reason as MhdBenefitIntakeReason,
          needsTimeAway: form.needsTimeAway,
          needsWorkplaceChange: form.needsWorkplaceChange,
        });
        setOutcome(nextOutcome);
        setStepIndex(2);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'The request could not be routed.');
      }
      return;
    }
    setStepIndex(nextIndex);
  }

  function buildPayload(): MhdBenefitIntakePayload {
    const payload: MhdBenefitIntakePayload = {
      subjectPersonId: isAdministrator ? subjectPersonId : undefined,
      reason: form.reason as MhdBenefitIntakeReason,
      needsTimeAway: form.needsTimeAway,
      needsWorkplaceChange: form.needsWorkplaceChange,
      familyRelationship: form.familyRelationship || undefined,
      requestedStart: form.requestedStart || undefined,
      requestedEnd: form.requestedEnd || undefined,
      requestedMode: form.requestedMode,
      bondingEventType: form.reason === 'BONDING' ? form.bondingEventType : undefined,
      bondingEventDate: form.reason === 'BONDING' ? form.bondingEventDate || undefined : undefined,
    };
    if (outcome === 'ACCOMMODATION' || outcome === 'BOTH') {
      payload.accommodation = {
        requestSummary: form.requestSummary.trim(),
        requestSource: isAdministrator ? form.requestSource : undefined,
        requestChannel: isAdministrator ? form.requestChannel : undefined,
        details: {
          limitation_duration: form.limitationDuration,
          anticipated_recovery_date: form.anticipatedRecoveryDate || undefined,
          workers_comp_claim: form.workersCompClaim,
          contact_phone: form.contactPhone.trim() || undefined,
          contact_email: form.contactEmail.trim() || undefined,
          work_location: form.workLocation.trim() || undefined,
          supervisor_name: form.supervisorName.trim() || undefined,
        },
      };
    }
    return payload;
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    const payload = buildPayload();
    const parsed = mhdBenefitIntakePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the request details.');
      return;
    }
    try {
      const submitted = await submit.mutateAsync(payload);
      await draft.discard();
      setResult(submitted);
      onSubmitted(submitted);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be submitted.');
    }
  }

  function renderStep() {
    switch (currentStep.id) {
      case 'who':
        return isAdministrator ? (
          <label className="block text-sm font-medium">
            Who is this request for?
            <select
              className={`mt-1 ${inputClass}`}
              value={form.personId}
              onChange={(event) => setForm({ ...form, personId: event.target.value })}
            >
              <option value="">Choose a person</option>
              {(people.data ?? []).map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm">This request is for {personName || 'you'}.</p>
        );
      case 'need':
        return (
          <MhdFormFieldStack>
            <label className="text-sm font-medium">
              What is the reason for your request?
              <select
                className={`mt-1 ${inputClass}`}
                value={form.reason}
                onChange={(event) =>
                  setForm({ ...form, reason: event.target.value as FormState['reason'] })
                }
              >
                <option value="">Choose a reason</option>
                {MHD_BENEFIT_INTAKE_REASONS.map((label, index) => (
                  <option
                    key={label}
                    value={
                      [
                        'OWN_HEALTH',
                        'FAMILY_HEALTH',
                        'PREGNANCY',
                        'BONDING',
                        'MILITARY_EXIGENCY',
                        'MILITARY_CAREGIVER',
                        'OTHER',
                      ][index]
                    }
                  >
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {yesNo(
              'needs-time-away',
              'Do you need time away from work?',
              form.needsTimeAway,
              (value) => setForm({ ...form, needsTimeAway: value }),
            )}
            {yesNo(
              'needs-workplace-change',
              'Do you need a change to your job, schedule, equipment or workplace?',
              form.needsWorkplaceChange,
              (value) => setForm({ ...form, needsWorkplaceChange: value }),
            )}
            {['FAMILY_HEALTH', 'MILITARY_EXIGENCY', 'MILITARY_CAREGIVER'].includes(form.reason) ? (
              <label className="text-sm font-medium">
                What is this person's relationship to you?
                <select
                  className={`mt-1 ${inputClass}`}
                  value={form.familyRelationship}
                  onChange={(event) => setForm({ ...form, familyRelationship: event.target.value })}
                >
                  <option value="">Choose a relationship</option>
                  {RELATIONSHIPS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </MhdFormFieldStack>
        );
      case 'routing':
        return (
          <p className="text-sm">
            {outcome === 'LEAVE'
              ? 'This request will be routed to leave.'
              : outcome === 'ACCOMMODATION'
                ? 'This request will be routed to accommodation.'
                : outcome === 'BOTH'
                  ? 'This request will be routed to both leave and accommodation.'
                  : 'This request needs HR guidance before it can be routed.'}
          </p>
        );
      case 'leave':
        return (
          <MhdFormFieldStack>
            <label className="text-sm font-medium">
              Requested start
              <MhdDateField
                className="mt-1"
                value={form.requestedStart}
                onChange={(value) => setForm({ ...form, requestedStart: value })}
              />
            </label>
            <label className="text-sm font-medium">
              Requested end
              <MhdDateField
                className="mt-1"
                value={form.requestedEnd}
                onChange={(value) => setForm({ ...form, requestedEnd: value })}
              />
            </label>
            <label className="text-sm font-medium">
              Requested mode
              <select
                className={`mt-1 ${inputClass}`}
                value={form.requestedMode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    requestedMode: event.target.value as FormState['requestedMode'],
                  })
                }
              >
                <option value="CONTINUOUS">Continuous</option>
                <option value="INTERMITTENT">Intermittent</option>
                <option value="REDUCED_SCHEDULE">Reduced schedule</option>
              </select>
            </label>
            {form.reason === 'BONDING' ? (
              <>
                <label className="text-sm font-medium">
                  Bonding event type
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={form.bondingEventType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        bondingEventType: event.target.value as FormState['bondingEventType'],
                      })
                    }
                  >
                    <option value="BIRTH">Birth</option>
                    <option value="ADOPTION">Adoption</option>
                    <option value="FOSTER">Foster</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Bonding event date
                  <MhdDateField
                    className="mt-1"
                    value={form.bondingEventDate}
                    onChange={(value) => setForm({ ...form, bondingEventDate: value })}
                  />
                </label>
              </>
            ) : null}
          </MhdFormFieldStack>
        );
      case 'accommodation':
        return (
          <MhdFormFieldStack>
            <label className="text-sm font-medium">
              Request summary
              <textarea
                className={`mt-1 min-h-24 ${inputClass}`}
                value={form.requestSummary}
                onChange={(event) => setForm({ ...form, requestSummary: event.target.value })}
              />{' '}
              <span className="mt-1 block text-xs text-muted-foreground">{HELPER_TEXT}</span>
            </label>
            {isAdministrator ? (
              <>
                <label className="text-sm font-medium">
                  Request source
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={form.requestSource}
                    onChange={(event) => setForm({ ...form, requestSource: event.target.value })}
                  >
                    <option value="SELF">Self</option>
                    <option value="REPRESENTATIVE">Representative</option>
                    <option value="EMPLOYER_OBSERVED">Employer observed</option>
                    <option value="LEAVE_EXHAUSTION">Leave exhaustion</option>
                    <option value="RETURN_TO_WORK">Return to work</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Request channel
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={form.requestChannel}
                    onChange={(event) => setForm({ ...form, requestChannel: event.target.value })}
                  >
                    <option value="VERBAL">Verbal</option>
                    <option value="WRITTEN">Written</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="PORTAL">Portal</option>
                    <option value="OBSERVED">Observed</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </>
            ) : null}
            <label className="text-sm font-medium">
              Duration
              <select
                className={`mt-1 ${inputClass}`}
                value={form.limitationDuration}
                onChange={(event) =>
                  setForm({
                    ...form,
                    limitationDuration: event.target.value as FormState['limitationDuration'],
                  })
                }
              >
                <option value="PERMANENT">Permanent</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </label>
            {form.limitationDuration === 'TEMPORARY' ? (
              <label className="text-sm font-medium">
                Anticipated recovery date
                <MhdDateField
                  className="mt-1"
                  value={form.anticipatedRecoveryDate}
                  onChange={(value) => setForm({ ...form, anticipatedRecoveryDate: value })}
                />
              </label>
            ) : null}
            {yesNo('workers-comp', "Workers' compensation claim", form.workersCompClaim, (value) =>
              setForm({ ...form, workersCompClaim: value }),
            )}
            {(['contactPhone', 'contactEmail', 'workLocation', 'supervisorName'] as const).map(
              (key) => (
                <label key={key} className="text-sm font-medium">
                  {key === 'contactPhone'
                    ? 'Contact phone'
                    : key === 'contactEmail'
                      ? 'Contact email'
                      : key === 'workLocation'
                        ? 'Work location'
                        : 'Supervisor'}
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">{HELPER_TEXT}</span>
                </label>
              ),
            )}
          </MhdFormFieldStack>
        );
      default:
        return (
          <div className="space-y-2 text-sm">
            <p>Person: {personName || 'Selected person'}</p>
            <p>
              Reason:{' '}
              {
                MHD_BENEFIT_INTAKE_REASONS[
                  [
                    'OWN_HEALTH',
                    'FAMILY_HEALTH',
                    'PREGNANCY',
                    'BONDING',
                    'MILITARY_EXIGENCY',
                    'MILITARY_CAREGIVER',
                    'OTHER',
                  ].indexOf(form.reason)
                ]
              }
            </p>
            <p>Routing: {outcome}</p>
            <Button
              onClick={() => void handleSubmit()}
              disabled={submit.isPending || outcome === 'NO_MATCH'}
            >
              Submit Request
            </Button>
          </div>
        );
    }
  }

  if (!open) return null;
  return (
    <MhdModal title="Benefit Intake" onClose={onClose}>
      {result ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Request submitted. HR has been notified.</h2>
          {result.leaveCaseId ? (
            <p className="text-sm">
              <a className="text-accent underline" href={`/leaves/${result.leaveCaseId}`}>
                Open leave case
              </a>
            </p>
          ) : null}
          {result.accommodationCaseId ? (
            <p className="text-sm">
              <a
                className="text-accent underline"
                href={`/accommodations/${result.accommodationCaseId}`}
              >
                Open accommodation case
              </a>
            </p>
          ) : null}
          {result.leaveCaseId ? (
            <p className="text-sm">
              HR will confirm your eligibility once payroll records are on file.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <MhdDraftBanner draft={draft} onRestore={restoreDraft} />
          <MhdStepper
            steps={steps}
            currentStepIndex={stepIndex}
            onNavigate={(index) => void navigate(index)}
            validateCurrentStep={validateStep}
            onSubmit={() => void handleSubmit()}
            isSubmitting={submit.isPending || route.isPending}
            showSubmit={currentStep.id !== 'review'}
          />
          <MhdCard>
            <h2 className="text-lg font-semibold">{currentStep.title}</h2>
            <div className="mt-4">{renderStep()}</div>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
          </MhdCard>
          <div className="flex flex-wrap items-center gap-2">
            <MhdSaveDraftButton
              draft={draft}
              getValues={getDraftValues}
              stepKey={currentStep.id}
              title="Benefit Intake"
            />
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </MhdModal>
  );
}

export default MhdBenefitIntakeModal;
