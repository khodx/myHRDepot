import { useState } from 'react';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import {
  useConfirmContractorClassification,
  useEvaluateContractorClassification,
  useMhdCaAb5ExemptionCategories,
  useMhdContractorClassificationReadiness,
} from '../Hook';
import type {
  MhdContractorClassificationEvaluateResult,
  MhdContractorOutcome,
} from '../Types';

type FactorValue = 'CONTRACTOR' | 'EMPLOYEE' | 'UNKNOWN';

const inputClass = 'w-full rounded-md border border-border bg-card px-3 py-2 text-sm';
const factorValues: FactorValue[] = ['CONTRACTOR', 'EMPLOYEE', 'UNKNOWN'];
const steps: MhdStep[] = [
  { id: 'intake', title: 'Engagement Intake' },
  { id: 'factors', title: 'Classification Factors' },
  { id: 'results', title: 'Recommendations' },
  { id: 'confirm', title: 'Confirm or Override' },
];

const factorGroups = [
  {
    testKey: 'FEDERAL_ECONOMIC_REALITY',
    title: 'Federal economic-reality factors',
    factors: [
      ['OPPORTUNITY_FOR_PROFIT_OR_LOSS', 'Opportunity for profit or loss depending on managerial skill'],
      ['INVESTMENTS_BY_WORKER_AND_EMPLOYER', 'Investments by the worker and the employer'],
      ['DEGREE_OF_PERMANENCE', 'Degree of permanence of the work relationship'],
      ['NATURE_AND_DEGREE_OF_CONTROL', 'Nature and degree of control'],
      ['INTEGRAL_PART_OF_BUSINESS', 'Whether the work is an integral part of the employer’s business'],
      ['SKILL_AND_INITIATIVE', 'Skill and initiative'],
    ],
  },
  {
    testKey: 'CA_ABC',
    title: 'California ABC test',
    factors: [
      ['A_FREE_FROM_CONTROL_AND_DIRECTION', 'A: free from the control and direction of the hiring entity'],
      ['B_WORK_OUTSIDE_USUAL_COURSE', 'B: work performed outside the usual course of the hiring entity’s business'],
      ['C_INDEPENDENTLY_ESTABLISHED_TRADE', 'C: customarily engaged in an independently established trade, occupation, or business'],
    ],
  },
  {
    testKey: 'CA_BORELLO',
    title: 'California Borello factors',
    factors: [
      ['HIRING_ENTITY_RIGHT_TO_CONTROL', 'Right to control the manner and means of the work'],
      ['DISTINCT_OCCUPATION_OR_BUSINESS', 'Distinct occupation or business'],
      ['USUAL_SUPERVISION_OR_SPECIALIST', 'Whether the work is usually done under direction or by a specialist without supervision'],
      ['SKILL_REQUIRED', 'Skill required'],
      ['WHO_SUPPLIES_INSTRUMENTS', 'Who supplies the instrumentalities, tools, and place of work'],
      ['LENGTH_OF_TIME', 'Length of time for which services are to be performed'],
      ['METHOD_OF_PAYMENT', 'Method of payment'],
      ['PART_OF_REGULAR_BUSINESS', 'Whether or not the work is part of the regular business of the principal'],
      ['PARTIES_BELIEF', 'Whether or not the parties believe they are creating an employer-employee relationship'],
    ],
  },
] as const;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The contractor classification action failed.';
}

function formatFinding(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : JSON.stringify(value);
}

