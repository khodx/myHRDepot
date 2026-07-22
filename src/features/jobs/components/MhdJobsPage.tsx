import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mhdCanMutateJobs, mhdCanSeeJobPay } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCreateJob, useMhdJobs } from '../Hook';
import {
  MHD_EMPLOYMENT_TYPES,
  MHD_FLSA_CLASSIFICATIONS,
  MHD_INDUSTRIES,
  mhdFormatEmploymentType,
  mhdFormatFlsa,
  mhdFormatIndustry,
  mhdFormatPayRange,
  type MhdEmploymentType,
  type MhdFlsaClassification,
  type MhdIndustry,
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
  const navigate = useNavigate();
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
  const [newSafety, setNewSafety] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobs = useMhdJobs(companyId, search || null, activeOnly);
  const createJob = useMhdCreateJob();

  if (!companyId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading jobs…</p>
      </div>
    );
  }

  if (!isPrivileged) {
    return (
      <div className="p-6">
        <p className="text-sm text-neutral-600">
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
      isSafetySensitive: newSafety,
    });
    setIsCreating(false);
    setNewTitle('');
    setNewSafety(false);
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Job descriptions</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Roles, their descriptions, and the competency library they draw from.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/jobs/competencies"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            Competency library
          </Link>
          <button
            type="button"
            onClick={() => setIsCreating((previous) => !previous)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50"
          >
            {isCreating ? 'Cancel' : 'New job'}
          </button>
        </div>
      </header>

      {isCreating ? (
        <div className="space-y-3 rounded-md border border-neutral-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="newTitle" className="block text-sm font-medium text-neutral-700">
                Job title
              </label>
              <input
                id="newTitle"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="newFlsa" className="block text-sm font-medium text-neutral-700">
                FLSA classification
              </label>
              <select
                id="newFlsa"
                value={newFlsa}
                onChange={(event) => setNewFlsa(event.target.value as MhdFlsaClassification | '')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
              <label htmlFor="newType" className="block text-sm font-medium text-neutral-700">
                Employment type
              </label>
              <select
                id="newType"
                value={newType}
                onChange={(event) => setNewType(event.target.value as MhdEmploymentType)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                {MHD_EMPLOYMENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatEmploymentType(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="newIndustry" className="block text-sm font-medium text-neutral-700">
                Industry
              </label>
              <select
                id="newIndustry"
                value={newIndustry}
                onChange={(event) => setNewIndustry(event.target.value as MhdIndustry)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                {MHD_INDUSTRIES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatIndustry(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
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
          <p className="text-xs text-neutral-500">
            Safety-sensitive designation is a property of the role and follows it across
            description versions.
          </p>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={createJob.isPending}
              onClick={() => void submitNew()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50 disabled:opacity-50"
            >
              {createJob.isPending ? 'Creating…' : 'Create job'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search title or code…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          Active only
        </label>
      </div>

      {jobs.isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (jobs.data ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">No jobs match.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Classification</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 text-right font-medium">Incumbents</th>
                {canSeePay ? <th className="py-2 pr-4 font-medium">Pay range</th> : null}
                <th className="py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {(jobs.data ?? []).map((job) => (
                <tr
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className={`cursor-pointer border-b border-neutral-100 ${
                    job.isActive ? 'text-neutral-800' : 'text-neutral-400'
                  }`}
                >
                  <td className="py-2 pr-4">
                    <span className="font-medium">{job.jobTitle}</span>
                    {job.jobCode ? (
                      <span className="ml-2 text-xs text-neutral-500">{job.jobCode}</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-4">
                    <MhdFlsaBadge
                      flsaClassification={job.flsaClassification}
                      isSafetySensitive={job.isSafetySensitive}
                    />
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {mhdFormatEmploymentType(job.employmentType)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{job.incumbentCount}</td>
                  {canSeePay ? (
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {mhdFormatPayRange(job) ?? <span className="text-neutral-400">—</span>}
                    </td>
                  ) : null}
                  <td className="py-2">
                    {job.publishedDescriptionId ? (
                      <span className="text-xs text-emerald-700">Published</span>
                    ) : (
                      <span className="text-xs text-amber-700">None published</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
