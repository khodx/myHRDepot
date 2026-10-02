import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdWizardOutputStep } from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { mhdLeavesIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';
import { useMhdCreateLeaveCase } from '../Hook';
import {
  useMhdConfirmLeaveEligibility,
  useMhdLeaveEligibility,
  useMhdLeaveReadiness,
  useMhdOverrideLeaveEligibility,
} from '../WorkflowHook';
import type { MhdLeaveEligibilityInput } from '../WorkflowTypes';

export interface MhdLeaveIntakeWizardProps {
  caseId?: string;
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
}

interface FactsState {
  employerEmployeeCount: string;
  monthsOfService: string;
  hoursWorked12Months: string;
  worksiteEmployeeCount75: string;
  scheduledWeeklyHours: string;
  designatedPersonSelected: boolean;
  coveredEmployerOverride: boolean;
}

const initialBasics: CaseBasicsState = {
  personId: '',
  reasonCategory: '',
  reasonCode: 'OWN_SERIOUS_HEALTH_CONDITION',
  familyRelationship: '',
  requestedStart: '',
  requestedEnd: '',
};

// Nothing is assumed: eligibility turns on these facts, so every one is entered by the
// person running the evaluation (a pre-filled guess would silently decide coverage).
const initialFacts: FactsState = {
  employerEmployeeCount: '',
  monthsOfService: '',
  hoursWorked12Months: '',
  worksiteEmployeeCount75: '',
  scheduledWeeklyHours: '',
  designatedPersonSelected: false,
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
  onChange,
}: {
  value: CaseBasicsState;
  people: Array<{ id: string; firstName?: string; lastName?: string }>;
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
          <input
            className={inputClassName}
            value={value.reasonCode}
            onChange={(e) => onChange({ ...value, reasonCode: e.target.value })}
            placeholder="e.g. OWN_SERIOUS_HEALTH_CONDITION"
          />
        </Field>
        <Field label="Family relationship (optional)">
          <input
            className={inputClassName}
            value={value.familyRelationship}
            onChange={(e) => onChange({ ...value, familyRelationship: e.target.value })}
            placeholder="e.g. SPOUSE"
          />
        </Field>
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
  const numberField = (label: string, key: keyof FactsState) => (
    <Field label={label}>
      <input
        className={inputClassName}
        type="number"
        min="0"
        value={value[key] as string}
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
            checked={value.designatedPersonSelected}
            onChange={(e) => onChange({ ...value, designatedPersonSelected: e.target.checked })}
          />{' '}
          Designated person selected
        </label>
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
  if (!results.length) {
    return (
      <p className="text-sm text-muted-foreground">Run the evaluation to see each legal basis.</p>
    );
  }
  return (
    <div className="space-y-3">
      {results.map((result) => (
        <MhdCard key={result.determination_id}>
          <p className="font-semibold">{result.type_key}</p>
          <p className="text-sm">Outcome: {result.evaluated_outcome}</p>
          <p className="text-sm">
            Entitlement: {result.entitlement_hours ?? 'Not determined'} hours
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
            {JSON.stringify(result.findings, null, 2)}
          </pre>
        </MhdCard>
      ))}
    </div>
  );
}

export function MhdLeaveIntakeWizard({ caseId: caseIdProp }: MhdLeaveIntakeWizardProps) {
  const params = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const isNewEntry = !caseIdProp && !params.caseId;
  // A leave case is a RESTRICTED record; the document step is offered only to the roles
  // that may see one (the server re-checks regardless).
  const canIssueDocument = mhdLeavesIsPrivileged(roles);
  const [caseId, setCaseId] = useState(caseIdProp ?? params.caseId ?? '');
  const [basics, setBasics] = useState<CaseBasicsState>(initialBasics);
  const [facts, setFacts] = useState<FactsState>(initialFacts);
  const [results, setResults] = useState<EligibilityResult[]>([]);
  const [snapshotId, setSnapshotId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  // An override made after confirmation is not covered by it: the confirm RPC stamps only
  // determinations that are effectively ELIGIBLE at that moment, so the designation gate
  // would still refuse. The user must confirm again.
  const [confirmationStale, setConfirmationStale] = useState(false);
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

  // Everything the evaluation depends on. Walking back, changing a fact and returning
  // re-evaluates; an unchanged walk never evaluates twice.
  const evaluationKey = `evaluate:${JSON.stringify({
    facts,
    reasonCode: basics.reasonCode,
    familyRelationship: basics.familyRelationship,
  })}`;

  // Rebuilt every render so each validate / onLeave sees current state (the flow keeps
  // the newest copy in a ref). `flow` is only read when a step actually runs.
  const steps: MhdWizardStepDefinition[] = [
    ...(isNewEntry
      ? [
          {
            id: 'basics',
            title: 'Case Basics',
            validate: () =>
              !basics.personId || !basics.reasonCategory || !basics.reasonCode
                ? 'Select a person and provide both reason fields.'
                : null,
            onLeave: () =>
              flow.runOnce('create-case', async () => {
                const created = await createCase.mutateAsync({
                  companyId,
                  personId: basics.personId,
                  reasonCategory: basics.reasonCategory,
                  requestedStart: basics.requestedStart || null,
                  requestedEnd: basics.requestedEnd || null,
                });
                setCaseId(created.id);
              }),
          },
        ]
      : []),
    {
      id: 'facts',
      title: 'Employer & Service Facts',
      validate: () => {
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
          return 'Enter every employer and service fact as a number (zero or more); none are assumed.';
        }
        if (facts.scheduledWeeklyHours.trim() === '' || !(Number(facts.scheduledWeeklyHours) > 0)) {
          return 'Scheduled weekly hours must be greater than zero.';
        }
        return null;
      },
      onLeave: async () => {
        if (!caseId) throw new Error('A leave case is required before evaluation.');
        const rows = await flow.runOnce(evaluationKey, async () => {
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
            designatedPersonSelected: facts.designatedPersonSelected,
            coveredEmployerOverride: facts.coveredEmployerOverride,
          } as MhdLeaveEligibilityInput);
          return (evaluated ?? []) as EligibilityResult[];
        });
        setResults(rows);
        setSnapshotId(rows[0]?.snapshot_id ?? '');
        setConfirmed(false);
        setConfirmationStale(false);
      },
    },
    { id: 'evaluation', title: 'Run Evaluation' },
    { id: 'review', title: 'Review Recommendations' },
    {
      id: 'confirm',
      title: 'Confirm or Override',
      validate: () => {
        if (confirmed) return null;
        return confirmationStale
          ? 'An override changed the evaluation. Confirm all as evaluated again before advancing.'
          : 'Confirm the snapshot before advancing.';
      },
    },
    { id: 'summary', title: 'Designation Summary' },
  ];

  const flow = useMhdWizardFlow({
    steps,
    isDirty: Boolean(basics.personId) || Boolean(caseId) || facts.employerEmployeeCount !== '',
    // Every record the wizard produces is already saved by the steps; finishing it opens
    // the completion panel.
    onSubmit: async () => undefined,
  });

  async function confirmAll() {
    if (!snapshotId) {
      flow.setError('Run an evaluation before confirming.');
      return;
    }
    try {
      await confirmEligibility.mutateAsync(snapshotId);
      setConfirmed(true);
      setConfirmationStale(false);
      flow.clearError();
    } catch (cause) {
      flow.setError(cause instanceof Error ? cause.message : 'Unable to confirm the snapshot.');
    }
  }

  async function overrideOne(result: EligibilityResult) {
    const reason = (overrideReasons[result.determination_id] ?? '').trim();
    if (!reason) {
      flow.setError('An eligibility override requires a recorded reason.');
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
      flow.clearError();
    } catch (cause) {
      flow.setError(
        cause instanceof Error ? cause.message : 'Unable to override the determination.',
      );
    }
  }

  function renderStep() {
    const id = flow.currentStep?.id;
    if (id === 'basics') {
      return <CaseBasicsStep value={basics} people={people.data ?? []} onChange={setBasics} />;
    }
    if (id === 'facts') return <FactsStep value={facts} onChange={setFacts} />;
    if (id === 'confirm') {
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
    }
    return <ResultsList results={results} />;
  }

  const completion = flow.isComplete ? (
    <div className="space-y-4">
      <MhdCard>
        <h2 className="text-lg font-semibold text-foreground">Leave Eligibility Recorded</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The confirmed determination is saved on the leave case.
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate(`/leaves/${caseId}`)}>Open Case</Button>
        </div>
      </MhdCard>
      {canIssueDocument ? (
        <MhdWizardOutputStep
          companyId={companyId}
          sourceWizard="LEAVE_INTAKE"
          templateKey="LEAVE_ELIGIBILITY_DETERMINATION"
          entityType="LEAVE_CASE"
          entityId={caseId}
          recordLabel="leave eligibility determination"
        />
      ) : null}
    </div>
  ) : undefined;

  return (
    <MhdWizardShell
      title="Guided leave intake"
      description="Evaluate leave eligibility and record a documented decision."
      backTo="/leaves"
      backLabel="Leaves of Absence"
      flow={flow}
      gateBanner={<MhdComplianceGateBanner readiness={readiness.data} />}
      cancelTo="/leaves"
      completion={completion}
    >
      {renderStep()}
    </MhdWizardShell>
  );
}

export default MhdLeaveIntakeWizard;
