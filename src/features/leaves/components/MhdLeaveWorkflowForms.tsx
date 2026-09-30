import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import {
  MHD_LEAVE_BENEFIT_RECORDABLE_TRANSACTION_TYPES,
  MHD_LEAVE_SEGMENT_MODES,
  MHD_LEAVE_SEGMENT_STATUSES,
  mhdReversibleBenefitTransactions,
  type MhdLeaveBenefitObligationInput,
  type MhdLeaveBenefitTransactionInput,
  type MhdLeaveBenefitTransactionType,
  type MhdLeaveSegmentInput,
  type MhdLeaveSegmentMode,
  type MhdLeaveSegmentStatus,
  type MhdLeaveWorkflow,
} from '../WorkflowTypes';

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
 * Privileged-only. The database does not restrict benefit type or frequency to a list
 * (only amounts, dates and status carry CHECKs), so both are free text rather than a
 * vocabulary the schema would not enforce.
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
  const [benefitType, setBenefitType] = useState('');
  const [frequency, setFrequency] = useState('');
  const [coverageStart, setCoverageStart] = useState('');
  const [coverageEnd, setCoverageEnd] = useState('');
  const [employer, setEmployer] = useState('');
  const [employee, setEmployee] = useState('');

  async function submit() {
    const saved = await onSubmit({
      caseId,
      benefitType,
      frequency,
      coverageStart,
      coverageEnd: coverageEnd || null,
      employerAmount: Number(employer),
      employeeAmount: Number(employee),
    });
    if (!saved) return;
    setBenefitType('');
    setFrequency('');
    setCoverageStart('');
    setCoverageEnd('');
    setEmployer('');
    setEmployee('');
  }

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader title="Record benefit obligation" />
      <MhdFormFieldStack>
        <label className="text-xs">
          Benefit type
          <input
            className={`mt-1 ${inputClass}`}
            value={benefitType}
            onChange={(e) => setBenefitType(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Contribution frequency
          <input
            className={`mt-1 ${inputClass}`}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Coverage start
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={coverageStart}
            onChange={setCoverageStart}
          />
        </label>
        <label className="text-xs">
          Coverage end (optional)
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={coverageEnd}
            onChange={setCoverageEnd}
          />
        </label>
        <label className="text-xs">
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
        <label className="text-xs">
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
      </MhdFormFieldStack>
      <Button
        disabled={
          isPending ||
          !benefitType.trim() ||
          !frequency.trim() ||
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
          isPending || !obligationId || amount.trim() === '' || !effectiveDate || (isReversal && !target)
        }
        onClick={() => void submit()}
      >
        {isPending ? 'Recording…' : 'Record Transaction'}
      </Button>
    </MhdCard>
  );
}