function DeterminationCard({
  determination,
  privileged,
  confirmed,
  onConfirm,
}: {
  determination: MhdContractorClassificationEvaluateResult;
  privileged: boolean;
  confirmed: boolean;
  onConfirm: (id: string, outcome: MhdContractorOutcome, reason: string | null) => Promise<void>;
}) {
  const [outcome, setOutcome] = useState<MhdContractorOutcome>(determination.effectiveOutcome);
  const [reason, setReason] = useState('');
  const [override, setOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = outcome !== determination.evaluatedOutcome;

  async function save() {
    if (changed && !reason.trim()) { setError('An override reason is required.'); return; }
    try { setError(null); await onConfirm(determination.determinationId, outcome, changed ? reason.trim() : null); }
    catch (caught) { setError(errorMessage(caught)); }
  }

  return (
    <article className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{determination.jurisdiction}</h3>
        <span className="rounded-full bg-muted px-2 py-1 text-xs">Applied test: {determination.testKey}</span>
        {confirmed ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-900">Recorded</span> : null}
      </div>
      <p><strong>Recommendation:</strong> {determination.evaluatedOutcome}</p>
      <MhdFormFieldStack>
        {Object.entries(determination.findings).map(([key, value]) => <div key={key}><dt className="font-medium">{key}</dt><dd>{formatFinding(value)}</dd></div>)}
      </MhdFormFieldStack>
      {privileged && !confirmed ? <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.secondary}`} onClick={() => void save()}>Confirm recommendation</button>
          <button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.secondary}`} onClick={() => setOverride((value) => !value)}>Override</button>
        </div>
        {override ? <div className="space-y-2 rounded-md bg-muted/40 p-3">
          <label className="block text-sm font-medium">Effective outcome<select className={inputClass} value={outcome} onChange={(event) => setOutcome(event.target.value as MhdContractorOutcome)}>{(['CONTRACTOR', 'EMPLOYEE', 'UNDETERMINED'] as MhdContractorOutcome[]).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="block text-sm font-medium">Override reason<textarea className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          <button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.primary}`} onClick={() => void save()}>Save override</button>
        </div> : null}
      </div> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </article>
  );
}

export function MhdContractorClassificationWizard() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const people = useMhdPeoplePicker(companyId);
  const readiness = useMhdContractorClassificationReadiness();
  const exemptions = useMhdCaAb5ExemptionCategories();
  const evaluate = useEvaluateContractorClassification();
  const confirm = useConfirmContractorClassification();
  const privileged = (['Platform Admin', 'HR Partner', 'HR Admin'] as MhdAuthRoleName[]).some((role) => roles.includes(role));
  const [step, setStep] = useState(0);
  const [engagementLabel, setEngagementLabel] = useState('');
  const [personId, setPersonId] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCaExemptionId, setSelectedCaExemptionId] = useState('');
  const [facts, setFacts] = useState<Record<string, FactorValue>>(() => Object.fromEntries(factorGroups.flatMap((group) => group.factors.map(([key]) => [key, 'UNKNOWN'])) as Array<[string, FactorValue]>));
  const [results, setResults] = useState<MhdContractorClassificationEvaluateResult[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function validate() {
    if (step === 0 && (!companyId || !engagementLabel.trim() || !asOfDate)) { setError('Provide an engagement label and as-of date.'); return false; }
    setError(null); return true;
  }

  async function navigate(nextStep: number) {
    if (nextStep < step) { setStep(nextStep); return; }
    if (step === 1 && nextStep > step && !results.length) {
      try {
        setError(null);
        const evaluated = await evaluate.mutateAsync({ companyId: companyId!, personId: personId || null, engagementLabel: engagementLabel.trim(), asOfDate, engagementFacts: facts, selectedCaExemptionId: selectedCaExemptionId || null });
        setResults(evaluated); setConfirmedIds(new Set());
      } catch (caught) {
        setError(readiness.data && !readiness.data.release_ready
          ? 'Evaluation is unavailable while the pre-live compliance gate is active. Review the gate notice above.'
          : errorMessage(caught));
        return;
      }
    }
    setStep(nextStep);
  }

  async function confirmOne(id: string, outcome: MhdContractorOutcome, reason: string | null) {
    await confirm.mutateAsync({ determinationId: id, confirmedOutcome: outcome, overrideReason: reason });
    setConfirmedIds((current) => new Set(current).add(id));
  }

  return <div className="space-y-6">
    <MhdPageHeader title="Independent Contractor Classification" description="Evaluate federal and California worker-classification factors and record a reviewed recommendation." />
    <MhdComplianceGateBanner readiness={readiness.data} />
    {error ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      {step === 0 ? <MhdFormFieldStack>
        <label className="block text-sm font-medium">Engagement label<input className={inputClass} value={engagementLabel} onChange={(event) => setEngagementLabel(event.target.value)} placeholder="e.g. Marketing consultant" /></label>
        <label className="block text-sm font-medium">Person (optional)<select className={inputClass} value={personId} onChange={(event) => setPersonId(event.target.value)}><option value="">No person selected</option>{(people.data ?? []).map((person) => <option key={person.id} value={person.id}>{[person.firstName, person.lastName].filter(Boolean).join(' ') || person.id}</option>)}</select></label>
        <label className="block text-sm font-medium">As-of date<input className={inputClass} type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} /></label>
        <label className="block text-sm font-medium">California AB 5 exemption<select className={inputClass} value={selectedCaExemptionId} onChange={(event) => setSelectedCaExemptionId(event.target.value)}><option value="">None apply — evaluate CA ABC</option>{(exemptions.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.categoryLabel} ({category.citation})</option>)}</select></label>
      </MhdFormFieldStack> : null}
      {step === 1 ? <div className="space-y-5">{factorGroups.map((group) => <fieldset key={group.testKey} className="space-y-3 rounded-md border border-border p-4"><legend className="px-1 font-semibold">{group.title}</legend>{group.factors.map(([key, label]) => <label key={key} className="space-y-2 text-sm"><span>{label}</span><select className={inputClass} value={facts[key]} onChange={(event) => setFacts((current) => ({ ...current, [key]: event.target.value as FactorValue }))}>{factorValues.map((value) => <option key={value}>{value}</option>)}</select></label>)}</fieldset>)}</div> : null}
      {step === 2 || step === 3 ? <MhdFormFieldStack>{results.map((determination) => <DeterminationCard key={determination.determinationId} determination={determination} privileged={privileged} confirmed={confirmedIds.has(determination.determinationId)} onConfirm={confirmOne} />)}</MhdFormFieldStack> : null}
      {step === 2 && !results.length ? <p className="text-sm text-muted-foreground">Run the evaluation to see the federal and California recommendations.</p> : null}
      <MhdStepper steps={steps} currentStepIndex={step} onNavigate={(nextStep) => void navigate(nextStep)} validateCurrentStep={validate} onSubmit={() => void navigate(3)} isSubmitting={evaluate.isPending || confirm.isPending} />
    </section>
  </div>;
}
