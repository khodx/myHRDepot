import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdWizardOutputStep } from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompetencies } from '@/features/jobs/Hook';
import { useMhdPerformanceUsers } from '../Hook';
import { useMhdFeedbackThreshold, useMhdReviewTemplates } from '../Hook-v2';
import {
  useMhdLaunchPerformanceCycle,
  useMhdPerformanceCycleCandidates,
  useMhdPerformanceCycleRaterPlan,
} from '../Hook-cycles';
import {
  MHD_PERFORMANCE_REVIEW_TYPES,
  mhdFormatPerformanceReviewType,
  type MhdPerformanceReviewType,
} from '../Types';
import type {
  MhdPerformanceCycleCandidate,
  MhdPerformanceCycleLaunchInput,
  MhdPerformanceCycleRaterKind,
  MhdPerformanceCycleRaterSuggestion,
} from '../Types-cycles';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function blankToNull(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function displayDate(value: string): string {
  if (!value) return 'Not set';
  const [year, month, day] = value.split('-');
  return `${month}/${day}/${year}`;
}

function raterKey(suggestion: MhdPerformanceCycleRaterSuggestion): string {
  return `${suggestion.subjectPersonId}:${suggestion.raterPersonId}:${suggestion.participantType}`;
}

function raterKindLabel(kind: MhdPerformanceCycleRaterKind): string {
  return kind === 'PEER' ? 'Peer' : 'Upward';
}

function MhdDateRow({
  id,
  label,
  value,
  onChange,
  optional = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional ? ' (optional)' : ''}
      </label>
      <MhdDateField id={id} value={value} onChange={onChange} />
    </div>
  );
}

