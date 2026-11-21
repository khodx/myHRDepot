import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import { mhdAccommodationsIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAccommodationPeople,
  useMhdAccommodationReadiness,
  useMhdAccommodationRequestDetails,
  useMhdCreateAccommodation,
} from '../Hook';
import {
  mhdAccommodationRequestDetailsSchema,
  mhdAccommodationRequestSchema,
  prohibitedMedicalDetail,
} from '../Schemas';
import {
  MHD_ACCOMMODATION_LIMITATION_DURATIONS,
  MHD_ACCOMMODATION_REQUEST_CHANNELS,
  MHD_ACCOMMODATION_REQUEST_SOURCES,
  mhdFormatAccommodationValue,
  type MhdAccommodationLimitationDuration,
  type MhdAccommodationRequestChannel,
  type MhdAccommodationRequestSource,
} from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const STEPS: MhdStep[] = [
  { id: 'person', title: 'Person', description: 'Who the request is for.' },
  { id: 'origin', title: 'How It Arrived', description: 'Source and channel of the request.' },
  { id: 'request', title: 'Request', description: 'The workplace change or assistance requested.' },
  {
    id: 'details',
    title: 'Request Details',
    description: "Duration, workers' compensation and leave.",
  },
];

const PROHIBITED_DETAIL_MESSAGE =
  'Do not enter a diagnosis, causation statement, genetic information, or medical record.';

function YesNoRadios({
  name,
  legend,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} checked={value} onChange={() => onChange(true)} />
          Yes
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={name} checked={!value} onChange={() => onChange(false)} />
          No
        </label>
      </div>
    </fieldset>
  );
}

/**
 * `/accommodations/new` — guided intake that opens a reasonable-accommodation
 * process. Same create RPC and request schema the list page's inline form used
 * (that form now links here instead of duplicating it).
 *
 * A request may be verbal, representative-made, observed, or triggered by leave
 * exhaustion / return-to-work, and no form or special wording is a prerequisite;
 * the wizard only records how it arrived. It never collects a diagnosis, cause,
 * genetic information, or medical record — the schema rejects that language.
 * Privileged roles pick the subject person; everyone else opens a request for
 * their own person record (the server re-checks this regardless).
 */
