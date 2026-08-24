import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mhdCanMutateJobs, mhdCanSeeJobPay } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdPaginationSummary, MhdPaginationControls, useMhdPagination } from '@/components/ui/MhdPagination';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { cn } from '@/utils/cn';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCreateJob, useMhdJobs } from '../Hook';
import {
  MHD_EMPLOYMENT_TYPES,
  MHD_FLSA_CLASSIFICATIONS,
  MHD_CA_WAGE_ORDER_CLASSIFICATIONS,
  MHD_INDUSTRIES,
  mhdFormatEmploymentType,
  mhdFormatFlsa,
  mhdFormatCaWageOrderClassification,
  mhdFormatIndustry,
  mhdFormatPayRange,
  type MhdEmploymentType,
  type MhdFlsaClassification,
  type MhdIndustry,
  type MhdCaWageOrderClassification,
} from '../Types';
import { MhdFlsaBadge } from './MhdFlsaBadge';

/**
 * `/jobs` route entry. Privileged only (Platform Admin / HR Partner /
 * Client Admin) — the router guard excludes everyone else, and an employee
 * reaches `/my-job` instead, a SEPARATE route rather than a filtered version of
 * this one, so this list never has to be correct for two audiences.
 *
 * Reads auth itself (companyId, roles) rather than taking presentational props;
 * `canSeePay` is narrower than the privilege that admits the route — Platform
 * Admin / HR Partner only — and the server masks pay to everyone else.
 */
