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
import { useMhdGrievance } from '@/features/grievances/Hook';
import {
  useMhdInvestigationConflicts,
  useMhdInvestigationPeople,
  useMhdInvestigationUsers,
  useMhdOpenInvestigationFromIntake,
} from '../Hook';
import {
  MHD_INVESTIGATION_CASE_TYPES,
  MHD_INVESTIGATION_CONFIDENTIALITIES,
  MHD_INVESTIGATION_INTERIM_MEASURE_TYPES,
  MHD_INVESTIGATION_PARTY_ROLES,
  MHD_INVESTIGATION_SOURCE_TYPES,
  mhdFormatInvestigationCaseType,
  mhdFormatInvestigationConfidentiality,
  mhdFormatInvestigationPartyRole,
  type MhdInvestigationCaseType,
  type MhdInvestigationConflict,
  type MhdInvestigationInterimMeasureType,
  type MhdInvestigationPartyRole,
  type MhdInvestigationSourceType,
  type MhdOpenInvestigationIntakeInput,
} from '../Types';
import { useMhdModuleComplianceReadiness } from '@/utils/useMhdModuleComplianceReadiness';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const INTERIM_MEASURE_LABELS: Record<MhdInvestigationInterimMeasureType, string> = {
  SEPARATION_OF_PARTIES: 'Separation of parties',
  SCHEDULE_CHANGE: 'Schedule change',
  PAID_ADMINISTRATIVE_LEAVE: 'Paid administrative leave',
  NO_CONTACT_DIRECTIVE: 'No-contact directive',
  OTHER: 'Other',
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
};

const SOURCE_LABELS: Record<MhdInvestigationSourceType, string> = {
  GRIEVANCE: 'Grievance',
  CONDUCT_CASE: 'Conduct case',
  SAFETY_INCIDENT: 'Safety incident',
};

interface PartyDraft {
  id: string;
  partyRole: MhdInvestigationPartyRole;
  personId: string;
  externalName: string;
  isConfidential: boolean;
  statement: string;
}

interface MeasureDraft {
  id: string;
  measureType: MhdInvestigationInterimMeasureType;
  description: string;
  effectiveFrom: string;
  reviewBy: string;
}

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function dateLabel(value: string): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : 'Not set';
}

function newParty(): PartyDraft {
  return {
    id: crypto.randomUUID(),
    partyRole: MHD_INVESTIGATION_PARTY_ROLES[0],
    personId: '',
    externalName: '',
    isConfidential: false,
    statement: '',
  };
}

function newMeasure(): MeasureDraft {
  return {
    id: crypto.randomUUID(),
    measureType: MHD_INVESTIGATION_INTERIM_MEASURE_TYPES[0],
    description: '',
    effectiveFrom: today(),
    reviewBy: '',
  };
}

function personName(people: Array<{ id: string; displayName: string }>, personId: string): string {
  return people.find((person) => person.id === personId)?.displayName ?? 'Unknown person';
}

export function MhdInvestigationIntakeWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const readiness = useMhdModuleComplianceReadiness('INVESTIGATIONS');
  const sourceTypeParam = searchParams.get('sourceType');
  const sourceIdParam = searchParams.get('sourceId')?.trim() ?? '';
  const sourceType = MHD_INVESTIGATION_SOURCE_TYPES.includes(
    sourceTypeParam as MhdInvestigationSourceType,
  )
    ? (sourceTypeParam as MhdInvestigationSourceType)
    : null;
  const sourceId = sourceType && sourceIdParam ? sourceIdParam : null;
  const grievance = useMhdGrievance(sourceType === 'GRIEVANCE' ? sourceId : null);
  const people = useMhdInvestigationPeople(companyId || null);
  const users = useMhdInvestigationUsers(companyId || null);
  const [caseTypeEdit, setCaseTypeEdit] = useState<MhdInvestigationCaseType | null>(null);
  const [allegationEdit, setAllegationEdit] = useState<string | null>(null);
  const [severity, setSeverity] = useState('');
  const [confidentiality, setConfidentiality] =
    useState<(typeof MHD_INVESTIGATION_CONFIDENTIALITIES)[number]>('STANDARD');
  const [parties, setParties] = useState<PartyDraft[]>([]);
  const [investigatorUserId, setInvestigatorUserId] = useState('');
  const [conflictAcknowledgment, setConflictAcknowledgment] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [measures, setMeasures] = useState<MeasureDraft[]>([]);
  const [openedCase, setOpenedCase] = useState<{ id: string; referenceId: string } | null>(null);
  const openInvestigation = useMhdOpenInvestigationFromIntake();

  const peopleList = people.data ?? [];
  const usersList = users.data ?? [];
  const grievanceAllegation = [
    grievance.data?.grievanceWhat,
    grievance.data?.disagreementExplanation,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join('\n\n');
  const caseType = caseTypeEdit ?? (sourceType === 'GRIEVANCE' ? 'GRIEVANCE' : 'OTHER');
  const allegation = allegationEdit ?? grievanceAllegation;
  const partyPersonIds = useMemo(
    () => parties.map((party) => party.personId).filter(Boolean),
    [parties],
  );
  const respondentPersonIds = useMemo(
    () =>
      parties
        .filter((party) => party.partyRole === 'RESPONDENT')
        .map((party) => party.personId)
        .filter(Boolean),
    [parties],
  );
  const conflicts = useMhdInvestigationConflicts({
    companyId: companyId || null,
    investigatorUserId: investigatorUserId || null,
    partyPersonIds,
    respondentPersonIds,
  });
  const findings = conflicts.data ?? [];
  const blockingFindings = findings.filter((finding) => finding.severity === 'BLOCKING');

  function updateParty(id: string, patch: Partial<PartyDraft>) {
    setParties((current) =>
      current.map((party) => (party.id === id ? { ...party, ...patch } : party)),
    );
  }

  function updateMeasure(id: string, patch: Partial<MeasureDraft>) {
    setMeasures((current) =>
      current.map((measure) => (measure.id === id ? { ...measure, ...patch } : measure)),
    );
  }

  function validateDateRange(): string | null {
    const currentDate = today();
    if (targetCompletionDate && targetCompletionDate < currentDate) {
      return 'The target date cannot be in the past.';
    }
    for (const measure of measures) {
      if (!measure.description.trim()) return 'Describe each interim measure.';
      if (measure.reviewBy && measure.reviewBy < measure.effectiveFrom) {
        return 'Review date cannot be before the effective date.';
      }
    }
    return null;
  }

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'intake',
      title: 'Intake',
      description: 'Record the concern and its handling level.',
      validate: () => (allegation.trim() ? null : 'Describe the concern.'),
    },
    {
      id: 'parties',
      title: 'Parties',
      description: 'Record the people or external parties involved.',
      validate: () => {
        const invalid = parties.find((party) => !party.personId && !party.externalName.trim());
        return invalid ? 'Each party needs a person or a name.' : null;
      },
    },
    {
      id: 'investigator',
      title: 'Investigator & Access',
      description: 'Choose an independent investigator and review access.',
      validate: () =>
        blockingFindings.length > 0 && !conflictAcknowledgment.trim()
          ? 'Record why this investigator should proceed, or choose someone else.'
          : null,
    },
    {
      id: 'deadlines',
      title: 'Deadlines & Interim Measures',
      description: 'Set the target date and any protective measures.',
      validate: validateDateRange,
    },
    {
      id: 'review',
      title: 'Review & Open',
      description: 'Confirm the intake before opening the investigation.',
    },
  ];

  const flow = useMhdWizardFlow({
    steps,
    isDirty:
      Boolean(allegation.trim()) ||
      parties.length > 0 ||
      Boolean(investigatorUserId) ||
      measures.length > 0,
    onSubmit: async () => {
      const input: MhdOpenInvestigationIntakeInput = {
        companyId,
        caseType,
        allegation: allegation.trim(),
        severity: severity || null,
        confidentiality,
        assignedInvestigatorUserId: investigatorUserId || null,
        parties: parties.map((party) => ({
          partyRole: party.partyRole,
          personId: party.personId || null,
          externalName: party.externalName.trim() || null,
          isConfidential: party.isConfidential,
          statement: party.statement.trim() || null,
        })),
        sourceType: sourceType && sourceId ? sourceType : null,
        sourceId: sourceType && sourceId ? sourceId : null,
        targetCompletionDate: targetCompletionDate || null,
        interimMeasures: measures.map((measure) => ({
          measureType: measure.measureType,
          description: measure.description.trim(),
          effectiveFrom: measure.effectiveFrom || null,
          reviewBy: measure.reviewBy || null,
        })),
        ...(blockingFindings.length > 0
          ? { conflictAcknowledgment: conflictAcknowledgment.trim() }
          : {}),
      };
      const result = await openInvestigation.mutateAsync(input);
      setOpenedCase(result);
    },
  });

  function renderConflicts() {
    if (!investigatorUserId) return null;
    if (conflicts.isLoading)
      return <p className="text-sm text-muted-foreground">Checking investigator independence…</p>;
    if (conflicts.isError) {
      return (
        <p className="text-sm text-rose-700">
          Unable to check the investigator&apos;s independence. You may continue.
        </p>
      );
    }
    if (!findings.length)
      return <p className="text-sm text-muted-foreground">No independence concerns found.</p>;
    return (
      <div className="space-y-3">
        {findings.map((finding: MhdInvestigationConflict) => (
          <div
            key={`${finding.code}-${finding.personId}`}
            className={`rounded-md border p-3 text-sm ${finding.severity === 'BLOCKING' ? 'border-amber-400 bg-amber-50 text-amber-950' : 'border-border bg-muted'}`}
            role={finding.severity === 'BLOCKING' ? 'alert' : 'status'}
          >
            <p className="font-medium">{finding.message}</p>
            <p>{personName(peopleList, finding.personId)}</p>
          </div>
        ))}
        {blockingFindings.length ? (
          <label className="block text-sm font-medium">
            Why this investigator should proceed
            <textarea
              className={`mt-1 min-h-24 ${inputClass}`}
              value={conflictAcknowledgment}
              onChange={(event) => setConflictAcknowledgment(event.target.value)}
            />
          </label>
        ) : null}
      </div>
    );
  }

  function renderStep() {
    switch (flow.currentStep?.id) {
      case 'intake':
        return (
          <MhdFormFieldStack>
            {sourceType && sourceId ? (
              <p className="text-sm text-muted-foreground">
                Prompted by: {SOURCE_LABELS[sourceType]}
              </p>
            ) : null}
            <label className="block text-sm font-medium">
              Case type
              <select
                className={`mt-1 ${inputClass}`}
                value={caseType}
                onChange={(event) =>
                  setCaseTypeEdit(event.target.value as MhdInvestigationCaseType)
                }
              >
                {MHD_INVESTIGATION_CASE_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatInvestigationCaseType(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Severity
              <select
                className={`mt-1 ${inputClass}`}
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
              >
                <option value="">Not Set</option>
                {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Confidentiality
              <select
                className={`mt-1 ${inputClass}`}
                value={confidentiality}
                onChange={(event) =>
                  setConfidentiality(event.target.value as typeof confidentiality)
                }
              >
                {MHD_INVESTIGATION_CONFIDENTIALITIES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatInvestigationConfidentiality(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Allegation / concern
              <textarea
                className={`mt-1 min-h-32 ${inputClass}`}
                value={allegation}
                onChange={(event) => setAllegationEdit(event.target.value)}
              />
            </label>
          </MhdFormFieldStack>
        );
      case 'parties':
        return (
          <MhdFormFieldStack>
            {!parties.length ? (
              <p className="text-sm text-muted-foreground">No parties added yet.</p>
            ) : null}
            {parties.map((party) => (
              <MhdCard key={party.id} className="space-y-4">
                <label className="block text-sm font-medium">
                  Role
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={party.partyRole}
                    onChange={(event) =>
                      updateParty(party.id, {
                        partyRole: event.target.value as MhdInvestigationPartyRole,
                      })
                    }
                  >
                    {MHD_INVESTIGATION_PARTY_ROLES.map((value) => (
                      <option key={value} value={value}>
                        {mhdFormatInvestigationPartyRole(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Person
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={party.personId}
                    onChange={(event) => updateParty(party.id, { personId: event.target.value })}
                  >
                    <option value="">External person</option>
                    {peopleList.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                {!party.personId ? (
                  <label className="block text-sm font-medium">
                    External name
                    <input
                      className={`mt-1 ${inputClass}`}
                      value={party.externalName}
                      onChange={(event) =>
                        updateParty(party.id, { externalName: event.target.value })
                      }
                    />
                  </label>
                ) : null}
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={party.isConfidential}
                    onChange={(event) =>
                      updateParty(party.id, { isConfidential: event.target.checked })
                    }
                  />
                  Keep this person&apos;s identity confidential
                </label>
                <label className="block text-sm font-medium">
                  Statement
                  <textarea
                    className={`mt-1 min-h-24 ${inputClass}`}
                    value={party.statement}
                    onChange={(event) => updateParty(party.id, { statement: event.target.value })}
                  />
                </label>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setParties((current) => current.filter((item) => item.id !== party.id))
                  }
                >
                  Remove
                </Button>
              </MhdCard>
            ))}
            <Button onClick={() => setParties((current) => [...current, newParty()])}>
              Add Party
            </Button>
          </MhdFormFieldStack>
        );
      case 'investigator':
        return (
          <MhdFormFieldStack>
            <label className="block text-sm font-medium">
              Investigator
              <select
                className={`mt-1 ${inputClass}`}
                value={investigatorUserId}
                onChange={(event) => setInvestigatorUserId(event.target.value)}
              >
                <option value="">Assign later</option>
                {usersList.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </label>
            {renderConflicts()}
            <p className="text-sm text-muted-foreground">
              The creator and the assigned investigator are granted access. Access is never widened
              automatically.
            </p>
          </MhdFormFieldStack>
        );
      case 'deadlines':
        return (
          <MhdFormFieldStack>
            <div>
              <label htmlFor="target-completion-date" className="block text-sm font-medium">
                Target completion date
              </label>
              <MhdDateField
                id="target-completion-date"
                value={targetCompletionDate}
                onChange={setTargetCompletionDate}
              />
            </div>
            {measures.map((measure) => (
              <MhdCard key={measure.id} className="space-y-4">
                <label className="block text-sm font-medium">
                  Type
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={measure.measureType}
                    onChange={(event) =>
                      updateMeasure(measure.id, {
                        measureType: event.target.value as MhdInvestigationInterimMeasureType,
                      })
                    }
                  >
                    {MHD_INVESTIGATION_INTERIM_MEASURE_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {INTERIM_MEASURE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Description
                  <textarea
                    className={`mt-1 min-h-24 ${inputClass}`}
                    value={measure.description}
                    onChange={(event) =>
                      updateMeasure(measure.id, { description: event.target.value })
                    }
                  />
                </label>
                <div>
                  <label htmlFor={`effective-${measure.id}`} className="block text-sm font-medium">
                    Effective from
                  </label>
                  <MhdDateField
                    id={`effective-${measure.id}`}
                    value={measure.effectiveFrom}
                    onChange={(value) => updateMeasure(measure.id, { effectiveFrom: value })}
                  />
                </div>
                <div>
                  <label htmlFor={`review-${measure.id}`} className="block text-sm font-medium">
                    Review by
                  </label>
                  <MhdDateField
                    id={`review-${measure.id}`}
                    value={measure.reviewBy}
                    onChange={(value) => updateMeasure(measure.id, { reviewBy: value })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  A task is created for the investigator on this date.
                </p>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setMeasures((current) => current.filter((item) => item.id !== measure.id))
                  }
                >
                  Remove
                </Button>
              </MhdCard>
            ))}
            <Button onClick={() => setMeasures((current) => [...current, newMeasure()])}>
              Add Interim Measure
            </Button>
          </MhdFormFieldStack>
        );
      default:
        return (
          <div className="space-y-3 text-sm">
            <p>
              <strong>Type:</strong> {mhdFormatInvestigationCaseType(caseType)}
            </p>
            <p>
              <strong>Severity:</strong> {SEVERITY_LABELS[severity] ?? 'Not Set'}
            </p>
            <p>
              <strong>Confidentiality:</strong>{' '}
              {mhdFormatInvestigationConfidentiality(confidentiality)}
            </p>
            <p>
              <strong>Source:</strong>{' '}
              {sourceType && sourceId ? `${SOURCE_LABELS[sourceType]} linked` : 'Direct intake'}
            </p>
            <p>
              <strong>Allegation:</strong> {allegation.slice(0, 240)}
            </p>
            <p>
              <strong>Parties:</strong>{' '}
              {parties.length
                ? parties
                    .map(
                      (party) =>
                        `${mhdFormatInvestigationPartyRole(party.partyRole)} (${party.personId ? personName(peopleList, party.personId) : party.externalName})`,
                    )
                    .join(', ')
                : 'None'}
            </p>
            <p>
              <strong>Investigator:</strong>{' '}
              {usersList.find((user) => user.id === investigatorUserId)?.displayName ??
                'Assign later'}
            </p>
            {conflictAcknowledgment.trim() ? (
              <p>
                <strong>Independence reason:</strong> {conflictAcknowledgment}
              </p>
            ) : null}
            <p>
              <strong>Target date:</strong> {dateLabel(targetCompletionDate)}
            </p>
            <p>
              <strong>Interim measures:</strong>{' '}
              {measures.length
                ? measures
                    .map(
                      (measure) =>
                        `${INTERIM_MEASURE_LABELS[measure.measureType]} — ${measure.description}`,
                    )
                    .join('; ')
                : 'None'}
            </p>
          </div>
        );
    }
  }

  const completion = openedCase ? (
    <div className="space-y-4">
      <MhdCard>
        <h2 className="text-lg font-semibold text-foreground">Investigation Opened</h2>
        <p className="mt-2 text-sm text-muted-foreground">Reference ID: {openedCase.referenceId}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Only you and the assigned investigator can see it until access is granted to others.
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate(`/investigations/${openedCase.id}`)}>Open Case</Button>
        </div>
      </MhdCard>
      <MhdWizardOutputStep
        companyId={companyId}
        sourceWizard="INVESTIGATION"
        templateKey="INVESTIGATION_OPENING_NOTICE"
        entityType="INVESTIGATION_CASE"
        entityId={openedCase.id}
        recordLabel="opening notice"
        allowEmployeeFile={false}
      />
    </div>
  ) : undefined;

  return (
    <MhdWizardShell
      title="Guided investigation intake"
      description="Record the concern, who is involved and an independent investigator, then open the investigation. It is visible only to the people granted access."
      backTo="/investigations"
      backLabel="Investigations"
      cancelTo="/investigations"
      gateBanner={<MhdComplianceGateBanner readiness={readiness.data} />}
      flow={flow}
      completion={completion}
    >
      {renderStep()}
    </MhdWizardShell>
  );
}

export default MhdInvestigationIntakeWizard;
