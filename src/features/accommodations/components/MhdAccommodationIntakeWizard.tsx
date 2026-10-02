import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdWizardOutputStep } from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { mhdAccommodationsIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';
import {
  useMhdAccommodationPeople,
  useMhdAccommodationReadiness,
  useMhdCreateAccommodation,
} from '../Hook';
import { mhdAccommodationRequestSchema } from '../Schemas';
import {
  MHD_ACCOMMODATION_REQUEST_CHANNELS,
  MHD_ACCOMMODATION_REQUEST_SOURCES,
  mhdFormatAccommodationValue,
  type MhdAccommodationRequestChannel,
  type MhdAccommodationRequestSource,
} from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

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
 *
 * Once the case is open, a privileged person is offered the request
 * acknowledgment document (generate now, save for later, or skip). A person
 * opening their own request goes straight to the case.
 */
export function MhdAccommodationIntakeWizard() {
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const selfPersonId = profile?.personId ?? null;
  const isPrivileged = mhdAccommodationsIsPrivileged(roles);

  const [personId, setPersonId] = useState('');
  const [requestSource, setRequestSource] = useState<MhdAccommodationRequestSource>('SELF');
  const [requestChannel, setRequestChannel] = useState<MhdAccommodationRequestChannel>('VERBAL');
  const [requestSummary, setRequestSummary] = useState('');
  const [openedCaseId, setOpenedCaseId] = useState<string | null>(null);

  const people = useMhdAccommodationPeople(isPrivileged ? companyId || null : null);
  const readiness = useMhdAccommodationReadiness();
  const createCase = useMhdCreateAccommodation();

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person) => ({
        id: person.id,
        name: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  const subjectPersonId = isPrivileged ? personId : (selfPersonId ?? '');

  function parseRequest(requestedAt: string) {
    return mhdAccommodationRequestSchema.safeParse({
      personId: subjectPersonId,
      requestSource,
      requestChannel,
      requestedAt,
      requestSummary,
    });
  }

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'person',
      title: 'Person',
      description: 'Who the request is for.',
      validate: () => {
        if (subjectPersonId) return null;
        return isPrivileged
          ? 'Choose a person.'
          : 'Your account is not linked to a person record, so a request cannot be opened.';
      },
    },
    { id: 'origin', title: 'How It Arrived', description: 'Source and channel of the request.' },
    {
      id: 'request',
      title: 'Request',
      description: 'The workplace change or assistance requested.',
      validate: () => {
        const parsed = parseRequest(new Date().toISOString());
        return parsed.success
          ? null
          : (parsed.error.issues[0]?.message ?? 'Review the request details.');
      },
    },
  ];

  const flow = useMhdWizardFlow({
    steps,
    isDirty: Boolean(personId) || requestSummary.trim().length > 0,
    onSubmit: async () => {
      const requestedAt = new Date().toISOString();
      const parsed = parseRequest(requestedAt);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Review the request details.');
      }
      const result = await createCase.mutateAsync({
        companyId,
        personId: parsed.data.personId,
        requestSource: parsed.data.requestSource,
        requestChannel: parsed.data.requestChannel,
        requestedAt,
        requestSummary: parsed.data.requestSummary,
      });
      if (isPrivileged) {
        setOpenedCaseId(result.id);
        return;
      }
      navigate(`/accommodations/${result.id}`);
    },
  });

  function renderStep() {
    switch (flow.currentStep?.id) {
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

  const completion = openedCaseId ? (
    <div className="space-y-4">
      <MhdCard>
        <h2 className="text-lg font-semibold text-foreground">Accommodation Request Opened</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The request is recorded and the interactive process can begin.
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate(`/accommodations/${openedCaseId}`)}>Open Case</Button>
        </div>
      </MhdCard>
      <MhdWizardOutputStep
        companyId={companyId}
        sourceWizard="ACCOMMODATION_INTAKE"
        templateKey="ACCOMMODATION_CASE_OPENING"
        entityType="ACCOMMODATION_CASE"
        entityId={openedCaseId}
        recordLabel="accommodation request"
      />
    </div>
  ) : undefined;

  return (
    <MhdWizardShell
      title="Guided accommodation intake"
      description="A request may be verbal and does not require this form or any special words. Record the workplace change or assistance requested—never a diagnosis or medical history."
      backTo="/accommodations"
      backLabel="Reasonable Accommodations"
      flow={flow}
      gateBanner={<MhdComplianceGateBanner readiness={readiness.data} />}
      cancelTo="/accommodations"
      completion={completion}
    >
      {renderStep()}
    </MhdWizardShell>
  );
}

export default MhdAccommodationIntakeWizard;
