import { useRef, useState } from 'react';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdExternalDataAttribution } from '@/components/ui/MhdExternalDataAttribution';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdJobs } from '@/features/jobs/Hook';
import type { MhdJob } from '@/features/jobs/Types';
import {
  useMhdCompensationReadiness,
  useMhdJobClassificationConfirm,
  useMhdJobClassificationEvaluate,
  useMhdJobClassificationOverride,
  useMhdJobEvaluationScore,
  useMhdJobPayGradeConfirm,
  useMhdJobPayGradeRecommend,
  useMhdCareerOneStopWageLookup,
  useMhdMarketWageLookup,
} from '../Hook';
import type {
  MhdCareerOneStopWageLookupSuccess,
  MhdJobClassificationEvaluateResult,
  MhdJobEvaluationFactorScore,
  MhdJobPayGradeRecommendation,
  MhdMarketWageLookupSuccess,
} from '../Types';

type ExemptionCategory = 'EXECUTIVE' | 'ADMINISTRATIVE' | 'PROFESSIONAL' | 'COMPUTER' | 'OUTSIDE_SALES' | 'HCE';

interface FactorScoreDraft {
  factorKey: string;
  points: number;
  weight?: number;
}

interface DeterminationRowProps {
  determination: MhdJobClassificationEvaluateResult;
  isConfirmed: boolean;
  onConfirm: (determinationId: string) => Promise<void>;
  onOverride: (determinationId: string, effectiveOutcome: 'EXEMPT' | 'NON_EXEMPT' | 'UNDETERMINED', reason: string) => Promise<void>;
}

const steps: MhdStep[] = [
  { id: 'job', title: 'Select Job' },
  { id: 'facts', title: 'Facts & Scoring' },
  { id: 'results', title: 'Classification Results' },
  { id: 'confirm', title: 'Confirm Determinations' },
  { id: 'market', title: 'Market Wage Reference' },
  { id: 'grade', title: 'Pay Grade' },
];

const inputClass = 'w-full rounded-md border border-border bg-card px-3 py-2 text-sm';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The requested compensation action failed.';
}

function formatFindingValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function DeterminationRow({ determination, isConfirmed, onConfirm, onOverride }: DeterminationRowProps) {
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState<'EXEMPT' | 'NON_EXEMPT' | 'UNDETERMINED'>('NON_EXEMPT');
  const [showOverride, setShowOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    try { setError(null); await onConfirm(determination.determinationId); } catch (caught) { setError(errorMessage(caught)); }
  }

  async function override() {
    if (!reason.trim()) { setError('An override reason is required.'); return; }
    try { setError(null); await onOverride(determination.determinationId, outcome, reason); } catch (caught) { setError(errorMessage(caught)); }
  }

  return (
    <article className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{determination.jurisdiction}</h3>
        {determination.jurisdiction === 'CA' ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">Controlling for California employees</span> : null}
        {isConfirmed ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-900">Recorded</span> : null}
      </div>
      <p><strong>Evaluated outcome:</strong> {determination.evaluatedOutcome}</p>
      <dl className="grid gap-1 text-sm sm:grid-cols-2">
        {Object.entries(determination.findings).map(([key, value]) => <div key={key}><dt className="font-medium">{key}</dt><dd>{formatFindingValue(value)}</dd></div>)}
      </dl>
      {!isConfirmed ? <div className="flex flex-wrap gap-2">
        <button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.secondary}`} onClick={() => void confirm()}>Confirm</button>
        <button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.secondary}`} onClick={() => setShowOverride((current) => !current)}>Override</button>
      </div> : null}
      {showOverride && !isConfirmed ? <div className="space-y-2 rounded-md bg-muted/40 p-3">
        <label className="block text-sm font-medium">Effective outcome<select className={inputClass} value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)}><option value="EXEMPT">EXEMPT</option><option value="NON_EXEMPT">NON_EXEMPT</option><option value="UNDETERMINED">UNDETERMINED</option></select></label>
        <label className="block text-sm font-medium">Override reason<textarea className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.primary}`} onClick={() => void override()}>Save override</button>
      </div> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </article>
  );
}

function DeterminationsPanel({ determinations, confirmedIds, onConfirm, onOverride }: {
  determinations: MhdJobClassificationEvaluateResult[];
  confirmedIds: Set<string>;
  onConfirm: (determinationId: string) => Promise<void>;
  onOverride: (determinationId: string, effectiveOutcome: 'EXEMPT' | 'NON_EXEMPT' | 'UNDETERMINED', reason: string) => Promise<void>;
}) {
  return <div className="space-y-4">{determinations.length === 0 ? <p>No determinations have been evaluated yet.</p> : determinations.map((determination) => <DeterminationRow key={determination.determinationId} determination={determination} isConfirmed={confirmedIds.has(determination.determinationId)} onConfirm={onConfirm} onOverride={onOverride} />)}</div>;
}

export function MhdCompensationClassificationWizard() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const jobs = useMhdJobs(companyId);
  const readiness = useMhdCompensationReadiness();
  const evaluate = useMhdJobClassificationEvaluate();
  const score = useMhdJobEvaluationScore();
  const confirm = useMhdJobClassificationConfirm();
  const override = useMhdJobClassificationOverride();
  const marketWageLookup = useMhdMarketWageLookup();
  const careerOneStopWageLookup = useMhdCareerOneStopWageLookup();
  const payGradeRecommend = useMhdJobPayGradeRecommend();
  const payGradeConfirm = useMhdJobPayGradeConfirm();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [exemptionCategory, setExemptionCategory] = useState<ExemptionCategory | ''>('');
  const [employerEmployeeCount, setEmployerEmployeeCount] = useState<number | null>(null);
  const [weeklySalary, setWeeklySalary] = useState<number | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [exemptDutiesPercent, setExemptDutiesPercent] = useState(0);
  const [factorScores, setFactorScores] = useState<FactorScoreDraft[]>([]);
  const [determinations, setDeterminations] = useState<MhdJobClassificationEvaluateResult[]>([]);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [marketWageResult, setMarketWageResult] = useState<MhdMarketWageLookupSuccess | null>(null);
  const [careerOneStopResult, setCareerOneStopResult] = useState<MhdCareerOneStopWageLookupSuccess | null>(null);
  const [marketWageSkipped, setMarketWageSkipped] = useState(false);
  const [payGradeResult, setPayGradeResult] = useState<MhdJobPayGradeRecommendation[] | null>(null);
  const [chosenGrade, setChosenGrade] = useState('');
  const [gradeReason, setGradeReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const evaluateFiredRef = useRef(false);
  const marketLookupFiredRef = useRef(false);
  const selectedJob = (jobs.data ?? []).find((job) => job.id === selectedJobId) as MhdJob | undefined;

  function validateCurrentStep(): boolean {
    if (currentStepIndex === 0) { if (!selectedJobId) { setError('Select a job to continue.'); return false; } }
    if (currentStepIndex === 1) {
      if (!exemptionCategory) { setError('Select an exemption category to continue.'); return false; }
      if (exemptionCategory !== 'OUTSIDE_SALES' && weeklySalary === null && hourlyRate === null) { setError('Enter a weekly salary or hourly rate to continue.'); return false; }
    }
    if (currentStepIndex === 3 && determinations.some((determination) => !confirmedIds.has(determination.determinationId))) { setError('Confirm or override every determination to continue.'); return false; }
    setError(null); return true;
  }

  async function onNavigate(nextIndex: number) {
    if (nextIndex < currentStepIndex) { setCurrentStepIndex(nextIndex); return; }
    try {
      setError(null);
      if (currentStepIndex === 1 && !evaluateFiredRef.current) {
        if (!selectedJobId || !exemptionCategory) throw new Error('Select a job and exemption category first.');
        const result = await evaluate.mutateAsync({ jobId: selectedJobId, asOfDate: new Date().toISOString().slice(0, 10), exemptionCategory, employerEmployeeCount, weeklySalary, hourlyRate, primaryDutiesPercentTime: { exempt_duties_percent: exemptDutiesPercent } });
        const nextSnapshotId = result[0]?.snapshotId;
        if (!nextSnapshotId) throw new Error('The classification evaluation returned no snapshot.');
        setDeterminations(result); setSnapshotId(nextSnapshotId);
        if (factorScores.length > 0) await score.mutateAsync({ snapshotId: nextSnapshotId, factorScores: factorScores.map((factor): MhdJobEvaluationFactorScore => ({ factorKey: factor.factorKey, points: factor.points, ...(factor.weight === undefined ? {} : { weight: factor.weight }) })) });
        evaluateFiredRef.current = true;
      }
      if (currentStepIndex === 4 && !marketLookupFiredRef.current) {
        if (selectedJob?.onetSocCode) {
          const wageResult = await marketWageLookup.mutateAsync({ jobId: selectedJobId, onetSocCode: selectedJob.onetSocCode });
          if (wageResult.success) { setMarketWageResult(wageResult); marketLookupFiredRef.current = true; }
        } else { setMarketWageSkipped(true); marketLookupFiredRef.current = true; }
      }
      setCurrentStepIndex(nextIndex);
    } catch (caught) { setError(errorMessage(caught)); }
  }

  async function handleSubmit() {
    if (!snapshotId) { setError('Evaluate the job before recommending a pay grade.'); return; }
    try { setError(null); setPayGradeResult(await payGradeRecommend.mutateAsync({ snapshotId, marketReferenceSnapshotId: marketWageResult?.snapshotId })); } catch (caught) { setError(errorMessage(caught)); }
  }

  async function handleCareerOneStopCompare() {
    if (!selectedJob?.onetSocCode) { setError('Set an ONET/SOC code on this job before comparing with CareerOneStop.'); return; }
    try { setError(null); const result = await careerOneStopWageLookup.mutateAsync({ jobId: selectedJobId, onetSocCode: selectedJob.onetSocCode }); if (result.success) setCareerOneStopResult(result); } catch (caught) { setError(errorMessage(caught)); }
  }

  async function handlePayGradeConfirm() {
    const recommendation = payGradeResult?.[0];
    const gradeId = chosenGrade || recommendation?.recommendedPayGradeId;
    if (!recommendation || !gradeId) { setError('Choose a pay grade before confirming.'); return; }
    if (gradeId !== recommendation.recommendedPayGradeId && !gradeReason.trim()) { setError('A reason is required when choosing a different grade.'); return; }
    try { setError(null); await payGradeConfirm.mutateAsync({ recommendationId: recommendation.recommendationId, confirmedPayGradeId: gradeId, overrideReason: gradeId === recommendation.recommendedPayGradeId ? null : gradeReason }); } catch (caught) { setError(errorMessage(caught)); }
  }

  async function handleConfirm(determinationId: string) { await confirm.mutateAsync(determinationId); setConfirmedIds((current) => new Set(current).add(determinationId)); }
  async function handleOverride(determinationId: string, effectiveOutcome: 'EXEMPT' | 'NON_EXEMPT' | 'UNDETERMINED', overrideReason: string) { await override.mutateAsync({ determinationId, effectiveOutcome, overrideReason }); setConfirmedIds((current) => new Set(current).add(determinationId)); }
  function updateFactor(index: number, patch: Partial<FactorScoreDraft>) { setFactorScores((current) => current.map((factor, factorIndex) => factorIndex === index ? { ...factor, ...patch } : factor)); }

  return <div className="space-y-6">
    <MhdPageHeader title="Compensation & Classification" description="Evaluate job classification, market reference data, and pay-grade fit." />
    <MhdComplianceGateBanner readiness={readiness.data} />
    {error ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      {currentStepIndex === 0 ? <div className="space-y-4"><label className="block text-sm font-medium">Job<select className={inputClass} value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}><option value="">Select a job</option>{(jobs.data ?? []).map((job) => <option key={job.id} value={job.id}>{job.jobTitle}</option>)}</select></label>{selectedJob ? <dl className="grid gap-2 text-sm sm:grid-cols-3"><div><dt className="font-medium">ONET/SOC code</dt><dd>{selectedJob.onetSocCode ?? 'Not set'}</dd></div><div><dt className="font-medium">CA wage order</dt><dd>{selectedJob.caWageOrderClassification ?? 'Not set'}</dd></div><div><dt className="font-medium">Job code</dt><dd>{selectedJob.jobCode ?? 'Not set'}</dd></div></dl> : null}</div> : null}
      {currentStepIndex === 1 ? <div className="space-y-4"><label className="block text-sm font-medium">Exemption category<select className={inputClass} value={exemptionCategory} onChange={(event) => setExemptionCategory(event.target.value as ExemptionCategory)}><option value="">Select category</option>{(['EXECUTIVE', 'ADMINISTRATIVE', 'PROFESSIONAL', 'COMPUTER', 'OUTSIDE_SALES', 'HCE'] as ExemptionCategory[]).map((category) => <option key={category} value={category}>{category}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium">Employee count<input className={inputClass} type="number" value={employerEmployeeCount ?? ''} onChange={(event) => setEmployerEmployeeCount(event.target.value ? Number(event.target.value) : null)} /></label><label className="text-sm font-medium">Weekly salary<input className={inputClass} type="number" value={weeklySalary ?? ''} onChange={(event) => setWeeklySalary(event.target.value ? Number(event.target.value) : null)} /></label><label className="text-sm font-medium">Hourly rate<input className={inputClass} type="number" value={hourlyRate ?? ''} onChange={(event) => setHourlyRate(event.target.value ? Number(event.target.value) : null)} /></label></div><label className="block text-sm font-medium">Exempt duties percent time<input className={inputClass} type="number" min="0" max="100" value={exemptDutiesPercent} onChange={(event) => setExemptDutiesPercent(Number(event.target.value))} /></label><div className="space-y-2"><div className="flex items-center justify-between"><h3 className="font-medium">Point-factor scores</h3><button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.secondary}`} onClick={() => setFactorScores((current) => [...current, { factorKey: '', points: 0 }])}>Add factor</button></div>{factorScores.map((factor, index) => <div className="flex flex-wrap gap-2" key={`${index}-${factor.factorKey}`}><input aria-label="Factor key" className={inputClass} placeholder="Factor key" value={factor.factorKey} onChange={(event) => updateFactor(index, { factorKey: event.target.value })} /><input aria-label="Points" className={inputClass} type="number" placeholder="Points" value={factor.points} onChange={(event) => updateFactor(index, { points: Number(event.target.value) })} /><input aria-label="Weight (optional)" className={inputClass} type="number" placeholder="Weight (optional)" value={factor.weight ?? ''} onChange={(event) => updateFactor(index, { weight: event.target.value ? Number(event.target.value) : undefined })} /><button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.secondary}`} onClick={() => setFactorScores((current) => current.filter((_, factorIndex) => factorIndex !== index))}>Remove</button></div>)}</div></div> : null}
      {currentStepIndex === 2 || currentStepIndex === 3 ? <DeterminationsPanel determinations={determinations} confirmedIds={confirmedIds} onConfirm={handleConfirm} onOverride={handleOverride} /> : null}
      {currentStepIndex === 4 ? <div className="space-y-4">{!selectedJob?.onetSocCode ? <p>Market data isn't available for this job because no ONET/SOC code is set.</p> : marketWageSkipped || marketWageResult ? <>{marketWageResult ? <MhdExternalDataAttribution citation={marketWageResult.source ?? ''} dataYear={marketWageResult.dataYear} /> : null}<dl className="grid gap-2 text-sm sm:grid-cols-3">{Object.entries(marketWageResult ?? {}).filter(([key]) => key.includes('Percentile') || key.includes('Median')).map(([key, value]) => <div key={key}><dt className="font-medium">{key}</dt><dd>{value ?? 'Not reported'}</dd></div>)}</dl><div className="space-y-2"><button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.secondary}`} onClick={() => void handleCareerOneStopCompare()} disabled={careerOneStopWageLookup.isPending}>Compare With CareerOneStop</button>{careerOneStopResult ? <><MhdExternalDataAttribution citation={careerOneStopResult.source} dataYear={careerOneStopResult.dataYear} /><dl className="grid gap-2 text-sm sm:grid-cols-3">{Object.entries(careerOneStopResult).filter(([key]) => key.includes('Percentile') || key.includes('Median')).map(([key, value]) => <div key={key}><dt className="font-medium">{key}</dt><dd>{value ?? 'Not reported'}</dd></div>)}</dl></> : null}</div></> : <p>Market wage lookup will run when you continue.</p>}</div> : null}
      {currentStepIndex === 5 ? <div className="space-y-4"><p>Submit to calculate the recommended pay grade from the evaluation and market reference.</p>{payGradeResult?.map((recommendation) => <div className="space-y-3 rounded-md border border-border p-4" key={recommendation.recommendationId}><p><strong>Total points:</strong> {recommendation.totalPoints}</p><p><strong>Recommendation:</strong> {recommendation.recommendedPayGradeId ?? 'No matching pay grade configured'}</p>{recommendation.recommendedPayGradeId ? <div className="space-y-2"><label className="block text-sm font-medium">Confirm this grade or choose a different grade<input className={inputClass} value={chosenGrade || recommendation.recommendedPayGradeId} onChange={(event) => setChosenGrade(event.target.value)} /></label>{chosenGrade && chosenGrade !== recommendation.recommendedPayGradeId ? <label className="block text-sm font-medium">Reason for different grade<textarea className={inputClass} value={gradeReason} onChange={(event) => setGradeReason(event.target.value)} /></label> : null}<button type="button" className={`${buttonBaseClasses} ${buttonVariantClasses.primary}`} onClick={() => void handlePayGradeConfirm()}>Confirm this grade</button></div> : null}</div>)}</div> : null}
      <MhdStepper steps={steps} currentStepIndex={currentStepIndex} onNavigate={onNavigate} validateCurrentStep={validateCurrentStep} onSubmit={() => void handleSubmit()} isSubmitting={payGradeRecommend.isPending} />
    </section>
  </div>;
}
