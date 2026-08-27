import {
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMhdAuth } from '@/features/authentication/Hook';
import { Button } from '@/components/ui/Button';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdExternalDataAttribution } from '@/components/ui/MhdExternalDataAttribution';
import { MhdRichTextEditor, MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import careerOneStopLogo from '@/assets/careeronestop-logo.svg';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import {
  useMhdCompetencies,
  useMhdCareerOneStopOccupationLookup,
  useMhdCreateDescriptionDraft,
  useMhdCreateJob,
  useMhdOnetOccupationLookup,
  useMhdOnetOccupationSearch,
  useMhdPublishDescription,
  useMhdSetDescriptionCompetencies,
  useMhdSetDescriptionFunctions,
  useMhdSetDescriptionQualifications,
  useMhdUpdateDescriptionDraft,
} from '../Hook';
import { mhdJobFormSchema } from '../Schemas';
import {
  MHD_CA_WAGE_ORDER_CLASSIFICATIONS,
  MHD_EMPLOYMENT_TYPES,
  MHD_FLSA_CLASSIFICATIONS,
  MHD_INDUSTRIES,
  MHD_PAY_PERIODS,
  MHD_QUALIFICATION_TYPES,
  mhdCanPublishDescription,
  mhdFormatCaWageOrderClassification,
  mhdFormatEmploymentType,
  mhdFormatFlsa,
  mhdFormatIndustry,
  mhdFormatPayRange,
  mhdFormatQualificationType,
  type MhdCaWageOrderClassification,
  type MhdEmploymentType,
  type MhdFlsaClassification,
  type MhdIndustry,
  type MhdPayPeriod,
  type MhdCareerOneStopOccupationLookupSuccess,
  type MhdOnetOccupationLookupSuccess,
  type MhdOnetOccupationSearchResult,
  type MhdQualificationType,
} from '../Types';

const BASICS_STEP_INDEX = 0;
const SOC_STEP_INDEX = 1;
const PAY_STEP_INDEX = 2;
const DUTIES_STEP_INDEX = 3;
const COMPETENCIES_STEP_INDEX = 4;
const REVIEW_STEP_INDEX = 5;

const steps: MhdStep[] = [
  { id: 'basics', title: 'Basics' },
  { id: 'soc-wage-order', title: 'SOC & Wage Order' },
  { id: 'pay-flsa', title: 'Pay & FLSA' },
  { id: 'duties-qualifications', title: 'Duties & Qualifications' },
  { id: 'competencies', title: 'Competencies' },
  { id: 'review', title: 'Review' },
];

interface DraftFunction { functionText: string; isEssential: boolean }
interface DraftQualification {
  qualificationText: string;
  qualificationType: MhdQualificationType;
  isRequired: boolean;
}

interface MhdJobDescriptionWizardJobState {
  jobTitle: string;
  jobCode: string;
  jobFamily: string;
  jobLevel: string;
  department: string;
  flsaClassification: MhdFlsaClassification | '';
  flsaClassificationSource: 'MANUAL' | 'CLASSIFICATION_WIZARD';
  employmentType: MhdEmploymentType;
  industry: MhdIndustry;
  isSafetySensitive: boolean;
  onetSocCode: string;
  caWageOrderClassification: MhdCaWageOrderClassification | '';
  payMin: number | null;
  payMax: number | null;
  payPeriod: MhdPayPeriod | '';
}

type MhdJobDescriptionWizardFieldError = { field: string; message: string } | null;

type MhdUpdateJobField = <K extends keyof MhdJobDescriptionWizardJobState>(
  key: K,
  value: MhdJobDescriptionWizardJobState[K],
) => void;

interface JobStepProps {
  job: MhdJobDescriptionWizardJobState;
  updateJob: MhdUpdateJobField;
  fieldError: MhdJobDescriptionWizardFieldError;
}

interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: ReadonlyArray<readonly [string, string]>;
  error?: string;
}

