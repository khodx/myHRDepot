import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { mhdToIsoDateString } from '@/utils/mhdDateFormat';
import {
  MHD_LEAVE_BENEFIT_FREQUENCIES,
  MHD_LEAVE_BENEFIT_RECORDABLE_TRANSACTION_TYPES,
  MHD_LEAVE_BENEFIT_TYPES,
  MHD_LEAVE_BONDING_EVENT_TYPES,
  MHD_LEAVE_CONTINUATION_BASES,
  MHD_LEAVE_FAMILY_RELATIONSHIPS,
  MHD_LEAVE_GROUP_HEALTH_BENEFIT_TYPES,
  MHD_LEAVE_HEALTH_PREMIUM_MIN_GRACE_DAYS,
  MHD_LEAVE_NOTICE_TYPES,
  MHD_LEAVE_REASON_CODES,
  MHD_LEAVE_REINSTATEMENT_OUTCOMES,
  MHD_LEAVE_SEGMENT_MODES,
  MHD_LEAVE_SEGMENT_STATUSES,
  mhdReversibleBenefitTransactions,
  type MhdLeaveBenefitFrequency,
  type MhdLeaveBenefitObligationInput,
  type MhdLeaveBenefitTransactionInput,
  type MhdLeaveBenefitTransactionType,
  type MhdLeaveBenefitType,
  type MhdLeaveBondingEventInput,
  type MhdLeaveBondingEventType,
  type MhdLeaveContinuationBasis,
  type MhdLeaveDeadline,
  type MhdLeaveEligibilityInput,
  type MhdLeaveNoticeType,
  type MhdLeaveReinstatementOutcome,
  type MhdLeaveReturnToWorkInput,
  type MhdLeaveSegmentInput,
  type MhdLeaveSegmentMode,
  type MhdLeaveSegmentStatus,
  type MhdLeaveWorkflow,
} from '../WorkflowTypes';
import { MhdLeaveActionButtons } from './MhdLeaveActionModal';
import { MhdLeaveDeadlineBadge } from './MhdLeaveDeadlineBadge';
import { useMhdLeaveDraftBinding, useMhdLeaveDraftField } from './mhdLeaveActionContext';
import {
  MHD_LEAVE_CONTINUATION_BASIS_LABELS,
  MHD_LEAVE_NOTICE_DEADLINE_KINDS,
  mhdLeaveEnumLabel,
  mhdLeavePick,
} from './mhdLeaveLabels';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const label = (value: string) => value.replaceAll('_', ' ');

// A blank field is "not given", never a coerced zero; the service and RPC then reject it
// where the database requires a value.
const optionalNumber = (value: string) => (value.trim() === '' ? null : Number(value));

// datetime-local yields a zone-less local time; the RPC takes a timestamptz.
const localToIso = (value: string) => (value ? new Date(value).toISOString() : '');

/*
 * Every form here renders inside MhdLeaveActionModal. Its onSubmit rejects with the server's
 * own refusal, which the modal shows while the form keeps what was typed; on success the
 * modal discards the draft and closes. Every input field is declared with useMhdLeaveDraftField,
 * medical-tier fields included, so Save Draft keeps the whole screen and Resume Draft restores it.
 */

export function MhdLeaveDeadlineStrip({
  deadlines,
  empty,
}: {
  deadlines: MhdLeaveDeadline[];
  empty: string;
}) {
  if (!deadlines.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {deadlines.map((deadline) => (
        <MhdLeaveDeadlineBadge key={deadline.id} deadline={deadline} />
      ))}
    </div>
  );
}

/** Yes / No / Unknown for an adult child's self-care; Unknown sends nothing. */
const SELF_CARE_ANSWERS = ['UNKNOWN', 'YES', 'NO'] as const;
type SelfCareAnswer = (typeof SELF_CARE_ANSWERS)[number];

/**
 * Privileged-only. The leave reason and family relationship are owned by the panel (they also
 * decide whether the bonding and designated-person cards show), so they arrive controlled.
 */