export function MhdJobsPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const isPrivileged = mhdCanMutateJobs(roles);
  const canSeePay = mhdCanSeeJobPay(roles);

  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFlsa, setNewFlsa] = useState<MhdFlsaClassification | ''>('');
  const [newType, setNewType] = useState<MhdEmploymentType>('FULL_TIME');
  const [newIndustry, setNewIndustry] = useState<MhdIndustry>('GENERAL');
  const [newOnetSocCode, setNewOnetSocCode] = useState('');
  const [newCaWageOrderClassification, setNewCaWageOrderClassification] =
    useState<MhdCaWageOrderClassification | ''>('');
  const [newSafety, setNewSafety] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobs = useMhdJobs(companyId, search || null, activeOnly);
  const createJob = useMhdCreateJob();
  const jobsData = jobs.data ?? [];
  const pagination = useMhdPagination(jobsData.length, {
    resetKey: `${jobsData.length}:${jobsData[0]?.id ?? ''}`,
  });

  if (!companyId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading jobs…</p>
      </div>
    );
  }

  if (!isPrivileged) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Job administration is not available to your role.
        </p>
      </div>
    );
  }

  async function submitNew() {
    if (!newTitle.trim()) {
      setError('A job needs a title.');
      return;
    }
    setError(null);
    await createJob.mutateAsync({
      companyId: companyId!,
      jobTitle: newTitle.trim(),
      flsaClassification: newFlsa || null,
      employmentType: newType,
      industry: newIndustry,
      onetSocCode: newOnetSocCode,
      caWageOrderClassification: newCaWageOrderClassification || null,
      isSafetySensitive: newSafety,
    });
    setIsCreating(false);
    setNewTitle('');
    setNewSafety(false);
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Job descriptions"
        description="Roles, their descriptions, and the competency library they draw from."
        actions={
          <>
            <Link
              to="/jobs/competencies"
              className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200"
            >
              Competency library
            </Link>
            <Link
              to="/jobs/disclaimers"
              className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200"
            >
              Disclaimers
            </Link>
            <Link
              to="/jobs/new"
              className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200"
            >
              Guided setup
            </Link>
            <Button onClick={() => setIsCreating((previous) => !previous)}>
              {isCreating ? 'Cancel' : 'New job'}
            </Button>
          </>
        }
      />

      {isCreating ? (
        <MhdCard className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="newTitle" className="block text-sm font-medium text-foreground">
                Job title
              </label>
              <input
                id="newTitle"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="newFlsa" className="block text-sm font-medium text-foreground">
                FLSA classification
              </label>
              <select
                id="newFlsa"
                value={newFlsa}
                onChange={(event) => setNewFlsa(event.target.value as MhdFlsaClassification | '')}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">Not yet classified</option>
                {MHD_FLSA_CLASSIFICATIONS.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatFlsa(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="newType" className="block text-sm font-medium text-foreground">
                Employment type
              </label>
              <select
                id="newType"
                value={newType}
                onChange={(event) => setNewType(event.target.value as MhdEmploymentType)}
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
              <label htmlFor="newIndustry" className="block text-sm font-medium text-foreground">
                Industry
              </label>
              <select
                id="newIndustry"
                value={newIndustry}
                onChange={(event) => setNewIndustry(event.target.value as MhdIndustry)}
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
              <label htmlFor="newOnetSocCode" className="block text-sm font-medium text-foreground">
                O*NET-SOC Code
              </label>
              <input
                id="newOnetSocCode"
                type="text"
                placeholder="e.g. 53-3032.00"
                value={newOnetSocCode}
                onChange={(event) => setNewOnetSocCode(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="newCaWageOrderClassification" className="block text-sm font-medium text-foreground">
                CA Wage Order Classification
              </label>
              <select
                id="newCaWageOrderClassification"
                value={newCaWageOrderClassification}
                onChange={(event) =>
                  setNewCaWageOrderClassification(
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
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={newSafety}
              onChange={(event) => setNewSafety(event.target.checked)}
            />
            Safety-sensitive role
          </label>
          {/* Not decoration: the designation carries regulatory weight in
              transportation and healthcare and governs how the role is treated
              regardless of how its duties are currently worded. */}
          <p className="text-xs text-muted-foreground">
            Safety-sensitive designation is a property of the role and follows it across description
            versions.
          </p>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <div className="flex justify-end">
            <Button disabled={createJob.isPending} onClick={() => void submitNew()}>
              {createJob.isPending ? 'Creating…' : 'Create job'}
            </Button>
          </div>
        </MhdCard>
      ) : null}

      <MhdFilterBar>
        <MhdFilterInput
          label="Search"
          placeholder="Search title or code"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex h-10 items-center gap-2 self-end rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          Active only
        </label>
      </MhdFilterBar>

      {jobs.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : jobsData.length === 0 ? (
        <p className="text-sm text-muted-foreground">No jobs match.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Title</MhdTh>
                <MhdTh>Classification</MhdTh>
                <MhdTh>Type</MhdTh>
                <MhdTh className="text-right">Incumbents</MhdTh>
                {canSeePay ? <MhdTh>Pay range</MhdTh> : null}
                <MhdTh>Description</MhdTh>
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {pagination.sliceItems(jobsData).map((job) => (
                <MhdTr
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className={cn(!job.isActive && 'opacity-60')}
                >
                  <MhdTd>
                    <span className="font-medium">{job.jobTitle}</span>
                    {job.jobCode ? (
                      <span className="ml-2 text-xs text-muted-foreground">{job.jobCode}</span>
                    ) : null}
                  </MhdTd>
                  <MhdTd>
                    <MhdFlsaBadge
                      flsaClassification={job.flsaClassification}
                      isSafetySensitive={job.isSafetySensitive}
                    />
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap">
                    {mhdFormatEmploymentType(job.employmentType)}
                  </MhdTd>
                  <MhdTd className="text-right tabular-nums">{job.incumbentCount}</MhdTd>
                  {canSeePay ? (
                    <MhdTd className="whitespace-nowrap">
                      {mhdFormatPayRange(job) ?? <span className="text-muted-foreground">—</span>}
                    </MhdTd>
                  ) : null}
                  <MhdTd>
                    {job.publishedDescriptionId ? (
                      <MhdBadge variant="success">Published</MhdBadge>
                    ) : (
                      <MhdBadge variant="warning" hideIcon>
                        None published
                      </MhdBadge>
                    )}
                  </MhdTd>
                  <MhdTableActions
                    viewTo={`/jobs/${job.id}`}
                    editTo={isPrivileged ? `/jobs/${job.id}` : undefined}
                  />
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter summary={mhdPaginationSummary(pagination, jobsData.length, 'jobs')}>
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
        </MhdCard>
      )}
    </div>
  );
}
