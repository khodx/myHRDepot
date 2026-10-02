import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdEntityAttachmentsPanel } from '@/components/ui/MhdEntityAttachmentsPanel';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdWizardOutputStep } from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdOpenSafetyIncidentFromIntake,
  useMhdOshaEstablishments,
  useMhdRecordSevereInjuryReport,
  useMhdSafetyLeaveContext,
  useMhdSafetyPeople,
  useMhdSafetyRecordability,
  useMhdSafetyRecordabilityRules,
  useMhdSafetySevereInjury,
  useMhdSafetySevereInjuryRules,
} from '../Hook';
import {
  MHD_SAFETY_PRIVACY_REASON_LABELS,
  MHD_SAFETY_PRIVACY_REASONS,
  MHD_SAFETY_TREATMENT_LEVELS,
  MHD_SAFETY_TREATMENT_LEVEL_LABELS,
  type MhdRecordSevereInjuryReportInput,
  type MhdSafetyFacts,
  type MhdSafetyIncidentClassification,
  type MhdSafetyIllnessType,
  type MhdSafetyIntakeInput,
  type MhdSafetyPrivacyReason,
  type MhdSafetyReportMethod,
  type MhdSafetySevereTriggerKind,
  type MhdSafetyTreatmentLevel,
} from '../Types';
import { useMhdModuleComplianceReadiness } from '@/utils/useMhdModuleComplianceReadiness';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const CLASSIFICATION_LABELS: Record<MhdSafetyIncidentClassification, string> = {
  DEATH: 'Death',
  DAYS_AWAY_FROM_WORK: 'Days Away From Work',
  JOB_TRANSFER_OR_RESTRICTION: 'Job Transfer Or Restriction',
  OTHER_RECORDABLE: 'Other Recordable Case',
};

const ILLNESS_TYPES: Array<{ value: MhdSafetyIllnessType; label: string }> = [
  { value: 'INJURY', label: 'Injury' },
  { value: 'SKIN_DISORDER', label: 'Skin Disorder' },
  { value: 'RESPIRATORY_CONDITION', label: 'Respiratory Condition' },
  { value: 'POISONING', label: 'Poisoning' },
  { value: 'HEARING_LOSS', label: 'Hearing Loss' },
  { value: 'ALL_OTHER_ILLNESSES', label: 'All Other Illnesses' },
];

function blankToNull(value: string): string | null {
  return value.trim() ? value : null;
}

function parseCount(value: string): number {
  return value === '' ? 0 : Number(value);
}