export function MhdAccommodationIntakeWizard() {
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const selfPersonId = profile?.personId ?? null;
  const isPrivileged = mhdAccommodationsIsPrivileged(roles);

  const [stepIndex, setStepIndex] = useState(0);
  const [personId, setPersonId] = useState('');
  const [requestSource, setRequestSource] = useState<MhdAccommodationRequestSource>('SELF');
  const [requestChannel, setRequestChannel] = useState<MhdAccommodationRequestChannel>('VERBAL');
  const [requestSummary, setRequestSummary] = useState('');
  const [limitationDuration, setLimitationDuration] = useState<
    MhdAccommodationLimitationDuration | ''
  >('');
  const [workersCompClaim, setWorkersCompClaim] = useState(false);
  const [leaveRequested, setLeaveRequested] = useState(false);
  const [leaveRequestDetails, setLeaveRequestDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openedCaseId, setOpenedCaseId] = useState<string | null>(null);

  const people = useMhdAccommodationPeople(isPrivileged ? companyId || null : null);
  const readiness = useMhdAccommodationReadiness();
  const createCase = useMhdCreateAccommodation();
  // The case id exists only after creation. The mutation input carries it; the hook's id is used
  // solely to invalidate that case's cached detail, which does not exist before the case does.
  const saveRequestDetails = useMhdAccommodationRequestDetails(openedCaseId ?? '');

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person) => ({
        id: person.id,
        name: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  const subjectPersonId = isPrivileged ? personId : (selfPersonId ?? '');

  function validateCurrentStep(): boolean {
    if (STEPS[stepIndex].id === 'person') {
      if (!subjectPersonId) {
        setError(
          isPrivileged
            ? 'Choose a person.'
            : 'Your account is not linked to a person record, so a request cannot be opened.',
        );
        return false;
      }
    }
    if (STEPS[stepIndex].id === 'request') {
      const parsed = mhdAccommodationRequestSchema.safeParse({
        personId: subjectPersonId,
        requestSource,
        requestChannel,
        requestedAt: new Date().toISOString(),
        requestSummary,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Review the request details.');
        return false;
      }
    }
    if (STEPS[stepIndex].id === 'details') {
      const message = detailsStepError();
      if (message) {
        setError(message);
        return false;
      }
    }
    setError(null);
    return true;
  }

  /**
   * The Section A answers before the case exists. The full schema needs the case id, so it runs
   * after creation; here the step applies the two rules that do not depend on it, including the
   * shared prohibited-medical-detail screen on the free-text answer.
   */
  function detailsStepError(): string | null {
    if (leaveRequested && !leaveRequestDetails.trim()) {
      return 'Say what leave was requested and when.';
    }
    if (prohibitedMedicalDetail.test(leaveRequestDetails)) {
      return PROHIBITED_DETAIL_MESSAGE;
    }
    return null;
  }

  async function handleSubmit() {
    const requestedAt = new Date().toISOString();
    const parsed = mhdAccommodationRequestSchema.safeParse({
      personId: subjectPersonId,
      requestSource,
      requestChannel,
      requestedAt,
      requestSummary,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the request details.');
      return;
    }
    const detailsMessage = detailsStepError();
    if (detailsMessage) {
      setError(detailsMessage);
      return;
    }
    setError(null);
    let created: { id: string; referenceId: string };
    try {
      created = await createCase.mutateAsync({
        companyId,
        personId: parsed.data.personId,
        requestSource: parsed.data.requestSource,
        requestChannel: parsed.data.requestChannel,
        requestedAt,
        requestSummary: parsed.data.requestSummary,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be opened.');
      return;
    }
    setOpenedCaseId(created.id);

    try {
      const details = mhdAccommodationRequestDetailsSchema.safeParse({
        caseId: created.id,
        limitationDuration: limitationDuration || null,
        workersCompClaim,
        leaveRequested,
        leaveRequestDetails: leaveRequested ? leaveRequestDetails.trim() || null : null,
      });
      if (!details.success) {
        throw new Error(details.error.issues[0]?.message ?? 'Review the request details.');
      }
      await saveRequestDetails.mutateAsync({
        caseId: created.id,
        limitationDuration: details.data.limitationDuration ?? null,
        workersCompClaim: details.data.workersCompClaim,
        leaveRequested: details.data.leaveRequested,
        leaveRequestDetails: details.data.leaveRequestDetails ?? null,
      });
    } catch (caught) {
      // The case exists, so say so plainly and let the person finish Section A on the case page.
      const reason = caught instanceof Error ? caught.message : 'the save failed';
      setError(
        `Request ${created.referenceId} was opened, but its request details were not saved: ${reason}. Open the request to complete them.`,
      );
      return;
    }
    navigate(`/accommodations/${created.id}`);
  }

  function renderStep() {
    switch (STEPS[stepIndex].id) {
      case 'person':
        return isPrivileged ? (
          <label className="block text-sm font-medium">
            Person
            <select
              className={`mt-1 ${inputClass}`}
              value={personId}
              onChange={(event) => setPersonId(event.target.value)}
            >
              <option value="">Choose…</option>
              {peopleOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-muted-foreground">
            This request will be opened for you. You will be able to follow it from Reasonable
            Accommodations.
          </p>
        );
      case 'origin':
        return (
          <MhdFormFieldStack>
            <label className="text-sm font-medium">
              How the need came to us
              <select
                className={`mt-1 ${inputClass}`}
                value={requestSource}
                onChange={(event) =>
                  setRequestSource(event.target.value as MhdAccommodationRequestSource)
                }
              >
                {MHD_ACCOMMODATION_REQUEST_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Channel
              <select
                className={`mt-1 ${inputClass}`}
                value={requestChannel}
                onChange={(event) =>
                  setRequestChannel(event.target.value as MhdAccommodationRequestChannel)
                }
              >
                {MHD_ACCOMMODATION_REQUEST_CHANNELS.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
            </label>
          </MhdFormFieldStack>
        );
      case 'details':
        return (
          <MhdFormFieldStack>
            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">Limitation</legend>
              <div className="flex flex-wrap gap-4 text-sm">
                {MHD_ACCOMMODATION_LIMITATION_DURATIONS.map((value) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mhd-intake-limitation"
                      checked={limitationDuration === value}
                      onChange={() => setLimitationDuration(value)}
                    />
                    {mhdFormatAccommodationValue(value)}
                  </label>
                ))}
              </div>
            </fieldset>
            <YesNoRadios
              name="mhd-intake-workers-comp"
              legend="Workers' Compensation Claim"
              value={workersCompClaim}
              onChange={setWorkersCompClaim}
            />
            <YesNoRadios
              name="mhd-intake-leave"
              legend="Leave Requested"
              value={leaveRequested}
              onChange={(next) => {
                setLeaveRequested(next);
                if (!next) setLeaveRequestDetails('');
              }}
            />
            {leaveRequested ? (
              <label className="block text-sm font-medium">
                Leave Request Details
                <textarea
                  className={`mt-1 min-h-16 ${inputClass}`}
                  value={leaveRequestDetails}
                  onChange={(event) => setLeaveRequestDetails(event.target.value)}
                  placeholder="What leave was requested, and for which dates"
                />
              </label>
            ) : null}
          </MhdFormFieldStack>
        );
      default:
        return (
          <label className="block text-sm font-medium">
            Requested workplace change or assistance
            <textarea
              className={`mt-1 min-h-24 ${inputClass}`}
              value={requestSummary}
              onChange={(event) => setRequestSummary(event.target.value)}
              placeholder="Describe the requested adjustment and work-related need. Do not enter a diagnosis."
            />
          </label>
        );
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Guided accommodation intake"
        description="A request may be verbal and does not require this form or any special words. Record the workplace change or assistance requested—never a diagnosis or medical history."
        backTo="/accommodations"
        backLabel="Reasonable Accommodations"
      />
      <MhdComplianceGateBanner readiness={readiness.data} />

      <MhdStepper
        steps={STEPS}
        currentStepIndex={stepIndex}
        onNavigate={setStepIndex}
        validateCurrentStep={validateCurrentStep}
        onSubmit={() => void handleSubmit()}
        isSubmitting={createCase.isPending || saveRequestDetails.isPending}
      />

      <MhdCard>
        <h2 className="text-lg font-semibold text-foreground">{STEPS[stepIndex].title}</h2>
        <div className="mt-4">{renderStep()}</div>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {openedCaseId && error ? (
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => navigate(`/accommodations/${openedCaseId}`)}
          >
            Open Request
          </Button>
        ) : null}
      </MhdCard>

      <div>
        <Button variant="secondary" onClick={() => navigate('/accommodations')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default MhdAccommodationIntakeWizard;
