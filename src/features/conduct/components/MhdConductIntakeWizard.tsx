import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdConductActionCeremony,
  useMhdConductActionsMutations,
  useMhdConductCases,
  useMhdConductPeople,
  useMhdConductPersonContext,
  useMhdConductPersonHistory,
  useMhdConductSeverityRecommendation,
} from '../Hook';
import {
  MHD_CONDUCT_CATEGORIES,
  MHD_CONDUCT_SEVERITIES,
  mhdFormatConductCategory,
  mhdFormatConductSeverity,
  type MhdConductActionDocumentPayload,
  type MhdConductCategory,
  type MhdConductSeverity,
  type MhdIssueConductActionResult,
} from '../Types';
import { useMhdModuleComplianceReadiness } from '@/utils/useMhdModuleComplianceReadiness';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function blankToNull(value: string): string | null {
  return value.trim() ? value : null;
}

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function dateLabel(value: string): string {
  return value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : '—';
}

export function MhdConductIntakeWizard() {
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const readiness = useMhdModuleComplianceReadiness('CONDUCT');
  const people = useMhdConductPeople(companyId);

  const [personId, setPersonId] = useState('');
  const [category, setCategory] = useState<MhdConductCategory>('CONDUCT');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [companyNameEdit, setCompanyNameEdit] = useState<string | null>(null);
  const [positionTitleEdit, setPositionTitleEdit] = useState<string | null>(null);
  const [departmentEdit, setDepartmentEdit] = useState<string | null>(null);
  const [supervisorEdit, setSupervisorEdit] = useState<string | null>(null);
  const [facilityEdit, setFacilityEdit] = useState<string | null>(null);
  const [dateOfHireEdit, setDateOfHireEdit] = useState<string | null>(null);
  const [incidentDates, setIncidentDates] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [policiesViolated, setPoliciesViolated] = useState('');
  const [policyCitationText, setPolicyCitationText] = useState('');
  const [previouslyAddressed, setPreviouslyAddressed] = useState('');
  const [incidentNarrative, setIncidentNarrative] = useState('');
  const [incidentFindings, setIncidentFindings] = useState('');
  const [priorSummaryEdit, setPriorSummaryEdit] = useState<string | null>(null);
  const [severityEdit, setSeverityEdit] = useState<MhdConductSeverity | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [actionSummary, setActionSummary] = useState('');
  const [expectations, setExpectations] = useState('');
  const [consequencesText, setConsequencesText] = useState('');
  const [trainingItems, setTrainingItems] = useState('');
  const [trainingDeadline, setTrainingDeadline] = useState('');
  const [followUpReviewDate, setFollowUpReviewDate] = useState('');
  const [extenuatingConsidered, setExtenuatingConsidered] = useState('');
  const [extenuatingExplanation, setExtenuatingExplanation] = useState('');
  const [requiresDocument, setRequiresDocument] = useState(true);
  const [draftSaved, setDraftSaved] = useState(false);
  const [issueResult, setIssueResult] = useState<MhdIssueConductActionResult | null>(null);
  const [issuedCaseId, setIssuedCaseId] = useState<string | null>(null);

  const context = useMhdConductPersonContext(personId || null);
  const history = useMhdConductPersonHistory(personId || null);
  const openCases = useMhdConductCases({
    companyId,
    personId: personId || 'ALL',
    category: 'ALL',
    status: 'OPEN',
    searchTerm: '',
  });
  const recommendation = useMhdConductSeverityRecommendation(personId || null, category);
  const mutations = useMhdConductActionsMutations();
  const ceremony = useMhdConductActionCeremony();

  const companyName = companyNameEdit ?? context.data?.companyName ?? '';
  const positionTitle = positionTitleEdit ?? context.data?.positionTitle ?? '';
  const department = departmentEdit ?? context.data?.department ?? '';
  const supervisor = supervisorEdit ?? context.data?.supervisorName ?? '';
  const facility = facilityEdit ?? context.data?.facilityLocation ?? '';
  const dateOfHire = dateOfHireEdit ?? context.data?.dateOfHire ?? '';
  const priorDefault = (history.data ?? [])
    .filter((entry) => entry.source === 'CONDUCT_ACTION')
    .map((entry) =>
      `${entry.referenceId ?? 'Action'} ${entry.severity ? mhdFormatConductSeverity(entry.severity) : ''} on ${dateLabel(entry.occurredAt)}`.trim(),
    )
    .join('\n');
  const priorCorrectiveActionSummary = priorSummaryEdit ?? priorDefault;
  const recommended = recommendation.data?.recommendedSeverity;
  // No rung is assumed: until the recommendation arrives (or the person chooses) there is none.
  const severity: MhdConductSeverity | '' = severityEdit ?? recommended ?? '';
  const severityDiffers = Boolean(recommended && severity && severity !== recommended);

  function documentPayload(): MhdConductActionDocumentPayload {
    const payload: MhdConductActionDocumentPayload = {
      companyName: blankToNull(companyName),
      positionTitle: blankToNull(positionTitle),
      departmentProgram: blankToNull(department),
      supervisorName: blankToNull(supervisor),
      facilityLocation: blankToNull(facility),
      dateOfHire: blankToNull(dateOfHire),
      dateOfNotice: today(),
      incidentDates: blankToNull(incidentDates),
      incidentTime: blankToNull(incidentTime),
      incidentLocation: blankToNull(incidentLocation),
      policiesViolated: blankToNull(policiesViolated),
      previouslyAddressed: blankToNull(previouslyAddressed),
      incidentNarrative: blankToNull(incidentNarrative),
      incidentFindings: blankToNull(incidentFindings),
      policyCitationText: blankToNull(policyCitationText),
      priorCorrectiveActionSummary: blankToNull(priorCorrectiveActionSummary),
      trainingItems: blankToNull(trainingItems),
      trainingDeadline: blankToNull(trainingDeadline),
      followUpReviewDate: blankToNull(followUpReviewDate),
      expectations: blankToNull(expectations),
      consequencesText: blankToNull(consequencesText),
      extenuatingCircumstancesConsidered: blankToNull(extenuatingConsidered),
      extenuatingCircumstancesExplanation: blankToNull(extenuatingExplanation),
    };
    if (recommendation.data && severity) {
      payload.severityRecommendation = {
        recommended: recommendation.data.recommendedSeverity,
        chosen: severity,
        overrideReason: severityDiffers ? blankToNull(overrideReason) : null,
        ruleId: recommendation.data.ruleId,
      };
    }
    return payload;
  }

  async function persist() {
    if (!severity) throw new Error('Choose a severity.');
    const content = {
      severity,
      actionSummary,
      requiresDocument,
      documentPayload: documentPayload(),
    };
    const contentKey = JSON.stringify(content);
    const chosenCase = (openCases.data ?? []).find((item) => item.id === selectedCaseId);
    const caseResult = await flow.runOnce(`case:${chosenCase?.id ?? 'new'}`, async () => {
      if (chosenCase) return { id: chosenCase.id, referenceId: chosenCase.referenceId };
      const result = await mutations.createCase.mutateAsync({
        companyId,
        personId,
        category,
        concernSummary: actionSummary,
      });
      return { id: result.id, referenceId: result.reference_id };
    });
    const actionResult = await flow.runOnce(`action:create:${caseResult.id}`, async () => {
      const result = await mutations.createAction.mutateAsync({
        caseId: caseResult.id,
        severity,
        actionSummary,
        requiresDocument,
        documentPayload: content.documentPayload,
      });
      return { id: result.id, key: contentKey };
    });
    if (actionResult.key !== contentKey) {
      await flow.runOnce(`action:update:${contentKey}`, () =>
        mutations.updateAction.mutateAsync({
          actionId: actionResult.id,
          input: { severity, actionSummary, documentPayload: content.documentPayload },
        }),
      );
    }
    return {
      caseId: caseResult.id,
      caseReferenceId: caseResult.referenceId,
      actionId: actionResult.id,
    };
  }

  function required(value: string, message: string): string | null {
    return value.trim() ? null : message;
  }

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'employee',
      title: 'Employee & Context',
      description: 'Choose the employee and notice context.',
      validate: () => (personId ? null : 'Choose an employee.'),
    },
    {
      id: 'incident',
      title: 'Incident & Policy',
      description: 'Record what happened and prior history.',
      validate: () => required(incidentNarrative, 'Describe what happened.'),
    },
    {
      id: 'severity',
      title: 'Severity',
      description: 'Review and confirm the recommended rung.',
      validate: () => {
        if (!severity) {
          return recommendation.isLoading
            ? 'Wait for the recommendation to load.'
            : 'Choose a severity.';
        }
        return severityDiffers
          ? required(overrideReason, 'Explain why this differs from the recommendation.')
          : null;
      },
    },
    {
      id: 'expectations',
      title: 'Expectations & Follow-up',
      description: 'State the action and expectations.',
      validate: () =>
        required(actionSummary, 'Summarize the action in a sentence or two.') ??
        required(expectations, 'State what is expected going forward.'),
    },
    {
      id: 'review',
      title: 'Review & Issue',
      description: 'Review the notice and issue it for receipt.',
    },
  ];

  const flow = useMhdWizardFlow({
    steps,
    isDirty:
      !draftSaved &&
      (Boolean(personId) ||
        [
          incidentDates,
          incidentTime,
          incidentLocation,
          policiesViolated,
          policyCitationText,
          previouslyAddressed,
          incidentNarrative,
          incidentFindings,
          actionSummary,
          expectations,
          consequencesText,
          trainingItems,
          trainingDeadline,
          followUpReviewDate,
          extenuatingConsidered,
          extenuatingExplanation,
        ].some((value) => value.trim())),
    onSubmit: async () => {
      if (!severity) throw new Error('Choose a severity.');
      const persisted = await persist();
      const result = await ceremony.issue({
        ...persisted,
        companyId,
        personId,
        severity,
        requiresDocument,
        actionSummary,
        documentPayload: documentPayload(),
        caseReferenceId: persisted.caseReferenceId,
        actorUserId: profile?.userId,
      });
      setIssuedCaseId(persisted.caseId);
      setIssueResult(result);
    },
  });

  function textField(
    label: string,
    value: string,
    onChange: (value: string) => void,
    textarea = false,
  ) {
    const field = textarea ? (
      <textarea
        className={`${inputClass} min-h-24`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    ) : (
      <input
        className={`mt-1 ${inputClass}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
    return (
      <label className="block text-sm font-medium">
        {label}
        {field}
      </label>
    );
  }

  function renderEmployee() {
    return (
      <MhdFormFieldStack>
        <label className="block text-sm font-medium">
          Employee
          <select
            className={`mt-1 ${inputClass}`}
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            <option value="">Choose an employee</option>
            {(people.data ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {[person.firstName, person.lastName].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Category
          <select
            className={`mt-1 ${inputClass}`}
            value={category}
            onChange={(event) => setCategory(event.target.value as MhdConductCategory)}
          >
            {MHD_CONDUCT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {mhdFormatConductCategory(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Add to an open case
          <select
            className={`mt-1 ${inputClass}`}
            disabled={!personId}
            value={selectedCaseId}
            onChange={(event) => setSelectedCaseId(event.target.value)}
          >
            <option value="">Open a new case</option>
            {(openCases.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.referenceId} — {mhdFormatConductCategory(item.category)}
              </option>
            ))}
          </select>
        </label>
        {textField('Company name', companyName, setCompanyNameEdit)}
        {textField('Position title', positionTitle, setPositionTitleEdit)}
        {textField('Department / program', department, setDepartmentEdit)}
        {textField('Supervisor', supervisor, setSupervisorEdit)}
        {textField('Facility location', facility, setFacilityEdit)}
        <div>
          <label htmlFor="conduct-date-of-hire" className="block text-sm font-medium">
            Date of hire
          </label>
          <MhdDateField id="conduct-date-of-hire" value={dateOfHire} onChange={setDateOfHireEdit} />
        </div>
      </MhdFormFieldStack>
    );
  }

  function renderIncident() {
    return (
      <MhdFormFieldStack>
        {textField('Incident date(s)', incidentDates, setIncidentDates)}
        {textField('Incident time', incidentTime, setIncidentTime)}
        {textField('Incident location', incidentLocation, setIncidentLocation)}
        {textField('Policies violated', policiesViolated, setPoliciesViolated, true)}
        {textField('Policy citation text', policyCitationText, setPolicyCitationText, true)}
        {textField('Previously addressed', previouslyAddressed, setPreviouslyAddressed, true)}
        {textField('Incident narrative', incidentNarrative, setIncidentNarrative, true)}
        {textField('Findings', incidentFindings, setIncidentFindings, true)}
        <MhdCard>
          <h3 className="font-semibold">Prior history</h3>
          {history.isLoading ? (
            <p>Loading history…</p>
          ) : history.isError ? (
            <p role="alert">
              {history.error instanceof Error ? history.error.message : 'Unable to load history.'}
            </p>
          ) : (history.data ?? []).length === 0 ? (
            <p>No prior history in the last 24 months.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {(history.data ?? []).map((entry, index) => (
                <li key={`${entry.referenceId ?? entry.source}-${index}`}>
                  <strong>
                    {entry.source === 'CONDUCT_ACTION'
                      ? 'Corrective action'
                      : 'Attendance threshold'}
                  </strong>{' '}
                  — {entry.referenceId ?? 'No reference'} — {dateLabel(entry.occurredAt)} —{' '}
                  {entry.severity ? mhdFormatConductSeverity(entry.severity) : '—'} — {entry.status}{' '}
                  — {entry.summary ?? 'No summary'}
                </li>
              ))}
            </ul>
          )}
        </MhdCard>
        {textField(
          'Prior corrective action summary',
          priorCorrectiveActionSummary,
          setPriorSummaryEdit,
          true,
        )}
      </MhdFormFieldStack>
    );
  }

  function renderSeverity() {
    return (
      <MhdFormFieldStack>
        {recommendation.isError ? (
          <p role="alert">
            {recommendation.error instanceof Error
              ? recommendation.error.message
              : 'Unable to load the severity recommendation.'}{' '}
            Choose a rung manually.
          </p>
        ) : recommendation.data ? (
          <MhdCard>
            <p>
              Recommended rung:{' '}
              <strong>{mhdFormatConductSeverity(recommendation.data.recommendedSeverity)}</strong>
            </p>
            <p className="mt-2">
              Ladder: {recommendation.data.ladder.map(mhdFormatConductSeverity).join(' → ')}
            </p>
            <p className="mt-2">
              Lookback: earlier issued actions in this category within{' '}
              {recommendation.data.lookbackMonths} months.
            </p>
            <p className="mt-2">
              Prior actions counted:{' '}
              {recommendation.data.priorActions.length
                ? recommendation.data.priorActions
                    .map(
                      (item) => `${item.referenceId} (${mhdFormatConductSeverity(item.severity)})`,
                    )
                    .join(', ')
                : 'None.'}
            </p>
            {recommendation.data.exhausted ? null : (
              <p className="mt-2">{recommendation.data.note}</p>
            )}
            {recommendation.data.exhausted ? (
              <div
                role="status"
                className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-amber-900"
              >
                {recommendation.data.note}
              </div>
            ) : null}
          </MhdCard>
        ) : (
          <p>Loading recommendation…</p>
        )}
        <label className="block text-sm font-medium">
          Severity
          <select
            className={`mt-1 ${inputClass}`}
            value={severity}
            onChange={(event) => setSeverityEdit(event.target.value as MhdConductSeverity)}
          >
            <option value="">Choose a severity</option>
            {MHD_CONDUCT_SEVERITIES.map((value) => (
              <option key={value} value={value}>
                {mhdFormatConductSeverity(value)}
              </option>
            ))}
          </select>
        </label>
        {severityDiffers
          ? textField(
              'Why this differs from the recommendation',
              overrideReason,
              setOverrideReason,
              true,
            )
          : null}
      </MhdFormFieldStack>
    );
  }

  function renderExpectations() {
    return (
      <MhdFormFieldStack>
        {textField('Summary of the action', actionSummary, setActionSummary, true)}
        {textField('Expectations', expectations, setExpectations, true)}
        {textField('Consequences if not met', consequencesText, setConsequencesText, true)}
        {textField('Training items', trainingItems, setTrainingItems, true)}
        <div>
          <label htmlFor="conduct-training-deadline" className="block text-sm font-medium">
            Training deadline
          </label>
          <MhdDateField
            id="conduct-training-deadline"
            value={trainingDeadline}
            onChange={setTrainingDeadline}
          />
        </div>
        <div>
          <label htmlFor="conduct-follow-up-review" className="block text-sm font-medium">
            Follow-up review date
          </label>
          <MhdDateField
            id="conduct-follow-up-review"
            value={followUpReviewDate}
            onChange={setFollowUpReviewDate}
          />
        </div>
        <label className="block text-sm font-medium">
          Extenuating circumstances considered
          <select
            className={`mt-1 ${inputClass}`}
            value={extenuatingConsidered}
            onChange={(event) => setExtenuatingConsidered(event.target.value)}
          >
            <option value="">Choose</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
        {textField('Explanation', extenuatingExplanation, setExtenuatingExplanation, true)}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={requiresDocument}
            onChange={(event) => setRequiresDocument(event.target.checked)}
          />
          Issue as a signed document the employee acknowledges receipt of
        </label>
      </MhdFormFieldStack>
    );
  }

  function renderReview() {
    const selectedPerson = (people.data ?? []).find((person) => person.id === personId);
    const selectedCase = (openCases.data ?? []).find((item) => item.id === selectedCaseId);
    return (
      <MhdFormFieldStack>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="font-semibold">Employee</dt>
            <dd>{selectedPerson ? selectedPerson.displayName : personId}</dd>
          </div>
          <div>
            <dt className="font-semibold">Category</dt>
            <dd>{mhdFormatConductCategory(category)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Case</dt>
            <dd>{selectedCase ? selectedCase.referenceId : 'Open a new case'}</dd>
          </div>
          <div>
            <dt className="font-semibold">Severity</dt>
            <dd>
              {severity ? mhdFormatConductSeverity(severity) : '—'}
              {recommended ? (severityDiffers ? ' (overridden)' : ' (recommended)') : ' (manual)'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Summary</dt>
            <dd>{actionSummary}</dd>
          </div>
          <div>
            <dt className="font-semibold">Narrative</dt>
            <dd>{incidentNarrative}</dd>
          </div>
          <div>
            <dt className="font-semibold">Expectations</dt>
            <dd>{expectations}</dd>
          </div>
          <div>
            <dt className="font-semibold">Training deadline</dt>
            <dd>{trainingDeadline || '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold">Follow-up review date</dt>
            <dd>{followUpReviewDate || '—'}</dd>
          </div>
        </dl>
        <Button
          variant="secondary"
          onClick={() =>
            void (async () => {
              try {
                const result = await persist();
                setDraftSaved(true);
                navigate(`/conduct/${result.caseId}`);
              } catch (caught) {
                flow.setError(
                  caught instanceof Error ? caught.message : 'Unable to save the draft.',
                );
              }
            })()
          }
        >
          Save As Draft
        </Button>
        {ceremony.steps.length ? (
          <div>
            <h3 className="font-semibold">Issue progress</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {ceremony.steps.map((step) => (
                <li key={step.key}>
                  {step.label}:{' '}
                  {step.status === 'PENDING'
                    ? 'Pending'
                    : step.status === 'RUNNING'
                      ? 'Running'
                      : step.status === 'DONE'
                        ? 'Done'
                        : 'Failed'}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </MhdFormFieldStack>
    );
  }

  const completion = issueResult ? (
    <MhdCard>
      <h2 className="text-lg font-semibold">Corrective Action Issued</h2>
      {issueResult.esignatureRequestId ? (
        <p className="mt-2">A signature request was sent to the employee to acknowledge receipt.</p>
      ) : null}
      {issueResult.invitationErrors.length ? (
        <div role="alert" className="mt-2">
          {issueResult.invitationErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
      <div className="mt-4">
        <Button onClick={() => navigate(`/conduct/${issuedCaseId}`)}>Open Case</Button>
      </div>
    </MhdCard>
  ) : undefined;
  const body =
    flow.currentStep?.id === 'employee'
      ? renderEmployee()
      : flow.currentStep?.id === 'incident'
        ? renderIncident()
        : flow.currentStep?.id === 'severity'
          ? renderSeverity()
          : flow.currentStep?.id === 'expectations'
            ? renderExpectations()
            : renderReview();

  return (
    <MhdWizardShell
      title="Guided corrective action"
      description="Document what happened, see the employee's history and the recommended next step, and issue the notice for the employee to acknowledge receipt."
      backTo="/conduct"
      backLabel="Conduct"
      cancelTo="/conduct"
      gateBanner={<MhdComplianceGateBanner readiness={readiness.data} />}
      flow={flow}
      completion={completion}
    >
      {body}
    </MhdWizardShell>
  );
}

export default MhdConductIntakeWizard;
