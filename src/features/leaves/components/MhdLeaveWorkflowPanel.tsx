import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdDocumentService } from '@/features/documents/Service';
import { mhdFormatDate, mhdFormatDateTime, mhdToIsoDateString } from '@/utils/mhdDateFormat';
import {
  useMhdConfirmLeaveEligibility,
  useMhdLeaveBenefitObligation,
  useMhdLeaveBenefitObligationStatus,
  useMhdLeaveBenefitTransaction,
  useMhdLeaveBondingEvent,
  useMhdLeaveDesignatedPerson,
  useMhdLeaveDesignatedPersonVoid,
  useMhdLeaveEligibility,
  useMhdLeaveEssentialFunctions,
  useMhdLeaveEvent,
  useMhdLeaveKeyEmployee,
  useMhdLeaveNotice,
  useMhdLeaveNoticeDelivery,
  useMhdLeavePaySource,
  useMhdLeavePaySourceStatus,
  useMhdLeaveReadiness,
  useMhdLeaveReturnToWork,
  useMhdLeaveSegment,
  useMhdLeaveSegmentStatus,
  useMhdLeaveWorkersComp,
  useMhdLeaveWorkflow,
  useMhdOverrideLeaveEligibility,
} from '../WorkflowHook';
import {
  MHD_LEAVE_BONDING_EVENT_TYPES,
  MHD_LEAVE_FAMILY_RELATIONSHIPS,
  MHD_LEAVE_NOTICE_TYPES,
  MHD_LEAVE_REASON_CODES,
  type MhdLeaveBondingEventType,
  type MhdLeaveDeadline,
  type MhdLeaveDeadlineKind,
  type MhdLeaveNoticeType,
} from '../WorkflowTypes';
import { MhdLeaveBenefitTransactionList } from './MhdLeaveBenefitTransactionList';
import { MhdLeaveCaseControlsPanel } from './MhdLeaveCaseControlsPanel';
import { MhdLeaveChecklistPanel } from './MhdLeaveChecklistPanel';
import { MhdLeaveDeadlineBadge } from './MhdLeaveDeadlineBadge';
import { MhdLeaveDesignatedPersonPanel } from './MhdLeaveDesignatedPersonPanel';
import { MhdLeavePayCoordinationPanel } from './MhdLeavePayCoordinationPanel';
import {
  MhdLeaveBenefitObligationForm,
  MhdLeaveBenefitTransactionForm,
  MhdLeaveReturnToWorkForm,
  MhdLeaveSegmentForm,
} from './MhdLeaveWorkflowForms';
import {
  MhdLeaveBenefitObligationStatusControl,
  MhdLeaveSegmentStatusControl,
} from './MhdLeaveWorkflowStatusControls';
import {
  MHD_LEAVE_CONTINUATION_BASIS_LABELS,
  MHD_LEAVE_NOTICE_DEADLINE_KINDS,
  mhdLeaveEnumLabel,
  mhdLeaveFindingMessage,
  mhdLeavePick,
} from './mhdLeaveLabels';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
type Tab =
  | 'eligibility'
  | 'checklist'
  | 'notices'
  | 'schedule'
  | 'communications'
  | 'pay'
  | 'benefits'
  | 'return'
  | 'controls';

/** Yes / No / Unknown for an adult child's self-care; Unknown sends nothing. */
const SELF_CARE_ANSWERS = ['UNKNOWN', 'YES', 'NO'] as const;
type SelfCareAnswer = (typeof SELF_CARE_ANSWERS)[number];

/** The outcomes a documented override may record (mhd_leave_eligibility_override). */
const OVERRIDE_OUTCOMES = ['ELIGIBLE', 'INELIGIBLE', 'UNDETERMINED'] as const;
type OverrideOutcome = (typeof OVERRIDE_OUTCOMES)[number];

/** Every deadline kind an issued notice can close, for the Notices tab's deadline strip. */
const NOTICE_DEADLINE_KINDS: ReadonlySet<MhdLeaveDeadlineKind> = new Set(
  Object.values(MHD_LEAVE_NOTICE_DEADLINE_KINDS).flat(),
);

function findingCode(finding: Record<string, unknown>): string {
  return typeof finding.code === 'string' ? finding.code : 'Review finding';
}

