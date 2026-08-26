import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  useMhdCertifyOshaAnnualSummary,
  useMhdGenerateOshaAnnualSummary,
  useMhdOshaAnnualSummaries,
  useMhdOshaAnnualSummary,
  useMhdQueueOshaItaSubmission,
} from '../Hook';
import { mhdOshaAnnualSummaryCertifySchema } from '../Schemas';
import type { MhdOshaAnnualSummary } from '../Types';

const CURRENT_YEAR = new Date().getFullYear();

type MhdOshaAnnualSummaryNumericField = {
  [K in keyof MhdOshaAnnualSummary]: MhdOshaAnnualSummary[K] extends number ? K : never;
}[keyof MhdOshaAnnualSummary];

const SUMMARY_FIELDS: Array<{ key: MhdOshaAnnualSummaryNumericField; label: string }> = [
  { key: 'totalDeaths', label: 'Deaths' },
  { key: 'totalDaysAwayCases', label: 'Cases with days away from work' },
  { key: 'totalJobTransferRestrictionCases', label: 'Cases with job transfer or restriction' },
  { key: 'totalOtherRecordableCases', label: 'Other recordable cases' },
  { key: 'totalDaysAwayCount', label: 'Total days away from work' },
  { key: 'totalDaysRestrictedCount', label: 'Total days of job transfer or restriction' },
  { key: 'totalInjuries', label: 'Injuries' },
  { key: 'totalSkinDisorders', label: 'Skin disorders' },
  { key: 'totalRespiratoryConditions', label: 'Respiratory conditions' },
  { key: 'totalPoisonings', label: 'Poisonings' },
  { key: 'totalHearingLossCases', label: 'Hearing loss cases' },
  { key: 'totalOtherIllnesses', label: 'All other illnesses' },
];

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * The Form 300A view: computed aggregates, "Regenerate from current
 * incidents" while DRAFT, certify (wired to the real E-Signature Engine
 * contract server-side, see mhd_osha_annual_summary_certify), and queue for
 * ITA submission once CERTIFIED.
 */
export function MhdOshaAnnualSummaryPage() {
  const { establishmentId } = useParams<{ establishmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const calendarYear = Number(searchParams.get('year')) || CURRENT_YEAR;

  const summaries = useMhdOshaAnnualSummaries(establishmentId ?? null);
  const currentSummary = useMemo(
    () => (summaries.data ?? []).find((summary) => summary.calendarYear === calendarYear) ?? null,
    [summaries.data, calendarYear],
  );
  const summary = useMhdOshaAnnualSummary(currentSummary?.id ?? null);

  const generate = useMhdGenerateOshaAnnualSummary();
  const certify = useMhdCertifyOshaAnnualSummary();
  const queueSubmission = useMhdQueueOshaItaSubmission();

  const [certifyingOfficialName, setCertifyingOfficialName] = useState('');
  const [certifyingOfficialTitle, setCertifyingOfficialTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [queuedSubmissionId, setQueuedSubmissionId] = useState<string | null>(null);

  const totals = summary.data;

  async function handleGenerate() {
    if (!establishmentId) return;
    await generate.mutateAsync({ establishmentId, calendarYear });
  }

  async function handleCertify() {
    if (!totals) return;
    const parsed = mhdOshaAnnualSummaryCertifySchema.safeParse({
      certifyingOfficialName,
      certifyingOfficialTitle,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Enter the certifying official.');
      return;
    }
    setFormError(null);
    await certify.mutateAsync({
      summaryId: totals.id,
      certifyingOfficialName: parsed.data.certifyingOfficialName,
      certifyingOfficialTitle: parsed.data.certifyingOfficialTitle,
    });
  }

  async function handleQueueSubmission() {
    if (!totals) return;
    const queueId = await queueSubmission.mutateAsync(totals.id);
    setQueuedSubmissionId(queueId);
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={`Form 300A — ${calendarYear}`}
        description="Annual summary of work-related injuries and illnesses, certified by a company official."
        actions={
          <Button variant="secondary" onClick={() => navigate(-1)} className="h-9 px-3 text-[16.8px]">
            Back
          </Button>
        }
      />

      {!totals ? (
        <MhdCard className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No {calendarYear} summary has been generated yet for this establishment.
          </p>
          <div className="flex justify-end">
            <Button disabled={generate.isPending} onClick={() => void handleGenerate()}>
              {generate.isPending ? 'Generating…' : 'Generate from current incidents'}
            </Button>
          </div>
        </MhdCard>
      ) : (
        <>
          <MhdCard className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Status: {totals.status}</h2>
              {totals.status === 'DRAFT' ? (
                <Button
                  variant="secondary"
                  disabled={generate.isPending}
                  onClick={() => void handleGenerate()}
                >
                  {generate.isPending ? 'Regenerating…' : 'Regenerate from current incidents'}
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {SUMMARY_FIELDS.map((field) => (
                <div key={field.key} className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="text-lg font-semibold text-foreground">{totals[field.key]}</p>
                </div>
              ))}
            </div>
          </MhdCard>

          {totals.status === 'DRAFT' ? (
            <MhdCard className="space-y-4">
              <h2 className="font-semibold text-foreground">Certify this summary</h2>
              <p className="text-sm text-muted-foreground">
                29 CFR 1904.32(b)(4) requires a company executive to certify that they have
                examined the Form 300 log and reasonably believe the annual summary is accurate.
                Certifying locks every underlying incident from further edits.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium">
                  Certifying official name
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={certifyingOfficialName}
                    onChange={(event) => setCertifyingOfficialName(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium">
                  Certifying official title
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={certifyingOfficialTitle}
                    onChange={(event) => setCertifyingOfficialTitle(event.target.value)}
                  />
                </label>
              </div>
              {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}
              <div className="flex justify-end">
                <Button disabled={certify.isPending} onClick={() => void handleCertify()}>
                  {certify.isPending ? 'Certifying…' : 'Certify Form 300A'}
                </Button>
              </div>
            </MhdCard>
          ) : null}

          {totals.status === 'CERTIFIED' ? (
            <MhdCard className="space-y-4">
              <h2 className="font-semibold text-foreground">Submit to OSHA's Injury Tracking Application</h2>
              <p className="text-sm text-muted-foreground">
                Certified by {totals.certifyingOfficialName} ({totals.certifyingOfficialTitle}) on{' '}
                {totals.certifiedAt}. Queuing builds the ITA-shaped payload; a scheduled function
                validates it and, once ITA API credentials are provisioned, submits it.
              </p>
              <div className="flex justify-end">
                <Button
                  disabled={queueSubmission.isPending}
                  onClick={() => void handleQueueSubmission()}
                >
                  {queueSubmission.isPending ? 'Queuing…' : 'Queue ITA Submission'}
                </Button>
              </div>
            </MhdCard>
          ) : null}

          {totals.status === 'SUBMITTED_TO_ITA' || queuedSubmissionId ? (
            <MhdCard>
              <p className="text-sm text-foreground">
                This summary has been queued for ITA submission
                {queuedSubmissionId ? ` (queue id ${queuedSubmissionId})` : ''}.
              </p>
            </MhdCard>
          ) : null}
        </>
      )}
    </div>
  );
}
