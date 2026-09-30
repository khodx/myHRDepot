import {
  MHD_LEAVE_BENEFIT_OBLIGATION_STATUS_TRANSITIONS,
  MHD_LEAVE_SEGMENT_STATUS_TRANSITIONS,
} from './WorkflowTypes';
import type {
  MhdLeaveBenefitObligationInput,
  MhdLeaveBenefitObligationStatusInput,
  MhdLeaveBenefitTransactionInput,
  MhdLeaveSegmentInput,
  MhdLeaveSegmentStatusInput,
} from './WorkflowTypes';

// Client-side mirrors of the database CHECKs, so the common mistakes are caught before a
// round trip. The RPC stays authoritative: balance ceilings and the designation guard
// for TAKEN segments are only knowable server-side and surface as the RPC's own message.

export function mhdValidateLeaveSegment(input: MhdLeaveSegmentInput): string | null {
  if (!input.startAt || Number.isNaN(Date.parse(input.startAt)))
    return 'Enter a start date and time.';
  if (input.endAt) {
    if (Number.isNaN(Date.parse(input.endAt))) return 'Enter a valid end date and time.';
    if (Date.parse(input.endAt) < Date.parse(input.startAt))
      return 'The end cannot be before the start.';
  }
  for (const [label, hours] of [
    ['Planned', input.plannedHours],
    ['Actual', input.actualHours],
  ] as const) {
    if (hours != null && !(Number.isFinite(hours) && hours > 0))
      return `${label} hours must be greater than zero.`;
  }
  if (input.status === 'TAKEN' && input.actualHours == null)
    return 'A taken segment requires actual hours.';
  return null;
}

export function mhdValidateLeaveSegmentStatus(input: MhdLeaveSegmentStatusInput): void {
  if (!MHD_LEAVE_SEGMENT_STATUS_TRANSITIONS[input.currentStatus].includes(input.status)) {
    throw new Error(`Segment status cannot change from ${input.currentStatus} to ${input.status}.`);
  }
  if (input.actualHours != null && input.status !== 'TAKEN') {
    throw new Error('Actual hours may only be supplied when taking a segment.');
  }
  if (input.status === 'TAKEN') {
    const hours = input.actualHours ?? (input.currentActualHours == null ? null : Number(input.currentActualHours));
    if (hours == null || !Number.isFinite(hours) || hours <= 0) {
      throw new Error('A taken segment requires actual hours greater than zero.');
    }
  }
}

export function mhdValidateLeaveBenefitObligation(
  input: MhdLeaveBenefitObligationInput,
): string | null {
  if (!input.benefitType.trim()) return 'Enter the benefit type.';
  if (!input.frequency.trim()) return 'Enter the contribution frequency.';
  if (!input.coverageStart) return 'Enter the coverage start date.';
  if (input.coverageEnd && input.coverageEnd < input.coverageStart)
    return 'Coverage cannot end before it starts.';
  for (const amount of [input.employerAmount, input.employeeAmount]) {
    if (!Number.isFinite(amount) || amount < 0) return 'Amounts must be zero or more.';
  }
  return null;
}

export function mhdValidateLeaveBenefitObligationStatus(
  input: MhdLeaveBenefitObligationStatusInput,
): void {
  if (!MHD_LEAVE_BENEFIT_OBLIGATION_STATUS_TRANSITIONS[input.currentStatus].includes(input.status)) {
    throw new Error(`Benefit obligation status cannot change from ${input.currentStatus} to ${input.status}.`);
  }
  if (input.status === 'WAIVED' && !input.reason?.trim()) {
    throw new Error('Waiving a benefit obligation requires a reason.');
  }
}

export function mhdValidateLeaveBenefitTransaction(
  input: MhdLeaveBenefitTransactionInput,
): string | null {
  if (!input.obligationId) return 'Select the obligation this transaction belongs to.';
  if (!Number.isFinite(input.amount) || input.amount === 0)
    return 'The amount must be a non-zero number.';
  if (!input.effectiveDate) return 'Enter the effective date.';
  if (input.transactionType === 'REVERSAL' && !input.reversalOf)
    return 'Select the transaction being reversed.';
  if (input.transactionType !== 'REVERSAL' && input.reversalOf)
    return 'Only a reversal can reference another transaction.';
  return null;
}
