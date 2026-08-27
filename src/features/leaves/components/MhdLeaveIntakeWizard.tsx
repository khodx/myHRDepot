import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdPeoplePicker } from '@/features/people/Hook';
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

const initialFacts: FactsState = {
  employerEmployeeCount: '50',
  monthsOfService: '12',
  hoursWorked12Months: '1250',
  worksiteEmployeeCount75: '50',
  scheduledWeeklyHours: '40',
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
          <select className={inputClassName} value={value.personId} onChange={(e) => onChange({ ...value, personId: e.target.value })}>
            <option value="">Select a person</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {[person.firstName, person.lastName].filter(Boolean).join(' ') || person.id}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason category">
          <input className={inputClassName} value={value.reasonCategory} onChange={(e) => onChange({ ...value, reasonCategory: e.target.value })} placeholder="Family or medical leave" />
        </Field>
        <Field label="Evaluation reason code">
          <input className={inputClassName} value={value.reasonCode} onChange={(e) => onChange({ ...value, reasonCode: e.target.value })} placeholder="e.g. OWN_SERIOUS_HEALTH_CONDITION" />
        </Field>
        <Field label="Family relationship (optional)">
          <input className={inputClassName} value={value.familyRelationship} onChange={(e) => onChange({ ...value, familyRelationship: e.target.value })} placeholder="e.g. SPOUSE" />
        </Field>
        <Field label="Requested start (optional)"><MhdDateField className={inputClassName} value={value.requestedStart} onChange={(nextValue) => onChange({ ...value, requestedStart: nextValue })} /></Field>
        <Field label="Requested end (optional)"><MhdDateField className={inputClassName} value={value.requestedEnd} onChange={(nextValue) => onChange({ ...value, requestedEnd: nextValue })} /></Field>
      </MhdFormFieldStack>
    </MhdCard>
  );
}

function FactsStep({ value, onChange }: { value: FactsState; onChange: (next: FactsState) => void }) {
  const numberField = (label: string, key: keyof FactsState) => (
    <Field label={label}>
      <input className={inputClassName} type="number" min="0" value={value[key] as string} onChange={(e) => onChange({ ...value, [key]: e.target.value })} />
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
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.designatedPersonSelected} onChange={(e) => onChange({ ...value, designatedPersonSelected: e.target.checked })} /> Designated person selected</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.coveredEmployerOverride} onChange={(e) => onChange({ ...value, coveredEmployerOverride: e.target.checked })} /> Apply covered-employer override</label>
      </MhdFormFieldStack>
    </MhdCard>
  );
}

function ResultsList({ results }: { results: EligibilityResult[] }) {
  if (!results.length) return <p className="text-sm text-muted-foreground">Run the evaluation to see each legal basis.</p>;
  return <div className="space-y-3">{results.map((result) => <MhdCard key={result.determination_id}><p className="font-semibold">{result.type_key}</p><p className="text-sm">Outcome: {result.evaluated_outcome}</p><p className="text-sm">Entitlement: {result.entitlement_hours ?? 'Not determined'} hours</p><pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(result.findings, null, 2)}</pre></MhdCard>)}</div>;
}

