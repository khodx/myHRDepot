/** One row of `transactions` in a benefit obligation, as mhd_leave_workflow_get returns it. */
export interface MhdLeaveBenefitTransaction {
  id: string;
  transaction_type: string;
  amount: number | string;
  effective_date: string;
  reference_note: string | null;
  reversal_of: string | null;
}

export interface MhdLeaveWorkflow {
  case: {
    id: string;
    reference_id: string;
    person_id: string;
    reason_code: string | null;
    family_relationship: string | null;
    requested_mode: string | null;
    status: string;
  };
  eligibility: Array<{
    id: string;
    snapshot_id: string;
    leave_type_id: string;
    type_key: string;
    evaluated_outcome: string;
    effective_outcome: string;
    findings: Array<Record<string, unknown>>;
    entitlement_hours: number | string | null;
    override_reason: string | null;
    confirmed_at: string | null;
  }>;
  notices: Array<{
    id: string;
    notice_type: string;
    status: string;
    template_key: string;
    template_version: number;
    issued_at: string | null;
    due_at: string | null;
    delivered_at: string | null;
    acknowledged_at: string | null;
  }>;
  segments: Array<{
    id: string;
    segment_mode: string;
    start_at: string;
    end_at: string;
    planned_hours: number | string;
    actual_hours: number | string | null;
    status: string;
    designated_at: string | null;
  }>;
  events: Array<{
    id: string;
    event_type: string;
    channel: string;
    occurred_at: string;
    summary: string;
    visibility: string;
  }>;
  certifications: Array<{
    id: string;
    certification_type: string;
    status: string;
    requested_at: string | null;
    due_date: string | null;
    received_at: string | null;
    deficiency_notified_at: string | null;
    cure_due_date: string | null;
  }>;
  benefits: Array<{
    id: string;
    benefit_type: string;
    coverage_start: string;
    coverage_end: string | null;
    employer_amount: number | string;
    employee_amount: number | string;
    frequency: string;
    status: string;
    transactions: MhdLeaveBenefitTransaction[];
  }>;
  return_to_work: {
    id: string;
    expected_return_date: string;
    actual_return_date: string | null;
    same_or_comparable_job: boolean | null;
    fitness_required: boolean;
    restrictions_present: boolean;
    accommodation_referral_required: boolean;
    accommodation_case_id: string | null;
  } | null;
}

export interface MhdLeaveEligibilityInput {
  caseId: string;
  asOfDate: string;
  employerEmployeeCount: number;
  monthsOfService: number;
  hoursWorked12Months: number;
  worksiteEmployeeCount75: number;
  scheduledWeeklyHours: number;
  reasonCode: string;
  familyRelationship?: string | null;
  designatedPersonSelected: boolean;
  coveredEmployerOverride: boolean;
}

// Vocabularies below mirror the database CHECK constraints named beside each list, so a
// picker can never offer a value the RPC would refuse.

/** leave_segment_mode_allowed on leave_schedule_segments. */
export const MHD_LEAVE_SEGMENT_MODES = ['CONTINUOUS', 'INTERMITTENT', 'REDUCED_SCHEDULE'] as const;
export type MhdLeaveSegmentMode = (typeof MHD_LEAVE_SEGMENT_MODES)[number];

/** leave_segment_status_allowed on leave_schedule_segments. */
export const MHD_LEAVE_SEGMENT_STATUSES = ['REQUESTED', 'APPROVED', 'TAKEN', 'DENIED', 'CANCELLED'] as const;
export type MhdLeaveSegmentStatus = (typeof MHD_LEAVE_SEGMENT_STATUSES)[number];

/**
 * leave_benefit_transaction_type_allowed on leave_benefit_transactions. REVERSAL is
 * valid in the database only with a `reversal_of` transaction id (leave_benefit_reversal_shape),
 * so the base list omits it; the form adds it only when the chosen obligation has a
 * reversible transaction (see mhdReversibleBenefitTransactions).
 */
export const MHD_LEAVE_BENEFIT_TRANSACTION_TYPES = ['CHARGE', 'PAYMENT', 'ADJUSTMENT', 'REVERSAL'] as const;
export type MhdLeaveBenefitTransactionType = (typeof MHD_LEAVE_BENEFIT_TRANSACTION_TYPES)[number];
export const MHD_LEAVE_BENEFIT_RECORDABLE_TRANSACTION_TYPES = MHD_LEAVE_BENEFIT_TRANSACTION_TYPES.filter(
  (type): type is Exclude<MhdLeaveBenefitTransactionType, 'REVERSAL'> => type !== 'REVERSAL',
);

/**
 * Transactions a REVERSAL may target, mirroring the RPC: not itself a REVERSAL and not
 * already reversed by another transaction on the same obligation.
 */
export function mhdReversibleBenefitTransactions(
  transactions: MhdLeaveBenefitTransaction[],
): MhdLeaveBenefitTransaction[] {
  const reversedIds = new Set(
    transactions.flatMap((item) => (item.reversal_of ? [item.reversal_of] : [])),
  );
  return transactions.filter(
    (item) => item.transaction_type !== 'REVERSAL' && !reversedIds.has(item.id),
  );
}

export interface MhdLeaveSegmentInput {
  caseId: string;
  segmentMode: MhdLeaveSegmentMode;
  startAt: string;
  endAt?: string | null;
  plannedHours?: number | null;
  actualHours?: number | null;
  status: MhdLeaveSegmentStatus;
}

export interface MhdLeaveBenefitObligationInput {
  caseId: string;
  benefitType: string;
  coverageStart: string;
  coverageEnd?: string | null;
  employerAmount: number;
  employeeAmount: number;
  frequency: string;
}

export interface MhdLeaveBenefitTransactionInput {
  obligationId: string;
  transactionType: MhdLeaveBenefitTransactionType;
  amount: number;
  effectiveDate: string;
  referenceNote?: string | null;
  /** Required for, and only allowed with, a REVERSAL: the transaction being reversed. */
  reversalOf?: string | null;
}
