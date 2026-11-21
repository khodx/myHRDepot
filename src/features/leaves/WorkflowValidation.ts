import {
  MHD_LEAVE_BENEFIT_FREQUENCIES,
  MHD_LEAVE_BENEFIT_OBLIGATION_STATUS_TRANSITIONS,
  MHD_LEAVE_BENEFIT_TYPES,
  MHD_LEAVE_BONDING_EVENT_TYPES,
  MHD_LEAVE_CERTIFICATION_CLEARABLE_DATES,
  MHD_LEAVE_EMPLOYER_REQUIRABLE_PAY_SOURCES,
  MHD_LEAVE_GROUP_HEALTH_BENEFIT_TYPES,
  MHD_LEAVE_HEALTH_PREMIUM_MIN_GRACE_DAYS,
  MHD_LEAVE_SEGMENT_STATUS_TRANSITIONS,
  MHD_LEAVE_YEAR_METHODS,
} from './WorkflowTypes';
import type {
  MhdLeaveBenefitObligationInput,
  MhdLeaveBenefitObligationStatusInput,
  MhdLeaveBenefitTransactionInput,
  MhdLeaveBondingEventInput,
  MhdLeaveCertificationClearDatesInput,
  MhdLeaveDesignatedPersonInput,
  MhdLeaveDesignatedPersonVoidInput,
  MhdLeaveKeyEmployeeInput,
  MhdLeavePaySourceInput,
  MhdLeavePolicySetInput,
  MhdLeaveReturnToWorkInput,
  MhdLeaveSegmentInput,
  MhdLeaveSegmentStatusInput,
  MhdLeaveWorkersCompInput,
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
    const hours =
      input.actualHours ??
      (input.currentActualHours == null ? null : Number(input.currentActualHours));
    if (hours == null || !Number.isFinite(hours) || hours <= 0) {
      throw new Error('A taken segment requires actual hours greater than zero.');
    }
  }
}

export function mhdValidateLeaveBenefitObligation(
  input: MhdLeaveBenefitObligationInput,
): string | null {
  if (!(MHD_LEAVE_BENEFIT_TYPES as readonly string[]).includes(input.benefitType))
    return 'Choose a benefit type from the list.';
  if (!(MHD_LEAVE_BENEFIT_FREQUENCIES as readonly string[]).includes(input.frequency))
    return 'Choose a contribution frequency from the list.';
  if (!input.coverageStart) return 'Enter the coverage start date.';
  if (input.coverageEnd && input.coverageEnd < input.coverageStart)
    return 'Coverage cannot end before it starts.';
  for (const amount of [input.employerAmount, input.employeeAmount]) {
    if (!Number.isFinite(amount) || amount < 0) return 'Amounts must be zero or more.';
  }
  if (input.continuationBasis) {
    if (!MHD_LEAVE_GROUP_HEALTH_BENEFIT_TYPES.includes(input.benefitType as never))
      return 'Only a group health benefit has a continuation basis.';
    if (
      input.gracePeriodDays != null &&
      input.gracePeriodDays < MHD_LEAVE_HEALTH_PREMIUM_MIN_GRACE_DAYS
    )
      return `The grace period for group health premiums cannot be shorter than ${MHD_LEAVE_HEALTH_PREMIUM_MIN_GRACE_DAYS} days.`;
  }
  if (input.gracePeriodDays != null && input.gracePeriodDays < 0)
    return 'The grace period cannot be negative.';
  return null;
}

