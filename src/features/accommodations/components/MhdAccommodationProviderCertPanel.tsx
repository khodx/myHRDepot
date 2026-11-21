import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { useMhdAccommodationProviderCertificationReveal } from '../Hook';
import { mhdAccommodationProviderCertificationSchema } from '../Schemas';
import {
  MHD_ACCOMMODATION_LIMITATION_DURATIONS,
  mhdFormatAccommodationValue,
  type MhdAccommodationLimitationDuration,
  type MhdAccommodationProviderCertification,
  type MhdAccommodationProviderCertificationInput,
  type MhdAccommodationProviderCertificationReveal,
} from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

type ProviderField =
  | 'providerName'
  | 'certifiedAt'
  | 'limitationDuration'
  | 'limitationEndDate'
  | 'accommodationBeginOn'
  | 'accommodationEndOn'
  | 'recommendation'
  | 'jobDutyStatementSentAt';

interface MhdAccommodationProviderCertPanelProps {
  caseId: string;
  certification: MhdAccommodationProviderCertification | null;
  onSave: (input: MhdAccommodationProviderCertificationInput) => Promise<unknown>;
  isPending: boolean;
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Section B — the provider's certification. The parent renders this ONLY for medical roles
 * (mhdAccommodationsCanSeeMedical); for anyone else it is absent from the DOM. The bundle carries
 * status and dates only; the provider's name and the recommendation come back solely from the
 * audited reveal RPC, which runs only when the operator clicks the reveal button.
 */
export function MhdAccommodationProviderCertPanel({
  caseId,
  certification,
  onSave,
  isPending,
}: MhdAccommodationProviderCertPanelProps) {
  const reveal = useMhdAccommodationProviderCertificationReveal();
  const resetReveal = reveal.reset;
  const [revealed, setRevealed] = useState<MhdAccommodationProviderCertificationReveal | null>(
    null,
  );
  const [providerName, setProviderName] = useState('');
  const [certifiedAt, setCertifiedAt] = useState(certification?.certified_at ?? '');
  const [disabilityVerified, setDisabilityVerified] = useState(
    certification?.disability_verified ?? false,
  );
  const [limitationDuration, setLimitationDuration] = useState<
    MhdAccommodationLimitationDuration | ''
  >(certification?.limitation_duration ?? '');
  const [limitationEndDate, setLimitationEndDate] = useState(
    certification?.limitation_end_date ?? '',
  );
  const [accommodationBeginOn, setAccommodationBeginOn] = useState(
    certification?.accommodation_begin_on ?? '',
  );
  const [accommodationEndOn, setAccommodationEndOn] = useState(
    certification?.accommodation_end_on ?? '',
  );
  const [accommodationContinuous, setAccommodationContinuous] = useState(
    certification?.accommodation_continuous ?? false,
  );
  const [recommendation, setRecommendation] = useState('');
  const [jobDutyStatementSentAt, setJobDutyStatementSentAt] = useState(
    certification?.job_duty_statement_sent_at ?? '',
  );
  const [errors, setErrors] = useState<Partial<Record<ProviderField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // The revealed strings live only in this component; leaving the panel discards them.
  useEffect(() => () => resetReveal(), [resetReveal]);

  async function handleReveal() {
    if (!certification) return;
    setFormError(null);
    try {
      const result = await reveal.mutateAsync(certification.id);
      setRevealed(result);
      setProviderName(result.provider_name ?? '');
      setRecommendation(result.recommendation ?? '');
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'The record could not be revealed.');
    }
  }

