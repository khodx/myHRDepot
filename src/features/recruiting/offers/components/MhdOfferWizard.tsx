import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import {
  MhdWizardOutputStep,
  type MhdWizardOutputOutcome,
} from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { mhdCanIssueOfferDocuments } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCreateOffer, useMhdExtendOffer, useMhdOfferSalaryCheck } from '../Hook';
import { mhdOfferService } from '../Service';
import {
  MHD_OFFER_PAY_FREQUENCIES,
  MHD_OFFER_PAY_FREQUENCY_LABELS,
  type MhdOfferPayFrequency,
} from '../Types';
import {
  useMhdRecruitingApplication,
  useMhdRecruitingPeople,
  useMhdRecruitingRequisitions,
} from '../../requisitions/Hook';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function dateLabel(value: string): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : 'Not set';
}

function today(): string {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function money(value: number | null): string {
  return value == null
    ? 'Not available'
    : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

export function MhdOfferWizard() {
  const navigate = useNavigate();
  const { appId } = useParams<{ appId: string }>();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const application = useMhdRecruitingApplication(appId ?? null);
  const requisitions = useMhdRecruitingRequisitions({ companyId, status: 'ALL' });
  const people = useMhdRecruitingPeople(companyId);
  const createOffer = useMhdCreateOffer();
  const extendOffer = useMhdExtendOffer();

  const requisition = useMemo(
    () => (requisitions.data ?? []).find((item) => item.id === application.data?.requisitionId),
    [application.data?.requisitionId, requisitions.data],
  );
  const peopleOptions = useMemo(
    () => (people.data ?? []).map((person) => ({ id: person.id, name: person.displayName })),
    [people.data],
  );

  const [jobTitleOverride, setJobTitleOverride] = useState<string | null>(null);
  const [employmentTypeOverride, setEmploymentTypeOverride] = useState<string | null>(null);
  const [managerOverride, setManagerOverride] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [payFrequency, setPayFrequency] = useState<MhdOfferPayFrequency | ''>('');
  const [salaryOverrideReason, setSalaryOverrideReason] = useState('');
  const [offerExpirationDate, setOfferExpirationDate] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [created, setCreated] = useState<{ id: string; referenceId: string } | null>(null);
  const [output, setOutput] = useState<MhdWizardOutputOutcome | null>(null);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [extended, setExtended] = useState(false);

  const jobTitle =
    jobTitleOverride ?? requisition?.title ?? application.data?.requisitionTitle ?? '';
  const employmentType = employmentTypeOverride ?? requisition?.employmentType ?? '';
  const reportingManagerPersonId = managerOverride ?? requisition?.hiringManagerPersonId ?? '';
  const salaryNumber = baseSalary.trim() ? Number(baseSalary) : null;
  const salaryCheckInput =
    salaryNumber != null && Number.isFinite(salaryNumber) && payFrequency
      ? {
          applicationId: appId ?? '',
          baseSalary: salaryNumber,
          payFrequency,
          asOf: startDate || null,
        }
      : null;
  const salaryCheck = useMhdOfferSalaryCheck(salaryCheckInput);
  const blocking = salaryCheck.data?.blocking ?? [];
  const payFrequencyLabel = payFrequency ? MHD_OFFER_PAY_FREQUENCY_LABELS[payFrequency] : 'Not set';

  const expirationError =
    offerExpirationDate &&
    (offerExpirationDate < today() || Boolean(startDate && offerExpirationDate < startDate));

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'role',
      title: 'Candidate & Role',
      description: 'Confirm the candidate and role details.',
      validate: () => (jobTitle.trim() ? null : 'A job title is required.'),
    },
    {
      id: 'compensation',
      title: 'Compensation',
      description: 'Enter pay and review the job check.',
      validate: () =>
        blocking.length && !salaryOverrideReason.trim()
          ? 'Record why to proceed, or correct the pay.'
          : null,
    },
    {
      id: 'terms',
      title: 'Terms',
      description: 'Set the expiration and approval terms.',
      validate: () =>
        expirationError ? 'The expiration date cannot be before today or the start date.' : null,
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review the offer before creating the draft.',
    },
  ];

  const flow = useMhdWizardFlow({
    steps,
    isDirty: Boolean(
      baseSalary || startDate || offerExpirationDate || salaryOverrideReason || requiresApproval,
    ),
    onSubmit: async () => {
      const result = await createOffer.mutateAsync({
        applicationId: appId ?? '',
        jobTitle: jobTitle.trim(),
        startDate: startDate || null,
        baseSalary: salaryNumber,
        payFrequency: payFrequency || null,
        employmentType: employmentType || null,
        reportingManagerPersonId: reportingManagerPersonId || null,
        offerExpirationDate: offerExpirationDate || null,
        requiresApproval,
        salaryOverrideReason: blocking.length ? salaryOverrideReason.trim() || null : null,
      });
      setCreated({ id: result.id, referenceId: result.referenceId });
    },
  });

  async function extend(documentGenerationId: string | null, esignatureRequestId: string | null) {
    if (!created) return;
    setExtendError(null);
    try {
      await extendOffer.mutateAsync({
        offerId: created.id,
        documentGenerationId,
        esignatureRequestId,
      });
      setExtended(true);
    } catch (error: unknown) {
      setExtendError(error instanceof Error ? error.message : 'Unable to extend the offer.');
    }
  }

  if (application.isLoading) return <p>Loading application…</p>;
  if (!application.data) {
    return (
      <div className="space-y-3">
        <p role="alert">Application not found.</p>
        <Link className="text-sm text-accent underline" to="/recruiting">
          Back to Recruiting
        </Link>
      </div>
    );
  }
  const applicant = application.data;

  function renderStep() {
    switch (flow.currentStep?.id) {
      case 'role':
        return (
          <MhdFormFieldStack>
            <p className="text-sm">
              <strong>Candidate:</strong> {applicant.personDisplayName}
            </p>
            <p className="text-sm">
              <strong>Requisition:</strong> {applicant.requisitionTitle}
            </p>
            <label className="block text-sm font-medium">
              Job title
              <input
                className={`mt-1 ${inputClass}`}
                value={jobTitle}
                onChange={(event) => setJobTitleOverride(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Employment type
              <input
                className={`mt-1 ${inputClass}`}
                value={employmentType}
                onChange={(event) => setEmploymentTypeOverride(event.target.value)}
              />
            </label>
            <div>
              <label htmlFor="offer-start-date" className="block text-sm font-medium">
                Start date
              </label>
              <MhdDateField id="offer-start-date" value={startDate} onChange={setStartDate} />
            </div>
            <label className="block text-sm font-medium">
              Reporting manager
              <select
                className={`mt-1 ${inputClass}`}
                value={reportingManagerPersonId}
                onChange={(event) => setManagerOverride(event.target.value)}
              >
                <option value="">Not set</option>
                {peopleOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
          </MhdFormFieldStack>
        );
      case 'compensation':
        return (
          <MhdFormFieldStack>
            <label className="block text-sm font-medium">
              Base pay
              <input
                className={`mt-1 ${inputClass}`}
                type="number"
                min="0"
                step="0.01"
                value={baseSalary}
                onChange={(event) => setBaseSalary(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Pay frequency
              <select
                className={`mt-1 ${inputClass}`}
                value={payFrequency}
                onChange={(event) =>
                  setPayFrequency(event.target.value as MhdOfferPayFrequency | '')
                }
              >
                <option value="">Not set</option>
                {MHD_OFFER_PAY_FREQUENCIES.map((value) => (
                  <option key={value} value={value}>
                    {MHD_OFFER_PAY_FREQUENCY_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            {!baseSalary.trim() ? (
              <p className="text-sm text-muted-foreground">
                No pay entered, so the pay will not be checked.
              </p>
            ) : null}
            {salaryCheck.isLoading ? (
              <p className="text-sm text-muted-foreground">Checking pay…</p>
            ) : null}
            {salaryCheck.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                {salaryCheck.error instanceof Error
                  ? salaryCheck.error.message
                  : 'Unable to check the offered pay.'}
              </p>
            ) : null}
            {salaryCheck.data ? (
              <>
                <p className="text-sm">
                  Annualized pay: {money(salaryCheck.data.annualizedPay)}
                  {salaryCheck.data.annualizationBasis === 'FULL_TIME_2080_HOURS'
                    ? ' (based on a full-time 2,080-hour year)'
                    : ''}
                </p>
                <p className="text-sm">
                  FLSA status: {salaryCheck.data.flsaClassification ?? 'Not set'}
                </p>
                {salaryCheck.data.advisory.map((finding) => (
                  <div
                    key={finding.code}
                    role="status"
                    className="rounded-md border border-border bg-muted p-3 text-sm"
                  >
                    {finding.message}
                  </div>
                ))}
                {blocking.map((finding) => (
                  <div
                    key={finding.code}
                    role="alert"
                    className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm"
                  >
                    {finding.message}
                  </div>
                ))}
              </>
            ) : null}
            {blocking.length ? (
              <label className="block text-sm font-medium">
                Why to proceed despite the pay check
                <textarea
                  className={`mt-1 min-h-20 ${inputClass}`}
                  value={salaryOverrideReason}
                  onChange={(event) => setSalaryOverrideReason(event.target.value)}
                />
              </label>
            ) : null}
          </MhdFormFieldStack>
        );
      case 'terms':
        return (
          <MhdFormFieldStack>
            <div>
              <label htmlFor="offer-expiration-date" className="block text-sm font-medium">
                Offer expiration date
              </label>
              <MhdDateField
                id="offer-expiration-date"
                value={offerExpirationDate}
                onChange={setOfferExpirationDate}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(event) => setRequiresApproval(event.target.checked)}
              />
              Requires approval
            </label>
          </MhdFormFieldStack>
        );
      default:
        return (
          <MhdFormFieldStack>
            <p className="text-sm">
              <strong>Candidate:</strong> {applicant.personDisplayName}
            </p>
            <p className="text-sm">
              <strong>Title:</strong> {jobTitle}
            </p>
            <p className="text-sm">
              <strong>Type:</strong> {employmentType || 'Not set'}
            </p>
            <p className="text-sm">
              <strong>Start date:</strong> {dateLabel(startDate)}
            </p>
            <p className="text-sm">
              <strong>Manager:</strong>{' '}
              {peopleOptions.find((person) => person.id === reportingManagerPersonId)?.name ??
                'Not set'}
            </p>
            <p className="text-sm">
              <strong>Pay:</strong>{' '}
              {salaryNumber == null ? 'Not set' : `${money(salaryNumber)} — ${payFrequencyLabel}`}
            </p>
            <p className="text-sm">
              <strong>Pay check:</strong>{' '}
              {salaryCheck.data?.blocking.length
                ? 'Blocking findings recorded'
                : salaryCheck.data
                  ? 'No blocking findings'
                  : 'Not checked'}
              {salaryOverrideReason.trim() ? ` — ${salaryOverrideReason.trim()}` : ''}
            </p>
            <p className="text-sm">
              <strong>Expiration:</strong> {dateLabel(offerExpirationDate)}
            </p>
            <p className="text-sm">
              <strong>Approval:</strong> {requiresApproval ? 'Required' : 'Not required'}
            </p>
          </MhdFormFieldStack>
        );
    }
  }

  const completion = created ? (
    <div className="space-y-4">
      <MhdCard>
        <h2 className="text-lg font-semibold">Offer Created</h2>
        <p className="mt-2 text-sm">Reference: {created.referenceId}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The offer is a draft. Extend it to send it to the candidate.
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate(`/recruiting/applications/${appId}/offer`)}>
            Open Offer
          </Button>
        </div>
      </MhdCard>
      <MhdCard className="space-y-3">
        <h2 className="text-lg font-semibold">Letter &amp; Signature</h2>
        {mhdCanIssueOfferDocuments(roles) ? (
          <MhdWizardOutputStep
            companyId={companyId}
            sourceWizard="OFFER"
            templateKey="OFFER_LETTER"
            entityType="RECRUITING_OFFER"
            entityId={created.id}
            recordLabel="offer letter"
            signing={{
              createRequest: (generated) =>
                mhdOfferService.requestCandidateSignature({
                  companyId,
                  personId: applicant.personId,
                  generationId: generated.generationId,
                  documentHash: generated.documentHash,
                }),
            }}
            onResolved={setOutput}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Your role cannot generate the offer letter.
          </p>
        )}
        {output?.outcome === 'GENERATED' ? (
          <Button
            disabled={extended || extendOffer.isPending}
            onClick={() => void extend(output.generationId, output.esignatureRequestId)}
          >
            Extend Offer To Candidate
          </Button>
        ) : null}
        <Button
          variant="secondary"
          disabled={extended || extendOffer.isPending}
          onClick={() => void extend(null, null)}
        >
          Extend Without A Letter
        </Button>
        <p className="text-sm text-muted-foreground">
          The candidate will receive no signed letter.
        </p>
        {extendError ? (
          <p role="alert" className="text-sm text-rose-700">
            {extendError}
          </p>
        ) : null}
        {extended ? (
          <p role="status" className="text-sm">
            The offer was extended to the candidate.
          </p>
        ) : null}
      </MhdCard>
    </div>
  ) : undefined;

  return (
    <MhdWizardShell
      title="Guided offer"
      description="Confirm the role, enter the pay, set the terms and create the offer. Pay is checked against the job before the offer is created."
      backTo={`/recruiting/applications/${appId}/offer`}
      backLabel="Offer"
      cancelTo={`/recruiting/applications/${appId}/offer`}
      flow={flow}
      completion={completion}
    >
      {renderStep()}
    </MhdWizardShell>
  );
}

export default MhdOfferWizard;
