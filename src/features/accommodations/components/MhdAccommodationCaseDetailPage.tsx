import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { MhdAccommodationCaseRecordTabs } from '@/appshell/components/MhdAccommodationCaseRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  mhdAccommodationsCanSeeMedical,
  mhdAccommodationsIsPrivileged,
} from '@/appshell/mhdRouteAccess';
import {
  useMhdAccommodationCase,
  useMhdAccommodationDocumentTemplates,
  useMhdAccommodationDecision,
  useMhdAccommodationImplementation,
  useMhdAccommodationInteraction,
  useMhdAccommodationMedicalRecord,
  useMhdAccommodationMedicalReveal,
  useMhdAccommodationOption,
  useMhdAccommodationOptionCatalog,
  useMhdAccommodationReadiness,
  useMhdAccommodationReview,
  useMhdAccommodationTransition,
} from '../Hook';
import { mhdAccommodationDecisionBlockers, mhdAccommodationMedicalSchema } from '../Schemas';
import {
  MHD_ACCOMMODATION_DOCUMENTATION_STATUSES,
  MHD_ACCOMMODATION_DOCUMENTATION_TYPES,
  MHD_ACCOMMODATION_REQUEST_CHANNELS,
  MHD_ACCOMMODATION_STATUSES,
  mhdFormatAccommodationValue,
  type MhdAccommodationDocumentationStatus,
  type MhdAccommodationDocumentationType,
  type MhdAccommodationMedicalReveal,
  type MhdAccommodationRequestChannel,
  type MhdAccommodationStatus,
} from '../Types';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdAccommodationNoticesPanel } from './MhdAccommodationNoticesPanel';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
type Tab = 'process' | 'options' | 'decision' | 'implementation' | 'medical' | 'notices';

/**
 * accommodation_options.option_type is CHECK-constrained server-side
 * (accommodation_option_type_allowed, 0053) to a fixed enum, while the
 * option-catalog's own option_type (0186) is free text — a catalog entry's
 * title (e.g. "Adjustable-height desk") will not generally be one of the
 * allowed enum values. Picking a catalog entry therefore maps its broader
 * `category` to the nearest allowed case option_type (below) rather than
 * copying the catalog's free-text title into a constrained field, and folds
 * the catalog title into the prefilled description instead — both fields
 * remain fully editable afterward, never a locked template.
 */
const MHD_ACCOMMODATION_CATALOG_CATEGORY_TO_CASE_OPTION_TYPE: Record<string, string> = {
  SCHEDULE: 'SCHEDULE_CHANGE',
  EQUIPMENT: 'EQUIPMENT',
  FACILITIES: 'WORKSITE_CHANGE',
  JOB_RESTRUCTURING: 'JOB_RESTRUCTURING',
  REASSIGNMENT: 'REASSIGNMENT',
  LEAVE_RELATED: 'LEAVE',
  TECHNOLOGY: 'EQUIPMENT',
  POLICY_EXCEPTION: 'POLICY_MODIFICATION',
  OTHER: 'OTHER',
};

// Mirrors mhd_accommodation_transition's own transition graph (0053_reasonable
//_accommodations_module.sql): CLOSED is not a legal next state from EVALUATION
// or IMPLEMENTING, and a case already CLOSED can only reopen to
// INTERACTIVE_PROCESS. The Close Case action must not be offered outside this
// set — the RPC is the enforcement, this only avoids showing a button that
// would just raise 22023.
const MHD_ACCOMMODATION_CLOSABLE_STATUSES: readonly MhdAccommodationStatus[] = [
  'INTAKE',
  'INTERACTIVE_PROCESS',
  'DOCUMENTATION_PENDING',
  'DECIDED',
  'ACTIVE',
  'REVIEW_DUE',
];