export function MhdPerformanceCycleWizard() {
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const templatesQuery = useMhdReviewTemplates(companyId);
  const competenciesQuery = useMhdCompetencies(companyId);
  const usersQuery = useMhdPerformanceUsers(companyId);
  const thresholdQuery = useMhdFeedbackThreshold(companyId);
  const launch = useMhdLaunchPerformanceCycle();

  const [cycleName, setCycleName] = useState('');
  const [reviewType, setReviewType] = useState<MhdPerformanceReviewType>('ANNUAL');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [selfAssessmentDue, setSelfAssessmentDue] = useState('');
  const [feedbackDue, setFeedbackDue] = useState('');
  const [reviewDue, setReviewDue] = useState('');
  const [includesSelfAssessment, setIncludesSelfAssessment] = useState(true);
  const [isMultiRater, setIsMultiRater] = useState(false);
  const [announcementNote, setAnnouncementNote] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [competencyIds, setCompetencyIds] = useState<string[]>([]);
  const [scope, setScope] = useState<'all' | 'manager'>('all');
  const [rootPersonId, setRootPersonId] = useState('');
  const [includeIndirect, setIncludeIndirect] = useState(true);
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [reviewerOverrides, setReviewerOverrides] = useState<Record<string, string>>({});
  const [includePeers, setIncludePeers] = useState(false);
  const [maxPeers, setMaxPeers] = useState('5');
  const [includeUpward, setIncludeUpward] = useState(false);
  const [maxUpward, setMaxUpward] = useState('5');
  const [removedRaters, setRemovedRaters] = useState<{
    signature: string;
    keys: Set<string>;
  }>({ signature: '', keys: new Set() });
  const [launchResult, setLaunchResult] = useState<Awaited<
    ReturnType<typeof launch.mutateAsync>
  > | null>(null);

  const candidateFilters = useMemo(
    () => ({
      companyId,
      rootPersonId: scope === 'manager' ? rootPersonId || null : null,
      includeIndirect,
      reviewType,
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
    }),
    [companyId, includeIndirect, periodEnd, periodStart, reviewType, rootPersonId, scope],
  );
  const candidatesQuery = useMhdPerformanceCycleCandidates(candidateFilters);
  const candidates = useMemo(() => candidatesQuery.data ?? [], [candidatesQuery.data]);
  const managers = useMemo(() => {
    const seen = new Set<string>();
    return candidates.filter((candidate) => {
      if (seen.has(candidate.personId)) return false;
      seen.add(candidate.personId);
      return true;
    });
  }, [candidates]);
  const effectiveCandidates = useMemo(
    () =>
      candidates.filter(
        (candidate) => !candidate.conflictingReviewReference && !excluded.has(candidate.personId),
      ),
    [candidates, excluded],
  );
  const chosenPersonIds = useMemo(
    () => effectiveCandidates.map((candidate) => candidate.personId),
    [effectiveCandidates],
  );
  const reviewerUsers = usersQuery.data ?? [];
  const templateOptions = useMemo(
    () => (templatesQuery.data ?? []).filter((template) => template.status === 'PUBLISHED'),
    [templatesQuery.data],
  );
  const selectedTemplate = templateOptions.find((template) => template.id === templateId);
  const raterInputs = useMemo(
    () => ({
      companyId,
      personIds: chosenPersonIds,
      includePeers,
      maxPeers: Number(maxPeers) || 1,
      includeUpward,
      maxUpward: Number(maxUpward) || 1,
    }),
    [chosenPersonIds, companyId, includePeers, includeUpward, maxPeers, maxUpward],
  );
  const raterPlanQuery = useMhdPerformanceCycleRaterPlan(
    includePeers || includeUpward ? raterInputs : null,
  );
  const suggestions = useMemo(() => raterPlanQuery.data ?? [], [raterPlanQuery.data]);
  const raterSignature = `${chosenPersonIds.join(',')}|${includePeers}|${maxPeers}|${includeUpward}|${maxUpward}`;
  const activeRemoved = useMemo(
    () => (removedRaters.signature === raterSignature ? removedRaters.keys : new Set<string>()),
    [raterSignature, removedRaters],
  );
  const activeSuggestions = useMemo(
    () => suggestions.filter((suggestion) => !activeRemoved.has(raterKey(suggestion))),
    [activeRemoved, suggestions],
  );
  const suggestionsBySubject = useMemo(() => {
    const groups = new Map<string, MhdPerformanceCycleRaterSuggestion[]>();
    activeSuggestions.forEach((suggestion) => {
      const group = groups.get(suggestion.subjectPersonId) ?? [];
      group.push(suggestion);
      groups.set(suggestion.subjectPersonId, group);
    });
    return groups;
  }, [activeSuggestions]);
  const threshold = thresholdQuery.data ?? 0;

  function effectiveReviewer(candidate: MhdPerformanceCycleCandidate): string {
    return reviewerOverrides[candidate.personId] ?? candidate.reviewerUserId ?? '';
  }

  function validateCycle(): string | null {
    if (!cycleName.trim()) return 'Name the cycle.';
    if (!periodStart || !periodEnd) return 'Enter the review period.';
    if (periodEnd < periodStart) return 'The review period must end on or after it starts.';
    if (!reviewDue) return 'Enter the date the reviews are due.';
    if (reviewDue < periodEnd)
      return 'The reviews must be due on or after the end of the review period.';
    if (selfAssessmentDue && selfAssessmentDue > reviewDue)
      return 'The self-assessment cannot be due after the reviews.';
    if (feedbackDue && feedbackDue > reviewDue) return 'Feedback cannot be due after the reviews.';
    return null;
  }

  function validatePeople(): string | null {
    if (chosenPersonIds.length === 0) return 'Choose at least one person to review.';
    const missing = effectiveCandidates.find((candidate) => !effectiveReviewer(candidate));
    return missing ? `Choose a reviewer for ${missing.displayName}.` : null;
  }

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'cycle',
      title: 'Cycle',
      description: 'Set the period, deadlines, and announcement.',
      validate: validateCycle,
    },
    {
      id: 'template',
      title: 'Template & Competencies',
      description: 'Choose the review template and shared competencies.',
    },
    {
      id: 'people',
      title: 'People',
      description: 'Choose who will be reviewed and who will review them.',
      validate: validatePeople,
    },
    { id: 'raters', title: 'Raters', description: 'Invite optional peer and upward feedback.' },
    {
      id: 'review',
      title: 'Review & Launch',
      description: 'Confirm the cycle before its atomic launch.',
    },
  ];

  const input = useMemo<MhdPerformanceCycleLaunchInput>(
    () => ({
      companyId,
      cycleName: cycleName.trim(),
      reviewType,
      reviewPeriodStart: periodStart,
      reviewPeriodEnd: periodEnd,
      selfAssessmentDue: blankToNull(selfAssessmentDue),
      feedbackDue: blankToNull(feedbackDue),
      reviewDue,
      templateId: blankToNull(templateId),
      includesSelfAssessment,
      isMultiRater,
      announcementNote: blankToNull(announcementNote),
      participants: effectiveCandidates.map((candidate) => ({
        personId: candidate.personId,
        reviewerUserId: reviewerOverrides[candidate.personId] ?? candidate.reviewerUserId ?? '',
        raters: isMultiRater
          ? activeSuggestions
              .filter((suggestion) => suggestion.subjectPersonId === candidate.personId)
              .map((suggestion) => ({
                personId: suggestion.raterPersonId,
                participantType: suggestion.participantType,
              }))
          : [],
      })),
      competencyIds,
    }),
    [
      activeSuggestions,
      announcementNote,
      competencyIds,
      companyId,
      cycleName,
      effectiveCandidates,
      feedbackDue,
      includesSelfAssessment,
      isMultiRater,
      periodEnd,
      periodStart,
      reviewerOverrides,
      reviewDue,
      reviewType,
      selfAssessmentDue,
      templateId,
    ],
  );

  const isDirty = Boolean(
    cycleName ||
    periodStart ||
    periodEnd ||
    selfAssessmentDue ||
    feedbackDue ||
    reviewDue ||
    announcementNote ||
    templateId ||
    competencyIds.length ||
    excluded.size ||
    Object.keys(reviewerOverrides).length ||
    scope !== 'all' ||
    !includesSelfAssessment ||
    isMultiRater,
  );
  const flow = useMhdWizardFlow({
    steps,
    isDirty,
    onSubmit: async () => {
      const result = await launch.mutateAsync(input);
      setLaunchResult(result);
    },
  });

  function resetPeopleChoices() {
    setExcluded(new Set());
    setReviewerOverrides({});
  }

  function toggleCompetency(id: string) {
    setCompetencyIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function togglePerson(personId: string) {
    setExcluded((current) => {
      const next = new Set(current);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }

  function removeRater(suggestion: MhdPerformanceCycleRaterSuggestion) {
    const next = new Set(activeRemoved);
    next.add(raterKey(suggestion));
    setRemovedRaters({ signature: raterSignature, keys: next });
  }

  function renderCycle() {
    return (
      <MhdFormFieldStack>
        <label className="block text-sm font-medium">
          Cycle name
          <input
            className={`mt-1 ${inputClass}`}
            value={cycleName}
            onChange={(event) => setCycleName(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Review type
          <select
            className={`mt-1 ${inputClass}`}
            value={reviewType}
            onChange={(event) => setReviewType(event.target.value as MhdPerformanceReviewType)}
          >
            {MHD_PERFORMANCE_REVIEW_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatPerformanceReviewType(type)}
              </option>
            ))}
          </select>
        </label>
        <MhdDateRow
          id="cycle-period-start"
          label="Review period start"
          value={periodStart}
          onChange={setPeriodStart}
        />
        <MhdDateRow
          id="cycle-period-end"
          label="Review period end"
          value={periodEnd}
          onChange={setPeriodEnd}
        />
        <MhdDateRow
          id="cycle-self-due"
          label="Self-assessment due"
          value={selfAssessmentDue}
          onChange={setSelfAssessmentDue}
          optional
        />
        <MhdDateRow
          id="cycle-feedback-due"
          label="Feedback due"
          value={feedbackDue}
          onChange={setFeedbackDue}
          optional
        />
        <MhdDateRow
          id="cycle-review-due"
          label="Reviews due"
          value={reviewDue}
          onChange={setReviewDue}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includesSelfAssessment}
            onChange={(event) => setIncludesSelfAssessment(event.target.checked)}
          />
          Each person completes a self-assessment
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isMultiRater}
            onChange={(event) => setIsMultiRater(event.target.checked)}
          />
          Collect 360 feedback from peers and direct reports
        </label>
        <label className="block text-sm font-medium">
          Announcement note (optional)
          <textarea
            className={`mt-1 min-h-24 ${inputClass}`}
            value={announcementNote}
            onChange={(event) => setAnnouncementNote(event.target.value)}
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Shown in the cycle announcement.
          </span>
        </label>
      </MhdFormFieldStack>
    );
  }

  function renderTemplate() {
    return (
      <MhdFormFieldStack>
        <label className="block text-sm font-medium">
          Template
          <select
            className={`mt-1 ${inputClass}`}
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          >
            <option value="">No template</option>
            {templateOptions.map((template) => (
              <option key={template.id} value={template.id}>
                {template.templateName}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-sm text-muted-foreground">
            Everyone gets the competencies of their own job description. Tick any to add for
            everyone.
          </p>
          <div className="mt-3 space-y-2">
            {(competenciesQuery.data ?? []).map((competency) => (
              <label key={competency.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={competencyIds.includes(competency.id)}
                  onChange={() => toggleCompetency(competency.id)}
                />
                <span>
                  {competency.competencyName}
                  {competency.category ? (
                    <small className="ml-2 text-muted-foreground">{competency.category}</small>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>
      </MhdFormFieldStack>
    );
  }

  function renderPeople() {
    return (
      <MhdFormFieldStack>
        <label className="block text-sm font-medium">
          Who
          <select
            className={`mt-1 ${inputClass}`}
            value={scope}
            onChange={(event) => {
              setScope(event.target.value as 'all' | 'manager');
              resetPeopleChoices();
            }}
          >
            <option value="all">Everyone in the company</option>
            <option value="manager">People who report to</option>
          </select>
        </label>
        {scope === 'manager' ? (
          <>
            <label className="block text-sm font-medium">
              Manager
              <select
                className={`mt-1 ${inputClass}`}
                value={rootPersonId}
                onChange={(event) => {
                  setRootPersonId(event.target.value);
                  resetPeopleChoices();
                }}
              >
                <option value="">Select a manager</option>
                {managers.map((candidate) => (
                  <option key={candidate.personId} value={candidate.personId}>
                    {candidate.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeIndirect}
                onChange={(event) => {
                  setIncludeIndirect(event.target.checked);
                  resetPeopleChoices();
                }}
              />
              Include everyone below them
            </label>
          </>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              setExcluded(
                new Set(
                  candidates
                    .filter((candidate) => !candidate.conflictingReviewReference)
                    .map((candidate) => candidate.personId),
                ),
              )
            }
          >
            Clear
          </Button>
          <Button variant="secondary" onClick={() => setExcluded(new Set())}>
            Select All
          </Button>
          <span className="text-sm text-muted-foreground">
            {chosenPersonIds.length} people chosen
          </span>
        </div>
        <MhdTable>
          <thead>
            <tr>
              <MhdTh /> <MhdTh>Name</MhdTh>
              <MhdTh>Job title</MhdTh>
              <MhdTh>Manager</MhdTh>
              <MhdTh>Competencies</MhdTh>
              <MhdTh>Reviewer</MhdTh>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => {
              const conflict = Boolean(candidate.conflictingReviewReference);
              return (
                <MhdTr key={candidate.personId}>
                  <MhdTd>
                    <input
                      type="checkbox"
                      aria-label={`Choose ${candidate.displayName}`}
                      checked={!conflict && !excluded.has(candidate.personId)}
                      disabled={conflict}
                      onChange={() => togglePerson(candidate.personId)}
                    />
                  </MhdTd>
                  <MhdTd>
                    {candidate.displayName}
                    {conflict ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Already covered by {candidate.conflictingReviewReference}
                      </span>
                    ) : null}
                  </MhdTd>
                  <MhdTd>{candidate.jobTitle ?? '—'}</MhdTd>
                  <MhdTd>{candidate.managerName ?? '—'}</MhdTd>
                  <MhdTd>
                    {candidate.hasPublishedJob
                      ? candidate.competencyCount
                      : 'No published job description'}
                  </MhdTd>
                  <MhdTd>
                    <select
                      className={inputClass}
                      aria-label={`Reviewer for ${candidate.displayName}`}
                      value={effectiveReviewer(candidate)}
                      disabled={conflict}
                      onChange={(event) =>
                        setReviewerOverrides((current) => ({
                          ...current,
                          [candidate.personId]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select a reviewer</option>
                      {reviewerUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.displayName}
                        </option>
                      ))}
                    </select>
                  </MhdTd>
                </MhdTr>
              );
            })}
          </tbody>
        </MhdTable>
      </MhdFormFieldStack>
    );
  }

  function renderRaters() {
    if (!isMultiRater)
      return <p className="text-sm text-muted-foreground">360 feedback is off for this cycle.</p>;
    const warningSubjects = chosenPersonIds
      .map((personId) => {
        const candidate = candidates.find((item) => item.personId === personId);
        const peerCount = activeSuggestions.filter(
          (item) => item.subjectPersonId === personId && item.participantType === 'PEER',
        ).length;
        const upwardCount = activeSuggestions.filter(
          (item) => item.subjectPersonId === personId && item.participantType === 'UPWARD',
        ).length;
        return candidate &&
          threshold > 0 &&
          ((peerCount > 0 && peerCount < threshold) || (upwardCount > 0 && upwardCount < threshold))
          ? candidate.displayName
          : null;
      })
      .filter((name): name is string => Boolean(name));
    return (
      <MhdFormFieldStack>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includePeers}
            onChange={(event) => setIncludePeers(event.target.checked)}
          />
          Ask peers (people with the same manager)
        </label>
        {includePeers ? (
          <label className="block text-sm font-medium">
            Most per person
            <input
              className={`mt-1 ${inputClass}`}
              type="number"
              min={1}
              max={20}
              value={maxPeers}
              onChange={(event) => setMaxPeers(event.target.value)}
            />
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeUpward}
            onChange={(event) => setIncludeUpward(event.target.checked)}
          />
          Ask direct reports to give upward feedback
        </label>
        {includeUpward ? (
          <label className="block text-sm font-medium">
            Most per person
            <input
              className={`mt-1 ${inputClass}`}
              type="number"
              min={1}
              max={20}
              value={maxUpward}
              onChange={(event) => setMaxUpward(event.target.value)}
            />
          </label>
        ) : null}
        <p className="text-sm text-muted-foreground">{activeSuggestions.length} raters suggested</p>
        {warningSubjects.map((name) => (
          <p key={name} className="text-sm text-amber-700">
            {name}: fewer than {threshold} raters of one kind - their answers will not be shown (the
            minimum protects anonymity).
          </p>
        ))}
        {Array.from(suggestionsBySubject.entries()).map(([subjectId, subjectSuggestions]) => {
          const subject = candidates.find((candidate) => candidate.personId === subjectId);
          return (
            <div key={subjectId} className="rounded-md border border-border p-3">
              <h3 className="font-medium">{subject?.displayName ?? subjectId}</h3>
              <div className="mt-2 space-y-2">
                {subjectSuggestions.map((suggestion) => (
                  <div
                    key={raterKey(suggestion)}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      {suggestion.raterName}{' '}
                      <span className="text-muted-foreground">
                        {raterKindLabel(suggestion.participantType)}
                      </span>
                    </span>
                    <Button variant="secondary" onClick={() => removeRater(suggestion)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </MhdFormFieldStack>
    );
  }

  function renderReview() {
    return (
      <div className="space-y-3 text-sm">
        <p>
          <strong>Name:</strong> {cycleName || 'Not set'}
        </p>
        <p>
          <strong>Type:</strong> {mhdFormatPerformanceReviewType(reviewType)}
        </p>
        <p>
          <strong>Period:</strong> {displayDate(periodStart)} – {displayDate(periodEnd)}
        </p>
        <p>
          <strong>Self-assessment due:</strong> {displayDate(selfAssessmentDue)}
        </p>
        <p>
          <strong>Feedback due:</strong> {displayDate(feedbackDue)}
        </p>
        <p>
          <strong>Reviews due:</strong> {displayDate(reviewDue)}
        </p>
        <p>
          <strong>Template:</strong> {selectedTemplate?.templateName ?? 'No template'}
        </p>
        <p>
          <strong>Additional competencies:</strong> {competencyIds.length}
        </p>
        <p>
          <strong>People:</strong> {chosenPersonIds.length}
        </p>
        <p>
          <strong>Self-assessment:</strong> {includesSelfAssessment ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>360 feedback:</strong>{' '}
          {isMultiRater ? `Yes (${activeSuggestions.length} raters)` : 'No'}
        </p>
        <p>
          <strong>Announcement note:</strong> {announcementNote || 'None'}
        </p>
      </div>
    );
  }

  const completion = launchResult ? (
    <div className="space-y-4">
      <MhdCard>
        <h2 className="text-xl font-semibold text-foreground">Cycle Launched</h2>
        <p className="mt-2 text-sm">Reference ID: {launchResult.referenceId}</p>
        <p className="text-sm">
          {launchResult.reviewCount} reviews created and {launchResult.participantCount} invitations
          sent.
        </p>
        <Button onClick={() => navigate('/performance/cycles')}>Open Cycles</Button>
      </MhdCard>
      <MhdWizardOutputStep
        companyId={companyId}
        sourceWizard="PERFORMANCE_CYCLE"
        templateKey="REVIEW_CYCLE_ANNOUNCEMENT"
        entityType="PERFORMANCE_CYCLE"
        entityId={launchResult.id}
        recordLabel="cycle announcement"
        allowEmployeeFile={false}
      />
    </div>
  ) : null;
  const body =
    flow.currentStep?.id === 'cycle'
      ? renderCycle()
      : flow.currentStep?.id === 'template'
        ? renderTemplate()
        : flow.currentStep?.id === 'people'
          ? renderPeople()
          : flow.currentStep?.id === 'raters'
            ? renderRaters()
            : renderReview();
  return (
    <MhdWizardShell
      title="Guided review cycle"
      description="Set the period and deadlines, choose what is reviewed and who is reviewed, invite raters, and launch the cycle."
      backTo="/performance"
      backLabel="Performance"
      cancelTo="/performance"
      flow={flow}
      completion={completion}
    >
      {body}
    </MhdWizardShell>
  );
}

export default MhdPerformanceCycleWizard;
