import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdWizardOutputStep } from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdOnboardingHireContext,
  useMhdOnboardingPacketSuggestions,
  useMhdOnboardingRoster,
  useMhdStartOnboardingPacket,
} from '../Hook';
import type { MhdOnboardingPacketSuggestion, MhdOnboardingDocumentKey } from '../Types';
import { MHD_US_STATES } from '@/utils/mhdUsStates';
import { useMhdModuleComplianceReadiness } from '@/utils/useMhdModuleComplianceReadiness';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function displayDate(value: string | null | undefined): string {
  return value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Not set';
}

function contextValue(value: string | null | undefined): string {
  return value ?? '';
}

export function MhdOnboardingWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const readiness = useMhdModuleComplianceReadiness('ONBOARDING');
  const roster = useMhdOnboardingRoster(companyId || null);
  const startPacket = useMhdStartOnboardingPacket();

  const [personId, setPersonId] = useState(searchParams.get('personId') ?? '');
  const [stateOverride, setStateOverride] = useState<string | null>(null);
  const [employmentTypeOverride, setEmploymentTypeOverride] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<MhdOnboardingDocumentKey> | null>(
    null,
  );
  const [completion, setCompletion] = useState<{
    personId: string;
    displayName: string;
    addedCount: number;
    startedCount: number;
  } | null>(null);

  const person = personId || null;
  const context = useMhdOnboardingHireContext(person);
  const stateCode = stateOverride ?? contextValue(context.data?.stateCode);
  const employmentType = employmentTypeOverride ?? contextValue(context.data?.employmentType);
  const suggestions = useMhdOnboardingPacketSuggestions({
    personId: person,
    stateCode: stateCode || null,
    employmentType: employmentType || null,
  });
  const suggestionRows = useMemo(() => suggestions.data ?? [], [suggestions.data]);
  const defaultSelected = useMemo(
    () => new Set(suggestionRows.map((item) => item.documentKey)),
    [suggestionRows],
  );
  const chosenDocuments = selectedDocuments ?? defaultSelected;
  const selectedSuggestions = suggestionRows.filter((item) =>
    chosenDocuments.has(item.documentKey),
  );
  const selectedNewDocuments = selectedSuggestions.filter((item) => !item.alreadyStarted);
  const personName =
    roster.rows.find((row) => row.personId === personId)?.displayName ?? 'the new hire';

  function choosePerson(nextPersonId: string) {
    setPersonId(nextPersonId);
    setStateOverride(null);
    setEmploymentTypeOverride(null);
    setSelectedDocuments(null);
    setDueDate('');
    setCompletion(null);
  }

  function toggleDocument(item: MhdOnboardingPacketSuggestion) {
    if (item.alreadyStarted) return;
    setSelectedDocuments((current) => {
      const next = new Set(current ?? defaultSelected);
      if (next.has(item.documentKey)) next.delete(item.documentKey);
      else next.add(item.documentKey);
      return next;
    });
  }

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'person',
      title: 'Person & Start Details',
      description: 'Choose the new hire and confirm known details.',
      validate: () => (personId ? null : 'Choose an employee.'),
    },
    {
      id: 'documents',
      title: 'Packet Documents',
      description: 'Confirm the documents to add.',
      validate: () => (selectedSuggestions.length ? null : 'Choose at least one document.'),
    },
    {
      id: 'review',
      title: 'Review & Start',
      description: 'Review the packet before starting onboarding.',
    },
  ];

  const flow = useMhdWizardFlow({
    steps,
    isDirty: Boolean(personId),
    onSubmit: async () => {
      if (!selectedNewDocuments.length) {
        throw new Error('Every chosen document has already been started.');
      }
      await startPacket.mutateAsync({
        companyId,
        personId,
        documentKeys: selectedNewDocuments.map((item) => item.documentKey),
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00Z`).toISOString() : null,
      });
      setCompletion({
        personId,
        displayName: personName,
        addedCount: selectedNewDocuments.length,
        startedCount: selectedSuggestions.filter((item) => item.alreadyStarted).length,
      });
    },
  });

  function renderOfferContext() {
    if (context.isLoading)
      return <p className="text-sm text-muted-foreground">Loading accepted offer details…</p>;
    if (context.isError) {
      return (
        <p role="alert" className="text-sm text-rose-700">
          {context.error instanceof Error
            ? context.error.message
            : 'Unable to load the accepted offer details.'}
        </p>
      );
    }
    if (!context.data?.hasAcceptedOffer)
      return <p className="text-sm text-muted-foreground">No accepted offer on file.</p>;
    const fields = [
      ['Offer reference', context.data.offerReference],
      ['Start date', context.data.startDate ? displayDate(context.data.startDate) : null],
      ['Job title', context.data.jobTitle],
      ['Department', context.data.department],
      ['Location', context.data.location],
      ['Reporting manager', context.data.managerName],
      ['Employment type', context.data.employmentType],
    ] as const;
    return (
      <MhdCard className="space-y-2 bg-muted/40">
        <h3 className="font-semibold text-foreground">From the accepted offer</h3>
        {fields
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <p key={label} className="text-sm text-foreground">
              <span className="font-medium">{label}:</span> {value}
            </p>
          ))}
      </MhdCard>
    );
  }

  function renderDocuments() {
    if (suggestions.isLoading)
      return <p className="text-sm text-muted-foreground">Loading suggested packet documents…</p>;
    if (suggestions.isError) {
      return (
        <p role="alert" className="text-sm text-rose-700">
          {suggestions.error instanceof Error
            ? suggestions.error.message
            : 'Unable to load suggested packet documents.'}
        </p>
      );
    }
    if (!suggestionRows.length)
      return <p className="text-sm text-muted-foreground">No packet documents were suggested.</p>;
    return (
      <MhdFormFieldStack>
        {suggestionRows.map((item) => (
          <label
            key={item.documentKey}
            className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm"
          >
            <input
              type="checkbox"
              className="mt-0.5"
              checked={chosenDocuments.has(item.documentKey)}
              disabled={item.alreadyStarted}
              onChange={() => toggleDocument(item)}
            />
            <span>
              <span className="font-medium text-foreground">{item.label}</span>
              {item.alreadyStarted ? (
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">Already started</span>
              ) : null}
              {item.isRequired ? (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                  Required
                </span>
              ) : null}
              <span className="mt-1 block text-muted-foreground">{item.reason}</span>
              {item.isRequired ? (
                <span className="mt-1 block text-xs text-muted-foreground">
                  Required by default
                </span>
              ) : null}
            </span>
          </label>
        ))}
        <div>
          <label htmlFor="onboarding-due-date" className="block text-sm font-medium">
            Due date for new items
          </label>
          <MhdDateField
            id="onboarding-due-date"
            value={dueDate}
            onChange={setDueDate}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Applies only to documents this run starts; existing items keep their deadlines.
          </p>
        </div>
      </MhdFormFieldStack>
    );
  }

  function renderReview() {
    const required = selectedSuggestions.filter((item) => item.isRequired);
    const optional = selectedSuggestions.filter((item) => !item.isRequired);
    return (
      <MhdFormFieldStack>
        <p className="text-sm">
          <strong>Employee:</strong> {personName}
        </p>
        <p className="text-sm">
          <strong>Governing state:</strong> {stateCode || 'Not set'}
        </p>
        <p className="text-sm">
          <strong>Employment type:</strong> {employmentType || 'Not set'}
        </p>
        <p className="text-sm">
          <strong>Start date:</strong> {displayDate(context.data?.startDate)}
        </p>
        <div>
          <h3 className="font-medium">Required documents</h3>
          {required.length ? (
            required.map((item) => (
              <p key={item.documentKey} className="text-sm">
                {item.label}
                {item.alreadyStarted ? ' (already started)' : ''}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">None</p>
          )}
        </div>
        <div>
          <h3 className="font-medium">Optional documents</h3>
          {optional.length ? (
            optional.map((item) => (
              <p key={item.documentKey} className="text-sm">
                {item.label}
                {item.alreadyStarted ? ' (already started)' : ''}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">None</p>
          )}
        </div>
        <p className="text-sm">
          <strong>Due date:</strong> {displayDate(dueDate)}
        </p>
        <p className="text-sm">
          <strong>Already started:</strong>{' '}
          {selectedSuggestions.filter((item) => item.alreadyStarted).length}
        </p>
      </MhdFormFieldStack>
    );
  }

  function renderStep() {
    switch (flow.currentStep?.id) {
      case 'person':
        return (
          <MhdFormFieldStack>
            <label htmlFor="onboarding-employee" className="block text-sm font-medium">
              Employee
              <select
                id="onboarding-employee"
                className={`mt-1 ${inputClass}`}
                value={personId}
                onChange={(event) => choosePerson(event.target.value)}
              >
                <option value="">Choose an employee</option>
                {roster.rows.map((row) => (
                  <option key={row.personId} value={row.personId}>
                    {row.displayName}
                    {row.isStarted ? ' (started)' : ''}
                  </option>
                ))}
              </select>
            </label>
            {personId ? renderOfferContext() : null}
            {personId ? (
              <>
                <label htmlFor="onboarding-state" className="block text-sm font-medium">
                  Governing state
                  <select
                    id="onboarding-state"
                    className={`mt-1 ${inputClass}`}
                    value={stateCode}
                    onChange={(event) => setStateOverride(event.target.value)}
                  >
                    <option value="">Choose a state</option>
                    {MHD_US_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="onboarding-employment-type" className="block text-sm font-medium">
                  Employment type
                  <input
                    id="onboarding-employment-type"
                    className={`mt-1 ${inputClass}`}
                    value={employmentType}
                    onChange={(event) => setEmploymentTypeOverride(event.target.value)}
                  />
                </label>
              </>
            ) : null}
          </MhdFormFieldStack>
        );
      case 'documents':
        return renderDocuments();
      default:
        return renderReview();
    }
  }

  const completionPanel = completion ? (
    <div className="space-y-4">
      <MhdCard>
        <h2 className="text-lg font-semibold text-foreground">Onboarding Started</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {completion.addedCount === 1
            ? '1 document was'
            : `${completion.addedCount} documents were`}{' '}
          added to {completion.displayName}&apos;s packet.
        </p>
        {completion.startedCount ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {completion.startedCount === 1
              ? '1 chosen document was'
              : `${completion.startedCount} chosen documents were`}{' '}
            already started.
          </p>
        ) : null}
        <div className="mt-4">
          <Button onClick={() => navigate(`/onboarding/${completion.personId}`)}>
            Open Checklist
          </Button>
        </div>
      </MhdCard>
      <MhdWizardOutputStep
        companyId={companyId}
        sourceWizard="ONBOARDING"
        templateKey="ONBOARDING_WELCOME_PACKET"
        entityType="ONBOARDING_PACKET"
        entityId={completion.personId}
        recordLabel="welcome letter"
      />
    </div>
  ) : undefined;

  return (
    <MhdWizardShell
      title="Guided onboarding"
      description="Choose the new hire, review what is known from the accepted offer, confirm the packet documents and start onboarding."
      backTo="/onboarding"
      backLabel="Onboarding"
      cancelTo="/onboarding"
      gateBanner={<MhdComplianceGateBanner readiness={readiness.data} />}
      flow={flow}
      completion={completionPanel}
    >
      {renderStep()}
    </MhdWizardShell>
  );
}

export default MhdOnboardingWizard;
