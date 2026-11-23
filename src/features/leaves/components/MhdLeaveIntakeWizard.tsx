import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { mhdLeavesIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS, MHD_DRAFT_NEW_KEY, type MhdDraftPayload } from '@/features/drafts/Types';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import { useMhdCreateLeaveCase } from '../Hook';
import {
  useMhdConfirmLeaveEligibility,
  useMhdLeaveEligibility,
  useMhdLeaveReadiness,
  useMhdOverrideLeaveEligibility,
} from '../WorkflowHook';
import {
  MHD_LEAVE_ADMIN_INTAKE_CHANNELS,
  MHD_LEAVE_FAMILY_RELATIONSHIPS,
  MHD_LEAVE_REASON_CODES,
  MHD_LEAVE_REQUESTED_MODES,
  type MhdLeaveAdminIntakeChannel,
  type MhdLeaveRequestedMode,
} from '../WorkflowTypes';
import { MhdLeavesPage } from './MhdLeavesPage';
import {
  MHD_LEAVE_INTAKE_CHANNEL_LABELS,
  mhdLeaveEnumLabel,
  mhdLeaveFindingMessage,
  mhdLeavePick,
} from './mhdLeaveLabels';

export interface MhdLeaveIntakeWizardProps {
  caseId?: string;
  /** Render the Leaves list behind the popup so the wizard reads as a dialog over the list. Default true. */
  withBackdrop?: boolean;
}

interface EligibilityResult {
  determination_id: string;
  snapshot_id: string;
  leave_type_id: string;
  type_key: string;
  evaluated_outcome: string;
  entitlement_hours: number | string | null;
  findings: Array<Record<string, unknown>>;
}

interface CaseBasicsState {
  personId: string;
  reasonCategory: string;
  reasonCode: string;
  familyRelationship: string;
  requestedStart: string;
  requestedEnd: string;
  requestedMode: MhdLeaveRequestedMode;
  intakeChannel: MhdLeaveAdminIntakeChannel;
}

interface FactsState {
  employerEmployeeCount: string;
  monthsOfService: string;
  hoursWorked12Months: string;
  worksiteEmployeeCount75: string;
  scheduledWeeklyHours: string;
  coveredEmployerOverride: boolean;
}

const initialBasics: CaseBasicsState = {
  personId: '',
  reasonCategory: '',
  reasonCode: 'OWN_SERIOUS_HEALTH_CONDITION',
  familyRelationship: '',
  requestedStart: '',
  requestedEnd: '',
  requestedMode: 'CONTINUOUS',
  intakeChannel: 'HR_ENTRY',
};

// Nothing is assumed: eligibility turns on these facts, so every one is entered by the
// person running the evaluation (a pre-filled guess would silently decide coverage).
const initialFacts: FactsState = {
  employerEmployeeCount: '',
  monthsOfService: '',
  hoursWorked12Months: '',
  worksiteEmployeeCount75: '',
  scheduledWeeklyHours: '',
  coveredEmployerOverride: false,
};