export function mhdValidateLeaveBenefitObligationStatus(
  input: MhdLeaveBenefitObligationStatusInput,
): void {
  if (
    !MHD_LEAVE_BENEFIT_OBLIGATION_STATUS_TRANSITIONS[input.currentStatus].includes(input.status)
  ) {
    throw new Error(
      `Benefit obligation status cannot change from ${input.currentStatus} to ${input.status}.`,
    );
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

const DAYS_IN_MONTH_NON_LEAP = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function mhdValidateLeaveBondingEvent(input: MhdLeaveBondingEventInput): string | null {
  if (!input.eventDate) return 'Enter the date of the birth, adoption or placement.';
  if (!(MHD_LEAVE_BONDING_EVENT_TYPES as readonly string[]).includes(input.eventType))
    return 'Choose the type of bonding event.';
  return null;
}

export function mhdValidateLeaveDesignatedPerson(
  input: MhdLeaveDesignatedPersonInput,
): string | null {
  if (!input.designatedName.trim()) return "Enter the designated person's name.";
  return null;
}

export function mhdValidateLeaveDesignatedPersonVoid(
  input: MhdLeaveDesignatedPersonVoidInput,
): string | null {
  if (!input.reason.trim()) return 'Voiding a designation requires a reason.';
  return null;
}

/**
 * Client mirror of the substitution guard (mhd_leave_pay_assert_substitution). The server also knows
 * what else is paying and the leave's reason, so its message is the authority for those rules.
 */
export function mhdValidateLeavePaySource(input: MhdLeavePaySourceInput): string | null {
  if (input.paidFrom && input.paidTo && input.paidTo < input.paidFrom)
    return 'The pay period cannot end before it starts.';
  if (input.employerRequired) {
    if (input.sourceKey === 'CA_PAID_SICK')
      return 'Statutory California paid sick leave can never be required; the employee chooses whether to use it.';
    if (!MHD_LEAVE_EMPLOYER_REQUIRABLE_PAY_SOURCES.includes(input.sourceKey))
      return 'That pay source is not something an employer can require an employee to use.';
  }
  return null;
}

export function mhdValidateLeaveWorkersComp(input: MhdLeaveWorkersCompInput): string | null {
  const hasDetail =
    Boolean(input.filedOn) ||
    Boolean(input.concurrentDesignatedOn) ||
    Boolean(input.lightDutyDeclinedNote?.trim());
  if (!input.claim && hasDetail) return "Claim details need a workers' compensation claim.";
  if (input.filedOn && input.concurrentDesignatedOn && input.concurrentDesignatedOn < input.filedOn)
    return 'Concurrent designation cannot precede the claim.';
  return null;
}

export function mhdValidateLeaveKeyEmployee(input: MhdLeaveKeyEmployeeInput): string | null {
  if (input.status !== 'NOT_DETERMINED' && !input.determinedOn)
    return 'Enter the date the key-employee determination was made.';
  if (input.status !== 'KEY' && (input.noticeOn || input.restorationDeniedNoticeOn))
    return 'Key-employee notices apply only to a key employee.';
  if (input.restorationDeniedNoticeOn && !input.noticeOn)
    return 'Record the key-employee notice given at the request before a restoration-denial notice.';
  if (
    input.noticeOn &&
    input.restorationDeniedNoticeOn &&
    input.restorationDeniedNoticeOn < input.noticeOn
  )
    return 'The restoration-denial notice cannot precede the key-employee notice.';
  return null;
}

export function mhdValidateLeaveReturnToWork(input: MhdLeaveReturnToWorkInput): string | null {
  if (!input.expectedReturnDate) return 'Enter the expected return date.';
  if (input.actualReturnDate && input.sameOrComparableJob == null && !input.reinstatementOutcome)
    return 'Say whether the employee returned to the same or a comparable job.';
  if (input.rtwCertificationRequestedOn && !input.fitnessRequired)
    return 'A return-to-work certification can be requested only when one is required.';
  if (
    input.rtwCertificationReceivedOn &&
    (!input.rtwCertificationRequestedOn ||
      input.rtwCertificationReceivedOn < input.rtwCertificationRequestedOn)
  )
    return 'A certification cannot be received before it was requested.';
  if (
    input.reinstatementOutcome === 'NOT_REINSTATED' &&
    !input.exceptionReason?.trim() &&
    !input.reinstatementNote?.trim()
  )
    return 'Not reinstating an employee requires a recorded reason.';
  return null;
}

export function mhdValidateLeaveCertificationClearDates(
  input: MhdLeaveCertificationClearDatesInput,
): string | null {
  if (input.fields.length === 0) return 'Choose the dates to clear.';
  if (!input.fields.every((field) => MHD_LEAVE_CERTIFICATION_CLEARABLE_DATES.includes(field)))
    return 'One of the chosen dates cannot be cleared.';
  if (!input.reason.trim()) return 'Clearing a certification date requires a reason.';
  return null;
}

export function mhdValidateLeavePolicySet(input: MhdLeavePolicySetInput): string | null {
  if (!MHD_LEAVE_YEAR_METHODS.includes(input.yearMethod)) return 'Choose a leave-year method.';
  if (input.yearMethod === 'FIXED_YEAR') {
    const { anchorMonth, anchorDay } = input;
    if (!anchorMonth || !anchorDay) return 'A fixed leave year needs an anchor month and day.';
    if (anchorMonth < 1 || anchorMonth > 12 || anchorDay < 1) return 'Enter a valid anchor date.';
    if (anchorDay > DAYS_IN_MONTH_NON_LEAP[anchorMonth - 1])
      return 'The anchor must be a valid calendar day (February 29 is not allowed).';
  } else if (input.anchorMonth || input.anchorDay) {
    return 'Only a fixed leave year takes an anchor date.';
  }
  return null;
}
