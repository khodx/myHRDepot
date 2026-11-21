import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import {
  MHD_LEAVE_BENEFIT_FREQUENCIES,
  MHD_LEAVE_BENEFIT_RECORDABLE_TRANSACTION_TYPES,
  MHD_LEAVE_BENEFIT_TYPES,
  MHD_LEAVE_CONTINUATION_BASES,
  MHD_LEAVE_GROUP_HEALTH_BENEFIT_TYPES,
  MHD_LEAVE_HEALTH_PREMIUM_MIN_GRACE_DAYS,
  MHD_LEAVE_REINSTATEMENT_OUTCOMES,
  MHD_LEAVE_SEGMENT_MODES,
  MHD_LEAVE_SEGMENT_STATUSES,
  mhdReversibleBenefitTransactions,
  type MhdLeaveBenefitFrequency,
  type MhdLeaveBenefitObligationInput,
  type MhdLeaveBenefitTransactionInput,
  type MhdLeaveBenefitTransactionType,
  type MhdLeaveBenefitType,
  type MhdLeaveContinuationBasis,
  type MhdLeaveReinstatementOutcome,
  type MhdLeaveReturnToWorkInput,
  type MhdLeaveSegmentInput,
  type MhdLeaveSegmentMode,
  type MhdLeaveSegmentStatus,
  type MhdLeaveWorkflow,
} from '../WorkflowTypes';
import {
  MHD_LEAVE_CONTINUATION_BASIS_LABELS,
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
 * Each form's onSubmit resolves true only when the record was saved. The caller shows
 * any refusal (the exact server text) and resolves false, so a form keeps what the
 * user typed when the RPC says no and clears itself only on success.
 */

/** Privileged-only. The RPC's own refusal (eligibility, balance ceiling) is shown by the caller. */
export function MhdLeaveSegmentForm({
  caseId,
  isPending,
  onSubmit,
}: {
  caseId: string;
  isPending: boolean;
  onSubmit: (input: MhdLeaveSegmentInput) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<MhdLeaveSegmentMode>('CONTINUOUS');
  const [status, setStatus] = useState<MhdLeaveSegmentStatus>('REQUESTED');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [planned, setPlanned] = useState('');
  const [actual, setActual] = useState('');

  async function submit() {
    const saved = await onSubmit({
      caseId,
      segmentMode: mode,
      startAt: localToIso(start),
      endAt: end ? localToIso(end) : null,
      plannedHours: optionalNumber(planned),
      actualHours: optionalNumber(actual),
      status,
    });
    if (!saved) return;
    setStart('');
    setEnd('');
    setPlanned('');
    setActual('');
  }

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader title="Record leave segment" />
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
      <Button disabled={isPending || !start} onClick={() => void submit()}>
        {isPending ? 'Recording…' : 'Record Segment'}
      </Button>
    </MhdCard>
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
  onSubmit: (input: MhdLeaveBenefitObligationInput) => Promise<boolean>;
}) {
  const [benefitType, setBenefitType] = useState<MhdLeaveBenefitType | ''>('');
  const [frequency, setFrequency] = useState<MhdLeaveBenefitFrequency | ''>('');
  const [coverageStart, setCoverageStart] = useState('');
  const [coverageEnd, setCoverageEnd] = useState('');
  const [employer, setEmployer] = useState('');
  const [employee, setEmployee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [gracePeriod, setGracePeriod] = useState('');
  const [chosenBasis, setChosenBasis] = useState<MhdLeaveContinuationBasis | ''>('');
  const [seniorityThrough, setSeniorityThrough] = useState('');
  const [description, setDescription] = useState('');

  // A continuation basis exists only for group health coverage, so it is derived away
  // (never sent stale) when the type changes to anything else.
  const isGroupHealth =
    benefitType !== '' && MHD_LEAVE_GROUP_HEALTH_BENEFIT_TYPES.includes(benefitType);
  const continuationBasis = isGroupHealth ? chosenBasis : '';

  async function submit() {
    if (!benefitType || !frequency) return;
    const saved = await onSubmit({
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
    if (!saved) return;
    setBenefitType('');
    setFrequency('');
    setCoverageStart('');
    setCoverageEnd('');
    setEmployer('');
    setEmployee('');
    setDueDate('');
    setGracePeriod('');
    setChosenBasis('');
    setSeniorityThrough('');
    setDescription('');
  }

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader title="Record Benefit Obligation" />
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
      <Button
        disabled={
          isPending ||
          !benefitType ||
          !frequency ||
          !coverageStart ||
          employer === '' ||
          employee === ''
        }
        onClick={() => void submit()}
      >
        {isPending ? 'Recording…' : 'Record Obligation'}
      </Button>
    </MhdCard>
  );
}

/**
 * Privileged-only. Opens on the recorded plan (if any) so an update starts from what is on
 * file. A return-to-work certification may be required only under a uniformly applied company
 * policy; without one the database refuses it and the caller shows that refusal.
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
  onSubmit: (input: MhdLeaveReturnToWorkInput) => Promise<boolean>;
}) {
  const [expectedReturn, setExpectedReturn] = useState(current?.expected_return_date ?? '');
  const [actualReturn, setActualReturn] = useState(current?.actual_return_date ?? '');
  const [outcome, setOutcome] = useState<MhdLeaveReinstatementOutcome | ''>(
    current?.reinstatement_outcome ?? '',
  );
  const [exceptionReason, setExceptionReason] = useState(
    current?.reinstatement_exception_reason ?? '',
  );
  const [fitnessRequired, setFitnessRequired] = useState(current?.fitness_required ?? false);
  const [certRequestedOn, setCertRequestedOn] = useState(
    current?.rtw_certification_requested_on ?? '',
  );
  const [certReceivedOn, setCertReceivedOn] = useState(
    current?.rtw_certification_received_on ?? '',
  );
  const [restrictions, setRestrictions] = useState(current?.restrictions_present ?? false);
  const [note, setNote] = useState('');

  async function submit() {
    const saved = await onSubmit({
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
    });
    if (saved) setNote('');
  }

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader title="Return-To-Work Plan" />
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
      <Button disabled={isPending || !expectedReturn} onClick={() => void submit()}>
        {isPending ? 'Saving…' : 'Save Return-To-Work Plan'}
      </Button>
    </MhdCard>
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
  onSubmit: (input: MhdLeaveBenefitTransactionInput) => Promise<boolean>;
}) {
  const [obligationId, setObligationId] = useState('');
  const [chosenType, setChosenType] = useState<MhdLeaveBenefitTransactionType>('CHARGE');
  const [chosenTarget, setChosenTarget] = useState('');
  const [chosenAmount, setChosenAmount] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [note, setNote] = useState('');

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

  async function submit() {
    const saved = await onSubmit({
      obligationId,
      transactionType: type,
      amount: Number(amount),
      effectiveDate,
      referenceNote: note || null,
      ...(isReversal ? { reversalOf: chosenTarget } : {}),
    });
    if (!saved) return;
    setChosenAmount('');
    setChosenTarget('');
    setEffectiveDate('');
    setNote('');
  }

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader title="Record benefit transaction" />
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
      <Button
        disabled={
          isPending ||
          !obligationId ||
          amount.trim() === '' ||
          !effectiveDate ||
          (isReversal && !target)
        }
        onClick={() => void submit()}
      >
        {isPending ? 'Recording…' : 'Record Transaction'}
      </Button>
    </MhdCard>
  );
}