function isoNow(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function dayAfter(value: string | null): string {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Not calculated';
}

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : 'Not set';
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

function triggerTitle(triggerKind: string): string {
  return triggerKind
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function MhdSafetyIncidentWizard() {
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const readiness = useMhdModuleComplianceReadiness('WORKPLACE_SAFETY');
  const establishments = useMhdOshaEstablishments(companyId);
  const people = useMhdSafetyPeople(companyId);
  const rules = useMhdSafetyRecordabilityRules(companyId);
  const [establishmentEdit, setEstablishmentEdit] = useState<string | null>(null);
  const establishmentId = establishmentEdit ?? establishments.data?.[0]?.id ?? '';
  const severeRules = useMhdSafetySevereInjuryRules(establishmentId || null);
  const openIncident = useMhdOpenSafetyIncidentFromIntake();
  const recordReport = useMhdRecordSevereInjuryReport();

  const [personKind, setPersonKind] = useState<'employee' | 'nonEmployee'>('employee');
  const [personId, setPersonId] = useState('');
  const [nonEmployeeName, setNonEmployeeName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [dateOfIncident, setDateOfIncident] = useState('');
  const [timeOfIncident, setTimeOfIncident] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [activityBefore, setActivityBefore] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [injuryDescription, setInjuryDescription] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [objectSubstance, setObjectSubstance] = useState('');
  const [illnessType, setIllnessType] = useState<MhdSafetyIllnessType | ''>('');
  const [employerNotifiedAt, setEmployerNotifiedAt] = useState('');
  const [treatmentLevel, setTreatmentLevel] = useState<MhdSafetyTreatmentLevel | ''>('');
  const [treatedInEmergencyRoom, setTreatedInEmergencyRoom] = useState(false);
  const [physicianName, setPhysicianName] = useState('');
  const [treatmentFacility, setTreatmentFacility] = useState('');
  const [isPrivacyCase, setIsPrivacyCase] = useState(false);
  const [privacyReason, setPrivacyReason] = useState<MhdSafetyPrivacyReason | ''>('');
  const [daysAway, setDaysAway] = useState('0');
  const [daysRestricted, setDaysRestricted] = useState('0');
  const [firstDayAway, setFirstDayAway] = useState('');
  const [returnToWorkDate, setReturnToWorkDate] = useState('');
  const [leaveCaseId, setLeaveCaseId] = useState<string | null>(null);
  const [booleanAnswers, setBooleanAnswers] = useState<Record<string, boolean | undefined>>({});
  const [decisionEdit, setDecisionEdit] = useState<boolean | null>(null);
  const [classificationEdit, setClassificationEdit] =
    useState<MhdSafetyIncidentClassification | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [severeDecisions, setSevereDecisions] = useState<
    Record<string, 'REPORT_REQUIRED' | 'NOT_REQUIRED' | undefined>
  >({});
  const [severeReasons, setSevereReasons] = useState<Record<string, string>>({});
  const [deathDate, setDeathDate] = useState('');
  const [intakeResult, setIntakeResult] = useState<Awaited<
    ReturnType<typeof openIncident.mutateAsync>
  > | null>(null);
  const [reportForms, setReportForms] = useState<
    Record<string, { reportedAt: string; method: MhdSafetyReportMethod; agencyReference: string }>
  >({});
  const [reported, setReported] = useState<Record<string, boolean>>({});
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({});

  const recordabilityRules = useMemo(() => rules.data ?? [], [rules.data]);
  const booleanRules = useMemo(
    () => recordabilityRules.filter((rule) => rule.answerType === 'BOOLEAN'),
    [recordabilityRules],
  );
  const facts = useMemo<MhdSafetyFacts>(() => {
    const next: MhdSafetyFacts = {
      days_away_count: parseCount(daysAway),
      days_restricted_or_transferred_count: parseCount(daysRestricted),
    };
    Object.entries(booleanAnswers).forEach(([key, value]) => {
      if (value !== undefined) next[key] = value;
    });
    return next;
  }, [booleanAnswers, daysAway, daysRestricted]);
  const recordability = useMhdSafetyRecordability(companyId, facts);
  const severeEvaluation = useMhdSafetySevereInjury(
    establishmentId || null,
    facts,
    isoNow(employerNotifiedAt),
  );
  const severeFactRules = useMemo(
    () =>
      Array.from(
        new Map(
          (severeRules.data ?? [])
            .filter((rule) => rule.factKey !== 'resulted_in_death')
            .map((rule) => [rule.factKey, rule]),
        ).values(),
      ),
    [severeRules.data],
  );
  const leaveContext = useMhdSafetyLeaveContext(
    companyId,
    personId || null,
    dateOfIncident || null,
  );
  const recommendedRecordable = recordability.data?.recordable;
  const recommendedClassification = recordability.data?.classification ?? null;
  const recordable: boolean | null = decisionEdit ?? recommendedRecordable ?? null;
  const classification = classificationEdit ?? recommendedClassification;
  const overridesRecommendation =
    recordability.data !== undefined &&
    ((recordable !== null && recordable !== recommendedRecordable) ||
      (recordable === true && classification !== recommendedClassification));

  function severeDecisionFor(
    triggerKind: MhdSafetySevereTriggerKind,
  ): 'REPORT_REQUIRED' | 'NOT_REQUIRED' {
    return severeDecisions[triggerKind] ?? 'REPORT_REQUIRED';
  }

  function setAnswer(key: string, value: boolean) {
    setBooleanAnswers((current) => ({ ...current, [key]: value }));
  }

  function validateWhere(): string | null {
    if (!establishmentId) return 'Choose an establishment.';
    if (personKind === 'employee' && !personId)
      return 'Choose the employee, or name the person who was not an employee.';
    if (personKind === 'nonEmployee' && !nonEmployeeName.trim())
      return 'Choose the employee, or name the person who was not an employee.';
    if (!dateOfIncident) return 'Enter the date of the incident.';
    if (dateOfIncident > todayIso()) return 'The date of the incident cannot be in the future.';
    return null;
  }

  function validateDays(): string | null {
    const counts = [daysAway, daysRestricted];
    if (counts.some((value) => !/^\d+$/.test(value)))
      return 'Enter whole numbers of days that are 0 or more.';
    if (counts.some((value) => Number(value) > 180)) return 'Counts stop at 180 days.';
    if (firstDayAway && returnToWorkDate && returnToWorkDate < firstDayAway)
      return 'The return-to-work date cannot be before the first day away.';
    return null;
  }

  function validateRecordability(): string | null {
    if (booleanRules.some((rule) => booleanAnswers[rule.factKey] === undefined))
      return 'Answer every recordability question.';
    if (recordability.data === undefined) return 'Wait for the recommendation to load.';
    if (recordable === null) return 'Record whether the case is recordable.';
    if (recordable && !classification) return 'Choose the 300-log classification.';
    if (overridesRecommendation && overrideReason.trim().length < 10)
      return 'Record why you are not following the recommendation (at least 10 characters).';
    return null;
  }

  function validateReporting(): string | null {
    if (severeFactRules.some((rule) => booleanAnswers[rule.factKey] === undefined))
      return 'Answer every severe-injury question.';
    if (severeEvaluation.data === undefined) return 'Wait for the reporting check to load.';
    for (const trigger of severeEvaluation.data.triggers) {
      if (
        severeDecisionFor(trigger.triggerKind) === 'NOT_REQUIRED' &&
        (severeReasons[trigger.triggerKind] ?? '').trim().length < 10
      )
        return `Record why a report is not required for: ${trigger.label} (at least 10 characters).`;
    }
    return null;
  }

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'where',
      title: 'Establishment & Person',
      description: 'Identify where the incident occurred and who was involved.',
      validate: validateWhere,
    },
    {
      id: 'what',
      title: 'What Happened',
      description: 'Describe the event and the injury or illness.',
      validate: () =>
        !whatHappened.trim()
          ? 'Describe what happened.'
          : !injuryDescription.trim()
            ? 'Describe the injury or illness.'
            : null,
    },
    {
      id: 'treatment',
      title: 'Treatment & Privacy',
      description: 'Record treatment details and any privacy concern.',
      validate: () =>
        isPrivacyCase && !privacyReason ? 'Record why this is a privacy concern case.' : null,
    },
    {
      id: 'days',
      title: 'Days Away & Restricted Work',
      description: 'Record time away and restricted work.',
      validate: validateDays,
    },
    {
      id: 'recordability',
      title: 'Recordability',
      description: 'Review the rule-based recommendation and make the decision.',
      validate: validateRecordability,
    },
    {
      id: 'reporting',
      title: 'Reporting',
      description: 'Record each severe-injury reporting decision.',
      validate: validateReporting,
    },
    {
      id: 'review',
      title: 'Review & Record',
      description: 'Review everything before the atomic save.',
    },
  ];

  const isDirty = Boolean(
    establishmentEdit ||
    personId ||
    nonEmployeeName ||
    jobTitle ||
    dateOfIncident ||
    timeOfIncident ||
    locationDescription ||
    activityBefore ||
    whatHappened ||
    injuryDescription ||
    bodyPart ||
    objectSubstance ||
    illnessType ||
    employerNotifiedAt ||
    treatmentLevel ||
    physicianName ||
    treatmentFacility ||
    isPrivacyCase ||
    firstDayAway ||
    returnToWorkDate ||
    Object.keys(booleanAnswers).length ||
    overrideReason,
  );

  const input: MhdSafetyIntakeInput = {
    companyId,
    establishmentId,
    incident: {
      personId: personKind === 'employee' ? blankToNull(personId) : null,
      nonEmployeeName: personKind === 'nonEmployee' ? blankToNull(nonEmployeeName) : null,
      jobTitle: blankToNull(jobTitle),
      dateOfIncident,
      timeOfIncident: blankToNull(timeOfIncident),
      locationDescription: blankToNull(locationDescription),
      whatHappened,
      injuryIllnessDescription: injuryDescription,
      illnessType: illnessType || null,
      daysAwayCount: parseCount(daysAway),
      daysRestrictedOrTransferredCount: parseCount(daysRestricted),
      isPrivacyCase,
      privacyCaseReason: isPrivacyCase ? privacyReason || null : null,
      bodyPart: blankToNull(bodyPart),
      objectSubstance: blankToNull(objectSubstance),
      activityBefore: blankToNull(activityBefore),
      treatmentLevel: treatmentLevel || null,
      treatedInEmergencyRoom,
      hospitalizedInpatient: booleanAnswers.inpatient_hospitalization === true,
      physicianName: blankToNull(physicianName),
      treatmentFacility: blankToNull(treatmentFacility),
      deathDate: booleanAnswers.resulted_in_death ? deathDate || null : null,
      employerNotifiedAt: isoNow(employerNotifiedAt),
      firstDayAway: firstDayAway || null,
      returnToWorkDate: returnToWorkDate || null,
      leaveCaseId,
    },
    facts,
    decision: {
      recordable: recordable === true,
      classification: recordable ? classification : null,
      overrideReason: overridesRecommendation ? overrideReason.trim() : null,
    },
    severeDecisions: (severeEvaluation.data?.triggers ?? []).map((trigger) => ({
      triggerKind: trigger.triggerKind,
      decision: severeDecisionFor(trigger.triggerKind),
      reason:
        severeDecisionFor(trigger.triggerKind) === 'NOT_REQUIRED'
          ? (severeReasons[trigger.triggerKind] ?? '').trim()
          : null,
    })),
  };

  const flow = useMhdWizardFlow({
    steps,
    isDirty,
    onSubmit: async () => {
      const saved = await openIncident.mutateAsync(input);
      setIntakeResult(saved);
    },
  });

  function field(
    label: string,
    value: string,
    onChange: (value: string) => void,
    multiline = false,
  ) {
    return (
      <label className="block text-sm font-medium">
        {label}
        {multiline ? (
          <textarea
            className={`${inputClass} mt-1 min-h-24`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <input
            className={`mt-1 ${inputClass}`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </label>
    );
  }

  function renderWhere() {
    if (establishments.data && establishments.data.length === 0)
      return (
        <p>
          Add an establishment on the Workplace Safety page first.{' '}
          <Link className="text-accent hover:underline" to="/safety">
            Go to Workplace Safety
          </Link>
        </p>
      );
    return (
      <MhdFormFieldStack>
        <label className="block text-sm font-medium">
          Establishment
          <select
            className={`mt-1 ${inputClass}`}
            value={establishmentId}
            onChange={(event) => setEstablishmentEdit(event.target.value)}
          >
            {(establishments.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.establishmentName}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm font-medium">Person type</legend>
          <div className="mt-2 flex gap-4 text-sm">
            <label>
              <input
                type="radio"
                checked={personKind === 'employee'}
                onChange={() => {
                  setPersonKind('employee');
                  setLeaveCaseId(null);
                }}
              />{' '}
              An employee
            </label>
            <label>
              <input
                type="radio"
                checked={personKind === 'nonEmployee'}
                onChange={() => {
                  setPersonKind('nonEmployee');
                  setLeaveCaseId(null);
                }}
              />{' '}
              Someone who is not an employee
            </label>
          </div>
        </fieldset>
        {personKind === 'employee' ? (
          <label className="block text-sm font-medium">
            Employee
            <select
              className={`mt-1 ${inputClass}`}
              value={personId}
              onChange={(event) => {
                setPersonId(event.target.value);
                setLeaveCaseId(null);
              }}
            >
              <option value="">Select an employee</option>
              {(people.data ?? []).map((person) => (
                <option key={person.id} value={person.id}>
                  {[person.firstName, person.lastName].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </label>
        ) : (
          field('Name', nonEmployeeName, setNonEmployeeName)
        )}
        {field('Job title', jobTitle, setJobTitle)}
        <div>
          <label htmlFor="safety-incident-date" className="block text-sm font-medium">
            Date of incident
          </label>
          <MhdDateField
            id="safety-incident-date"
            value={dateOfIncident}
            onChange={setDateOfIncident}
          />
        </div>
        <label className="block text-sm font-medium">
          Time of incident (optional)
          <input
            type="time"
            className={`mt-1 ${inputClass}`}
            value={timeOfIncident}
            onChange={(event) => setTimeOfIncident(event.target.value)}
          />
        </label>
        {field('Where it happened', locationDescription, setLocationDescription)}
      </MhdFormFieldStack>
    );
  }

  function renderWhat() {
    return (
      <MhdFormFieldStack>
        {field('What was the person doing just before', activityBefore, setActivityBefore, true)}
        {field('What happened', whatHappened, setWhatHappened, true)}
        {field(
          'Description of the injury or illness',
          injuryDescription,
          setInjuryDescription,
          true,
        )}
        {field('Body part', bodyPart, setBodyPart)}
        {field('Object or substance that harmed the person', objectSubstance, setObjectSubstance)}
        <label className="block text-sm font-medium">
          Type of injury or illness
          <select
            className={`mt-1 ${inputClass}`}
            value={illnessType}
            onChange={(event) => setIllnessType(event.target.value as MhdSafetyIllnessType | '')}
          >
            <option value="">Not set</option>
            {ILLNESS_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          When the company learned of it
          <input
            type="datetime-local"
            className={`mt-1 ${inputClass}`}
            value={employerNotifiedAt}
            onChange={(event) => setEmployerNotifiedAt(event.target.value)}
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            This starts the reporting clock when a severe injury is involved.
          </span>
        </label>
      </MhdFormFieldStack>
    );
  }

  function renderTreatment() {
    return (
      <MhdFormFieldStack>
        <label className="block text-sm font-medium">
          Level of treatment
          <select
            className={`mt-1 ${inputClass}`}
            value={treatmentLevel}
            onChange={(event) =>
              setTreatmentLevel(event.target.value as MhdSafetyTreatmentLevel | '')
            }
          >
            <option value="">Not set</option>
            {MHD_SAFETY_TREATMENT_LEVELS.map((level) => (
              <option key={level} value={level}>
                {MHD_SAFETY_TREATMENT_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={treatedInEmergencyRoom}
            onChange={(event) => setTreatedInEmergencyRoom(event.target.checked)}
          />{' '}
          Treated in an emergency room
        </label>
        {field('Health-care professional', physicianName, setPhysicianName)}
        {field('Facility', treatmentFacility, setTreatmentFacility)}
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isPrivacyCase}
            onChange={(event) => setIsPrivacyCase(event.target.checked)}
          />{' '}
          This is a privacy concern case
        </label>
        {isPrivacyCase ? (
          <label className="block text-sm font-medium">
            Reason
            <select
              className={`mt-1 ${inputClass}`}
              value={privacyReason}
              onChange={(event) =>
                setPrivacyReason(event.target.value as MhdSafetyPrivacyReason | '')
              }
            >
              <option value="">Select a reason</option>
              {MHD_SAFETY_PRIVACY_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {MHD_SAFETY_PRIVACY_REASON_LABELS[reason]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <p className="text-xs text-muted-foreground">
          The employee's name is withheld from anyone who cannot see privacy cases.
        </p>
      </MhdFormFieldStack>
    );
  }

  function renderDays() {
    return (
      <MhdFormFieldStack>
        <label className="block text-sm font-medium">
          Days away from work
          <input
            type="number"
            min={0}
            className={`mt-1 ${inputClass}`}
            value={daysAway}
            onChange={(event) => setDaysAway(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Days of job transfer or restriction
          <input
            type="number"
            min={0}
            className={`mt-1 ${inputClass}`}
            value={daysRestricted}
            onChange={(event) => setDaysRestricted(event.target.value)}
          />
        </label>
        <div>
          <label htmlFor="safety-first-day-away" className="block text-sm font-medium">
            First day away
          </label>
          <MhdDateField
            id="safety-first-day-away"
            value={firstDayAway}
            onChange={setFirstDayAway}
          />
        </div>
        <div>
          <label htmlFor="safety-return-to-work" className="block text-sm font-medium">
            Return-to-work date
          </label>
          <MhdDateField
            id="safety-return-to-work"
            value={returnToWorkDate}
            onChange={setReturnToWorkDate}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Count calendar days after the day of the incident, including weekends.
        </p>
        {leaveContext.data?.visible ? (
          leaveContext.data.cases.map((leave) => (
            <div key={leave.id} className="rounded border border-border p-3 text-sm">
              <p>
                {leave.referenceId} — {leave.status} — {formatDate(leave.startDate)} through{' '}
                {formatDate(leave.endDate)}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setDaysAway(String(leave.suggestedCalendarDays));
                  setFirstDayAway(leave.startDate);
                  setReturnToWorkDate(dayAfter(leave.endDate));
                  setLeaveCaseId(leave.id);
                }}
              >
                Use {leave.suggestedCalendarDays} Days
              </Button>
            </div>
          ))
        ) : leaveContext.data && !leaveContext.data.visible ? (
          <p className="text-sm">
            Leave records are not available to your role. Enter the days by hand.
          </p>
        ) : null}
      </MhdFormFieldStack>
    );
  }

  function renderRecordability() {
    return (
      <MhdFormFieldStack>
        {booleanRules.map((rule) => (
          <fieldset key={rule.ruleKey} className="space-y-2">
            <legend className="text-sm font-medium">{rule.label}</legend>
            <div className="flex gap-4 text-sm">
              <label>
                <input
                  type="radio"
                  name={rule.factKey}
                  checked={booleanAnswers[rule.factKey] === true}
                  onChange={() => setAnswer(rule.factKey, true)}
                />{' '}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name={rule.factKey}
                  checked={booleanAnswers[rule.factKey] === false}
                  onChange={() => setAnswer(rule.factKey, false)}
                />{' '}
                No
              </label>
            </div>
            {rule.guidance ? (
              <details>
                <summary className="cursor-pointer text-sm">Guidance</summary>
                <p className="text-sm text-muted-foreground">{rule.guidance}</p>
              </details>
            ) : null}
            <small className="block text-muted-foreground">{rule.citation}</small>
          </fieldset>
        ))}
        <p className="text-sm">Days away from work: {parseCount(daysAway)}</p>
        <p className="text-sm">Days of restriction: {parseCount(daysRestricted)}</p>
        {recordability.data?.recordable === true ? (
          <MhdCard>
            <p>
              Recommended: Recordable —{' '}
              {recordability.data.classification
                ? CLASSIFICATION_LABELS[recordability.data.classification]
                : 'Not classified'}
            </p>
            {recordability.data.matchedCriteria.map((finding) => (
              <p key={finding.ruleKey} className="mt-1 text-sm">
                {finding.label} — {finding.citation}
              </p>
            ))}
          </MhdCard>
        ) : recordability.data?.recordable === false ? (
          <MhdCard>
            <p>Recommended: Not recordable</p>
            {recordability.data.failedPreconditions.length ? (
              recordability.data.failedPreconditions.map((finding) => (
                <p key={finding.ruleKey} className="mt-1 text-sm">
                  {finding.label} — {finding.citation}
                </p>
              ))
            ) : (
              <p>none of the recording criteria apply</p>
            )}
          </MhdCard>
        ) : (
          <MhdCard>
            <p>Answer the remaining questions to see the recommendation.</p>
            {(recordability.data?.missingFacts ?? []).map((missing) => (
              <p key={missing.factKey} className="text-sm">
                {missing.label}
              </p>
            ))}
          </MhdCard>
        )}
        {recordability.data?.registryReviewStatus !== 'APPROVED' ? (
          <p className="text-sm text-amber-800">
            These rules are working drafts pending legal review. The recommendation is a starting
            point — you decide.
          </p>
        ) : null}
        <fieldset>
          <legend className="text-sm font-medium">Your decision</legend>
          <div className="mt-2 flex gap-4 text-sm">
            <label>
              <input
                type="radio"
                checked={recordable === true}
                onChange={() => setDecisionEdit(true)}
              />{' '}
              Recordable
            </label>
            <label>
              <input
                type="radio"
                checked={recordable === false}
                onChange={() => setDecisionEdit(false)}
              />{' '}
              Not recordable
            </label>
          </div>
        </fieldset>
        {recordable ? (
          <label className="block text-sm font-medium">
            Classification
            <select
              className={`mt-1 ${inputClass}`}
              value={classification ?? ''}
              onChange={(event) =>
                setClassificationEdit(event.target.value as MhdSafetyIncidentClassification)
              }
            >
              <option value="">Select a classification</option>
              {Object.entries(CLASSIFICATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {overridesRecommendation ? (
          <label className="block text-sm font-medium">
            Why are you not following the recommendation?
            <textarea
              className={`${inputClass} mt-1 min-h-20`}
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
            />
          </label>
        ) : null}
      </MhdFormFieldStack>
    );
  }

  function renderReporting() {
    const triggers = severeEvaluation.data?.triggers ?? [];
    return (
      <MhdFormFieldStack>
        {severeFactRules.map((rule) => (
          <fieldset key={rule.factKey}>
            <legend className="text-sm font-medium">{rule.label}</legend>
            <div className="mt-2 flex gap-4 text-sm">
              <label>
                <input
                  type="radio"
                  checked={booleanAnswers[rule.factKey] === true}
                  onChange={() => setAnswer(rule.factKey, true)}
                />{' '}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  checked={booleanAnswers[rule.factKey] === false}
                  onChange={() => setAnswer(rule.factKey, false)}
                />{' '}
                No
              </label>
            </div>
            <small className="block text-muted-foreground">{rule.citation}</small>
          </fieldset>
        ))}
        {booleanAnswers.resulted_in_death ? (
          <div>
            <label htmlFor="safety-death-date" className="block text-sm font-medium">
              Date of death
            </label>
            <MhdDateField id="safety-death-date" value={deathDate} onChange={setDeathDate} />
          </div>
        ) : null}
        {severeEvaluation.data?.needsNotifiedTime ? (
          <label className="block text-sm font-medium">
            When the company learned of it
            <input
              type="datetime-local"
              className={`mt-1 ${inputClass}`}
              value={employerNotifiedAt}
              onChange={(event) => setEmployerNotifiedAt(event.target.value)}
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Enter when the company learned of it so the deadline can be calculated.
            </span>
          </label>
        ) : null}
        {triggers.length === 0 ? (
          <p>None of the severe-injury reporting events apply.</p>
        ) : (
          triggers.map((trigger) => (
            <div key={trigger.triggerKind} className="space-y-2">
              <div role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
                {trigger.label} — report to{' '}
                {severeEvaluation.data?.jurisdiction === 'CALIFORNIA' ? 'Cal/OSHA' : 'OSHA'} within{' '}
                {trigger.deadlineHours} hours. <small>{trigger.citation}</small>
                {trigger.guidance ? <p>{trigger.guidance}</p> : null}
                {trigger.deadlineAt ? <p>Due by {formatDateTime(trigger.deadlineAt)}</p> : null}
              </div>
              <div className="flex gap-4 text-sm">
                <label>
                  <input
                    type="radio"
                    checked={severeDecisionFor(trigger.triggerKind) === 'REPORT_REQUIRED'}
                    onChange={() =>
                      setSevereDecisions((current) => ({
                        ...current,
                        [trigger.triggerKind]: 'REPORT_REQUIRED',
                      }))
                    }
                  />{' '}
                  A report is required
                </label>
                <label>
                  <input
                    type="radio"
                    checked={severeDecisionFor(trigger.triggerKind) === 'NOT_REQUIRED'}
                    onChange={() =>
                      setSevereDecisions((current) => ({
                        ...current,
                        [trigger.triggerKind]: 'NOT_REQUIRED',
                      }))
                    }
                  />{' '}
                  A report is not required
                </label>
              </div>
              {severeDecisionFor(trigger.triggerKind) === 'NOT_REQUIRED' ? (
                <label className="block text-sm font-medium">
                  Why a report is not required
                  <textarea
                    className={`${inputClass} mt-1 min-h-20`}
                    value={severeReasons[trigger.triggerKind] ?? ''}
                    onChange={(event) =>
                      setSevereReasons((current) => ({
                        ...current,
                        [trigger.triggerKind]: event.target.value,
                      }))
                    }
                  />
                </label>
              ) : null}
            </div>
          ))
        )}
      </MhdFormFieldStack>
    );
  }

  function renderReview() {
    const selectedPerson = (people.data ?? []).find((person) => person.id === personId);
    return (
      <div className="space-y-3 text-sm">
        <p>
          <strong>Establishment:</strong>{' '}
          {(establishments.data ?? []).find((item) => item.id === establishmentId)
            ?.establishmentName ?? 'Not set'}
        </p>
        <p>
          <strong>Person:</strong>{' '}
          {personKind === 'employee'
            ? [selectedPerson?.firstName, selectedPerson?.lastName].filter(Boolean).join(' ')
            : nonEmployeeName}
        </p>
        <p>
          <strong>Date:</strong> {formatDate(dateOfIncident)} —{' '}
          {locationDescription || 'No location'}
        </p>
        <p>
          <strong>What happened:</strong> {whatHappened}
        </p>
        <p>
          <strong>Injury or illness:</strong> {injuryDescription}
        </p>
        <p>
          <strong>Treatment:</strong>{' '}
          {treatmentLevel ? MHD_SAFETY_TREATMENT_LEVEL_LABELS[treatmentLevel] : 'Not set'};
          emergency room: {treatedInEmergencyRoom ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Days:</strong> {parseCount(daysAway)} away, {parseCount(daysRestricted)}{' '}
          restricted
        </p>
        <p>
          <strong>Privacy:</strong>{' '}
          {isPrivacyCase && privacyReason ? MHD_SAFETY_PRIVACY_REASON_LABELS[privacyReason] : 'No'}
        </p>
        <p>
          <strong>Recommendation:</strong>{' '}
          {recordability.data?.recordable === true
            ? 'Recordable'
            : recordability.data?.recordable === false
              ? 'Not recordable'
              : 'Undetermined'}
          ; <strong>Decision:</strong>{' '}
          {recordable === true
            ? `Recordable — ${classification ? CLASSIFICATION_LABELS[classification] : 'No classification'}`
            : 'Not recordable'}
        </p>
        {overridesRecommendation ? (
          <p>
            <strong>Override reason:</strong> {overrideReason}
          </p>
        ) : null}
        {(severeEvaluation.data?.triggers ?? []).map((trigger) => (
          <p key={trigger.triggerKind}>
            <strong>{trigger.label}:</strong>{' '}
            {severeDecisionFor(trigger.triggerKind) === 'REPORT_REQUIRED'
              ? 'A report is required'
              : 'A report is not required'}{' '}
            — {trigger.deadlineAt ? formatDateTime(trigger.deadlineAt) : 'No deadline'}
          </p>
        ))}
      </div>
    );
  }

  async function submitReport(report: {
    id: string;
    triggerKind: MhdSafetySevereTriggerKind;
    deadlineAt: string | null;
  }) {
    const form = reportForms[report.id];
    if (!form?.reportedAt) return;
    const payload: MhdRecordSevereInjuryReportInput = {
      reportId: report.id,
      reportedAt: new Date(form.reportedAt).toISOString(),
      method: form.method,
      agencyReference: blankToNull(form.agencyReference),
    };
    try {
      await recordReport.mutateAsync(payload);
      setReported((current) => ({ ...current, [report.id]: true }));
    } catch (caught) {
      setReportErrors((current) => ({
        ...current,
        [report.id]: caught instanceof Error ? caught.message : 'Unable to record the report.',
      }));
    }
  }

  function completion() {
    if (!intakeResult) return null;
    return (
      <div className="space-y-5">
        <MhdCard>
          <h2 className="text-lg font-semibold">Incident Recorded</h2>
          <p className="mt-2">Reference: {intakeResult.referenceId}</p>
          <p>
            {intakeResult.caseNumber === null
              ? 'Not recordable — no 300 log entry'
              : `300 log case number ${intakeResult.caseNumber}`}
          </p>
          {intakeResult.classification ? (
            <p>{CLASSIFICATION_LABELS[intakeResult.classification]}</p>
          ) : null}
          <Button onClick={() => navigate('/safety')}>Open Safety Module</Button>
        </MhdCard>
        {intakeResult.severeInjuryReports
          .filter((report) => report.decision === 'REPORT_REQUIRED' && !reported[report.id])
          .map((report) => {
            const form = reportForms[report.id] ?? {
              reportedAt: '',
              method: 'PHONE' as MhdSafetyReportMethod,
              agencyReference: '',
            };
            return (
              <MhdCard key={report.id}>
                <h3 className="font-semibold">{triggerTitle(report.triggerKind)}</h3>
                <p className="text-sm">Deadline: {formatDateTime(report.deadlineAt)}</p>
                <MhdFormFieldStack>
                  <label className="block text-sm font-medium">
                    When the report was made
                    <input
                      required
                      type="datetime-local"
                      className={`mt-1 ${inputClass}`}
                      value={form.reportedAt}
                      onChange={(event) =>
                        setReportForms((current) => ({
                          ...current,
                          [report.id]: { ...form, reportedAt: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Method
                    <select
                      className={`mt-1 ${inputClass}`}
                      value={form.method}
                      onChange={(event) =>
                        setReportForms((current) => ({
                          ...current,
                          [report.id]: {
                            ...form,
                            method: event.target.value as MhdSafetyReportMethod,
                          },
                        }))
                      }
                    >
                      <option value="PHONE">Phone</option>
                      <option value="ONLINE">Online</option>
                      <option value="IN_PERSON">In person</option>
                    </select>
                  </label>
                  {field('Agency reference', form.agencyReference, (value) =>
                    setReportForms((current) => ({
                      ...current,
                      [report.id]: { ...form, agencyReference: value },
                    })),
                  )}
                  {reportErrors[report.id] ? <p role="alert">{reportErrors[report.id]}</p> : null}
                  <Button
                    onClick={() => void submitReport(report)}
                    disabled={!form.reportedAt || recordReport.isPending}
                  >
                    Record The Report
                  </Button>
                </MhdFormFieldStack>
              </MhdCard>
            );
          })}
        {intakeResult.severeInjuryReports
          .filter((report) => reported[report.id])
          .map((report) => (
            <p key={report.id} role="status">
              The report was recorded.
            </p>
          ))}
        <MhdCard>
          <h2 className="font-semibold">Photos & Statements</h2>
          <MhdEntityAttachmentsPanel
            entityType="SAFETY_INCIDENT"
            entityId={intakeResult.id}
            subjectLabel="incident"
          />
        </MhdCard>
        <MhdWizardOutputStep
          companyId={companyId}
          sourceWizard="SAFETY_INCIDENT"
          templateKey="OSHA_301_INCIDENT_REPORT"
          entityType="SAFETY_INCIDENT"
          entityId={intakeResult.id}
          recordLabel="incident report"
          allowEmployeeFile={false}
        />
      </div>
    );
  }

  const content =
    flow.currentStep?.id === 'where'
      ? renderWhere()
      : flow.currentStep?.id === 'what'
        ? renderWhat()
        : flow.currentStep?.id === 'treatment'
          ? renderTreatment()
          : flow.currentStep?.id === 'days'
            ? renderDays()
            : flow.currentStep?.id === 'recordability'
              ? renderRecordability()
              : flow.currentStep?.id === 'reporting'
                ? renderReporting()
                : renderReview();
  return (
    <MhdWizardShell
      title="Guided incident"
      description="Record an injury or illness: what happened, the treatment, the days away, whether it is recordable, and whether it must be reported to the safety agency."
      backTo="/safety"
      backLabel="Workplace Safety"
      cancelTo="/safety"
      gateBanner={<MhdComplianceGateBanner readiness={readiness.data} />}
      flow={flow}
      completion={completion()}
    >
      {content}
    </MhdWizardShell>
  );
}

export default MhdSafetyIncidentWizard;