export function MhdLeaveEligibilityEvaluateForm({
  caseId,
  reasonCode,
  onReasonChange,
  relationship,
  onRelationshipChange,
  intermittent,
  isPending,
  onSubmit,
}: {
  caseId: string;
  reasonCode: string;
  onReasonChange: (value: string) => void;
  relationship: string;
  onRelationshipChange: (value: string) => void;
  intermittent: boolean;
  isPending: boolean;
  onSubmit: (input: MhdLeaveEligibilityInput) => Promise<unknown>;
}) {
  useMhdLeaveDraftBinding('reasonCode', reasonCode, onReasonChange);
  useMhdLeaveDraftBinding('familyRelationship', relationship, onRelationshipChange);
  const [selfCare, setSelfCare] = useMhdLeaveDraftField<SelfCareAnswer>('selfCare', 'UNKNOWN');
  const [employerAgreedBonding, setEmployerAgreedBonding] = useMhdLeaveDraftField(
    'employerAgreedBonding',
    false,
  );
  const [employerCount, setEmployerCount] = useMhdLeaveDraftField('employerCount', '');
  const [worksiteCount, setWorksiteCount] = useMhdLeaveDraftField('worksiteCount', '');
  const [months, setMonths] = useMhdLeaveDraftField('months', '');
  const [hours, setHours] = useMhdLeaveDraftField('hours', '');
  const [weeklyHours, setWeeklyHours] = useMhdLeaveDraftField('weeklyHours', '');
  const [coveredEmployerOverride, setCoveredEmployerOverride] = useMhdLeaveDraftField(
    'coveredEmployerOverride',
    false,
  );

  const isBonding = reasonCode === 'BONDING';
  const countFactsEntered = [employerCount, worksiteCount, months, hours].every(
    (value) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
  );
  const factsComplete = countFactsEntered && weeklyHours.trim() !== '' && Number(weeklyHours) > 0;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        The engine evaluates each legal basis separately. CFRA does not use a 75-mile test; that
        count is used only for FMLA. A human must confirm every result.
      </p>
      <MhdFormFieldStack>
        <label className="block text-xs">
          Leave reason
          <select
            className={`mt-1 ${inputClass}`}
            value={reasonCode}
            onChange={(e) => onReasonChange(e.target.value)}
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
            onChange={(e) => onRelationshipChange(e.target.value)}
          >
            <option value="">No family relationship</option>
            {MHD_LEAVE_FAMILY_RELATIONSHIPS.map((value) => (
              <option key={value} value={value}>
                {mhdLeaveEnumLabel(value)}
              </option>
            ))}
          </select>
        </label>
        {relationship === 'DESIGNATED_PERSON' ? (
          <p className="text-xs text-muted-foreground">
            Record who the designated person is in the Designated Person card.
          </p>
        ) : null}
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
              FMLA covers care of an adult child only when the child is incapable of self-care.
              Leave it Unknown until that is established.
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
      <MhdLeaveActionButtons
        submitLabel="Evaluate All Bases"
        pendingLabel="Evaluating…"
        disabled={isPending || !factsComplete}
        onSubmit={() =>
          onSubmit({
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
          })
        }
      />
    </div>
  );
}

/** The outcomes a documented override may record (mhd_leave_eligibility_override). */
const OVERRIDE_OUTCOMES = ['ELIGIBLE', 'INELIGIBLE', 'UNDETERMINED'] as const;
type OverrideOutcome = (typeof OVERRIDE_OUTCOMES)[number];

/** Privileged-only. A documented human override of one determination. */
export function MhdLeaveEligibilityOverrideForm({
  determinationId,
  isPending,
  onSubmit,
}: {
  determinationId: string;
  isPending: boolean;
  onSubmit: (input: {
    determinationId: string;
    effectiveOutcome: OverrideOutcome;
    overrideReason: string;
  }) => Promise<unknown>;
}) {
  const [outcome, setOutcome] = useMhdLeaveDraftField<OverrideOutcome>('outcome', 'ELIGIBLE');
  const [reason, setReason] = useMhdLeaveDraftField('reason', '');

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        An override is a documented human decision. The evaluated outcome, findings, and rule-set
        version remain on the record.
      </p>
      <select
        className={inputClass}
        value={outcome}
        onChange={(e) => setOutcome(mhdLeavePick(OVERRIDE_OUTCOMES, e.target.value) ?? 'ELIGIBLE')}
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
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why the determination is being overridden"
        aria-label="Override reason"
      />
      <MhdLeaveActionButtons
        submitLabel="Record Override"
        disabled={isPending || !reason.trim()}
        onSubmit={() =>
          onSubmit({ determinationId, effectiveOutcome: outcome, overrideReason: reason })
        }
      />
    </div>
  );
}