const inputClassName =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function CaseBasicsStep({
  value,
  people,
  showIntakeChannel,
  onChange,
}: {
  value: CaseBasicsState;
  people: Array<{ id: string; firstName?: string; lastName?: string }>;
  /** The intake channel is an administrator's record of how the request arrived. */
  showIntakeChannel: boolean;
  onChange: (next: CaseBasicsState) => void;
}) {
  return (
    <MhdCard>
      <MhdFormFieldStack>
        <Field label="Subject person">
          <select
            className={inputClassName}
            value={value.personId}
            onChange={(e) => onChange({ ...value, personId: e.target.value })}
          >
            <option value="">Select a person</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {[person.firstName, person.lastName].filter(Boolean).join(' ') || person.id}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason category">
          <input
            className={inputClassName}
            value={value.reasonCategory}
            onChange={(e) => onChange({ ...value, reasonCategory: e.target.value })}
            placeholder="Family or medical leave"
          />
        </Field>
        <Field label="Evaluation reason code">
          <select
            className={inputClassName}
            value={value.reasonCode}
            onChange={(e) => onChange({ ...value, reasonCode: e.target.value })}
          >
            {MHD_LEAVE_REASON_CODES.map((code) => (
              <option key={code} value={code}>
                {mhdLeaveEnumLabel(code)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Family relationship (optional)">
          <select
            className={inputClassName}
            value={value.familyRelationship}
            onChange={(e) => onChange({ ...value, familyRelationship: e.target.value })}
          >
            <option value="">No family relationship</option>
            {MHD_LEAVE_FAMILY_RELATIONSHIPS.map((relationship) => (
              <option key={relationship} value={relationship}>
                {mhdLeaveEnumLabel(relationship)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Requested mode">
          <select
            className={inputClassName}
            value={value.requestedMode}
            onChange={(e) =>
              onChange({
                ...value,
                requestedMode:
                  mhdLeavePick(MHD_LEAVE_REQUESTED_MODES, e.target.value) ?? 'CONTINUOUS',
              })
            }
          >
            {MHD_LEAVE_REQUESTED_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mhdLeaveEnumLabel(mode)}
              </option>
            ))}
          </select>
        </Field>
        {showIntakeChannel ? (
          <Field label="Intake channel">
            <select
              className={inputClassName}
              value={value.intakeChannel}
              onChange={(e) =>
                onChange({
                  ...value,
                  intakeChannel:
                    mhdLeavePick(MHD_LEAVE_ADMIN_INTAKE_CHANNELS, e.target.value) ?? 'HR_ENTRY',
                })
              }
            >
              {MHD_LEAVE_ADMIN_INTAKE_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {MHD_LEAVE_INTAKE_CHANNEL_LABELS[channel]}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="Requested start (optional)">
          <MhdDateField
            className={inputClassName}
            value={value.requestedStart}
            onChange={(nextValue) => onChange({ ...value, requestedStart: nextValue })}
          />
        </Field>
        <Field label="Requested end (optional)">
          <MhdDateField
            className={inputClassName}
            value={value.requestedEnd}
            onChange={(nextValue) => onChange({ ...value, requestedEnd: nextValue })}
          />
        </Field>
      </MhdFormFieldStack>
    </MhdCard>
  );
}

function FactsStep({
  value,
  onChange,
}: {
  value: FactsState;
  onChange: (next: FactsState) => void;
}) {
  const numberField = (
    label: string,
    key: Exclude<keyof FactsState, 'coveredEmployerOverride'>,
  ) => (
    <Field label={label}>
      <input
        className={inputClassName}
        type="number"
        min="0"
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
      />
    </Field>
  );
  return (
    <MhdCard>
      <MhdFormFieldStack>
        {numberField('Employer employee count', 'employerEmployeeCount')}
        {numberField('Months of service', 'monthsOfService')}
        {numberField('Hours worked in last 12 months', 'hoursWorked12Months')}
        {numberField('Worksite employees within 75 miles', 'worksiteEmployeeCount75')}
        {numberField('Scheduled weekly hours', 'scheduledWeeklyHours')}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.coveredEmployerOverride}
            onChange={(e) => onChange({ ...value, coveredEmployerOverride: e.target.checked })}
          />{' '}
          Apply covered-employer override
        </label>
      </MhdFormFieldStack>
    </MhdCard>
  );
}

function ResultsList({ results }: { results: EligibilityResult[] }) {
  if (!results.length)
    return (
      <p className="text-sm text-muted-foreground">Run the evaluation to see each legal basis.</p>
    );
  return (
    <div className="space-y-3">
      {results.map((result) => (
        <MhdCard key={result.determination_id}>
          <p className="font-semibold">{result.type_key}</p>
          <p className="text-sm">Outcome: {result.evaluated_outcome}</p>
          <p className="text-sm">
            Entitlement: {result.entitlement_hours ?? 'Not determined'} hours
          </p>
          {result.findings.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {result.findings.map((finding, index) => {
                const code = typeof finding.code === 'string' ? finding.code : 'Review finding';
                return <li key={`${code}-${index}`}>{mhdLeaveFindingMessage(code)}</li>;
              })}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No findings</p>
          )}
        </MhdCard>
      ))}
    </div>
  );
}

/**
 * Guided intake, shown as a popup over the Leaves list on both routes (/leaves/new/intake and
 * /leaves/:caseId/intake). Save and resume: the draft is keyed 'new' until the case is created mid-way, then by
 * the case id; the reason evaluation code and override reasons are left out of the draft (no medical detail).
 */
export function MhdLeaveIntakeWizard({
  caseId: caseIdProp,
  withBackdrop = true,
}: MhdLeaveIntakeWizardProps) {
  const params = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const isAdministrator = mhdLeavesIsPrivileged(roles);
  const isNewEntry = !caseIdProp && !params.caseId;
  const [caseId, setCaseId] = useState(caseIdProp ?? params.caseId ?? '');
  const [currentStepIndex, setCurrentStepIndex] = useState(caseId ? 0 : 0);
  const [basics, setBasics] = useState<CaseBasicsState>(initialBasics);
  const [facts, setFacts] = useState<FactsState>(initialFacts);
  const [results, setResults] = useState<EligibilityResult[]>([]);
  const [snapshotId, setSnapshotId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  // An override made after confirmation is not covered by it: the confirm RPC stamps only
  // determinations that are effectively ELIGIBLE at that moment, so the designation gate
  // would still refuse. The user must confirm again.
  const [confirmationStale, setConfirmationStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [overrideOutcomes, setOverrideOutcomes] = useState<
    Record<string, EligibilityResult['evaluated_outcome']>
  >({});
  const createCase = useMhdCreateLeaveCase(companyId || null);
  const people = useMhdPeoplePicker(isNewEntry && companyId ? companyId : null);
  const evaluate = useMhdLeaveEligibility(caseId);
  const confirmEligibility = useMhdConfirmLeaveEligibility(caseId);
  const overrideEligibility = useMhdOverrideLeaveEligibility(caseId);
  const readiness = useMhdLeaveReadiness();
  const newDraft = useMhdDraft({
    draftKind: MHD_DRAFT_KINDS.leaveIntake,
    draftKey: MHD_DRAFT_NEW_KEY,
    companyId: companyId || null,
    enabled: isNewEntry && !caseId,
  });
  const caseDraft = useMhdDraft({
    draftKind: MHD_DRAFT_KINDS.leaveIntake,
    draftKey: caseId || MHD_DRAFT_NEW_KEY,
    companyId: companyId || null,
    enabled: Boolean(caseId),
  });
  const draft = caseId ? caseDraft : newDraft;
  const createStarted = useRef(Boolean(caseId));
  const evaluateStarted = useRef(false);

  const steps = useMemo<MhdStep[]>(
    () => [
      ...(isNewEntry ? [{ id: 'basics', title: 'Case Basics' }] : []),
      { id: 'facts', title: 'Employer & Service Facts' },
      { id: 'evaluation', title: 'Run Evaluation' },
      { id: 'review', title: 'Review Recommendations' },
      { id: 'confirm', title: 'Confirm or Override' },
      { id: 'summary', title: 'Designation Summary' },
    ],
    [isNewEntry],
  );

  const currentStep = steps[currentStepIndex];

  async function handleNavigate(nextIndex: number) {
    if (nextIndex < currentStepIndex) {
      setCurrentStepIndex(nextIndex);
      return;
    }
    if (nextIndex === currentStepIndex) return;
    setError(null);
    if (currentStep.id === 'basics' && !createStarted.current) {
      createStarted.current = true;
      try {
        const created = await createCase.mutateAsync({
          companyId,
          personId: basics.personId,
          reasonCategory: basics.reasonCategory,
          requestedStart: basics.requestedStart || null,
          requestedEnd: basics.requestedEnd || null,
          requestedMode: basics.requestedMode,
          intakeChannel: isAdministrator ? basics.intakeChannel : null,
        });
        setCaseId(created.id);
        // The case now exists: the pre-creation draft is spent; later drafts are keyed by the case.
        await newDraft.discard();
      } catch (cause) {
        createStarted.current = false;
        setError(cause instanceof Error ? cause.message : 'Unable to create the leave case.');
        return;
      }
    }
    if (currentStep.id === 'facts' && !evaluateStarted.current) {
      if (!caseId) {
        setError('A leave case is required before evaluation.');
        return;
      }
      evaluateStarted.current = true;
      try {
        const evaluated = await evaluate.mutateAsync({
          caseId,
          asOfDate: new Date().toISOString().slice(0, 10),
          employerEmployeeCount: Number(facts.employerEmployeeCount),
          monthsOfService: Number(facts.monthsOfService),
          hoursWorked12Months: Number(facts.hoursWorked12Months),
          worksiteEmployeeCount75: Number(facts.worksiteEmployeeCount75),
          scheduledWeeklyHours: Number(facts.scheduledWeeklyHours),
          reasonCode: basics.reasonCode,
          familyRelationship: basics.familyRelationship || null,
          coveredEmployerOverride: facts.coveredEmployerOverride,
        });
        const rows = (evaluated ?? []) as EligibilityResult[];
        setResults(rows);
        setSnapshotId(rows[0]?.snapshot_id ?? '');
      } catch (cause) {
        evaluateStarted.current = false;
        setError(cause instanceof Error ? cause.message : 'Unable to evaluate eligibility.');
        return;
      }
    }
    setCurrentStepIndex(nextIndex);
  }

  function validateCurrentStep() {
    if (
      currentStep.id === 'basics' &&
      (!basics.personId || !basics.reasonCategory || !basics.reasonCode)
    ) {
      setError('Select a person and provide both reason fields.');
      return false;
    }
    if (currentStep.id === 'facts') {
      const counted = [
        facts.employerEmployeeCount,
        facts.monthsOfService,
        facts.hoursWorked12Months,
        facts.worksiteEmployeeCount75,
      ];
      if (
        counted.some(
          (value) => value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0,
        )
      ) {
        setError(
          'Enter every employer and service fact as a number (zero or more); none are assumed.',
        );
        return false;
      }
      if (facts.scheduledWeeklyHours.trim() === '' || !(Number(facts.scheduledWeeklyHours) > 0)) {
        setError('Scheduled weekly hours must be greater than zero.');
        return false;
      }
    }
    if (currentStep.id === 'confirm' && !confirmed) {
      setError(
        confirmationStale
          ? 'An override changed the evaluation. Confirm all as evaluated again before advancing.'
          : 'Confirm the snapshot before advancing.',
      );
      return false;
    }
    setError(null);
    return true;
  }

  async function confirmAll() {
    if (!snapshotId) {
      setError('Run an evaluation before confirming.');
      return;
    }
    try {
      await confirmEligibility.mutateAsync(snapshotId);
      setConfirmed(true);
      setConfirmationStale(false);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to confirm the snapshot.');
    }
  }

  async function overrideOne(result: EligibilityResult) {
    const reason = (overrideReasons[result.determination_id] ?? '').trim();
    if (!reason) {
      setError('An eligibility override requires a recorded reason.');
      return;
    }
    try {
      await overrideEligibility.mutateAsync({
        determinationId: result.determination_id,
        effectiveOutcome: (overrideOutcomes[result.determination_id] ??
          result.evaluated_outcome) as 'ELIGIBLE' | 'INELIGIBLE' | 'UNDETERMINED',
        overrideReason: reason,
      });
      setConfirmed(false);
      setConfirmationStale(true);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to override the determination.');
    }
  }

  function renderStep() {
    if (currentStep.id === 'basics')
      return (
        <CaseBasicsStep
          value={basics}
          people={people.data ?? []}
          showIntakeChannel={isAdministrator}
          onChange={setBasics}
        />
      );
    if (currentStep.id === 'facts') return <FactsStep value={facts} onChange={setFacts} />;
    if (currentStep.id === 'evaluation' || currentStep.id === 'review')
      return <ResultsList results={results} />;
    if (currentStep.id === 'confirm')
      return (
        <div className="space-y-4">
          <MhdCard>
            <p className="font-semibold">Confirm the evaluated snapshot</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirmation applies to the whole snapshot ({snapshotId || 'not yet available'}).
            </p>
            {confirmationStale ? (
              <p role="status" className="mt-2 text-sm text-amber-700">
                An override was recorded after confirmation, so the confirmation is out of date.
                Confirm all as evaluated again to continue.
              </p>
            ) : null}
            <Button
              onClick={() => void confirmAll()}
              disabled={confirmed || confirmEligibility.isPending}
            >
              {confirmed ? 'Snapshot confirmed' : 'Confirm all as evaluated'}
            </Button>
          </MhdCard>
          {results.map((result) => (
            <MhdCard key={result.determination_id}>
              <p className="font-semibold">Override {result.type_key}</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <select
                  className={inputClassName}
                  value={overrideOutcomes[result.determination_id] ?? result.evaluated_outcome}
                  onChange={(e) =>
                    setOverrideOutcomes({
                      ...overrideOutcomes,
                      [result.determination_id]: e.target.value,
                    })
                  }
                >
                  <option value="ELIGIBLE">ELIGIBLE</option>
                  <option value="INELIGIBLE">INELIGIBLE</option>
                  <option value="UNDETERMINED">UNDETERMINED</option>
                </select>
                <textarea
                  className={inputClassName}
                  placeholder="Reason for override"
                  value={overrideReasons[result.determination_id] ?? ''}
                  onChange={(e) =>
                    setOverrideReasons({
                      ...overrideReasons,
                      [result.determination_id]: e.target.value,
                    })
                  }
                />
              </div>
              <Button variant="secondary" onClick={() => void overrideOne(result)}>
                Override this one
              </Button>
            </MhdCard>
          ))}
        </div>
      );
    return <ResultsList results={results} />;
  }

  function getDraftValues(): MhdDraftPayload {
    return {
      // The evaluation reason code and the override reasons are medical-adjacent free choices: never drafted.
      basics: { ...basics, reasonCode: undefined },
      facts,
      results,
      snapshotId,
      confirmed,
      confirmationStale,
    };
  }

  function restoreDraft(payload: MhdDraftPayload, stepKey: string | null) {
    const saved = payload as {
      basics?: Partial<CaseBasicsState>;
      facts?: Partial<FactsState>;
      results?: EligibilityResult[];
      snapshotId?: string;
      confirmed?: boolean;
      confirmationStale?: boolean;
    };
    setBasics((current) => ({ ...current, ...saved.basics }));
    setFacts((current) => ({ ...current, ...saved.facts }));
    if (saved.results?.length) {
      setResults(saved.results);
      evaluateStarted.current = true;
    }
    setSnapshotId(saved.snapshotId ?? '');
    setConfirmed(Boolean(saved.confirmed));
    setConfirmationStale(Boolean(saved.confirmationStale));
    const stepIndex = steps.findIndex((step) => step.id === stepKey);
    if (stepIndex >= 0) setCurrentStepIndex(stepIndex);
  }

  // A stable onClose: MhdModal's focus trap re-runs (and refocuses the close button) whenever onClose changes identity.
  const routeCaseId = caseIdProp ?? params.caseId;
  const handleClose = useCallback(() => {
    navigate(routeCaseId ? `/leaves/${routeCaseId}` : '/leaves');
  }, [navigate, routeCaseId]);

  async function handleSubmit() {
    await draft.discard();
    navigate(`/leaves/${caseId}`);
  }

  return (
    <>
      {withBackdrop ? <MhdLeavesPage /> : null}
      <MhdFormModal
        title="Guided Leave Intake"
        description="Evaluate leave eligibility and record a documented decision."
        size="xl"
        onClose={handleClose}
      >
        <div className="space-y-6">
          <MhdComplianceGateBanner readiness={readiness.data} />
          <MhdDraftBanner draft={draft} onRestore={restoreDraft} />
          <MhdStepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onNavigate={(nextIndex) => void handleNavigate(nextIndex)}
            validateCurrentStep={validateCurrentStep}
            onSubmit={() => void handleSubmit()}
            isSubmitting={createCase.isPending || evaluate.isPending}
          />
          <MhdCard>
            <h3 className="text-lg font-semibold">{currentStep.title}</h3>
            <div className="mt-4">{renderStep()}</div>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </MhdCard>
          <div className="flex flex-wrap items-center gap-2">
            <MhdSaveDraftButton
              draft={draft}
              getValues={getDraftValues}
              stepKey={currentStep.id}
              title="Leave Intake"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Medical details are not saved in drafts. The evaluation reason code and override reasons
            are re-entered after you resume.
          </p>
        </div>
      </MhdFormModal>
    </>
  );
}