function DeadlineStrip({ deadlines, empty }: { deadlines: MhdLeaveDeadline[]; empty: string }) {
  if (!deadlines.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {deadlines.map((deadline) => (
        <MhdLeaveDeadlineBadge key={deadline.id} deadline={deadline} />
      ))}
    </div>
  );
}

export function MhdLeaveWorkflowPanel({
  caseId,
  privileged,
}: {
  caseId: string;
  privileged: boolean;
}) {
  const workflow = useMhdLeaveWorkflow(caseId);
  const { authUserId, profile } = useMhdAuth();
  const templates = useQuery({
    queryKey: ['mhd-leaves', 'document-templates', profile?.companyId ?? ''],
    queryFn: () =>
      mhdDocumentService.listTemplates(profile!.companyId, undefined, false, 'LEAVE_CASE'),
    enabled: Boolean(profile?.companyId),
  });
  const readiness = useMhdLeaveReadiness();
  const evaluate = useMhdLeaveEligibility(caseId);
  const confirm = useMhdConfirmLeaveEligibility(caseId);
  const override = useMhdOverrideLeaveEligibility(caseId);
  const event = useMhdLeaveEvent(caseId);
  const returnToWork = useMhdLeaveReturnToWork(caseId);
  const recordNotice = useMhdLeaveNotice(caseId);
  const markNoticeDelivery = useMhdLeaveNoticeDelivery(caseId);
  const recordSegment = useMhdLeaveSegment(caseId);
  const updateSegmentStatus = useMhdLeaveSegmentStatus(caseId);
  const recordObligation = useMhdLeaveBenefitObligation(caseId);
  const updateObligationStatus = useMhdLeaveBenefitObligationStatus(caseId);
  const recordTransaction = useMhdLeaveBenefitTransaction(caseId);
  const bondingEvent = useMhdLeaveBondingEvent(caseId);
  const designatedPerson = useMhdLeaveDesignatedPerson(caseId);
  const voidDesignatedPerson = useMhdLeaveDesignatedPersonVoid(caseId);
  const paySource = useMhdLeavePaySource(caseId);
  const paySourceStatus = useMhdLeavePaySourceStatus(caseId);
  const workersComp = useMhdLeaveWorkersComp(caseId);
  const keyEmployee = useMhdLeaveKeyEmployee(caseId);
  const essentialFunctions = useMhdLeaveEssentialFunctions(caseId);
  const [tab, setTab] = useState<Tab>('eligibility');
  // null = not chosen yet, so the case's own recorded value is used.
  const [reasonChoice, setReasonChoice] = useState<string | null>(null);
  const [relationshipChoice, setRelationshipChoice] = useState<string | null>(null);
  const [selfCare, setSelfCare] = useState<SelfCareAnswer>('UNKNOWN');
  const [bondingDateChoice, setBondingDateChoice] = useState<string | null>(null);
  const [bondingTypeChoice, setBondingTypeChoice] = useState<MhdLeaveBondingEventType | '' | null>(
    null,
  );
  const [employerAgreedBonding, setEmployerAgreedBonding] = useState(false);
  const [employerCount, setEmployerCount] = useState('');
  const [worksiteCount, setWorksiteCount] = useState('');
  const [months, setMonths] = useState('');
  const [hours, setHours] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [coveredEmployerOverride, setCoveredEmployerOverride] = useState(false);
  const [eventSummary, setEventSummary] = useState('');
  const [overriding, setOverriding] = useState<string | null>(null);
  const [overrideOutcome, setOverrideOutcome] = useState<OverrideOutcome>('ELIGIBLE');
  const [overrideReason, setOverrideReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newNoticeOpen, setNewNoticeOpen] = useState(false);
  const [noticeType, setNoticeType] = useState<MhdLeaveNoticeType>('ELIGIBILITY');
  const [templateKey, setTemplateKey] = useState('');

  const record = workflow.data;
  const countFactsEntered = [employerCount, worksiteCount, months, hours].every(
    (value) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
  );
  const factsComplete = countFactsEntered && weeklyHours.trim() !== '' && Number(weeklyHours) > 0;
  if (workflow.isLoading) return <p className="text-sm text-muted-foreground">Loading workflow…</p>;
  if (!record) return null;

  // Resolves the action's value, or null after showing the refusal, so a form can keep its
  // input when the RPC says no.
  async function attempt<T>(action: () => Promise<T>): Promise<{ value: T } | null> {
    setError(null);
    try {
      return { value: await action() };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The workflow action failed.');
      return null;
    }
  }
  async function run(action: () => Promise<unknown>): Promise<boolean> {
    return (await attempt(action)) !== null;
  }

  const reasonCode = reasonChoice ?? record.case.reason_code ?? 'OWN_SERIOUS_HEALTH_CONDITION';
  const relationship = relationshipChoice ?? record.case.family_relationship ?? '';
  const bondingDate = bondingDateChoice ?? record.case.bonding_event_date ?? '';
  const bondingType = bondingTypeChoice ?? record.case.bonding_event_type ?? '';
  const intermittent = record.case.is_intermittent || record.case.requested_mode === 'INTERMITTENT';
  const isBonding = reasonCode === 'BONDING';
  const showDesignatedPersons =
    relationship === 'DESIGNATED_PERSON' || record.designated_persons.length > 0;
  // Templates without a stable key cannot be named by a notice (the database refuses a uuid).
  const keyedTemplates = (templates.data ?? []).filter((template) => template.templateKey);
  const noticeDeadlines = record.deadlines.filter((deadline) =>
    NOTICE_DEADLINE_KINDS.has(deadline.deadline_kind),
  );
  const closedBySelectedNotice = MHD_LEAVE_NOTICE_DEADLINE_KINDS[noticeType] ?? [];
  const selectedNoticeDeadlines = record.deadlines.filter((deadline) =>
    closedBySelectedNotice.includes(deadline.deadline_kind),
  );

  const tabs = [
    { value: 'eligibility' as const, label: 'Eligibility', count: record.eligibility.length },
    { value: 'checklist' as const, label: 'Checklist', count: record.checklist.length },
    { value: 'notices' as const, label: 'Notices', count: record.notices.length },
    { value: 'schedule' as const, label: 'Schedule', count: record.segments.length },
    { value: 'communications' as const, label: 'Contacts', count: record.events.length },
    { value: 'pay' as const, label: 'Pay', count: record.pay_sources.length },
    { value: 'benefits' as const, label: 'Benefits', count: record.benefits.length },
    { value: 'return' as const, label: 'Return To Work' },
    { value: 'controls' as const, label: 'Controls' },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Leave Workflow</h2>
        <p className="text-xs text-muted-foreground">
          Versioned eligibility, legal deadlines, notices, usage, pay, benefits, and return-to-work
          facts.
        </p>
      </div>
      <MhdComplianceGateBanner readiness={readiness.data} />
      <MhdTabs tabs={tabs} value={tab} onChange={setTab} />
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      {tab === 'eligibility' ? (
        <div className="space-y-3">
          {record.eligibility.map((item) => (
            <MhdCard key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.type_key}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.effective_outcome} ·{' '}
                    {item.entitlement_hours == null
                      ? 'No entitlement calculated'
                      : `${item.entitlement_hours} hours`}
                  </p>
                </div>
                {privileged && !item.confirmed_at ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={confirm.isPending}
                      onClick={() => void run(() => confirm.mutateAsync(item.snapshot_id))}
                    >
                      Confirm Determination
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={override.isPending}
                      onClick={() => setOverriding(overriding === item.id ? null : item.id)}
                    >
                      Override
                    </Button>
                  </div>
                ) : null}
              </div>
              {/*
               * The evaluated outcome and its findings stay on the record even
               * after an override — they are the evidence the override departed
               * from, not a draft it replaced.
               */}
              <dl>
                <MhdDetailField
                  label="Findings"
                  value={
                    item.findings.length ? (
                      <ul className="list-disc space-y-1 pl-5">
                        {item.findings.map((finding, index) => (
                          <li key={`${findingCode(finding)}-${index}`}>
                            {mhdLeaveFindingMessage(findingCode(finding))}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'No findings'
                    )
                  }
                  className="mt-2"
                />
                <MhdDetailField
                  label="Override reason"
                  value={
                    item.override_reason
                      ? `Overridden from ${item.evaluated_outcome}: ${item.override_reason}`
                      : null
                  }
                  className="mt-2"
                />
              </dl>
              {privileged && overriding === item.id ? (
                <div className="mt-3 space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    An override is a documented human decision. The evaluated outcome, findings, and
                    rule-set version remain on the record.
                  </p>
                  <select
                    className={inputClass}
                    value={overrideOutcome}
                    onChange={(e) =>
                      setOverrideOutcome(
                        mhdLeavePick(OVERRIDE_OUTCOMES, e.target.value) ?? 'ELIGIBLE',
                      )
                    }
                    aria-label="Override outcome"
                  >
                    {OVERRIDE_OUTCOMES.map((value) => (
                      <option key={value} value={value}>
                        {mhdLeaveEnumLabel(value)}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={`min-h-20 ${inputClass}`}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Why the determination is being overridden"
                    aria-label="Override reason"
                  />
                  <Button
                    disabled={override.isPending || !overrideReason.trim()}
                    onClick={() =>
                      void run(async () => {
                        await override.mutateAsync({
                          determinationId: item.id,
                          effectiveOutcome: overrideOutcome,
                          overrideReason,
                        });
                        setOverrideReason('');
                        setOverriding(null);
                      })
                    }
                  >
                    Record Override
                  </Button>
                </div>
              ) : null}
            </MhdCard>
          ))}

          {isBonding ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="Bonding Event" />
              <p className="text-xs text-muted-foreground">
                Bonding leave runs from the birth, adoption or foster placement and must be taken
                within 12 months of it.
              </p>
              <dl className="grid gap-2 sm:grid-cols-2">
                <MhdDetailField
                  label="Recorded event date"
                  value={record.case.bonding_event_date}
                />
                <MhdDetailField
                  label="Recorded event type"
                  value={
                    record.case.bonding_event_type
                      ? mhdLeaveEnumLabel(record.case.bonding_event_type)
                      : null
                  }
                />
              </dl>
              {privileged ? (
                <div className="space-y-3 border-t border-border pt-3">
                  <MhdFormFieldStack>
                    <label className="block text-xs">
                      Bonding event date
                      <MhdDateField
                        className={`mt-1 ${inputClass}`}
                        value={bondingDate}
                        onChange={setBondingDateChoice}
                      />
                    </label>
                    <label className="block text-xs">
                      Bonding event type
                      <select
                        className={`mt-1 ${inputClass}`}
                        value={bondingType}
                        onChange={(e) =>
                          setBondingTypeChoice(
                            mhdLeavePick(MHD_LEAVE_BONDING_EVENT_TYPES, e.target.value) ?? '',
                          )
                        }
                      >
                        <option value="">Select an event type</option>
                        {MHD_LEAVE_BONDING_EVENT_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {mhdLeaveEnumLabel(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </MhdFormFieldStack>
                  <Button
                    disabled={bondingEvent.isPending || !bondingDate || !bondingType}
                    onClick={() => {
                      if (!bondingType) return;
                      void run(() =>
                        bondingEvent.mutateAsync({
                          caseId,
                          eventDate: bondingDate,
                          eventType: bondingType,
                        }),
                      );
                    }}
                  >
                    Save Bonding Event
                  </Button>
                </div>
              ) : null}
            </MhdCard>
          ) : null}

          {showDesignatedPersons ? (
            <MhdLeaveDesignatedPersonPanel
              caseId={caseId}
              persons={record.designated_persons}
              familyRelationship={relationship}
              limitDesignatedPerson={record.policy.limit_designated_person}
              privileged={privileged}
              isPending={designatedPerson.isPending || voidDesignatedPerson.isPending}
              onRecord={(input) => run(() => designatedPerson.mutateAsync(input))}
              onVoid={(input) => run(() => voidDesignatedPerson.mutateAsync(input))}
            />
          ) : null}

          {privileged ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="Evaluate Current Facts" />
              <p className="text-xs text-muted-foreground">
                The engine evaluates each legal basis separately. CFRA does not use a 75-mile test;
                that count is used only for FMLA. A human must confirm every result.
              </p>
              <MhdFormFieldStack>
                <label className="block text-xs">
                  Leave reason
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={reasonCode}
                    onChange={(e) => setReasonChoice(e.target.value)}
                  >
                    {MHD_LEAVE_REASON_CODES.map((value) => (
                      <option key={value} value={value}>
                        {mhdLeaveEnumLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  Family relationship
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={relationship}
                    onChange={(e) => setRelationshipChoice(e.target.value)}
                  >
                    <option value="">No family relationship</option>
                    {MHD_LEAVE_FAMILY_RELATIONSHIPS.map((value) => (
                      <option key={value} value={value}>
                        {mhdLeaveEnumLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                {relationship === 'CHILD_ADULT' ? (
                  <div>
                    <label className="block text-xs">
                      Incapable Of Self-Care
                      <select
                        className={`mt-1 ${inputClass}`}
                        value={selfCare}
                        onChange={(e) =>
                          setSelfCare(mhdLeavePick(SELF_CARE_ANSWERS, e.target.value) ?? 'UNKNOWN')
                        }
                      >
                        {SELF_CARE_ANSWERS.map((value) => (
                          <option key={value} value={value}>
                            {mhdLeaveEnumLabel(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      FMLA covers care of an adult child only when the child is incapable of
                      self-care. Leave it Unknown until that is established.
                    </p>
                  </div>
                ) : null}
                {isBonding && intermittent ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={employerAgreedBonding}
                      onChange={(e) => setEmployerAgreedBonding(e.target.checked)}
                    />
                    Employer Agrees To Intermittent Bonding
                  </label>
                ) : null}
                <label className="block text-xs">
                  Scheduled weekly hours
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                  />
                </label>
                <label className="block text-xs">
                  Employer employee count
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={employerCount}
                    onChange={(e) => setEmployerCount(e.target.value)}
                  />
                </label>
                <label className="block text-xs">
                  FMLA worksite count within 75 miles
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={worksiteCount}
                    onChange={(e) => setWorksiteCount(e.target.value)}
                  />
                </label>
                <label className="block text-xs">
                  Months of service
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                  />
                </label>
                <label className="block text-xs">
                  Hours worked in prior 12 months
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </label>
              </MhdFormFieldStack>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={coveredEmployerOverride}
                  onChange={(e) => setCoveredEmployerOverride(e.target.checked)}
                />{' '}
                Covered employer override (record only for a verified public agency/school or other
                covered-employer basis)
              </label>
              {!factsComplete ? (
                <p className="text-xs text-muted-foreground">
                  Enter every employer and service fact (weekly hours above zero); none are assumed.
                </p>
              ) : null}
              <Button
                disabled={evaluate.isPending || !factsComplete}
                onClick={() =>
                  void run(() =>
                    evaluate.mutateAsync({
                      caseId,
                      asOfDate: mhdToIsoDateString(),
                      employerEmployeeCount: Number(employerCount),
                      monthsOfService: Number(months),
                      hoursWorked12Months: Number(hours),
                      worksiteEmployeeCount75: Number(worksiteCount),
                      scheduledWeeklyHours: Number(weeklyHours),
                      reasonCode,
                      familyRelationship: relationship || null,
                      coveredEmployerOverride,
                      ...(relationship === 'CHILD_ADULT' && selfCare !== 'UNKNOWN'
                        ? { incapableOfSelfCare: selfCare === 'YES' }
                        : {}),
                      ...(isBonding && intermittent
                        ? { employerAgreedIntermittentBonding: employerAgreedBonding }
                        : {}),
                    }),
                  )
                }
              >
                Evaluate All Bases
              </Button>
            </MhdCard>
          ) : null}
        </div>
      ) : null}

      {tab === 'checklist' ? (
        <div className="space-y-3">
          <MhdCard className="space-y-3">
            <MhdCardHeader title="Legal Deadlines" />
            <DeadlineStrip
              deadlines={record.deadlines}
              empty="No legal deadlines have been opened on this case."
            />
          </MhdCard>
          <MhdLeaveChecklistPanel items={record.checklist} />
        </div>
      ) : null}

      {tab === 'notices' ? (
        <div className="space-y-2">
          <MhdCard className="space-y-3">
            <MhdCardHeader title="Notice Deadlines" />
            <DeadlineStrip
              deadlines={noticeDeadlines}
              empty="No notice deadline is open on this case."
            />
          </MhdCard>
          {privileged ? (
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setNewNoticeOpen((open) => !open)}>
                New Notice
              </Button>
            </div>
          ) : null}
          {privileged && newNoticeOpen ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="New Leave Notice" />
              <MhdFormFieldStack>
                <label className="block text-xs">
                  Notice type
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={noticeType}
                    onChange={(event) =>
                      setNoticeType(
                        mhdLeavePick(MHD_LEAVE_NOTICE_TYPES, event.target.value) ?? 'ELIGIBILITY',
                      )
                    }
                  >
                    {MHD_LEAVE_NOTICE_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {mhdLeaveEnumLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  Document template
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={templateKey}
                    onChange={(event) => setTemplateKey(event.target.value)}
                  >
                    <option value="">Select a document template</option>
                    {keyedTemplates.map((template) => (
                      <option key={template.id} value={template.templateKey ?? ''}>
                        {template.name} (v{template.version})
                      </option>
                    ))}
                  </select>
                </label>
              </MhdFormFieldStack>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  The due date comes from the case&apos;s legal deadline, not from this form.
                  Issuing this notice closes:
                </p>
                <DeadlineStrip
                  deadlines={selectedNoticeDeadlines}
                  empty="This notice type closes no open deadline."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={
                    recordNotice.isPending || !templateKey || !authUserId || !profile?.companyId
                  }
                  onClick={() =>
                    void run(async () => {
                      const template = keyedTemplates.find(
                        (item) => item.templateKey === templateKey,
                      );
                      if (!template?.templateKey) throw new Error('Select a document template.');
                      const generation = await mhdDocumentService.generateAndPoll(
                        {
                          templateId: template.id,
                          companyId: profile!.companyId,
                          entityType: 'LEAVE_CASE',
                          entityId: caseId,
                          mergeData: {},
                        },
                        { actorUserId: authUserId! },
                      );
                      await recordNotice.mutateAsync({
                        caseId,
                        noticeType,
                        templateKey: template.templateKey,
                        templateVersion: template.version,
                        documentGenerationId: generation.id,
                      });
                      setNewNoticeOpen(false);
                      setTemplateKey('');
                    })
                  }
                >
                  {recordNotice.isPending ? 'Recording…' : 'Create Notice'}
                </Button>
                <Button variant="secondary" onClick={() => setNewNoticeOpen(false)}>
                  Cancel
                </Button>
              </div>
            </MhdCard>
          ) : null}
          {record.notices.length ? (
            record.notices.map((item) => (
              <MhdCard key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <MhdDetailField
                      label="Notice type"
                      value={mhdLeaveEnumLabel(item.notice_type)}
                    />
                    <MhdDetailField label="Status" value={mhdLeaveEnumLabel(item.status)} />
                    <MhdDetailField label="Due" value={mhdFormatDate(item.due_at, 'No deadline')} />
                    <MhdDetailField
                      label="Delivered"
                      value={mhdFormatDateTime(item.delivered_at, 'Not delivered')}
                    />
                  </dl>
                  {privileged && item.status !== 'DELIVERED' ? (
                    <Button
                      variant="secondary"
                      disabled={markNoticeDelivery.isPending}
                      onClick={() =>
                        void run(() =>
                          markNoticeDelivery.mutateAsync({
                            noticeId: item.id,
                            status: 'DELIVERED',
                          }),
                        )
                      }
                    >
                      Mark Delivered
                    </Button>
                  ) : null}
                </div>
              </MhdCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No notices recorded.</p>
          )}
        </div>
      ) : null}

      {tab === 'schedule' ? (
        <div className="space-y-2">
          {record.segments.length ? (
            record.segments.map((item) => (
              <MhdCard key={item.id}>
                <MhdDetailField
                  label="Segment mode"
                  value={item.segment_mode.replaceAll('_', ' ')}
                />
                <MhdDetailField label="Start" value={new Date(item.start_at).toLocaleString()} />
                <MhdDetailField label="End" value={new Date(item.end_at).toLocaleString()} />
                <MhdDetailField label="Hours" value={item.actual_hours ?? item.planned_hours} />
                <MhdDetailField label="Status" value={item.status} />
                {privileged ? (
                  <MhdLeaveSegmentStatusControl
                    segment={item}
                    isPending={updateSegmentStatus.isPending}
                    onSubmit={(input) => run(() => updateSegmentStatus.mutateAsync(input))}
                  />
                ) : null}
              </MhdCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No leave segments recorded.</p>
          )}
          {privileged ? (
            <MhdLeaveSegmentForm
              caseId={caseId}
              isPending={recordSegment.isPending}
              onSubmit={(input) => run(() => recordSegment.mutateAsync(input))}
            />
          ) : null}
        </div>
      ) : null}

      {tab === 'communications' ? (
        <div className="space-y-3">
          {record.events.map((item) => (
            <MhdCard key={item.id}>
              <MhdDetailField label="Contact type" value={item.event_type.replaceAll('_', ' ')} />
              <MhdDetailField label="Summary" value={item.summary} className="mt-2" />
              <MhdDetailField
                label="Occurred"
                value={new Date(item.occurred_at).toLocaleString()}
                className="mt-2"
              />
              <MhdDetailField label="Channel" value={item.channel} className="mt-2" />
            </MhdCard>
          ))}
          {privileged ? (
            <MhdCard className="space-y-2">
              <textarea
                className={`min-h-20 ${inputClass}`}
                value={eventSummary}
                onChange={(e) => setEventSummary(e.target.value)}
                placeholder="Operational contact summary—no medical details"
              />
              <Button
                disabled={event.isPending || !eventSummary.trim()}
                onClick={() =>
                  void run(async () => {
                    await event.mutateAsync({
                      caseId,
                      eventType: 'CONTACT',
                      channel: 'OTHER',
                      summary: eventSummary,
                      visibility: 'EMPLOYEE',
                    });
                    setEventSummary('');
                  })
                }
              >
                Record Contact
              </Button>
            </MhdCard>
          ) : null}
        </div>
      ) : null}

      {tab === 'pay' ? (
        <MhdLeavePayCoordinationPanel
          caseId={caseId}
          paySources={record.pay_sources}
          privileged={privileged}
          isPending={paySource.isPending || paySourceStatus.isPending}
          onRecord={async (input) =>
            (await attempt(async () => (await paySource.mutateAsync(input)).warnings))?.value ??
            null
          }
          onUpdateStatus={async (input) =>
            (await attempt(() => paySourceStatus.mutateAsync(input)))?.value ?? null
          }
        />
      ) : null}

      {tab === 'benefits' ? (
        <div className="space-y-2">
          <MhdCard className="space-y-3">
            <MhdCardHeader title="Health Coverage Continuation" />
            {record.health_continuation.length ? (
              record.health_continuation.map((item) => (
                <div
                  key={`${item.continuation_basis}-${item.coverage_start}`}
                  className="space-y-2 rounded-md border border-border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{item.label}</p>
                    {item.exceeds_cap ? (
                      <MhdBadge variant="warning">Coverage Runs Past The Cap</MhdBadge>
                    ) : null}
                  </div>
                  <dl className="grid gap-2 sm:grid-cols-4">
                    <MhdDetailField label="Coverage start" value={item.coverage_start} />
                    <MhdDetailField label="Cap end" value={item.cap_end} />
                    <MhdDetailField label="Coverage end" value={item.coverage_end} />
                    <MhdDetailField label="Days remaining" value={item.days_remaining} />
                  </dl>
                  {item.exceeds_cap ? (
                    <p role="alert" className="text-sm text-amber-800">
                      The recorded coverage end is later than the {item.label} continuation cap of{' '}
                      {item.cap_end}.
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No group health continuation is being tracked.
              </p>
            )}
          </MhdCard>
          {record.benefits.length ? (
            record.benefits.map((item) => (
              <MhdCard key={item.id}>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <MhdDetailField
                    label="Benefit type"
                    value={mhdLeaveEnumLabel(item.benefit_type)}
                  />
                  <MhdDetailField label="Description" value={item.benefit_label} />
                  <MhdDetailField label="Coverage start" value={item.coverage_start} />
                  <MhdDetailField label="Coverage end" value={item.coverage_end} />
                  <MhdDetailField label="Employee amount" value={item.employee_amount} />
                  <MhdDetailField label="Employer amount" value={item.employer_amount} />
                  <MhdDetailField label="Frequency" value={mhdLeaveEnumLabel(item.frequency)} />
                  <MhdDetailField label="Due date" value={item.due_date} />
                  <MhdDetailField label="Grace period (days)" value={item.grace_period_days} />
                  <MhdDetailField
                    label="Continuation basis"
                    value={
                      item.continuation_basis
                        ? MHD_LEAVE_CONTINUATION_BASIS_LABELS[item.continuation_basis]
                        : null
                    }
                  />
                  <MhdDetailField
                    label="Seniority credit through"
                    value={item.seniority_credit_through}
                  />
                  <MhdDetailField label="Status" value={item.status} />
                  <MhdDetailField label="Status reason" value={item.status_reason} />
                </dl>
                {privileged ? (
                  <MhdLeaveBenefitObligationStatusControl
                    obligation={item}
                    isPending={updateObligationStatus.isPending}
                    onSubmit={(input) => run(() => updateObligationStatus.mutateAsync(input))}
                  />
                ) : null}
                <MhdLeaveBenefitTransactionList transactions={item.transactions} />
              </MhdCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No benefit-maintenance obligation recorded.
            </p>
          )}
          {privileged ? (
            <>
              <MhdLeaveBenefitObligationForm
                caseId={caseId}
                isPending={recordObligation.isPending}
                onSubmit={(input) => run(() => recordObligation.mutateAsync(input))}
              />
              {record.benefits.length ? (
                <MhdLeaveBenefitTransactionForm
                  obligations={record.benefits}
                  isPending={recordTransaction.isPending}
                  onSubmit={(input) => run(() => recordTransaction.mutateAsync(input))}
                />
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {tab === 'controls' ? (
        <MhdLeaveCaseControlsPanel
          caseData={record.case}
          privileged={privileged}
          isPending={workersComp.isPending || keyEmployee.isPending || essentialFunctions.isPending}
          onWorkersComp={(input) => run(() => workersComp.mutateAsync(input))}
          onKeyEmployee={(input) => run(() => keyEmployee.mutateAsync(input))}
          onEssentialFunctions={(providedOn) =>
            run(() => essentialFunctions.mutateAsync(providedOn))
          }
        />
      ) : null}

      {tab === 'return' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {record.policy.rtw_certification_uniform_policy
              ? 'Return-to-work certifications are required under a uniformly applied company policy.'
              : 'No uniformly applied return-to-work certification policy is recorded for this company.'}
          </p>
          {record.return_to_work ? (
            <MhdCard className="space-y-2">
              <dl className="grid gap-2 sm:grid-cols-2">
                <MhdDetailField
                  label="Expected return"
                  value={record.return_to_work.expected_return_date}
                />
                <MhdDetailField
                  label="Actual return"
                  value={record.return_to_work.actual_return_date ?? 'Not yet returned'}
                />
                <MhdDetailField
                  label="Reinstatement outcome"
                  value={
                    record.return_to_work.reinstatement_outcome
                      ? mhdLeaveEnumLabel(record.return_to_work.reinstatement_outcome)
                      : null
                  }
                />
                <MhdDetailField
                  label="Exception reason"
                  value={
                    privileged
                      ? record.return_to_work.reinstatement_exception_reason
                      : 'Not available'
                  }
                />
                <MhdDetailField
                  label="Fitness-for-duty certification"
                  value={record.return_to_work.fitness_required ? 'Required' : 'Not required'}
                />
                <MhdDetailField
                  label="Certification requested on"
                  value={record.return_to_work.rtw_certification_requested_on}
                />
                <MhdDetailField
                  label="Certification received on"
                  value={record.return_to_work.rtw_certification_received_on}
                />
                <MhdDetailField
                  label="Restrictions"
                  value={record.return_to_work.restrictions_present ? 'Present' : 'Not recorded'}
                />
              </dl>
              {record.return_to_work.accommodation_case_id ? (
                <Link
                  className="inline-block text-sm text-accent-hover hover:underline"
                  to={`/accommodations/${record.return_to_work.accommodation_case_id}`}
                >
                  Open Accommodation Process
                </Link>
              ) : null}
            </MhdCard>
          ) : (
            <p className="text-sm text-muted-foreground">No return-to-work plan recorded.</p>
          )}
          {privileged ? (
            <MhdLeaveReturnToWorkForm
              key={record.return_to_work?.id ?? 'new'}
              caseId={caseId}
              current={record.return_to_work}
              uniformCertificationPolicy={record.policy.rtw_certification_uniform_policy}
              isPending={returnToWork.isPending}
              onSubmit={(input) => run(() => returnToWork.mutateAsync(input))}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