export function MhdAccommodationCaseDetailPage() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { profile, roles } = useMhdAuth();
  const privileged = mhdAccommodationsIsPrivileged(roles);
  const canSeeMedical = mhdAccommodationsCanSeeMedical(roles);
  const detail = useMhdAccommodationCase(caseId);
  const optionCatalog = useMhdAccommodationOptionCatalog(profile?.companyId ?? null);
  const documentTemplates = useMhdAccommodationDocumentTemplates(profile?.companyId);
  const readiness = useMhdAccommodationReadiness();
  const transition = useMhdAccommodationTransition(caseId);
  const addInteraction = useMhdAccommodationInteraction(caseId);
  const addOption = useMhdAccommodationOption(caseId);
  const decide = useMhdAccommodationDecision(caseId);
  const implement = useMhdAccommodationImplementation(caseId);
  const completeReview = useMhdAccommodationReview(caseId);
  const recordMedical = useMhdAccommodationMedicalRecord(caseId);
  const revealMedical = useMhdAccommodationMedicalReveal();
  const [tab, setTab] = useState<Tab>('process');
  const [status, setStatus] = useState<MhdAccommodationStatus>('INTERACTIVE_PROCESS');
  const [transitionReason, setTransitionReason] = useState('');
  const [interactionChannel, setInteractionChannel] =
    useState<MhdAccommodationRequestChannel>('VERBAL');
  const [summary, setSummary] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [optionType, setOptionType] = useState('JOB_RESTRUCTURING');
  const [optionDescription, setOptionDescription] = useState('');
  const [catalogPickId, setCatalogPickId] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [effectiveness, setEffectiveness] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [outcome, setOutcome] = useState<'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED'>('APPROVED');
  const [decisionSummary, setDecisionSummary] = useState('');
  const [denialReason, setDenialReason] = useState('UNDUE_HARDSHIP');
  const [analysis, setAnalysis] = useState('');
  const [managerInstruction, setManagerInstruction] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [reviewDueDate, setReviewDueDate] = useState('');
  const [documentationType, setDocumentationType] =
    useState<MhdAccommodationDocumentationType>('SIMPLE_CERTIFICATION');
  const [documentationStatus, setDocumentationStatus] =
    useState<MhdAccommodationDocumentationStatus>('NOT_NEEDED');
  const [needIsObvious, setNeedIsObvious] = useState(false);
  const [documentationRequested, setDocumentationRequested] = useState(false);
  const [documentationRequestedAt, setDocumentationRequestedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [documentationDueDate, setDocumentationDueDate] = useState('');
  const [functionalLimitation, setFunctionalLimitation] = useState('');
  const [accommodationNeed, setAccommodationNeed] = useState('');
  const [revealed, setRevealed] = useState<Record<string, MhdAccommodationMedicalReveal>>({});
  const [error, setError] = useState<string | null>(null);
  const [closingCase, setClosingCase] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  const filteredCatalogOptions = (optionCatalog.data ?? []).filter((item) => {
    const search = catalogSearch.trim().toLowerCase();
    if (!search) return true;
    return [
      item.optionType,
      item.descriptionTemplate,
      mhdFormatAccommodationValue(item.category),
      ...(item.functionalLimitationTags ?? []).flatMap((tag) => [
        tag,
        mhdFormatAccommodationValue(tag),
      ]),
    ].some((value) => value.toLowerCase().includes(search));
  });

  const record = detail.data;
  if (detail.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!record) return <p className="text-sm text-muted-foreground">Case not found.</p>;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
  }

  const canCloseCase =
    privileged && MHD_ACCOMMODATION_CLOSABLE_STATUSES.includes(record.case.status);

  const activeDecision = record.decisions.find((item) => !item.superseded_at);
  // The option to implement is a DECIDED fact, not a UI fact. `selectedOptionId`
  // is only the draft state of the decision form and is empty after any reload,
  // so the active decision's selected_option_id is the source of truth and the
  // local draft is merely the fallback while a decision is still being composed.
  const implementableOptionId = activeDecision?.selected_option_id ?? selectedOptionId;
  const implementableOption = record.options.find((item) => item.id === implementableOptionId);
  const selectedDraftOption = record.options.find((item) => item.id === selectedOptionId);

  // Mirrors every 23514 mhd_accommodation_decide raises, so the operator reads
  // the reason rather than a database error. The RPC remains the enforcement.
  const decisionBlockers = mhdAccommodationDecisionBlockers({
    outcome,
    selectedOptionId: outcome === 'DENIED' ? null : selectedOptionId,
    individualizedAnalysis: outcome === 'DENIED' ? analysis : null,
    interactionCount: record.interactions.length,
    optionCount: record.options.length,
    selectedOptionRemovesEssentialFunction: Boolean(
      outcome !== 'DENIED' && selectedDraftOption?.removes_essential_function,
    ),
  });

  const medicalDraft = mhdAccommodationMedicalSchema.safeParse({
    documentationType,
    status: documentationStatus,
    needIsObvious,
    documentationRequested,
    requestedAt: documentationRequested ? documentationRequestedAt : null,
    dueDate: documentationRequested ? documentationDueDate || null : null,
    functionalLimitation: functionalLimitation || null,
    accommodationNeed: accommodationNeed || null,
  });
  const medicalBlockers = medicalDraft.success
    ? []
    : [...new Set(medicalDraft.error.issues.map((issue) => issue.message))];

  const tabs = [
    { value: 'process' as const, label: 'Interactive process', count: record.interactions.length },
    { value: 'notices' as const, label: 'Notices' },
    { value: 'options' as const, label: 'Options', count: record.options.length },
    { value: 'decision' as const, label: 'Decision', count: record.decisions.length },
    {
      value: 'implementation' as const,
      label: 'Implementation & review',
      count: record.implementations.length,
    },
    {
      value: 'medical' as const,
      label: 'Documentation status',
      count: record.medical_status.length,
    },
  ];

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/accommodations"
        backLabel="all accommodations"
        title={record.case.reference_id}
        description={`${mhdFormatAccommodationValue(record.case.request_source)} · ${new Date(
          record.case.requested_at,
        ).toLocaleDateString()} · ${mhdFormatAccommodationValue(record.case.status)}`}
      />

      <MhdAccommodationCaseRecordTabs
        caseId={record.case.id}
        active="detail"
        onDelete={canCloseCase ? () => setClosingCase(true) : undefined}
        deleteLabel="Close Case"
        skipConfirm
      />

      <MhdComplianceGateBanner readiness={readiness.data} />

      {closingCase ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader title="Close case" />
          <p className="text-xs text-muted-foreground">
            Closing is the audited cancel/withdraw path for this module — the case record and its
            interactive-process history are retained, not deleted. A reason is required.
          </p>
          <label className="text-sm font-medium">
            Reason <span className="font-normal text-muted-foreground">(required)</span>
            <input
              className={`mt-1 ${inputClass}`}
              value={closeReason}
              onChange={(event) => setCloseReason(event.target.value)}
              placeholder="Why is this case closing?"
            />
          </label>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={transition.isPending || !closeReason.trim()}
              onClick={() =>
                void run(async () => {
                  await transition.mutateAsync({ status: 'CLOSED', reason: closeReason });
                  setClosingCase(false);
                  setCloseReason('');
                })
              }
            >
              {transition.isPending ? 'Closing…' : 'Confirm Close Case'}
            </Button>
            <Button
              variant="secondary"
              disabled={transition.isPending}
              onClick={() => {
                setClosingCase(false);
                setCloseReason('');
              }}
            >
              Cancel
            </Button>
          </div>
        </MhdCard>
      ) : null}

      <MhdCard>
        <MhdCardHeader title="Request and job context" />
        <p className="text-sm text-foreground">{record.case.request_summary}</p>
        {record.case.leave_case_id ? (
          <p className="mt-2 text-sm">
            Linked leave:{' '}
            <Link
              className="text-accent-hover hover:underline"
              to={`/leaves/${record.case.leave_case_id}`}
            >
              open case
            </Link>
          </p>
        ) : null}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stamped essential functions
          </p>
          {record.case.essential_functions.length ? (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {record.case.essential_functions.map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-amber-700">
              No published job-description snapshot was available when this process opened.
            </p>
          )}
        </div>
      </MhdCard>

      {privileged ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader title="Workflow status" />
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium">
              Move to
              <select
                className={`mt-1 ${inputClass}`}
                value={status}
                onChange={(event) => setStatus(event.target.value as MhdAccommodationStatus)}
              >
                {MHD_ACCOMMODATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
            </label>
            {(status === 'CLOSED' || record.case.status === 'CLOSED') && (
              <label className="min-w-64 flex-1 text-sm font-medium">
                Closing or reopening reason
                <input
                  className={`mt-1 ${inputClass}`}
                  value={transitionReason}
                  onChange={(event) => setTransitionReason(event.target.value)}
                />
              </label>
            )}
            <Button
              disabled={transition.isPending}
              onClick={() =>
                void run(() =>
                  transition.mutateAsync({ status, reason: transitionReason || undefined }),
                )
              }
            >
              Update
            </Button>
          </div>
        </MhdCard>
      ) : null}

      <MhdTabs tabs={tabs} value={tab} onChange={setTab} />
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      {tab === 'notices' ? <MhdAccommodationNoticesPanel caseId={caseId} /> : null}

      {tab === 'process' ? (
        <div className="space-y-4">
          {record.interactions.map((item) => (
            <MhdCard key={item.id}>
              <div className="flex justify-between gap-3">
                <p className="font-medium">{mhdFormatAccommodationValue(item.channel)}</p>
                <time className="text-xs text-muted-foreground">
                  {new Date(item.occurred_at).toLocaleString()}
                </time>
              </div>
              <p className="mt-2 text-sm">{item.summary}</p>
              {item.next_step ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Next: {item.next_step}
                  {item.next_step_due ? ` · ${item.next_step_due}` : ''}
                </p>
              ) : null}
            </MhdCard>
          ))}
          {privileged ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="Record interaction" />
              <p className="text-xs text-muted-foreground">
                Record functional needs, alternatives, and next steps. Do not record a diagnosis,
                cause, genetic information, or medical history here.
              </p>
              <label className="text-sm font-medium">
                Channel
                <select
                  className={`mt-1 ${inputClass}`}
                  value={interactionChannel}
                  onChange={(event) =>
                    setInteractionChannel(event.target.value as MhdAccommodationRequestChannel)
                  }
                >
                  {MHD_ACCOMMODATION_REQUEST_CHANNELS.map((value) => (
                    <option key={value} value={value}>
                      {mhdFormatAccommodationValue(value)}
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                className={`min-h-24 ${inputClass}`}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="What was discussed and understood?"
              />
              <input
                className={inputClass}
                value={nextStep}
                onChange={(event) => setNextStep(event.target.value)}
                placeholder="Next step"
              />
              <Button
                disabled={addInteraction.isPending || !summary.trim()}
                onClick={() =>
                  void run(async () => {
                    await addInteraction.mutateAsync({
                      caseId,
                      occurredAt: new Date().toISOString(),
                      channel: interactionChannel,
                      summary,
                      nextStep,
                      employeeVisible: true,
                    });
                    setSummary('');
                    setNextStep('');
                  })
                }
              >
                Add interaction
              </Button>
            </MhdCard>
          ) : null}
        </div>
      ) : null}

      {tab === 'options' ? (
        <div className="space-y-4">
          {record.options.map((item) => (
            <MhdCard key={item.id}>
              <p className="font-medium">{mhdFormatAccommodationValue(item.option_type)}</p>
              <p className="mt-1 text-sm">{item.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Expected effectiveness: {item.expected_effectiveness} ·{' '}
                {mhdFormatAccommodationValue(item.disposition)}
              </p>
            </MhdCard>
          ))}
          {privileged ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader
                title="Evaluate an option"
                action={
                  <Link
                    to="/accommodations/option-library"
                    className="text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    Manage Option Library
                  </Link>
                }
              />
              {(optionCatalog.data ?? []).length > 0 ? (
                <>
                  <label className="block text-sm font-medium" htmlFor="mhd-accommodation-catalog-search">
                    Search accommodation ideas
                    <input
                      id="mhd-accommodation-catalog-search"
                      className={`mt-1 ${inputClass}`}
                      value={catalogSearch}
                      onChange={(event) => setCatalogSearch(event.target.value)}
                      placeholder="Search by limitation or keyword (e.g. lifting, concentration, hearing)…"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                  Start from catalog{' '}
                  <span className="font-normal text-muted-foreground">
                    (optional — pre-fills the fields below, which remain fully editable; this is a
                    starting point, never a locked template)
                  </span>
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={catalogPickId}
                    onChange={(event) => {
                      const pickedId = event.target.value;
                      setCatalogPickId(pickedId);
                      const picked = (optionCatalog.data ?? []).find((item) => item.id === pickedId);
                      if (picked) {
                        setOptionType(
                          MHD_ACCOMMODATION_CATALOG_CATEGORY_TO_CASE_OPTION_TYPE[picked.category] ??
                            'OTHER',
                        );
                        setOptionDescription(`${picked.optionType}: ${picked.descriptionTemplate}`);
                      }
                    }}
                  >
                    <option value="">Start from free text (default)…</option>
                    {filteredCatalogOptions.length ? (
                      filteredCatalogOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {mhdFormatAccommodationValue(item.category)} — {item.optionType}
                          {item.isLibrary ? ' (Global)' : ''}
                        </option>
                      ))
                    ) : (
                      <option disabled>No matching accommodation ideas — try a different term.</option>
                    )}
                  </select>
                  </label>
                </>
              ) : null}
              <select
                className={inputClass}
                value={optionType}
                onChange={(event) => {
                  setCatalogPickId('');
                  setOptionType(event.target.value);
                }}
              >
                {[
                  'JOB_RESTRUCTURING',
                  'MODIFIED_SCHEDULE',
                  'LEAVE',
                  'EQUIPMENT',
                  'ACCESSIBILITY',
                  'REASSIGNMENT',
                  'REMOTE_WORK',
                  'OTHER',
                ].map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
              <textarea
                className={`min-h-20 ${inputClass}`}
                value={optionDescription}
                onChange={(event) => setOptionDescription(event.target.value)}
                placeholder="Option description"
              />
              <input
                className={inputClass}
                value={effectiveness}
                onChange={(event) => setEffectiveness(event.target.value)}
                placeholder="Expected effectiveness"
              />
              <Button
                disabled={addOption.isPending || !optionDescription.trim() || !effectiveness.trim()}
                onClick={() =>
                  void run(async () => {
                    await addOption.mutateAsync({
                      caseId,
                      optionType,
                      description: optionDescription,
                      expectedEffectiveness: effectiveness,
                      essentialFunctionIds: [],
                      employeePreference: false,
                    });
                    setOptionDescription('');
                    setEffectiveness('');
                  })
                }
              >
                Add option
              </Button>
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  JAN (a free, U.S. Department of Labor-funded service) maintains a much larger,
                  continually updated accommodation-ideas database.
                  <br />
                  <a
                    href="https://askjan.org/soar.cfm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hover"
                  >
                    Search the Job Accommodation Network (JAN) for more ideas
                  </a>
                </p>
                {documentTemplates.data?.length ? (
                  <div>
                    <MhdCardHeader title="Document templates" />
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                      {documentTemplates.data.map((entry) => (
                        <li key={entry.id}>
                          <Link className="text-accent hover:underline" to={`/forms/${entry.id}/render`}>
                            {entry.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </MhdCard>
          ) : null}
        </div>
      ) : null}

      {tab === 'decision' ? (
        <div className="space-y-4">
          {activeDecision ? (
            <MhdCard>
              <p className="font-semibold">{mhdFormatAccommodationValue(activeDecision.outcome)}</p>
              <p className="mt-2 text-sm">{activeDecision.decision_summary}</p>
              {activeDecision.denial_reason_code ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Reason: {mhdFormatAccommodationValue(activeDecision.denial_reason_code)}
                </p>
              ) : null}
            </MhdCard>
          ) : null}
          {privileged ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="Record decision" />
              {decisionBlockers.length ? (
                <ul className="list-disc space-y-1 rounded-md bg-amber-50 p-3 pl-8 text-sm text-amber-800">
                  {decisionBlockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              ) : null}
              <select
                className={inputClass}
                value={outcome}
                onChange={(event) =>
                  setOutcome(event.target.value as 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED')
                }
              >
                <option value="APPROVED">Approved</option>
                <option value="PARTIALLY_APPROVED">Partially approved</option>
                <option value="DENIED">Denied</option>
              </select>
              {outcome !== 'DENIED' ? (
                <select
                  className={inputClass}
                  value={selectedOptionId}
                  onChange={(event) => setSelectedOptionId(event.target.value)}
                >
                  <option value="">Select approved option…</option>
                  {/*
                   * An option that removes an essential function is listed but
                   * never selectable — mhd_accommodation_decide rejects it with
                   * 23514, and removing an essential function is not a
                   * reasonable accommodation.
                   */}
                  {record.options.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.removes_essential_function}
                    >
                      {mhdFormatAccommodationValue(item.option_type)} — {item.description}
                      {item.removes_essential_function ? ' (removes an essential function)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <select
                    className={inputClass}
                    value={denialReason}
                    onChange={(event) => setDenialReason(event.target.value)}
                  >
                    <option value="UNDUE_HARDSHIP">Undue hardship</option>
                    <option value="DIRECT_THREAT">Direct threat</option>
                    <option value="NO_COVERED_DISABILITY">No covered disability</option>
                    <option value="NO_REASONABLE_OPTION">No reasonable effective option</option>
                  </select>
                  <textarea
                    className={`min-h-24 ${inputClass}`}
                    value={analysis}
                    onChange={(event) => setAnalysis(event.target.value)}
                    placeholder="Individualized analysis and alternatives considered"
                  />
                </>
              )}
              <textarea
                className={`min-h-20 ${inputClass}`}
                value={decisionSummary}
                onChange={(event) => setDecisionSummary(event.target.value)}
                placeholder="Decision summary"
              />
              <Button
                disabled={
                  decide.isPending || !decisionSummary.trim() || decisionBlockers.length > 0
                }
                onClick={() =>
                  void run(() =>
                    decide.mutateAsync({
                      caseId,
                      outcome,
                      decisionSummary,
                      selectedOptionId: outcome === 'DENIED' ? null : selectedOptionId,
                      denialReasonCode: outcome === 'DENIED' ? denialReason : null,
                      individualizedAnalysis: outcome === 'DENIED' ? analysis : null,
                      alternativesConsidered: outcome === 'DENIED',
                      interactiveProcessContinues:
                        outcome === 'DENIED' && denialReason === 'UNDUE_HARDSHIP',
                    }),
                  )
                }
              >
                Record decision
              </Button>
            </MhdCard>
          ) : null}
        </div>
      ) : null}

      {tab === 'implementation' ? (
        <div className="space-y-4">
          {record.implementations.map((item) => (
            <MhdCard key={item.id}>
              <p className="font-medium">{item.manager_instruction}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.start_date}
                {item.end_date ? ` → ${item.end_date}` : ''} · {item.status}
              </p>
            </MhdCard>
          ))}
          {privileged && implementableOptionId && implementableOption ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="Implement selected option" />
              <p className="text-sm">{implementableOption.description}</p>
              <textarea
                className={`min-h-20 ${inputClass}`}
                value={managerInstruction}
                onChange={(event) => setManagerInstruction(event.target.value)}
                placeholder="Manager-safe implementation instruction—no medical facts"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <MhdDateField
                  className={inputClass}
                  value={startDate}
                  onChange={(nextValue) => setStartDate(nextValue)}
                />
                <MhdDateField
                  className={inputClass}
                  value={reviewDueDate}
                  onChange={(nextValue) => setReviewDueDate(nextValue)}
                />
              </div>
              <Button
                disabled={implement.isPending || !managerInstruction.trim()}
                onClick={() =>
                  void run(() =>
                    implement.mutateAsync({
                      caseId,
                      optionId: implementableOptionId,
                      startDate,
                      managerInstruction,
                      reviewDueDate: reviewDueDate || null,
                    }),
                  )
                }
              >
                Activate accommodation
              </Button>
            </MhdCard>
          ) : null}
          {record.reviews.map((review) => (
            <MhdCard key={review.id}>
              <p className="font-medium">Effectiveness review due {review.due_date}</p>
              {review.completed_at ? (
                <p className="mt-1 text-sm">{review.summary}</p>
              ) : privileged ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={completeReview.isPending}
                    onClick={() =>
                      void run(() =>
                        completeReview.mutateAsync({
                          reviewId: review.id,
                          effectiveness: 'EFFECTIVE',
                          summary: 'Accommodation remains effective.',
                          reengageRequired: false,
                        }),
                      )
                    }
                  >
                    Mark effective
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={completeReview.isPending}
                    onClick={() =>
                      void run(() =>
                        completeReview.mutateAsync({
                          reviewId: review.id,
                          // INEFFECTIVE, not a free-form label: the
                          // accommodation_review_effectiveness_allowed CHECK
                          // admits only EFFECTIVE / PARTIALLY_EFFECTIVE /
                          // INEFFECTIVE / NO_LONGER_NEEDED.
                          effectiveness: 'INEFFECTIVE',
                          summary: 'Re-engage in the interactive process.',
                          reengageRequired: true,
                        }),
                      )
                    }
                  >
                    Re-engage
                  </Button>
                </div>
              ) : null}
            </MhdCard>
          ))}
        </div>
      ) : null}

      {tab === 'medical' ? (
        <MhdCard>
          <MhdCardHeader title="Documentation status" />
          <p className="text-sm text-muted-foreground">
            This page never displays a diagnosis, causation statement, or medical record. Medical
            administrators may manage encrypted functional limitations and accommodation need in the
            restricted record.
          </p>
          {!canSeeMedical ? (
            <p className="mt-3 text-sm text-amber-700">
              Restricted medical content is unavailable to your role.
            </p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {record.medical_status.map((item) => (
              <li key={item.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {mhdFormatAccommodationValue(item.documentation_type)} ·{' '}
                    {mhdFormatAccommodationValue(item.status)}
                    {item.need_is_obvious
                      ? ' · Need recorded as obvious; documentation not requested'
                      : ''}
                  </span>
                  {canSeeMedical ? (
                    <Button
                      variant="secondary"
                      disabled={revealMedical.isPending}
                      onClick={() =>
                        void run(async () => {
                          const revealed = await revealMedical.mutateAsync(item.id);
                          setRevealed((current) => ({ ...current, [item.id]: revealed }));
                        })
                      }
                    >
                      Reveal Restricted Record
                    </Button>
                  ) : null}
                </div>
                {revealed[item.id] ? (
                  <dl className="mt-3 space-y-2 rounded-md bg-muted p-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Functional limitation
                      </dt>
                      <dd>{revealed[item.id]?.functional_limitation ?? 'Not recorded'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Accommodation need
                      </dt>
                      <dd>{revealed[item.id]?.accommodation_need ?? 'Not recorded'}</dd>
                    </div>
                  </dl>
                ) : null}
              </li>
            ))}
          </ul>

          {canSeeMedical ? (
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <MhdCardHeader title="Record Restricted Medical Status" />
              <p className="text-xs text-muted-foreground">
                Enter only the functional limitation and the accommodation need. Both are encrypted
                at rest and every reveal is audited. A diagnosis, cause, complete medical record, or
                genetic information must never be entered here.
              </p>
              {medicalBlockers.length ? (
                <ul className="list-disc space-y-1 rounded-md bg-amber-50 p-3 pl-8 text-sm text-amber-800">
                  {medicalBlockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium">
                  Documentation type
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={documentationType}
                    onChange={(event) =>
                      setDocumentationType(event.target.value as MhdAccommodationDocumentationType)
                    }
                  >
                    {MHD_ACCOMMODATION_DOCUMENTATION_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {mhdFormatAccommodationValue(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Status
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={documentationStatus}
                    onChange={(event) =>
                      setDocumentationStatus(
                        event.target.value as MhdAccommodationDocumentationStatus,
                      )
                    }
                  >
                    {MHD_ACCOMMODATION_DOCUMENTATION_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {mhdFormatAccommodationValue(value)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={needIsObvious}
                  onChange={(event) => {
                    setNeedIsObvious(event.target.checked);
                    // The two are mutually exclusive by law and by CHECK
                    // constraint; marking the need obvious withdraws any request.
                    if (event.target.checked) setDocumentationRequested(false);
                  }}
                />
                Disability and need for accommodation are obvious
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={documentationRequested}
                  disabled={needIsObvious}
                  onChange={(event) => setDocumentationRequested(event.target.checked)}
                />
                Documentation requested
                {needIsObvious ? (
                  <span className="text-xs text-muted-foreground">
                    Unavailable — documentation cannot be requested for an obvious need.
                  </span>
                ) : null}
              </label>
              {documentationRequested ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-medium">
                    Requested on
                    <MhdDateField
                      className={`mt-1 ${inputClass}`}
                      value={documentationRequestedAt}
                      onChange={(nextValue) => setDocumentationRequestedAt(nextValue)}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Due
                    <MhdDateField
                      className={`mt-1 ${inputClass}`}
                      value={documentationDueDate}
                      onChange={(nextValue) => setDocumentationDueDate(nextValue)}
                    />
                  </label>
                </div>
              ) : null}
              <textarea
                className={`min-h-20 ${inputClass}`}
                value={functionalLimitation}
                onChange={(event) => setFunctionalLimitation(event.target.value)}
                placeholder="Functional limitation — what the employee currently cannot do"
                aria-label="Functional limitation"
              />
              <textarea
                className={`min-h-20 ${inputClass}`}
                value={accommodationNeed}
                onChange={(event) => setAccommodationNeed(event.target.value)}
                placeholder="Accommodation need — the workplace change that would help"
                aria-label="Accommodation need"
              />
              <Button
                disabled={recordMedical.isPending || medicalBlockers.length > 0}
                onClick={() =>
                  void run(async () => {
                    await recordMedical.mutateAsync({
                      caseId,
                      documentationType,
                      status: documentationStatus,
                      needIsObvious,
                      documentationRequested,
                      requestedAt: documentationRequested ? documentationRequestedAt : null,
                      dueDate: documentationRequested ? documentationDueDate || null : null,
                      functionalLimitation: functionalLimitation || null,
                      accommodationNeed: accommodationNeed || null,
                    });
                    setFunctionalLimitation('');
                    setAccommodationNeed('');
                  })
                }
              >
                Record Restricted Status
              </Button>
            </div>
          ) : null}
        </MhdCard>
      ) : null}

      {canCloseCase ? (
        <div className="flex justify-end border-t border-border pt-4">
          <MhdDetailActions
            deleteLabel="Close Case"
            onDelete={() => setClosingCase(true)}
            skipConfirm
          />
        </div>
      ) : null}
    </div>
  );
}
