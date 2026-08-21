import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mhdCanMutateJobs, mhdCanSeeJobPay } from '@/appshell/mhdRouteAccess';
import { MhdJobRecordTabs } from '@/appshell/components/MhdJobRecordTabs';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateDescriptionDraft,
  useMhdDeleteJob,
  useMhdJobs,
  useMhdPublishedJobForPerson,
  useMhdSetPayRange,
  useMhdUpdateJob,
} from '../Hook';
import {
  MHD_EMPLOYMENT_TYPES,
  MHD_FLSA_CLASSIFICATIONS,
  MHD_CA_WAGE_ORDER_CLASSIFICATIONS,
  MHD_INDUSTRIES,
  MHD_PAY_PERIODS,
  mhdFormatEmploymentType,
  mhdFormatFlsa,
  mhdFormatCaWageOrderClassification,
  mhdFormatIndustry,
  type MhdEmploymentType,
  type MhdFlsaClassification,
  type MhdIndustry,
  type MhdCaWageOrderClassification,
  type MhdPayPeriod,
} from '../Types';
import { MhdEssentialFunctionList } from './MhdEssentialFunctionList';
import { MhdFlsaBadge } from './MhdFlsaBadge';
import { MhdJobDescriptionEditor } from './MhdJobDescriptionEditor';
import { MhdPayRangeField } from './MhdPayRangeField';

/**
 * `/jobs/:jobId` route entry — identity, the published description, and version
 * authoring. Reads auth itself (companyId, roles); `canSeePay` is Platform Admin
 * / HR Partner only.
 *
 * The published-description preview resolves through the same consumer contract
 * (`mhd_job_get_published_for_person`) that Performance v2 will use, keyed on a
 * person currently holding the job. There is no incumbent-person lookup on the
 * job list yet, so the preview stays keyed on nobody here (null) and shows the
 * "assign somebody to preview" guidance; the authoring flow below is unaffected.
 */