/** Privileged-only. Opens on the recorded bonding event, if any. */
export function MhdLeaveBondingEventForm({
  caseId,
  current,
  isPending,
  onSubmit,
}: {
  caseId: string;
  current: MhdLeaveWorkflow['case'];
  isPending: boolean;
  onSubmit: (input: MhdLeaveBondingEventInput) => Promise<unknown>;
}) {
  const [eventDate, setEventDate] = useMhdLeaveDraftField(
    'eventDate',
    current.bonding_event_date ?? '',
  );
  const [eventType, setEventType] = useMhdLeaveDraftField<MhdLeaveBondingEventType | ''>(
    'eventType',
    current.bonding_event_type ?? '',
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Bonding leave runs from the birth, adoption or foster placement and must be taken within 12
        months of it.
      </p>
      <MhdFormFieldStack>
        <label className="block text-xs">
          Bonding event date
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={eventDate}
            onChange={setEventDate}
          />
        </label>
        <label className="block text-xs">
          Bonding event type
          <select
            className={`mt-1 ${inputClass}`}
            value={eventType}
            onChange={(e) =>
              setEventType(mhdLeavePick(MHD_LEAVE_BONDING_EVENT_TYPES, e.target.value) ?? '')
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
      <MhdLeaveActionButtons
        submitLabel="Save Bonding Event"
        disabled={isPending || !eventDate || !eventType}
        onSubmit={async () => {
          if (!eventType) return;
          await onSubmit({ caseId, eventDate, eventType });
        }}
      />
    </div>
  );
}

export interface MhdLeaveNoticeTemplateOption {
  id: string;
  name: string;
  version: number;
  templateKey: string | null;
}

/**
 * Privileged-only. Only templates with a stable key are offered (the database refuses a uuid).
 * The due date comes from the case's legal deadline, never from this form.
 */
export function MhdLeaveNoticeForm({
  templates,
  deadlines,
  isPending,
  canSubmit,
  onSubmit,
}: {
  templates: MhdLeaveNoticeTemplateOption[];
  deadlines: MhdLeaveDeadline[];
  isPending: boolean;
  /** False until the viewer's user and company are known. */
  canSubmit: boolean;
  onSubmit: (input: { noticeType: MhdLeaveNoticeType; templateKey: string }) => Promise<unknown>;
}) {
  const [noticeType, setNoticeType] = useMhdLeaveDraftField<MhdLeaveNoticeType>(
    'noticeType',
    'ELIGIBILITY',
  );
  const [templateKey, setTemplateKey] = useMhdLeaveDraftField('templateKey', '');
  const closedBySelectedNotice = MHD_LEAVE_NOTICE_DEADLINE_KINDS[noticeType] ?? [];
  const selectedNoticeDeadlines = deadlines.filter((deadline) =>
    closedBySelectedNotice.includes(deadline.deadline_kind),
  );

  return (
    <div className="space-y-3">
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
            {templates.map((template) => (
              <option key={template.id} value={template.templateKey ?? ''}>
                {template.name} (v{template.version})
              </option>
            ))}
          </select>
        </label>
      </MhdFormFieldStack>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          The due date comes from the case&apos;s legal deadline, not from this form. Issuing this
          notice closes:
        </p>
        <MhdLeaveDeadlineStrip
          deadlines={selectedNoticeDeadlines}
          empty="This notice type closes no open deadline."
        />
      </div>
      <MhdLeaveActionButtons
        submitLabel="Create Notice"
        pendingLabel="Recording…"
        disabled={isPending || !templateKey || !canSubmit}
        onSubmit={() => onSubmit({ noticeType, templateKey })}
      />
    </div>
  );
}

/** Privileged-only. An operational contact; the summary carries no medical detail. */
export function MhdLeaveContactForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (summary: string) => Promise<unknown>;
}) {
  const [summary, setSummary] = useMhdLeaveDraftField('summary', '');
  return (
    <div className="space-y-2">
      <textarea
        className={`min-h-20 ${inputClass}`}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Operational contact summary—no medical details"
        aria-label="Contact summary"
      />
      <MhdLeaveActionButtons
        submitLabel="Record Contact"
        disabled={isPending || !summary.trim()}
        onSubmit={() => onSubmit(summary)}
      />
    </div>
  );
}

