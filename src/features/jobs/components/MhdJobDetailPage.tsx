import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mhdCanSeeJobPay } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateDescriptionDraft,
  useMhdJobs,
  useMhdPublishedJobForPerson,
  useMhdSetPayRange,
} from '../Hook';
import {
  MHD_PAY_PERIODS,
  mhdFormatEmploymentType,
  mhdFormatIndustry,
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
  const previewPersonId: string | null = null;

  const [draftId, setDraftId] = useState<string | null>(null);
  const [isEditingPay, setIsEditingPay] = useState(false);
  const [payMin, setPayMin] = useState('');
  const [payMax, setPayMax] = useState('');
  const [payPeriod, setPayPeriod] = useState<MhdPayPeriod>('ANNUAL');
  const [payError, setPayError] = useState<string | null>(null);

  const jobs = useMhdJobs(companyId, null, false);
  const job = (jobs.data ?? []).find((candidate) => candidate.id === jobId) ?? null;

  const published = useMhdPublishedJobForPerson(previewPersonId);
  const createDraft = useMhdCreateDescriptionDraft(companyId);
  const setPay = useMhdSetPayRange();

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

  if (!companyId || jobs.isLoading) {
    return <p className="p-6 text-sm text-neutral-500">Loading…</p>;
  }
  if (!job) return <p className="p-6 text-sm text-neutral-500">Job not found.</p>;

  return (
    <div className="space-y-6 p-6">
      <button
        type="button"
        onClick={() => navigate('/jobs')}
        className="text-sm text-neutral-500 underline"
      >
        ← All jobs
      </button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{job.jobTitle}</h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            {job.referenceId}
            {job.jobCode ? ` · ${job.jobCode}` : ''} · {mhdFormatEmploymentType(job.employmentType)}{' '}
            · {mhdFormatIndustry(job.industry)}
          </p>
          <div className="mt-2">
            <MhdFlsaBadge
              flsaClassification={job.flsaClassification}
              isSafetySensitive={job.isSafetySensitive}
            />
          </div>
        </div>
        <MhdPayRangeField
          job={job}
          canSeePay={canSeePay}
          onEdit={canSeePay ? () => setIsEditingPay(true) : undefined}
        />
      </header>

      {isEditingPay && canSeePay ? (
        <div className="space-y-3 rounded-md border border-neutral-200 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="payMin" className="block text-sm font-medium text-neutral-700">
                From
              </label>
              <input
                id="payMin"
                type="number"
                value={payMin}
                onChange={(event) => setPayMin(event.target.value)}
                className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="payMax" className="block text-sm font-medium text-neutral-700">
                To
              </label>
              <input
                id="payMax"
                type="number"
                value={payMax}
                onChange={(event) => setPayMax(event.target.value)}
                className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="payPeriod" className="block text-sm font-medium text-neutral-700">
                Per
              </label>
              <select
                id="payPeriod"
                value={payPeriod}
                onChange={(event) => setPayPeriod(event.target.value as MhdPayPeriod)}
                className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
          <p className="text-xs text-neutral-500">
            Record what you reasonably expect to pay on hire. Benchmark data can inform this, but it
            is not a substitute for it.
          </p>
          {payError ? <p className="text-xs text-rose-600">{payError}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingPay(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={setPay.isPending}
              onClick={() => void savePay()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {setPay.isPending ? 'Saving…' : 'Save range'}
            </button>
          </div>
        </div>
      ) : null}

      {draftId ? (
        <section className="rounded-md border border-neutral-200 p-4">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Draft description</h2>
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
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">Published description</h2>
            <button
              type="button"
              disabled={createDraft.isPending}
              onClick={() => void startDraft()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {createDraft.isPending ? 'Preparing…' : job.publishedDescriptionId ? 'New version' : 'Write description'}
            </button>
          </div>

          {!previewPersonId ? (
            <p className="text-sm text-neutral-500">
              Assign somebody to this job to preview its description as a review would resolve it.
            </p>
          ) : published.isLoading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : published.data ? (
            <>
              {published.data.summary ? (
                <p className="text-sm text-neutral-800">{published.data.summary}</p>
              ) : null}
              <MhdEssentialFunctionList
                essential={published.data.essentialFunctions}
                marginal={published.data.marginalFunctions}
                readOnly
              />
            </>
          ) : (
            <p className="text-sm text-neutral-500">Nothing published for this job yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