export function MhdJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canSeePay = mhdCanSeeJobPay(roles);
  const canMutate = mhdCanMutateJobs(roles);
  const previewPersonId: string | null = null;

  const [draftId, setDraftId] = useState<string | null>(null);
  const [isEditingPay, setIsEditingPay] = useState(false);
  const [payMin, setPayMin] = useState('');
  const [payMax, setPayMax] = useState('');
  const [payPeriod, setPayPeriod] = useState<MhdPayPeriod>('ANNUAL');
  const [payError, setPayError] = useState<string | null>(null);

  const [isEditingJob, setIsEditingJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCode, setJobCode] = useState('');
  const [jobFamily, setJobFamily] = useState('');
  const [jobLevel, setJobLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [flsaClassification, setFlsaClassification] = useState<MhdFlsaClassification | ''>('');
  const [employmentType, setEmploymentType] = useState<MhdEmploymentType>('FULL_TIME');
  const [industry, setIndustry] = useState<MhdIndustry>('GENERAL');
  const [onetSocCode, setOnetSocCode] = useState('');
  const [caWageOrderClassification, setCaWageOrderClassification] =
    useState<MhdCaWageOrderClassification | ''>('');
  const [isSafetySensitive, setIsSafetySensitive] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  const jobs = useMhdJobs(companyId, null, false);
  const job = (jobs.data ?? []).find((candidate) => candidate.id === jobId) ?? null;

  const published = useMhdPublishedJobForPerson(previewPersonId);
  const createDraft = useMhdCreateDescriptionDraft(companyId);
  const setPay = useMhdSetPayRange();
  const updateJob = useMhdUpdateJob();
  const deleteJob = useMhdDeleteJob();

  async function startDraft() {
    if (!jobId) return;
    const result = await createDraft.mutateAsync({
      jobId,
      // Copying the published version brings its functions, qualifications and
      // competencies across — a new version is nearly always an edit of the last
      // one rather than a blank page.
      copyFrom: job?.publishedDescriptionId ?? null,
    });
    setDraftId(result.id);
  }

  async function savePay() {
    if (!jobId) return;
    const min = Number.parseFloat(payMin);
    const max = Number.parseFloat(payMax);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      setPayError('Enter both bounds.');
      return;
    }
    if (max < min) {
      setPayError('The upper bound must be at or above the lower bound.');
      return;
    }
    setPayError(null);
    await setPay.mutateAsync({ jobId, payMin: min, payMax: max, payPeriod });
    setIsEditingPay(false);
  }

  function startEditingJob() {
    if (!job) return;
    setJobTitle(job.jobTitle);
    setJobCode(job.jobCode ?? '');
    setJobFamily(job.jobFamily ?? '');
    setJobLevel(job.jobLevel ?? '');
    setDepartment(job.department ?? '');
    setFlsaClassification(job.flsaClassification ?? '');
    setEmploymentType(job.employmentType);
    setIndustry(job.industry);
    setOnetSocCode(job.onetSocCode ?? '');
    setCaWageOrderClassification(job.caWageOrderClassification ?? '');
    setIsSafetySensitive(job.isSafetySensitive);
    setIsActive(job.isActive);
    setJobError(null);
    setIsEditingJob(true);
  }

  async function saveJob() {
    if (!jobId) return;
    const trimmedTitle = jobTitle.trim();
    if (!trimmedTitle) {
      setJobError('Title is required.');
      return;
    }
    setJobError(null);
    await updateJob.mutateAsync({
      jobId,
      jobTitle: trimmedTitle,
      jobCode: jobCode.trim() || null,
      jobFamily: jobFamily.trim() || null,
      jobLevel: jobLevel.trim() || null,
      department: department.trim() || null,
      flsaClassification: flsaClassification || null,
      employmentType,
      isSafetySensitive,
      industry,
      onetSocCode: onetSocCode.trim() || null,
      caWageOrderClassification: caWageOrderClassification || null,
      isActive,
    });
    setIsEditingJob(false);
  }

  async function handleDeleteJob() {
    if (!jobId) return;
    await deleteJob.mutateAsync(jobId);
    navigate('/jobs');
  }

  if (!companyId || jobs.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!job) return <p className="text-sm text-muted-foreground">Job not found.</p>;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={job.jobTitle}
        backTo="/jobs"
        backLabel="All jobs"
        chips={
          <MhdFlsaBadge
            flsaClassification={job.flsaClassification}
            isSafetySensitive={job.isSafetySensitive}
          />
        }
        description={
          <>
            {job.referenceId}
            {job.jobCode ? ` · ${job.jobCode}` : ''} · {mhdFormatEmploymentType(job.employmentType)}{' '}
            · {mhdFormatIndustry(job.industry)}
          </>
        }
      />

      <MhdJobRecordTabs
        jobId={job.id}
        active="detail"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <MhdPayRangeField
              job={job}
              canSeePay={canSeePay}
              onEdit={canSeePay ? () => setIsEditingPay(true) : undefined}
            />
            {canMutate ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="warning"
                  onClick={() => (isEditingJob ? setIsEditingJob(false) : startEditingJob())}
                >
                  {isEditingJob ? 'Cancel Edit' : 'Edit Job'}
                </Button>
                <MhdDetailActions
                  onDelete={handleDeleteJob}
                  deleteLabel="Delete Job"
                  deleteConfirmMessage="Delete this job? This cannot be undone."
                />
              </div>
            ) : null}
          </div>
        }
      />

      {isEditingJob && canMutate ? (
        <MhdCard className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Edit job</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-foreground">
                Title
              </label>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="jobCode" className="block text-sm font-medium text-foreground">
                Code
              </label>
              <input
                id="jobCode"
                type="text"
                value={jobCode}
                onChange={(event) => setJobCode(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="jobFamily" className="block text-sm font-medium text-foreground">
                Family
              </label>
              <input
                id="jobFamily"
                type="text"
                value={jobFamily}
                onChange={(event) => setJobFamily(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="jobLevel" className="block text-sm font-medium text-foreground">
                Level
              </label>
              <input
                id="jobLevel"
                type="text"
                value={jobLevel}
                onChange={(event) => setJobLevel(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-foreground">
                Department
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="flsaClassification" className="block text-sm font-medium text-foreground">
                FLSA classification
              </label>
              <select
                id="flsaClassification"
                value={flsaClassification}
                onChange={(event) =>
                  setFlsaClassification(event.target.value as MhdFlsaClassification | '')
                }
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">Unclassified</option>
                {MHD_FLSA_CLASSIFICATIONS.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatFlsa(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="employmentType" className="block text-sm font-medium text-foreground">
                Employment type
              </label>
              <select
                id="employmentType"
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value as MhdEmploymentType)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {MHD_EMPLOYMENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatEmploymentType(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-foreground">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(event) => setIndustry(event.target.value as MhdIndustry)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {MHD_INDUSTRIES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatIndustry(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="onetSocCode" className="block text-sm font-medium text-foreground">
                O*NET-SOC Code
              </label>
              <input
                id="onetSocCode"
                type="text"
                placeholder="e.g. 53-3032.00"
                value={onetSocCode}
                onChange={(event) => setOnetSocCode(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="caWageOrderClassification" className="block text-sm font-medium text-foreground">
                CA Wage Order Classification
              </label>
              <select
                id="caWageOrderClassification"
                value={caWageOrderClassification}
                onChange={(event) =>
                  setCaWageOrderClassification(
                    event.target.value as MhdCaWageOrderClassification | '',
                  )
                }
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">Unclassified</option>
                {MHD_CA_WAGE_ORDER_CLASSIFICATIONS.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatCaWageOrderClassification(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isSafetySensitive}
                onChange={(event) => setIsSafetySensitive(event.target.checked)}
              />
              Safety-sensitive
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active
            </label>
          </div>
          {jobError ? <p className="text-xs text-rose-600">{jobError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsEditingJob(false)}>
              Cancel
            </Button>
            <Button disabled={updateJob.isPending} onClick={() => void saveJob()}>
              {updateJob.isPending ? 'Saving…' : 'Save job'}
            </Button>
          </div>
        </MhdCard>
      ) : null}

      {isEditingPay && canSeePay ? (
        <MhdCard className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="payMin" className="block text-sm font-medium text-foreground">
                From
              </label>
              <input
                id="payMin"
                type="number"
                value={payMin}
                onChange={(event) => setPayMin(event.target.value)}
                className="mt-1 w-32 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="payMax" className="block text-sm font-medium text-foreground">
                To
              </label>
              <input
                id="payMax"
                type="number"
                value={payMax}
                onChange={(event) => setPayMax(event.target.value)}
                className="mt-1 w-32 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="payPeriod" className="block text-sm font-medium text-foreground">
                Per
              </label>
              <select
                id="payPeriod"
                value={payPeriod}
                onChange={(event) => setPayPeriod(event.target.value as MhdPayPeriod)}
                className="mt-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {MHD_PAY_PERIODS.map((value) => (
                  <option key={value} value={value}>
                    {value === 'HOURLY' ? 'Hour' : 'Year'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* The statutory standard is what the employer expects to pay, not a
              market figure — so this field is a decision, not a lookup. */}
          <p className="text-xs text-muted-foreground">
            Record what you reasonably expect to pay on hire. Benchmark data can inform this, but it
            is not a substitute for it.
          </p>
          {payError ? <p className="text-xs text-rose-600">{payError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsEditingPay(false)}>
              Cancel
            </Button>
            <Button disabled={setPay.isPending} onClick={() => void savePay()}>
              {setPay.isPending ? 'Saving…' : 'Save range'}
            </Button>
          </div>
        </MhdCard>
      ) : null}

      {draftId ? (
        <MhdCard>
          <h2 className="mb-4 text-base font-semibold text-foreground">Draft description</h2>
          <MhdJobDescriptionEditor
            companyId={companyId}
            descriptionId={draftId}
            initialSummary={published.data?.summary ?? ''}
            initialFunctions={[
              ...(published.data?.essentialFunctions ?? []).map((f) => ({
                functionText: f.text,
                isEssential: true,
              })),
              ...(published.data?.marginalFunctions ?? []).map((f) => ({
                functionText: f.text,
                isEssential: false,
              })),
            ]}
            initialQualifications={published.data?.qualifications ?? []}
            onPublished={() => setDraftId(null)}
            onCancel={() => setDraftId(null)}
          />
        </MhdCard>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Published description</h2>
            <Button disabled={createDraft.isPending} onClick={() => void startDraft()}>
              {createDraft.isPending
                ? 'Preparing…'
                : job.publishedDescriptionId
                  ? 'New version'
                  : 'Write description'}
            </Button>
          </div>

          {!previewPersonId ? (
            <p className="text-sm text-muted-foreground">
              Assign somebody to this job to preview its description as a review would resolve it.
            </p>
          ) : published.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : published.data ? (
            <>
              {published.data.summary ? (
                <p className="text-sm text-foreground">{published.data.summary}</p>
              ) : null}
              <MhdEssentialFunctionList
                essential={published.data.essentialFunctions}
                marginal={published.data.marginalFunctions}
                readOnly
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing published for this job yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