  async function handleSave() {
    setFormError(null);
    const draft = {
      caseId,
      providerName: providerName.trim() || null,
      certifiedAt: certifiedAt || null,
      disabilityVerified,
      limitationDuration: limitationDuration || null,
      limitationEndDate: limitationEndDate || null,
      accommodationBeginOn: accommodationBeginOn || null,
      accommodationEndOn: accommodationEndOn || null,
      accommodationContinuous,
      recommendation: recommendation.trim() || null,
      jobDutyStatementSentAt: jobDutyStatementSentAt || null,
    };
    const parsed = mhdAccommodationProviderCertificationSchema.safeParse(draft);
    const nextErrors: Partial<Record<ProviderField, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as ProviderField;
        nextErrors[field] = nextErrors[field] ?? issue.message;
      }
    }
    // mhd_accommodation_provider_certification_record replaces both encrypted values on every
    // save, so a blank field would erase what is on file. Require the operator to reveal (which
    // fills them in) or re-enter them first.
    if (certification?.has_provider_name && !draft.providerName) {
      nextErrors.providerName =
        'A provider name is on file. Reveal or re-enter it before saving, or saving will erase it.';
    }
    if (certification?.has_recommendation && !draft.recommendation) {
      nextErrors.recommendation =
        'A recommendation is on file. Reveal or re-enter it before saving, or saving will erase it.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      await onSave(draft);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'The certification was not saved.');
    }
  }

  function fieldError(field: ProviderField) {
    return errors[field] ? <p className="mt-1 text-xs text-rose-700">{errors[field]}</p> : null;
  }

  const canReveal = Boolean(
    certification && (certification.has_provider_name || certification.has_recommendation),
  );

  return (
    <MhdCard className="space-y-4">
      <MhdCardHeader title="Provider Certification" />
      <p className="text-xs text-muted-foreground">
        Restricted to medical administrators. The provider&apos;s name and recommendation are
        encrypted at rest, and every reveal is audited.
      </p>
      {formError ? (
        <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{formError}</p>
      ) : null}

      {certification ? (
        <div className="grid gap-3 md:grid-cols-2">
          <MhdDetailField
            label="Job-Duty Statement Sent"
            value={certification.job_duty_statement_sent_at}
          />
          <MhdDetailField label="Certified" value={certification.certified_at} />
          <MhdDetailField
            label="Disability Verified"
            value={yesNo(certification.disability_verified)}
          />
          <MhdDetailField
            label="Duration"
            value={
              certification.limitation_duration
                ? mhdFormatAccommodationValue(certification.limitation_duration)
                : null
            }
          />
          <MhdDetailField label="Limitation Ends" value={certification.limitation_end_date} />
          <MhdDetailField
            label="Accommodation Begins"
            value={certification.accommodation_begin_on}
          />
          <MhdDetailField label="Accommodation Ends" value={certification.accommodation_end_on} />
          <MhdDetailField
            label="Continuous"
            value={yesNo(certification.accommodation_continuous)}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No provider certification is recorded yet.</p>
      )}

      {canReveal ? (
        <div className="space-y-2">
          <Button
            variant="secondary"
            disabled={reveal.isPending}
            onClick={() => void handleReveal()}
          >
            Reveal Provider And Recommendation
          </Button>
          {revealed ? (
            <dl className="space-y-2 rounded-md bg-muted p-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Provider
                </dt>
                <dd>{revealed.provider_name ?? 'Not recorded'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recommendation
                </dt>
                <dd>{revealed.recommendation ?? 'Not recorded'}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3 border-t border-border pt-4">
        <MhdCardHeader title="Record Provider Certification" />
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-provider-job-duty-sent">
              Job-Duty Statement Sent On
            </label>
            <MhdDateField
              id="mhd-provider-job-duty-sent"
              className={`mt-1 ${inputClass}`}
              value={jobDutyStatementSentAt}
              onChange={setJobDutyStatementSentAt}
            />
            {fieldError('jobDutyStatementSentAt')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-provider-name">
              Provider Name
            </label>
            <input
              id="mhd-provider-name"
              className={`mt-1 ${inputClass}`}
              value={providerName}
              onChange={(event) => setProviderName(event.target.value)}
            />
            {fieldError('providerName')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-provider-certified-at">
              Certified On
            </label>
            <MhdDateField
              id="mhd-provider-certified-at"
              className={`mt-1 ${inputClass}`}
              value={certifiedAt}
              onChange={setCertifiedAt}
            />
            {fieldError('certifiedAt')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-provider-duration">
              Duration
            </label>
            <select
              id="mhd-provider-duration"
              className={`mt-1 ${inputClass}`}
              value={limitationDuration}
              onChange={(event) => {
                const next = event.target.value as MhdAccommodationLimitationDuration | '';
                setLimitationDuration(next);
                if (next !== 'TEMPORARY') setLimitationEndDate('');
              }}
            >
              <option value="">Not Recorded</option>
              {MHD_ACCOMMODATION_LIMITATION_DURATIONS.map((value) => (
                <option key={value} value={value}>
                  {mhdFormatAccommodationValue(value)}
                </option>
              ))}
            </select>
            {fieldError('limitationDuration')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-provider-limitation-end">
              Limitation End Date
            </label>
            <MhdDateField
              id="mhd-provider-limitation-end"
              className={`mt-1 ${inputClass}`}
              value={limitationEndDate}
              disabled={limitationDuration !== 'TEMPORARY'}
              onChange={setLimitationEndDate}
            />
            {fieldError('limitationEndDate')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-provider-begin">
              Accommodation Begins On
            </label>
            <MhdDateField
              id="mhd-provider-begin"
              className={`mt-1 ${inputClass}`}
              value={accommodationBeginOn}
              onChange={setAccommodationBeginOn}
            />
            {fieldError('accommodationBeginOn')}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-provider-end">
              Accommodation Ends On
            </label>
            <MhdDateField
              id="mhd-provider-end"
              className={`mt-1 ${inputClass}`}
              value={accommodationEndOn}
              disabled={accommodationContinuous}
              onChange={setAccommodationEndOn}
            />
            {fieldError('accommodationEndOn')}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={disabilityVerified}
            onChange={(event) => setDisabilityVerified(event.target.checked)}
          />
          Disability Verified
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={accommodationContinuous}
            onChange={(event) => {
              setAccommodationContinuous(event.target.checked);
              if (event.target.checked) setAccommodationEndOn('');
            }}
          />
          Accommodation Is Continuous
        </label>
        <div>
          <label className="block text-sm font-medium" htmlFor="mhd-provider-recommendation">
            Recommendation
          </label>
          <p id="mhd-provider-recommendation-help" className="text-xs text-muted-foreground">
            Do not enter a diagnosis, cause, genetic information, or medical records. Record the
            functional recommendation only.
          </p>
          <textarea
            id="mhd-provider-recommendation"
            aria-describedby="mhd-provider-recommendation-help"
            className={`mt-1 min-h-20 ${inputClass}`}
            value={recommendation}
            onChange={(event) => setRecommendation(event.target.value)}
          />
          {fieldError('recommendation')}
        </div>
        <Button disabled={isPending} onClick={() => void handleSave()}>
          {isPending ? 'Saving…' : 'Save Provider Certification'}
        </Button>
      </div>
    </MhdCard>
  );
}

export default MhdAccommodationProviderCertPanel;