interface DutiesProps {
  summary: string;
  onetSocCode: string;
  setSummary: (value: string) => void;
  physicalRequirements: string;
  educationRequirements: string;
  setPhysicalRequirements: (value: string) => void;
  setEducationRequirements: (value: string) => void;
  functions: DraftFunction[];
  setFunctions: Dispatch<SetStateAction<DraftFunction[]>>;
  qualifications: DraftQualification[];
  setQualifications: Dispatch<SetStateAction<DraftQualification[]>>;
}

interface CompetencyListProps {
  data: Array<{ id: string; competencyName: string; description: string | null }>;
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
}

interface ReviewProps {
  job: MhdJobDescriptionWizardJobState;
  summary: string;
  functions: DraftFunction[];
  qualifications: DraftQualification[];
  selectedCompetencyIds: string[];
  gate: { ok: boolean; reason: string | null };
}

const inputClasses =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function mhdEscapeRichTextParagraph(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${escaped}</p>`;
}

/** These wizard fields persist as HTML strings (MhdRichTextEditor), so an "Add"
 * action from a suggestion list appends an escaped paragraph, not a newline. */
function mhdAppendRichTextParagraph(previousHtml: string, text: string): string {
  return previousHtml + mhdEscapeRichTextParagraph(text);
}

function Field({ label, id, children, error }: { label: string; id: string; children: ReactNode; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function MhdJobDescriptionWizard() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(BASICS_STEP_INDEX);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<MhdJobDescriptionWizardFieldError>(null);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [descriptionId, setDescriptionId] = useState<string | null>(null);
  const [job, setJob] = useState<MhdJobDescriptionWizardJobState>({
    jobTitle: '', jobCode: '', jobFamily: '', jobLevel: '', department: '',
    flsaClassification: '' as MhdFlsaClassification | '',
    flsaClassificationSource: 'MANUAL',
    employmentType: 'FULL_TIME' as MhdEmploymentType, industry: 'GENERAL' as MhdIndustry,
    isSafetySensitive: false, onetSocCode: '',
    caWageOrderClassification: '' as MhdCaWageOrderClassification | '',
    payMin: null as number | null, payMax: null as number | null,
    payPeriod: '' as MhdPayPeriod | '',
  });
  const [summary, setSummary] = useState('');
  const [physicalRequirements, setPhysicalRequirements] = useState('');
  const [educationRequirements, setEducationRequirements] = useState('');
  const [functions, setFunctions] = useState<DraftFunction[]>([{ functionText: '', isEssential: true }]);
  const [qualifications, setQualifications] = useState<DraftQualification[]>([]);
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([]);
  const createJob = useMhdCreateJob();
  const createDraft = useMhdCreateDescriptionDraft(companyId);
  const updateDraft = useMhdUpdateDescriptionDraft(companyId);
  const setFns = useMhdSetDescriptionFunctions(companyId);
  const setQuals = useMhdSetDescriptionQualifications(companyId);
  const setCompetencies = useMhdSetDescriptionCompetencies(companyId);
  const publish = useMhdPublishDescription(companyId);
  const competencies = useMhdCompetencies(companyId, job.industry);
  const createStarted = useRef(false);
  const dutiesSaved = useRef(false);
  const competenciesSaved = useRef(false);

  const essentialCount = functions.filter((fn) => fn.isEssential && fn.functionText.trim()).length;
  const gate = mhdCanPublishDescription(summary, essentialCount);

  const updateJob: MhdUpdateJobField = (key, value) => {
    setJob((previous) => ({ ...previous, [key]: value }));
    setFieldError(null);
  };

  function validateCurrentStep() {
    setStepError(null);
    setFieldError(null);
    if (currentStepIndex === DUTIES_STEP_INDEX) {
      if (!functions.some((fn) => fn.isEssential && fn.functionText.trim())) {
        setStepError('Add at least one essential function before continuing.');
        return false;
      }
      return true;
    }
    if (currentStepIndex === REVIEW_STEP_INDEX) {
      if (!gate.ok) setStepError(gate.reason);
      return gate.ok;
    }
    if (currentStepIndex === COMPETENCIES_STEP_INDEX) return true;
    const result = mhdJobFormSchema.safeParse({
      companyId, ...job,
      jobCode: job.jobCode || null, jobFamily: job.jobFamily || null,
      jobLevel: job.jobLevel || null, department: job.department || null,
      flsaClassification: job.flsaClassification || null,
      onetSocCode: job.onetSocCode || null,
      caWageOrderClassification: job.caWageOrderClassification || null,
      payPeriod: job.payPeriod || null,
    });
    if (!result.success) {
      const issue = result.error.issues[0];
      setFieldError({ field: String(issue.path[0] ?? ''), message: issue.message });
      return false;
    }
    return true;
  }

  async function handleNavigate(nextIndex: number) {
    const isGoingBack = nextIndex < currentStepIndex;
    if (isGoingBack) {
      setCurrentStepIndex(nextIndex);
      return;
    }
    try {
      setIsAdvancing(true);
      setStepError(null);
      if (currentStepIndex === PAY_STEP_INDEX && !createdJobId && !createStarted.current) {
        createStarted.current = true;
        const result = await createJob.mutateAsync({
          companyId: companyId!, jobTitle: job.jobTitle.trim(), jobCode: job.jobCode || null,
          jobFamily: job.jobFamily || null, jobLevel: job.jobLevel || null, department: job.department || null,
          flsaClassification: job.flsaClassification || null, employmentType: job.employmentType,
          industry: job.industry, isSafetySensitive: job.isSafetySensitive,
          onetSocCode: job.onetSocCode || null,
          caWageOrderClassification: job.caWageOrderClassification || null,
          payMin: job.payMin, payMax: job.payMax, payPeriod: job.payPeriod || null,
        });
        setCreatedJobId(result.id);
        const draft = await createDraft.mutateAsync({ jobId: result.id, copyFrom: null });
        setDescriptionId(draft.id);
      }
      if (currentStepIndex === DUTIES_STEP_INDEX && descriptionId && !dutiesSaved.current) {
        dutiesSaved.current = true;
        await updateDraft.mutateAsync({ descriptionId, summary, physicalRequirements, educationRequirements });
        await setFns.mutateAsync({ descriptionId, functions: functions.filter((fn) => fn.functionText.trim()) });
        await setQuals.mutateAsync({ descriptionId, qualifications: qualifications.filter((q) => q.qualificationText.trim()) });
      }
      if (currentStepIndex === COMPETENCIES_STEP_INDEX && descriptionId && !competenciesSaved.current) {
        competenciesSaved.current = true;
        await setCompetencies.mutateAsync({ descriptionId, competencies: selectedCompetencyIds.map((competencyId) => ({ competencyId })) });
      }
      setCurrentStepIndex(nextIndex);
    } catch (err) {
      if (currentStepIndex === PAY_STEP_INDEX) createStarted.current = false;
      if (currentStepIndex === DUTIES_STEP_INDEX) dutiesSaved.current = false;
      if (currentStepIndex === COMPETENCIES_STEP_INDEX) competenciesSaved.current = false;
      setStepError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsAdvancing(false);
    }
  }

  async function handleSubmit() {
    if (!descriptionId || !createdJobId) return;
    if (!gate.ok) { setStepError(gate.reason); return; }
    try {
      setIsAdvancing(true);
      await publish.mutateAsync({ descriptionId });
      navigate(`/jobs/${createdJobId}`);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setIsAdvancing(false); }
  }

  if (!companyId) return <p className="text-sm text-muted-foreground">Loading job setup…</p>;

  return (
    <div className="space-y-6">
      <MhdPageHeader title="Guided job setup" description="Build a complete job description one step at a time." />
      <MhdCard className="space-y-6">
        {currentStepIndex === BASICS_STEP_INDEX ? <Basics job={job} updateJob={updateJob} fieldError={fieldError} /> : null}
        {currentStepIndex === SOC_STEP_INDEX ? <Soc job={job} updateJob={updateJob} fieldError={fieldError} /> : null}
        {currentStepIndex === PAY_STEP_INDEX ? <Pay job={job} updateJob={updateJob} fieldError={fieldError} /> : null}
        {currentStepIndex === DUTIES_STEP_INDEX ? <Duties summary={summary} onetSocCode={job.onetSocCode} setSummary={setSummary} physicalRequirements={physicalRequirements} educationRequirements={educationRequirements} setPhysicalRequirements={setPhysicalRequirements} setEducationRequirements={setEducationRequirements} functions={functions} setFunctions={setFunctions} qualifications={qualifications} setQualifications={setQualifications} /> : null}
        {currentStepIndex === COMPETENCIES_STEP_INDEX ? <CompetencyList data={competencies.data ?? []} selected={selectedCompetencyIds} setSelected={setSelectedCompetencyIds} /> : null}
        {currentStepIndex === REVIEW_STEP_INDEX ? <Review job={job} summary={summary} functions={functions} qualifications={qualifications} selectedCompetencyIds={selectedCompetencyIds} gate={gate} /> : null}
        {stepError ? <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{stepError}</p> : null}
        <MhdStepper steps={steps} currentStepIndex={currentStepIndex} onNavigate={(index) => void handleNavigate(index)} validateCurrentStep={validateCurrentStep} isSubmitting={isAdvancing} onSubmit={() => void handleSubmit()} />
      </MhdCard>
    </div>
  );
}

function Basics({ job, updateJob, fieldError }: JobStepProps) {
  return <MhdFormFieldStack>
    <Field label="Job title" id="wizard-jobTitle" error={fieldError?.field === 'jobTitle' ? fieldError.message : undefined}><input id="wizard-jobTitle" value={job.jobTitle} onChange={(e) => updateJob('jobTitle', e.target.value)} className={inputClasses} /></Field>
    <Field label="Job code" id="wizard-jobCode"><input id="wizard-jobCode" value={job.jobCode} onChange={(e) => updateJob('jobCode', e.target.value)} className={inputClasses} /></Field>
    <Field label="Job family" id="wizard-jobFamily"><input id="wizard-jobFamily" value={job.jobFamily} onChange={(e) => updateJob('jobFamily', e.target.value)} className={inputClasses} /></Field>
    <Field label="Job level" id="wizard-jobLevel"><input id="wizard-jobLevel" value={job.jobLevel} onChange={(e) => updateJob('jobLevel', e.target.value)} className={inputClasses} /></Field>
    <Field label="Department" id="wizard-department"><input id="wizard-department" value={job.department} onChange={(e) => updateJob('department', e.target.value)} className={inputClasses} /></Field>
    <SelectField label="Employment type" id="wizard-employmentType" value={job.employmentType} onChange={(e) => updateJob('employmentType', e.target.value as MhdEmploymentType)} options={MHD_EMPLOYMENT_TYPES.map((v) => [v, mhdFormatEmploymentType(v)] as const)} />
    <SelectField label="Industry" id="wizard-industry" value={job.industry} onChange={(e) => updateJob('industry', e.target.value as MhdIndustry)} options={MHD_INDUSTRIES.map((v) => [v, mhdFormatIndustry(v)] as const)} />
    <label className="flex items-center gap-2 self-end text-sm text-foreground"><input type="checkbox" checked={job.isSafetySensitive} onChange={(e) => updateJob('isSafetySensitive', e.target.checked)} />Safety-sensitive role</label>
  </MhdFormFieldStack>;
}

function Soc({ job, updateJob, fieldError }: JobStepProps) {
  const onetSearch = useMhdOnetOccupationSearch();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<MhdOnetOccupationSearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch() {
    if (!keyword.trim()) return;
    setSearchError(null);
    try {
      const result = await onetSearch.mutateAsync({ keyword: keyword.trim() });
      if (result.success) setResults(result.results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'The O*NET occupation search failed.');
    }
  }

  return <div className="space-y-4">
    <div className="space-y-2">
      <label htmlFor="wizard-onetSearch" className="block text-sm font-medium text-foreground">Find an O*NET-SOC code by job title</label>
      <div className="flex gap-2">
        <input id="wizard-onetSearch" placeholder="e.g. software developer" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleSearch(); } }} className={`${inputClasses} mt-0 flex-1`} />
        <Button variant="secondary" onClick={() => void handleSearch()} disabled={!keyword.trim() || onetSearch.isPending}>Search O*NET</Button>
      </div>
      {searchError ? <p className="text-xs text-rose-600">{searchError}</p> : null}
      {results ? <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
        {results.length ? results.map((occupation) => (
          <button type="button" key={occupation.code} onClick={() => { updateJob('onetSocCode', occupation.code); setResults(null); }} className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm hover:bg-muted">
            <span>{occupation.title}</span>
            <span className="text-xs text-muted-foreground">{occupation.code}</span>
          </button>
        )) : <p className="px-2 py-1 text-sm text-muted-foreground">No O*NET occupations matched.</p>}
      </div> : null}
    </div>
    <MhdFormFieldStack>
      <Field label="O*NET-SOC Code" id="wizard-onetSocCode" error={fieldError?.field === 'onetSocCode' ? fieldError.message : undefined}><input id="wizard-onetSocCode" placeholder="e.g. 53-3032.00" value={job.onetSocCode} onChange={(e) => updateJob('onetSocCode', e.target.value)} className={inputClasses} /></Field>
      <SelectField label="CA Wage Order Classification" id="wizard-caWageOrder" value={job.caWageOrderClassification} onChange={(e) => updateJob('caWageOrderClassification', e.target.value as MhdCaWageOrderClassification | '')} options={[['', 'Unclassified'] as const, ...MHD_CA_WAGE_ORDER_CLASSIFICATIONS.map((v) => [v, mhdFormatCaWageOrderClassification(v)] as const)]} />
    </MhdFormFieldStack>
  </div>;
}

function Pay({ job, updateJob, fieldError }: JobStepProps) {
  const classificationLocked = job.flsaClassificationSource === 'CLASSIFICATION_WIZARD';
  return <MhdFormFieldStack>
    <Field label="Pay minimum" id="wizard-payMin" error={fieldError?.field === 'payMin' ? fieldError.message : undefined}><input id="wizard-payMin" type="number" min="0" value={job.payMin ?? ''} onChange={(e) => updateJob('payMin', e.target.value === '' ? null : Number(e.target.value))} className={inputClasses} /></Field>
    <Field label="Pay maximum" id="wizard-payMax" error={fieldError?.field === 'payMax' ? fieldError.message : undefined}><input id="wizard-payMax" type="number" min="0" value={job.payMax ?? ''} onChange={(e) => updateJob('payMax', e.target.value === '' ? null : Number(e.target.value))} className={inputClasses} /></Field>
    <SelectField label="Pay period" id="wizard-payPeriod" value={job.payPeriod} onChange={(e) => updateJob('payPeriod', e.target.value as MhdPayPeriod | '')} options={[['', 'No pay range'] as const, ...MHD_PAY_PERIODS.map((v) => [v, v === 'HOURLY' ? 'Hourly' : 'Annual'] as const)]} error={fieldError?.field === 'payPeriod' ? fieldError.message : undefined} />
    <div><SelectField label="FLSA classification" id="wizard-flsa" value={job.flsaClassification} onChange={(e) => updateJob('flsaClassification', e.target.value as MhdFlsaClassification | '')} options={[['', 'Not yet classified'] as const, ...MHD_FLSA_CLASSIFICATIONS.map((v) => [v, mhdFormatFlsa(v)] as const)]} disabled={classificationLocked} />{classificationLocked ? <p className="mt-1 text-xs text-muted-foreground">Set by a confirmed classification determination. <Link to="/compensation" className="underline">Review in Classification Wizard</Link></p> : null}</div>
  </MhdFormFieldStack>;
}

function SelectField({ label, id, value, onChange, options, error, disabled }: SelectFieldProps & { disabled?: boolean }) { return <Field label={label} id={id} error={error}><select id={id} value={value} onChange={onChange} disabled={disabled} className={inputClasses}>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></Field>; }

function Duties({ summary, onetSocCode, setSummary, physicalRequirements, educationRequirements, setPhysicalRequirements, setEducationRequirements, functions, setFunctions, qualifications, setQualifications }: DutiesProps) {
  const careerOneStopOccupationLookup = useMhdCareerOneStopOccupationLookup();
  const onetOccupationLookup = useMhdOnetOccupationLookup();
  const [suggestion, setSuggestion] = useState<MhdCareerOneStopOccupationLookupSuccess | null>(null);
  const [onetSuggestion, setOnetSuggestion] = useState<MhdOnetOccupationLookupSuccess | null>(null);
  const [requirementsSuggestion, setRequirementsSuggestion] = useState<MhdOnetOccupationLookupSuccess | null>(null);
  const [onetError, setOnetError] = useState<string | null>(null);
  async function handleSuggest() {
    if (!onetSocCode) return;
    const result = await careerOneStopOccupationLookup.mutateAsync({ onetSocCode });
    if (result.success) setSuggestion(result);
  }
  async function handleSuggestOnet() {
    if (!onetSocCode) return;
    setOnetError(null);
    try {
      const result = await onetOccupationLookup.mutateAsync({ onetSocCode, includeDuties: true });
      if (result.success) setOnetSuggestion(result);
    } catch (err) {
      setOnetError(err instanceof Error ? err.message : 'The O*NET duties lookup failed.');
    }
  }
  async function handleSuggestRequirements() {
    if (!onetSocCode) return;
    setOnetError(null);
    try {
      const result = await onetOccupationLookup.mutateAsync({ onetSocCode, includeRequirements: true });
      if (result.success) setRequirementsSuggestion(result);
    } catch (err) {
      setOnetError(err instanceof Error ? err.message : 'The O*NET requirements lookup failed.');
    }
  }
  return <div className="space-y-6"><div className="space-y-2"><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => void handleSuggest()} disabled={!onetSocCode || careerOneStopOccupationLookup.isPending}>Suggest Duties From CareerOneStop</Button><Button variant="secondary" onClick={() => void handleSuggestOnet()} disabled={!onetSocCode || onetOccupationLookup.isPending}>Suggest Duties From O*NET Online</Button><Button variant="secondary" onClick={() => void handleSuggestRequirements()} disabled={!onetSocCode || onetOccupationLookup.isPending}>Suggest Requirements From O*NET Online</Button></div>{!onetSocCode ? <p className="text-sm text-muted-foreground">Set an O*NET-SOC code on the SOC &amp; Wage Order step to enable this.</p> : null}{onetError ? <p className="text-xs text-rose-600">{onetError}</p> : null}{suggestion ? <div className="space-y-3 rounded-md border border-border p-3"><MhdExternalDataAttribution citation={suggestion.source} logoUrl={careerOneStopLogo} logoAlt="CareerOneStop" /><div className="space-y-2"><p className="text-sm font-medium">Suggested duties</p>{suggestion.tasks.map((task, index) => <div className="flex items-center justify-between gap-2 text-sm" key={`task-${index}`}><span>{task}</span><Button variant="secondary" onClick={() => setFunctions((p) => [...p, { functionText: task, isEssential: true }])}>Add</Button></div>)}</div><div className="space-y-2"><p className="text-sm font-medium">Suggested skills and knowledge</p>{[...suggestion.skills, ...suggestion.knowledge].map((item, index) => <div className="flex items-center justify-between gap-2 text-sm" key={`qualification-${index}`}><span>{item}</span><Button variant="secondary" onClick={() => setQualifications((p) => [...p, { qualificationText: item, qualificationType: 'SKILL', isRequired: false }])}>Add</Button></div>)}</div></div> : null}{onetSuggestion ? <div className="space-y-3 rounded-md border border-border p-3"><MhdExternalDataAttribution citation={onetSuggestion.source} /><div className="space-y-2"><p className="text-sm font-medium">Suggested duties</p>{(onetSuggestion.tasks ?? []).map((task, index) => <div className="flex items-center justify-between gap-2 text-sm" key={`onet-task-${index}`}><span>{task}</span><Button variant="secondary" onClick={() => setFunctions((p) => [...p, { functionText: task, isEssential: true }])}>Add</Button></div>)}</div><div className="space-y-2"><p className="text-sm font-medium">Suggested skills, knowledge, and abilities</p>{[...(onetSuggestion.skills ?? []), ...(onetSuggestion.knowledge ?? []), ...(onetSuggestion.abilities ?? [])].map((item, index) => <div className="flex items-center justify-between gap-2 text-sm" key={`onet-qualification-${index}`}><span>{item}</span><Button variant="secondary" onClick={() => setQualifications((p) => [...p, { qualificationText: item, qualificationType: 'SKILL', isRequired: false }])}>Add</Button></div>)}</div></div> : null}{requirementsSuggestion ? <div className="space-y-3 rounded-md border border-border p-3"><MhdExternalDataAttribution citation={requirementsSuggestion.source} />{requirementsSuggestion.jobZone ? <div className="space-y-2"><p className="text-sm font-medium">Suggested education &amp; training level</p><div className="flex items-start justify-between gap-2 text-sm"><span>{[requirementsSuggestion.jobZone.education, requirementsSuggestion.jobZone.relatedExperience, requirementsSuggestion.jobZone.jobTraining].filter(Boolean).join(' ')}</span><Button variant="secondary" onClick={() => { const zone = requirementsSuggestion.jobZone!; const text = [zone.education, zone.relatedExperience, zone.jobTraining].filter(Boolean).join(' '); setEducationRequirements(mhdAppendRichTextParagraph(educationRequirements, text)); }}>Add</Button></div></div> : null}<div className="space-y-2"><p className="text-sm font-medium">Suggested education levels reported</p>{(requirementsSuggestion.educationBreakdown ?? []).map((item, index) => <div className="flex items-center justify-between gap-2 text-sm" key={`education-${index}`}><span>{item.percentageOfRespondents != null ? `${item.title} (${item.percentageOfRespondents}% of respondents)` : item.title}</span><Button variant="secondary" onClick={() => { const text = item.percentageOfRespondents != null ? `${item.title} (${item.percentageOfRespondents}% of respondents)` : item.title; setEducationRequirements(mhdAppendRichTextParagraph(educationRequirements, text)); }}>Add</Button></div>)}</div><div className="space-y-2"><p className="text-sm font-medium">Suggested physical &amp; work context requirements</p>{(requirementsSuggestion.workContext ?? []).map((item, index) => <div className="flex items-center justify-between gap-2 text-sm" key={`work-context-${index}`}><span>{item}</span><Button variant="secondary" onClick={() => setPhysicalRequirements(mhdAppendRichTextParagraph(physicalRequirements, item))}>Add</Button></div>)}</div></div> : null}</div><MhdRichTextEditor label="Role summary" html={summary} onChange={(html) => setSummary(html)} />
    <fieldset><legend className="text-sm font-medium text-foreground">Functions</legend><div className="mt-2 space-y-2">{functions.map((fn: DraftFunction, i: number) => <div key={`fn-${i}`} className="flex items-start gap-2"><textarea rows={2} value={fn.functionText} onChange={(e) => setFunctions((p: DraftFunction[]) => p.map((x, j) => j === i ? { ...x, functionText: e.target.value } : x))} className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground" /><label className="mt-2 flex items-center gap-1.5 text-sm"><input type="checkbox" checked={fn.isEssential} onChange={(e) => setFunctions((p: DraftFunction[]) => p.map((x, j) => j === i ? { ...x, isEssential: e.target.checked } : x))} />Essential</label><button type="button" onClick={() => setFunctions((p: DraftFunction[]) => p.filter((_, j) => j !== i))} className="mt-2 text-sm text-muted-foreground">Remove</button></div>)}<Button variant="secondary" onClick={() => setFunctions((p: DraftFunction[]) => [...p, { functionText: '', isEssential: true }])}>Add function</Button></div></fieldset>
    <fieldset><legend className="text-sm font-medium text-foreground">Qualifications</legend><div className="mt-2 space-y-2">{qualifications.map((q: DraftQualification, i: number) => <div key={`qual-${i}`} className="flex items-start gap-2"><input value={q.qualificationText} onChange={(e) => setQualifications((p: DraftQualification[]) => p.map((x, j) => j === i ? { ...x, qualificationText: e.target.value } : x))} className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground" /><select value={q.qualificationType} onChange={(e) => setQualifications((p: DraftQualification[]) => p.map((x, j) => j === i ? { ...x, qualificationType: e.target.value as MhdQualificationType } : x))} className="rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground">{MHD_QUALIFICATION_TYPES.map((type) => <option key={type} value={type}>{mhdFormatQualificationType(type)}</option>)}</select><label className="mt-2 flex items-center gap-1.5 text-sm"><input type="checkbox" checked={q.isRequired} onChange={(e) => setQualifications((p: DraftQualification[]) => p.map((x, j) => j === i ? { ...x, isRequired: e.target.checked } : x))} />Required</label><button type="button" onClick={() => setQualifications((p: DraftQualification[]) => p.filter((_, j) => j !== i))} className="mt-2 text-sm text-muted-foreground">Remove</button></div>)}<Button variant="secondary" onClick={() => setQualifications((p: DraftQualification[]) => [...p, { qualificationText: '', qualificationType: 'EXPERIENCE', isRequired: true }])}>Add qualification</Button></div></fieldset>
  <MhdRichTextEditor label="Physical Requirements" html={physicalRequirements} onChange={(html) => setPhysicalRequirements(html)} />
    <MhdRichTextEditor label="Education & Training Requirements" html={educationRequirements} onChange={(html) => setEducationRequirements(html)} />
  </div>;
}

function CompetencyList({ data, selected, setSelected }: CompetencyListProps) { return <div><h2 className="text-sm font-medium text-foreground">Select competencies</h2><div className="mt-2 space-y-2">{data.length ? data.map((c) => <label key={c.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={selected.includes(c.id)} onChange={(e) => setSelected((p) => e.target.checked ? [...p, c.id] : p.filter((id) => id !== c.id))} /><span><span className="font-medium">{c.competencyName}</span>{c.description ? <span className="block text-muted-foreground">{c.description}</span> : null}</span></label>) : <p className="text-sm text-muted-foreground">No competencies available for this industry.</p>}</div></div>; }

function Review({ job, summary, functions, qualifications, selectedCompetencyIds, gate }: ReviewProps) { const pay = { payMin: job.payMin, payMax: job.payMax, payPeriod: job.payPeriod || null }; return <div className="space-y-3 text-sm"><h2 className="font-medium text-foreground">Review and publish</h2><MhdFormFieldStack><MhdDetailField label="Job title" value={job.jobTitle} /><MhdDetailField label="Employment" value={mhdFormatEmploymentType(job.employmentType)} /><MhdDetailField label="Industry" value={mhdFormatIndustry(job.industry)} /><MhdDetailField label="Pay range" value={mhdFormatPayRange(pay)} /><MhdDetailField label="Functions" value={functions.filter((f) => f.functionText.trim()).length} /><MhdDetailField label="Qualifications" value={qualifications.filter((q) => q.qualificationText.trim()).length} /><MhdDetailField label="Competencies" value={selectedCompetencyIds.length} /></MhdFormFieldStack>{summary ? <MhdRichTextRenderer html={summary} className="text-muted-foreground" /> : <p className="text-muted-foreground">No summary added.</p>}{!gate.ok ? <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{gate.reason}</p> : null}</div>; }