export function MhdLeaveIntakeWizard({ caseId: caseIdProp }: MhdLeaveIntakeWizardProps) {
  const params = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const isNewEntry = !caseIdProp && !params.caseId;
  const [caseId, setCaseId] = useState(caseIdProp ?? params.caseId ?? '');
  const [currentStepIndex, setCurrentStepIndex] = useState(caseId ? 0 : 0);
  const [basics, setBasics] = useState<CaseBasicsState>(initialBasics);
  const [facts, setFacts] = useState<FactsState>(initialFacts);
  const [results, setResults] = useState<EligibilityResult[]>([]);
  const [snapshotId, setSnapshotId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [overrideOutcomes, setOverrideOutcomes] = useState<Record<string, EligibilityResult['evaluated_outcome']>>({});
  const createCase = useMhdCreateLeaveCase(companyId || null);
  const people = useMhdPeoplePicker(isNewEntry && companyId ? companyId : null);
  const evaluate = useMhdLeaveEligibility(caseId);
  const confirmEligibility = useMhdConfirmLeaveEligibility(caseId);
  const overrideEligibility = useMhdOverrideLeaveEligibility(caseId);
  const readiness = useMhdLeaveReadiness();
  const createStarted = useRef(false);
  const evaluateStarted = useRef(false);

  const steps = useMemo<MhdStep[]>(() => [
    ...(!caseId ? [{ id: 'basics', title: 'Case Basics' }] : []),
    { id: 'facts', title: 'Employer & Service Facts' },
    { id: 'evaluation', title: 'Run Evaluation' },
    { id: 'review', title: 'Review Recommendations' },
    { id: 'confirm', title: 'Confirm or Override' },
    { id: 'summary', title: 'Designation Summary' },
  ], [isNewEntry]);

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
        const created = await createCase.mutateAsync({ companyId, personId: basics.personId, reasonCategory: basics.reasonCategory, requestedStart: basics.requestedStart || null, requestedEnd: basics.requestedEnd || null });
        setCaseId(created.id);
      } catch (cause) {
        createStarted.current = false;
        setError(cause instanceof Error ? cause.message : 'Unable to create the leave case.');
        return;
      }
    }
    if (currentStep.id === 'facts' && !evaluateStarted.current) {
      if (!caseId) { setError('A leave case is required before evaluation.'); return; }
      evaluateStarted.current = true;
      try {
        const evaluated = await evaluate.mutateAsync({ caseId, asOfDate: new Date().toISOString().slice(0, 10), employerEmployeeCount: Number(facts.employerEmployeeCount), monthsOfService: Number(facts.monthsOfService), hoursWorked12Months: Number(facts.hoursWorked12Months), worksiteEmployeeCount75: Number(facts.worksiteEmployeeCount75), scheduledWeeklyHours: Number(facts.scheduledWeeklyHours), reasonCode: basics.reasonCode, familyRelationship: basics.familyRelationship || null, designatedPersonSelected: facts.designatedPersonSelected, coveredEmployerOverride: facts.coveredEmployerOverride } as MhdLeaveEligibilityInput);
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
    if (currentStep.id === 'basics' && (!basics.personId || !basics.reasonCategory || !basics.reasonCode)) { setError('Select a person and provide both reason fields.'); return false; }
    if (currentStep.id === 'facts' && Number(facts.scheduledWeeklyHours) <= 0) { setError('Scheduled weekly hours must be greater than zero.'); return false; }
    if (currentStep.id === 'confirm' && !confirmed) { setError('Confirm the snapshot before advancing.'); return false; }
    setError(null);
    return true;
  }

  async function confirmAll() {
    if (!snapshotId) { setError('Run an evaluation before confirming.'); return; }
    try { await confirmEligibility.mutateAsync(snapshotId); setConfirmed(true); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to confirm the snapshot.'); }
  }

  async function overrideOne(result: EligibilityResult) {
    const reason = (overrideReasons[result.determination_id] ?? '').trim();
    if (!reason) { setError('An eligibility override requires a recorded reason.'); return; }
    try { await overrideEligibility.mutateAsync({ determinationId: result.determination_id, effectiveOutcome: (overrideOutcomes[result.determination_id] ?? result.evaluated_outcome) as 'ELIGIBLE' | 'INELIGIBLE' | 'UNDETERMINED', overrideReason: reason }); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to override the determination.'); }
  }

  function renderStep() {
    if (currentStep.id === 'basics') return <CaseBasicsStep value={basics} people={people.data ?? []} onChange={setBasics} />;
    if (currentStep.id === 'facts') return <FactsStep value={facts} onChange={setFacts} />;
    if (currentStep.id === 'evaluation' || currentStep.id === 'review') return <ResultsList results={results} />;
    if (currentStep.id === 'confirm') return <div className="space-y-4"><MhdCard><p className="font-semibold">Confirm the evaluated snapshot</p><p className="mt-1 text-sm text-muted-foreground">Confirmation applies to the whole snapshot ({snapshotId || 'not yet available'}).</p><Button onClick={() => void confirmAll()} disabled={confirmed || confirmEligibility.isPending}>{confirmed ? 'Snapshot confirmed' : 'Confirm all as evaluated'}</Button></MhdCard>{results.map((result) => <MhdCard key={result.determination_id}><p className="font-semibold">Override {result.type_key}</p><div className="mt-2 grid gap-2 md:grid-cols-2"><select className={inputClassName} value={overrideOutcomes[result.determination_id] ?? result.evaluated_outcome} onChange={(e) => setOverrideOutcomes({ ...overrideOutcomes, [result.determination_id]: e.target.value })}><option value="ELIGIBLE">ELIGIBLE</option><option value="INELIGIBLE">INELIGIBLE</option><option value="UNDETERMINED">UNDETERMINED</option></select><textarea className={inputClassName} placeholder="Reason for override" value={overrideReasons[result.determination_id] ?? ''} onChange={(e) => setOverrideReasons({ ...overrideReasons, [result.determination_id]: e.target.value })} /></div><Button variant="secondary" onClick={() => void overrideOne(result)}>Override this one</Button></MhdCard>)}</div>;
    return <ResultsList results={results} />;
  }

  function handleSubmit() { navigate(`/leaves/${caseId}`); }

  return <div className="space-y-6"><MhdComplianceGateBanner readiness={readiness.data} /><MhdPageHeader title="Guided leave intake" description="Evaluate leave eligibility and record a documented decision." /><MhdStepper steps={steps} currentStepIndex={currentStepIndex} onNavigate={(nextIndex) => void handleNavigate(nextIndex)} validateCurrentStep={validateCurrentStep} onSubmit={handleSubmit} isSubmitting={createCase.isPending || evaluate.isPending} /><MhdCard><h2 className="text-lg font-semibold">{currentStep.title}</h2><div className="mt-4">{renderStep()}</div>{error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}</MhdCard></div>;
}