/** Privileged-only. The RPC's own refusal (eligibility, balance ceiling) is shown by the modal. */
export function MhdLeaveSegmentForm({
  caseId,
  isPending,
  onSubmit,
}: {
  caseId: string;
  isPending: boolean;
  onSubmit: (input: MhdLeaveSegmentInput) => Promise<unknown>;
}) {
  const [mode, setMode] = useMhdLeaveDraftField<MhdLeaveSegmentMode>('segmentMode', 'CONTINUOUS');
  const [status, setStatus] = useMhdLeaveDraftField<MhdLeaveSegmentStatus>('status', 'REQUESTED');
  const [start, setStart] = useMhdLeaveDraftField('start', '');
  const [end, setEnd] = useMhdLeaveDraftField('end', '');
  const [planned, setPlanned] = useMhdLeaveDraftField('plannedHours', '');
  const [actual, setActual] = useMhdLeaveDraftField('actualHours', '');

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        A taken segment needs actual hours and debits the balance, so it is also checked against
        confirmed eligibility and the remaining hours.
      </p>
      <MhdFormFieldStack>
        <label className="text-xs">
          Segment mode
          <select
            className={`mt-1 ${inputClass}`}
            value={mode}
            onChange={(e) => setMode(e.target.value as MhdLeaveSegmentMode)}
          >
            {MHD_LEAVE_SEGMENT_MODES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Segment status
          <select
            className={`mt-1 ${inputClass}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as MhdLeaveSegmentStatus)}
          >
            {MHD_LEAVE_SEGMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Segment start
          <input
            className={`mt-1 ${inputClass}`}
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Segment end (optional)
          <input
            className={`mt-1 ${inputClass}`}
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Planned hours (optional)
          <input
            className={`mt-1 ${inputClass}`}
            type="number"
            min="0"
            step="any"
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
          />
        </label>
        <label className="text-xs">
          {status === 'TAKEN'
            ? 'Actual hours (required for a taken segment)'
            : 'Actual hours (optional)'}
          <input
            className={`mt-1 ${inputClass}`}
            type="number"
            min="0"
            step="any"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </label>
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel="Record Segment"
        pendingLabel="Recording…"
        disabled={isPending || !start}
        onSubmit={() =>
          onSubmit({
            caseId,
            segmentMode: mode,
            startAt: localToIso(start),
            endAt: end ? localToIso(end) : null,
            plannedHours: optionalNumber(planned),
            actualHours: optionalNumber(actual),
            status,
          })
        }
      />
    </div>
  );
}

/**
 * Privileged-only. Benefit type, frequency and continuation basis are the database's
 * vocabularies (mhd_leave_benefit_types / mhd_leave_benefit_frequencies / leave_benefit_rules);
 * the free-text Description is kept alongside the controlled type as `benefit_label`.
 */
export function MhdLeaveBenefitObligationForm({
  caseId,
  isPending,
  onSubmit,
}: {
  caseId: string;
  isPending: boolean;
  onSubmit: (input: MhdLeaveBenefitObligationInput) => Promise<unknown>;
}) {
  const [benefitType, setBenefitType] = useMhdLeaveDraftField<MhdLeaveBenefitType | ''>(
    'benefitType',
    '',
  );
  const [frequency, setFrequency] = useMhdLeaveDraftField<MhdLeaveBenefitFrequency | ''>(
    'frequency',
    '',
  );
  const [coverageStart, setCoverageStart] = useMhdLeaveDraftField('coverageStart', '');
  const [coverageEnd, setCoverageEnd] = useMhdLeaveDraftField('coverageEnd', '');
  const [employer, setEmployer] = useMhdLeaveDraftField('employerAmount', '');
  const [employee, setEmployee] = useMhdLeaveDraftField('employeeAmount', '');
  const [dueDate, setDueDate] = useMhdLeaveDraftField('dueDate', '');
  const [gracePeriod, setGracePeriod] = useMhdLeaveDraftField('gracePeriodDays', '');
  const [chosenBasis, setChosenBasis] = useMhdLeaveDraftField<MhdLeaveContinuationBasis | ''>(
    'continuationBasis',
    '',
  );
  const [seniorityThrough, setSeniorityThrough] = useMhdLeaveDraftField('seniorityThrough', '');
  const [description, setDescription] = useMhdLeaveDraftField('description', '');

  // A continuation basis exists only for group health coverage, so it is derived away
  // (never sent stale) when the type changes to anything else.
  const isGroupHealth =
    benefitType !== '' && MHD_LEAVE_GROUP_HEALTH_BENEFIT_TYPES.includes(benefitType);
  const continuationBasis = isGroupHealth ? chosenBasis : '';

  return (
    <div className="space-y-3">
      <MhdFormFieldStack>
        <label className="block text-xs">
          Benefit type
          <select
            className={`mt-1 ${inputClass}`}
            value={benefitType}
            onChange={(e) =>
              setBenefitType(mhdLeavePick(MHD_LEAVE_BENEFIT_TYPES, e.target.value) ?? '')
            }
          >
            <option value="">Select a benefit type</option>
            {MHD_LEAVE_BENEFIT_TYPES.map((value) => (
              <option key={value} value={value}>
                {mhdLeaveEnumLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          Description (optional)
          <input
            className={`mt-1 ${inputClass}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="block text-xs">
          Contribution frequency
          <select
            className={`mt-1 ${inputClass}`}
            value={frequency}
            onChange={(e) =>
              setFrequency(mhdLeavePick(MHD_LEAVE_BENEFIT_FREQUENCIES, e.target.value) ?? '')
            }
          >
            <option value="">Select a frequency</option>
            {MHD_LEAVE_BENEFIT_FREQUENCIES.map((value) => (
              <option key={value} value={value}>
                {mhdLeaveEnumLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          Coverage start
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={coverageStart}
            onChange={setCoverageStart}
          />
        </label>
        <label className="block text-xs">
          Coverage end (optional)
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={coverageEnd}
            onChange={setCoverageEnd}
          />
        </label>
        <label className="block text-xs">
          Employer amount
          <input
            className={`mt-1 ${inputClass}`}
            type="number"
            min="0"
            step="0.01"
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
          />
        </label>
        <label className="block text-xs">
          Employee amount
          <input
            className={`mt-1 ${inputClass}`}
            type="number"
            min="0"
            step="0.01"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
          />
        </label>
        <label className="block text-xs">
          Due date (optional)
          <MhdDateField className={`mt-1 ${inputClass}`} value={dueDate} onChange={setDueDate} />
        </label>
        <label className="block text-xs">
          Grace period in days (optional)
          <input
            className={`mt-1 ${inputClass}`}
            type="number"
            min="0"
            step="1"
            value={gracePeriod}
            onChange={(e) => setGracePeriod(e.target.value)}
          />
        </label>
        <div>
          <label className="block text-xs">
            Continuation basis
            <select
              className={`mt-1 ${inputClass}`}
              value={continuationBasis}
              disabled={!isGroupHealth}
              onChange={(e) =>
                setChosenBasis(mhdLeavePick(MHD_LEAVE_CONTINUATION_BASES, e.target.value) ?? '')
              }
            >
              <option value="">Not applicable</option>
              {MHD_LEAVE_CONTINUATION_BASES.map((value) => (
                <option key={value} value={value}>
                  {MHD_LEAVE_CONTINUATION_BASIS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Offered for medical, dental and vision coverage. Group health premiums keep a grace
            period of at least {MHD_LEAVE_HEALTH_PREMIUM_MIN_GRACE_DAYS} days.
          </p>
        </div>
        <label className="block text-xs">
          Seniority credit through (optional)
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={seniorityThrough}
            onChange={setSeniorityThrough}
          />
        </label>
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel="Record Obligation"
        pendingLabel="Recording…"
        disabled={
          isPending ||
          !benefitType ||
          !frequency ||
          !coverageStart ||
          employer === '' ||
          employee === ''
        }
        onSubmit={async () => {
          if (!benefitType || !frequency) return;
          await onSubmit({
            caseId,
            benefitType,
            frequency,
            coverageStart,
            coverageEnd: coverageEnd || null,
            employerAmount: Number(employer),
            employeeAmount: Number(employee),
            dueDate: dueDate || null,
            gracePeriodDays: optionalNumber(gracePeriod),
            continuationBasis: continuationBasis || null,
            seniorityCreditThrough: seniorityThrough || null,
            benefitLabel: description || null,
          });
        }}
      />
    </div>
  );
}

/**
 * Privileged-only. Opens on the recorded plan (if any) so an update starts from what is on
 * file. A return-to-work certification may be required only under a uniformly applied company
 * policy; without one the database refuses it and the modal shows that refusal.
 */
export function MhdLeaveReturnToWorkForm({
  caseId,
  current,
  uniformCertificationPolicy,
  isPending,
  onSubmit,
}: {
  caseId: string;
  current: MhdLeaveWorkflow['return_to_work'];
  uniformCertificationPolicy: boolean;
  isPending: boolean;
  onSubmit: (input: MhdLeaveReturnToWorkInput) => Promise<unknown>;
}) {
  const [expectedReturn, setExpectedReturn] = useMhdLeaveDraftField(
    'expectedReturn',
    current?.expected_return_date ?? '',
  );
  const [actualReturn, setActualReturn] = useMhdLeaveDraftField(
    'actualReturn',
    current?.actual_return_date ?? '',
  );
  const [outcome, setOutcome] = useMhdLeaveDraftField<MhdLeaveReinstatementOutcome | ''>(
    'outcome',
    current?.reinstatement_outcome ?? '',
  );
  const [exceptionReason, setExceptionReason] = useMhdLeaveDraftField(
    'exceptionReason',
    current?.reinstatement_exception_reason ?? '',
  );
  const [fitnessRequired, setFitnessRequired] = useMhdLeaveDraftField(
    'fitnessRequired',
    current?.fitness_required ?? false,
  );
  const [certRequestedOn, setCertRequestedOn] = useMhdLeaveDraftField(
    'certRequestedOn',
    current?.rtw_certification_requested_on ?? '',
  );
  const [certReceivedOn, setCertReceivedOn] = useMhdLeaveDraftField(
    'certReceivedOn',
    current?.rtw_certification_received_on ?? '',
  );
  const [restrictions, setRestrictions] = useMhdLeaveDraftField(
    'restrictionsPresent',
    current?.restrictions_present ?? false,
  );
  const [note, setNote] = useMhdLeaveDraftField('note', '');

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {uniformCertificationPolicy
          ? 'Return-to-work certifications are required under a uniformly applied company policy.'
          : 'This company has no uniformly applied return-to-work certification policy, so requiring a certification will be refused.'}
      </p>
      <MhdFormFieldStack>
        <label className="block text-xs">
          Expected return date
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={expectedReturn}
            onChange={setExpectedReturn}
          />
        </label>
        <label className="block text-xs">
          Actual return date (optional)
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={actualReturn}
            onChange={setActualReturn}
          />
        </label>
        <label className="block text-xs">
          Reinstatement outcome (optional)
          <select
            className={`mt-1 ${inputClass}`}
            value={outcome}
            onChange={(e) =>
              setOutcome(mhdLeavePick(MHD_LEAVE_REINSTATEMENT_OUTCOMES, e.target.value) ?? '')
            }
          >
            <option value="">Not yet decided</option>
            {MHD_LEAVE_REINSTATEMENT_OUTCOMES.map((value) => (
              <option key={value} value={value}>
                {mhdLeaveEnumLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <div>
          <label className="block text-xs">
            Exception reason
            <textarea
              className={`mt-1 min-h-16 ${inputClass}`}
              value={exceptionReason}
              onChange={(e) => setExceptionReason(e.target.value)}
            />
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Required for a pregnancy-disability comparable position or any non-reinstatement.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fitnessRequired}
            onChange={(e) => setFitnessRequired(e.target.checked)}
          />
          Fitness-For-Duty Certification Required
        </label>
        <label className="block text-xs">
          Certification requested on (optional)
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={certRequestedOn}
            onChange={setCertRequestedOn}
          />
        </label>
        <label className="block text-xs">
          Certification received on (optional)
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={certReceivedOn}
            onChange={setCertReceivedOn}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={restrictions}
            onChange={(e) => setRestrictions(e.target.checked)}
          />
          Work Restrictions Present; Begin Accommodation Referral
        </label>
        <label className="block text-xs">
          Reinstatement note (optional)
          <textarea
            className={`mt-1 min-h-16 ${inputClass}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel="Save Return-To-Work Plan"
        disabled={isPending || !expectedReturn}
        onSubmit={() =>
          onSubmit({
            caseId,
            expectedReturnDate: expectedReturn,
            actualReturnDate: actualReturn || null,
            // The outcome answers "same or comparable job": either position is a return to one.
            sameOrComparableJob: outcome === '' ? null : outcome !== 'NOT_REINSTATED',
            fitnessRequired,
            restrictionsPresent: restrictions,
            accommodationReferralRequired: restrictions,
            reinstatementNote: note || null,
            reinstatementOutcome: outcome || null,
            exceptionReason: exceptionReason || null,
            rtwCertificationRequestedOn: certRequestedOn || null,
            rtwCertificationReceivedOn: certReceivedOn || null,
          })
        }
      />
    </div>
  );
}

/**
 * Privileged-only. A reversal reverses one whole earlier transaction, so REVERSAL is
 * offered only while the chosen obligation has one that is still reversible, and its
 * amount is locked to that transaction's amount.
 */
export function MhdLeaveBenefitTransactionForm({
  obligations,
  isPending,
  onSubmit,
}: {
  obligations: MhdLeaveWorkflow['benefits'];
  isPending: boolean;
  onSubmit: (input: MhdLeaveBenefitTransactionInput) => Promise<unknown>;
}) {
  const [obligationId, setObligationId] = useMhdLeaveDraftField('obligationId', '');
  const [chosenType, setChosenType] = useMhdLeaveDraftField<MhdLeaveBenefitTransactionType>(
    'transactionType',
    'CHARGE',
  );
  const [chosenTarget, setChosenTarget] = useMhdLeaveDraftField('reversalOf', '');
  const [chosenAmount, setChosenAmount] = useMhdLeaveDraftField('amount', '');
  const [effectiveDate, setEffectiveDate] = useMhdLeaveDraftField('effectiveDate', '');
  const [note, setNote] = useMhdLeaveDraftField('referenceNote', '');

  // Everything below derives from the obligation and the typed choices, so switching the
  // obligation can never leave a stale reversal type or target selected.
  const reversible = mhdReversibleBenefitTransactions(
    obligations.find((item) => item.id === obligationId)?.transactions ?? [],
  );
  const offeredTypes: MhdLeaveBenefitTransactionType[] = [
    ...MHD_LEAVE_BENEFIT_RECORDABLE_TRANSACTION_TYPES,
    ...(reversible.length ? (['REVERSAL'] as const) : []),
  ];
  const type = offeredTypes.includes(chosenType) ? chosenType : 'CHARGE';
  const isReversal = type === 'REVERSAL';
  const target = isReversal ? reversible.find((item) => item.id === chosenTarget) : undefined;
  const amount = isReversal ? (target ? String(Number(target.amount)) : '') : chosenAmount;

  return (
    <div className="space-y-3">
      <MhdFormFieldStack>
        <label className="text-xs">
          Obligation
          <select
            className={`mt-1 ${inputClass}`}
            value={obligationId}
            onChange={(e) => setObligationId(e.target.value)}
          >
            <option value="">Select an obligation</option>
            {obligations.map((item) => (
              <option key={item.id} value={item.id}>
                {label(item.benefit_type)} from {item.coverage_start}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Transaction type
          <select
            className={`mt-1 ${inputClass}`}
            value={type}
            onChange={(e) => setChosenType(e.target.value as MhdLeaveBenefitTransactionType)}
          >
            {offeredTypes.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        {isReversal ? (
          <label className="text-xs">
            Transaction being reversed
            <select
              className={`mt-1 ${inputClass}`}
              value={chosenTarget}
              onChange={(e) => setChosenTarget(e.target.value)}
            >
              <option value="">Select a transaction</option>
              {reversible.map((item) => (
                <option key={item.id} value={item.id}>
                  {label(item.transaction_type)} {item.amount} on {item.effective_date}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-xs">
          {isReversal ? 'Amount (set by the reversed transaction)' : 'Amount'}
          <input
            className={`mt-1 ${inputClass}`}
            type="number"
            step="0.01"
            value={amount}
            readOnly={isReversal}
            onChange={(e) => setChosenAmount(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Effective date
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={effectiveDate}
            onChange={setEffectiveDate}
          />
        </label>
        <label className="text-xs">
          Reference note (optional)
          <input
            className={`mt-1 ${inputClass}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel="Record Transaction"
        pendingLabel="Recording…"
        disabled={
          isPending ||
          !obligationId ||
          amount.trim() === '' ||
          !effectiveDate ||
          (isReversal && !target)
        }
        onSubmit={() =>
          onSubmit({
            obligationId,
            transactionType: type,
            amount: Number(amount),
            effectiveDate,
            referenceNote: note || null,
            ...(isReversal ? { reversalOf: chosenTarget } : {}),
          })
        }
      />
    </div>
  );
}
