/** One row of `transactions` in a benefit obligation, as mhd_leave_workflow_get returns it. */
export interface MhdLeaveBenefitTransaction {
  id: string;
  transaction_type: string;
  amount: number | string;
  effective_date: string;
  reference_note: string | null;
  reversal_of: string | null;
}

/** One designated person on a case (mhd_leave_workflow_get -> designated_persons). */
export interface MhdLeaveDesignatedPerson {
  id: string;
  designated_name: string;
  relationship_note: string | null;
  designated_at: string;
  pfl_attested_on: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

/** A legal clock on the case (compliance_deadlines rows of kind LEAVE_*). */
export interface MhdLeaveDeadline {
  id: string;
  deadline_kind: MhdLeaveDeadlineKind;
  basis_event: string;
  basis_at: string;
  due_at: string;
  satisfied_at: string | null;
  waived_at: string | null;
  waiver_reason: string | null;
  legal_citation: string | null;
  is_overdue: boolean;
}

export interface MhdLeaveChecklistItem {
  stage_no: number;
  stage_key: MhdLeaveChecklistStageKey;
  item_key: string;
  label: string;
  status: MhdLeaveChecklistStatus;
  due_at: string | null;
  /** An item HR added to this case (0395); generated items are false. */
  is_custom: boolean;
  /** A generated item whose label, stage, due date or status HR adjusted on this case (0395). */
  is_overridden: boolean;
  /** A generated item whose due date HR set by hand (otherwise the rules' deadline governs). */
  due_overridden: boolean;
  /** What the rules compute for a generated item, before any adjustment; null for a custom item. */
  generated_status: MhdLeaveChecklistStatus | null;
  /** HR's note on the item; returned to leave administrators only. */
  note: string | null;
  /** Who set the status by hand (Mark Done, Reopen, Not Applicable), and when. */
  status_set_by_name: string | null;
  status_set_at: string | null;
}

export interface MhdLeavePaySource {
  id: string;
  source_key: MhdLeavePaySourceKey;
  label: string;
  status: MhdLeavePaySourceStatus;
  claim_ref: string | null;
  paid_from: string | null;
  paid_to: string | null;
  employer_required: boolean;
  mutual_agreement: boolean;
  note: string | null;
}

export interface MhdLeaveHealthContinuation {
  continuation_basis: MhdLeaveContinuationBasis;
  label: string;
  coverage_start: string;
  cap_end: string;
  coverage_end: string | null;
  exceeds_cap: boolean;
  days_remaining: number;
}

export interface MhdLeaveWorkersComp {
  claim: boolean;
  claim_filed_on: string | null;
  concurrent_designated_on: string | null;
  light_duty_declined_note: string | null;
}

export interface MhdLeaveKeyEmployee {
  status: MhdLeaveKeyEmployeeStatus;
  determined_on: string | null;
  notice_on: string | null;
  restoration_denied_notice_on: string | null;
}

export interface MhdLeaveBenefit {
  id: string;
  benefit_type: MhdLeaveBenefitType;
  benefit_label: string | null;
  coverage_start: string;
  coverage_end: string | null;
  employer_amount: number | string;
  employee_amount: number | string;
  frequency: MhdLeaveBenefitFrequency;
  status: MhdLeaveBenefitObligationStatus;
  status_reason: string | null;
  due_date: string | null;
  grace_period_days: number | null;
  continuation_basis: MhdLeaveContinuationBasis | null;
  seniority_credit_through: string | null;
  transactions: MhdLeaveBenefitTransaction[];
}

/** One election in company_leave_policies (mhd_leave_policy_get -> history / upcoming). */
export interface MhdLeavePolicyElection {
  year_method: MhdLeaveYearMethod;
  anchor_month: number | null;
  anchor_day: number | null;
  effective_from: string;
  limit_designated_person: boolean;
  rtw_certification_uniform_policy: boolean;
}

export interface MhdLeavePolicy {
  election_recorded: boolean;
  year_method: MhdLeaveYearMethod | null;
  anchor_month: number | null;
  anchor_day: number | null;
  effective_from: string | null;
  limit_designated_person: boolean;
  rtw_certification_uniform_policy: boolean;
  /** `LEAVE_YEAR_METHOD_<METHOD>` or `LEAVE_YEAR_METHOD_MOST_FAVORABLE`. */
  method_text_key: string;
  upcoming: MhdLeavePolicyElection | null;
  history: Array<
    MhdLeavePolicyElection & {
      id: string;
      change_reason: string | null;
      set_by: string;
      created_at: string;
    }
  >;
}

export interface MhdLeaveWorkflow {
  case: {
    id: string;
    reference_id: string;
    person_id: string;
    company_id: string;
    reason_code: MhdLeaveReasonCode | null;
    family_relationship: MhdLeaveFamilyRelationship | null;
    requested_mode: MhdLeaveRequestedMode | null;
    intake_channel: string;
    is_intermittent: boolean;
    requested_start: string | null;
    requested_end: string | null;
    actual_start: string | null;
    actual_end: string | null;
    status: string;
    bonding_event_date: string | null;
    bonding_event_type: MhdLeaveBondingEventType | null;
    essential_functions_provided_on: string | null;
    /** Administrators only; null for an employee reading their own case. */
    workers_comp: MhdLeaveWorkersComp | null;
    /** Administrators only; null for an employee reading their own case. */
    key_employee: MhdLeaveKeyEmployee | null;
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
  designated_persons: MhdLeaveDesignatedPerson[];
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
  deadlines: MhdLeaveDeadline[];
  checklist: MhdLeaveChecklistItem[];
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
  pay_sources: MhdLeavePaySource[];
  benefits: MhdLeaveBenefit[];
  health_continuation: MhdLeaveHealthContinuation[];
  return_to_work: {
    id: string;
    expected_return_date: string;
    actual_return_date: string | null;
    same_or_comparable_job: boolean | null;
    fitness_required: boolean;
    restrictions_present: boolean;
    accommodation_referral_required: boolean;
    accommodation_case_id: string | null;
    reinstatement_outcome: MhdLeaveReinstatementOutcome | null;
    /** Administrators only. */
    reinstatement_exception_reason: string | null;
    rtw_certification_requested_on: string | null;
    rtw_certification_received_on: string | null;
  } | null;
  policy: MhdLeavePolicy;
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
  /**
   * Retained for the RPC signature only. Since 0382 the recorded designated person decides, not
   * this flag (see mhdLeaveWorkflowService.recordDesignatedPerson).
   */
  designatedPersonSelected?: boolean;
  coveredEmployerOverride: boolean;
  /** FMLA: an adult child counts only when incapable of self-care. Omit when unknown. */
  incapableOfSelfCare?: boolean | null;
  /** FMLA: intermittent bonding leave needs the employer's agreement. */
  employerAgreedIntermittentBonding?: boolean;
}

// Vocabularies below mirror the database CHECK constraints named beside each list, so a
// picker can never offer a value the RPC would refuse.

/** leave_segment_mode_allowed on leave_schedule_segments. */
export const MHD_LEAVE_SEGMENT_MODES = ['CONTINUOUS', 'INTERMITTENT', 'REDUCED_SCHEDULE'] as const;
export type MhdLeaveSegmentMode = (typeof MHD_LEAVE_SEGMENT_MODES)[number];

/** leave_segment_status_allowed on leave_schedule_segments. */
export const MHD_LEAVE_SEGMENT_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'TAKEN',
  'DENIED',
  'CANCELLED',
] as const;
export type MhdLeaveSegmentStatus = (typeof MHD_LEAVE_SEGMENT_STATUSES)[number];

/** Lifecycle enforced by migration 0332 and the leave schedule status RPC. */
export const MHD_LEAVE_SEGMENT_STATUS_TRANSITIONS: Readonly<
  Record<MhdLeaveSegmentStatus, readonly MhdLeaveSegmentStatus[]>
> = {
  REQUESTED: ['APPROVED', 'DENIED', 'CANCELLED', 'TAKEN'],
  APPROVED: ['TAKEN', 'CANCELLED'],
  TAKEN: [],
  DENIED: [],
  CANCELLED: [],
};

/** Source: migration 0332 CHECK constraint leave_benefit_status_allowed. */
export const MHD_LEAVE_BENEFIT_OBLIGATION_STATUSES = [
  'ACTIVE',
  'PAST_DUE',
  'SATISFIED',
  'WAIVED',
  'ENDED',
] as const;
export type MhdLeaveBenefitObligationStatus =
  (typeof MHD_LEAVE_BENEFIT_OBLIGATION_STATUSES)[number];
export const MHD_LEAVE_BENEFIT_OBLIGATION_STATUS_TRANSITIONS: Readonly<
  Record<MhdLeaveBenefitObligationStatus, readonly MhdLeaveBenefitObligationStatus[]>
> = {
  ACTIVE: ['PAST_DUE', 'SATISFIED', 'WAIVED', 'ENDED'],
  PAST_DUE: ['ACTIVE', 'SATISFIED', 'WAIVED', 'ENDED'],
  SATISFIED: ['ENDED'],
  WAIVED: [],
  ENDED: [],
};

/**
 * leave_benefit_transaction_type_allowed on leave_benefit_transactions. REVERSAL is
 * valid in the database only with a `reversal_of` transaction id (leave_benefit_reversal_shape),
 * so the base list omits it; the form adds it only when the chosen obligation has a
 * reversible transaction (see mhdReversibleBenefitTransactions).
 */
export const MHD_LEAVE_BENEFIT_TRANSACTION_TYPES = [
  'CHARGE',
  'PAYMENT',
  'ADJUSTMENT',
  'REVERSAL',
] as const;
export type MhdLeaveBenefitTransactionType = (typeof MHD_LEAVE_BENEFIT_TRANSACTION_TYPES)[number];
export const MHD_LEAVE_BENEFIT_RECORDABLE_TRANSACTION_TYPES =
  MHD_LEAVE_BENEFIT_TRANSACTION_TYPES.filter(
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

export interface MhdLeaveSegmentStatusInput {
  segmentId: string;
  currentStatus: MhdLeaveSegmentStatus;
  status: MhdLeaveSegmentStatus;
  actualHours?: number | null;
  currentActualHours?: number | string | null;
}

export interface MhdLeaveBenefitObligationInput {
  caseId: string;
  benefitType: string;
  coverageStart: string;
  coverageEnd?: string | null;
  employerAmount: number;
  employeeAmount: number;
  frequency: string;
  dueDate?: string | null;
  /** Health benefits only; defaults from the continuation rule (30 days) and may not be shorter. */
  gracePeriodDays?: number | null;
  continuationBasis?: MhdLeaveContinuationBasis | null;
  seniorityCreditThrough?: string | null;
  /** Free-text description kept alongside the controlled benefit type. */
  benefitLabel?: string | null;
}

export interface MhdLeaveBenefitObligationStatusInput {
  obligationId: string;
  currentStatus: MhdLeaveBenefitObligationStatus;
  status: MhdLeaveBenefitObligationStatus;
  reason?: string | null;
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

// ---------------------------------------------------------------------------
// Vocabularies added by migrations 0381-0389. One constant per list; every picker, schema and
// test reads these, never a hand-typed copy. Each mirrors the database list named beside it.
// ---------------------------------------------------------------------------

/** mhd_leave_family_relationship_values() (0382). */
export const MHD_LEAVE_FAMILY_RELATIONSHIPS = [
  'CHILD',
  'CHILD_ADULT',
  'PARENT',
  'PARENT_IN_LAW',
  'SPOUSE',
  'DOMESTIC_PARTNER',
  'GRANDPARENT',
  'GRANDCHILD',
  'SIBLING',
  'DESIGNATED_PERSON',
  'NEXT_OF_KIN',
] as const;
export type MhdLeaveFamilyRelationship = (typeof MHD_LEAVE_FAMILY_RELATIONSHIPS)[number];

/** Reason codes the eligibility engine accepts. */
export const MHD_LEAVE_REASON_CODES = [
  'OWN_SERIOUS_HEALTH_CONDITION',
  'FAMILY_SERIOUS_HEALTH_CONDITION',
  'BONDING',
  'QUALIFYING_EXIGENCY',
  'MILITARY_CAREGIVER',
  'PREGNANCY_DISABILITY',
] as const;
export type MhdLeaveReasonCode = (typeof MHD_LEAVE_REASON_CODES)[number];

/** Reasons that need a family relationship (the engine's own rule). */
export const MHD_LEAVE_RELATIONSHIP_REASONS: readonly MhdLeaveReasonCode[] = [
  'FAMILY_SERIOUS_HEALTH_CONDITION',
  'QUALIFYING_EXIGENCY',
  'MILITARY_CAREGIVER',
];

/** leave_cases_bonding_event_type_allowed (0382). */
export const MHD_LEAVE_BONDING_EVENT_TYPES = ['BIRTH', 'ADOPTION', 'FOSTER'] as const;
export type MhdLeaveBondingEventType = (typeof MHD_LEAVE_BONDING_EVENT_TYPES)[number];

/** company_leave_policy_method_allowed (0381). */
export const MHD_LEAVE_YEAR_METHODS = [
  'CALENDAR_YEAR',
  'FIXED_YEAR',
  'ROLLING_FORWARD',
  'ROLLING_BACKWARD',
] as const;
export type MhdLeaveYearMethod = (typeof MHD_LEAVE_YEAR_METHODS)[number];

/** leave_cases_requested_mode_allowed. */
export const MHD_LEAVE_REQUESTED_MODES = [
  'CONTINUOUS',
  'INTERMITTENT',
  'REDUCED_SCHEDULE',
] as const;
export type MhdLeaveRequestedMode = (typeof MHD_LEAVE_REQUESTED_MODES)[number];

/** Intake channels an administrator may write (SELF_SERVICE is written only by the employee's own request). */
export const MHD_LEAVE_ADMIN_INTAKE_CHANNELS = ['HR_ENTRY', 'MANAGER_REFERRAL', 'OTHER'] as const;
export type MhdLeaveAdminIntakeChannel = (typeof MHD_LEAVE_ADMIN_INTAKE_CHANNELS)[number];

/** leave_pay_source_kinds (0384). */
export const MHD_LEAVE_PAY_SOURCE_KEYS = [
  'SDI',
  'PFL',
  'WC',
  'EMPLOYER_PLAN',
  'PTO',
  'EMPLOYER_SICK',
  'CA_PAID_SICK',
  'UNPAID',
] as const;
export type MhdLeavePaySourceKey = (typeof MHD_LEAVE_PAY_SOURCE_KEYS)[number];

/** Pay-source keys an employer may ask an employee to use under any condition. */
export const MHD_LEAVE_EMPLOYER_REQUIRABLE_PAY_SOURCES: readonly MhdLeavePaySourceKey[] = [
  'PTO',
  'EMPLOYER_SICK',
];

/** leave_pay_status_allowed (0384). */
export const MHD_LEAVE_PAY_SOURCE_STATUSES = [
  'EXPECTED',
  'APPROVED',
  'PAYING',
  'ENDED',
  'DENIED',
] as const;
export type MhdLeavePaySourceStatus = (typeof MHD_LEAVE_PAY_SOURCE_STATUSES)[number];

/** Warning codes the pay-source RPCs return alongside success. */
export const MHD_LEAVE_PAY_SOURCE_WARNINGS = ['SDI_PFL_OVERLAP'] as const;
export type MhdLeavePaySourceWarning = (typeof MHD_LEAVE_PAY_SOURCE_WARNINGS)[number];

/** mhd_leave_benefit_types() / mhd_leave_benefit_frequencies() (0384). */
export const MHD_LEAVE_BENEFIT_TYPES = [
  'MEDICAL',
  'DENTAL',
  'VISION',
  'LIFE_INSURANCE',
  'DISABILITY_INSURANCE',
  'RETIREMENT',
  'FSA_HSA',
  'OTHER',
] as const;
export type MhdLeaveBenefitType = (typeof MHD_LEAVE_BENEFIT_TYPES)[number];
export const MHD_LEAVE_GROUP_HEALTH_BENEFIT_TYPES: readonly MhdLeaveBenefitType[] = [
  'MEDICAL',
  'DENTAL',
  'VISION',
];

export const MHD_LEAVE_BENEFIT_FREQUENCIES = [
  'WEEKLY',
  'BIWEEKLY',
  'SEMI_MONTHLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL',
  'ONE_TIME',
] as const;
export type MhdLeaveBenefitFrequency = (typeof MHD_LEAVE_BENEFIT_FREQUENCIES)[number];

/** leave_benefit_rules (0384): 12 workweeks FMLA/CFRA, four months PDL, tracked separately. */
export const MHD_LEAVE_CONTINUATION_BASES = ['FMLA_CFRA', 'PDL'] as const;
export type MhdLeaveContinuationBasis = (typeof MHD_LEAVE_CONTINUATION_BASES)[number];
/** Minimum grace period (days) for group health premiums; mirrors leave_benefit_rules.default_grace_days. */
export const MHD_LEAVE_HEALTH_PREMIUM_MIN_GRACE_DAYS = 30;

/** leave_cases_key_employee_status_allowed (0385): an FMLA-only exception. */
export const MHD_LEAVE_KEY_EMPLOYEE_STATUSES = ['NOT_DETERMINED', 'NOT_KEY', 'KEY'] as const;
export type MhdLeaveKeyEmployeeStatus = (typeof MHD_LEAVE_KEY_EMPLOYEE_STATUSES)[number];

/** leave_return_outcome_allowed (0385). */
export const MHD_LEAVE_REINSTATEMENT_OUTCOMES = [
  'SAME_POSITION',
  'COMPARABLE_POSITION',
  'NOT_REINSTATED',
] as const;
export type MhdLeaveReinstatementOutcome = (typeof MHD_LEAVE_REINSTATEMENT_OUTCOMES)[number];

/** leave_notice_type_allowed (0385). */
export const MHD_LEAVE_NOTICE_TYPES = [
  'ELIGIBILITY',
  'RIGHTS_RESPONSIBILITIES',
  'DESIGNATION',
  'DEFICIENCY',
  'CHANGE',
  'BALANCE',
  'BENEFITS',
  'RETURN_TO_WORK',
  'DENIAL',
  'EDD_FAMILY_LEAVE_PAMPHLET',
  'EDD_DISABILITY_PAMPHLET',
  'EDD_UI_PAMPHLET',
  'CHANGE_IN_RELATIONSHIP',
  'KEY_EMPLOYEE_REQUEST',
  'KEY_EMPLOYEE_RESTORATION_DENIAL',
  'ESSENTIAL_FUNCTIONS',
] as const;
export type MhdLeaveNoticeType = (typeof MHD_LEAVE_NOTICE_TYPES)[number];

/** compliance_deadlines_kind_allowed, the LEAVE_* kinds (0383). */
export const MHD_LEAVE_DEADLINE_KINDS = [
  'LEAVE_ELIGIBILITY_NOTICE',
  'LEAVE_DESIGNATION_NOTICE',
  'LEAVE_CERT_DUE',
  'LEAVE_CERT_CURE',
  'LEAVE_CFRA_RESPONSE',
  'LEAVE_CHANGE_IN_RELATIONSHIP',
  'LEAVE_BENEFIT_LAPSE_NOTICE',
] as const;
export type MhdLeaveDeadlineKind = (typeof MHD_LEAVE_DEADLINE_KINDS)[number];

/** mhd_leave_documentation_checklist (0385). */
export const MHD_LEAVE_CHECKLIST_STATUSES = [
  'DONE',
  'OPEN',
  'OVERDUE',
  'UPCOMING',
  'NOT_APPLICABLE',
] as const;
export type MhdLeaveChecklistStatus = (typeof MHD_LEAVE_CHECKLIST_STATUSES)[number];
export const MHD_LEAVE_CHECKLIST_STAGE_KEYS = [
  'REQUEST',
  'ELIGIBILITY',
  'NOTICES',
  'CERTIFICATION',
  'DESIGNATION',
  'TRACKING',
  'PAY_COORDINATION',
  'BENEFITS',
  'RETURN_TO_WORK',
] as const;
export type MhdLeaveChecklistStageKey = (typeof MHD_LEAVE_CHECKLIST_STAGE_KEYS)[number];
/** Status actions mhd_leave_checklist_set_status accepts (0395). */
export const MHD_LEAVE_CHECKLIST_ACTIONS = [
  'MARK_DONE',
  'REOPEN',
  'MARK_NOT_APPLICABLE',
  'RESTORE',
] as const;
export type MhdLeaveChecklistAction = (typeof MHD_LEAVE_CHECKLIST_ACTIONS)[number];

/** Dates mhd_leave_certification_clear_dates can remove (the cure date follows its deficiency date). */
export const MHD_LEAVE_CERTIFICATION_CLEARABLE_DATES = [
  'received_at',
  'deficiency_notified_at',
  'requested_at',
] as const;
export type MhdLeaveCertificationClearableDate =
  (typeof MHD_LEAVE_CERTIFICATION_CLEARABLE_DATES)[number];

// ---------------------------------------------------------------------------
// Inputs for the writers added by migrations 0381-0386.
// ---------------------------------------------------------------------------

export interface MhdLeaveBondingEventInput {
  caseId: string;
  eventDate: string;
  eventType: MhdLeaveBondingEventType;
}

export interface MhdLeaveDesignatedPersonInput {
  caseId: string;
  designatedName: string;
  relationshipNote?: string | null;
  /** SB 590 (2028-07-01): the employee's sworn first-time attestation for Paid Family Leave. */
  pflAttestedOn?: string | null;
}

export interface MhdLeaveDesignatedPersonVoidInput {
  designatedPersonId: string;
  reason: string;
}

export interface MhdLeavePaySourceInput {
  caseId: string;
  sourceKey: MhdLeavePaySourceKey;
  status: MhdLeavePaySourceStatus;
  claimRef?: string | null;
  paidFrom?: string | null;
  paidTo?: string | null;
  employerRequired?: boolean;
  mutualAgreement?: boolean;
  note?: string | null;
}

export interface MhdLeavePaySourceStatusInput {
  paySourceId: string;
  status: MhdLeavePaySourceStatus;
  paidFrom?: string | null;
  paidTo?: string | null;
  claimRef?: string | null;
}

export interface MhdLeaveWorkersCompInput {
  caseId: string;
  claim: boolean;
  filedOn?: string | null;
  concurrentDesignatedOn?: string | null;
  lightDutyDeclinedNote?: string | null;
}

export interface MhdLeaveKeyEmployeeInput {
  caseId: string;
  status: MhdLeaveKeyEmployeeStatus;
  determinedOn?: string | null;
  noticeOn?: string | null;
  restorationDeniedNoticeOn?: string | null;
}

export interface MhdLeaveReturnToWorkInput {
  caseId: string;
  expectedReturnDate: string;
  actualReturnDate?: string | null;
  sameOrComparableJob?: boolean | null;
  fitnessRequired: boolean;
  restrictionsPresent: boolean;
  accommodationReferralRequired: boolean;
  reinstatementNote?: string | null;
  reinstatementOutcome?: MhdLeaveReinstatementOutcome | null;
  /** Required for a pregnancy-disability comparable position or any non-reinstatement. */
  exceptionReason?: string | null;
  rtwCertificationRequestedOn?: string | null;
  rtwCertificationReceivedOn?: string | null;
}

export interface MhdLeaveCertificationClearDatesInput {
  certificationId: string;
  fields: MhdLeaveCertificationClearableDate[];
  reason: string;
}

// ---------------------------------------------------------------------------
// Inputs for the checklist adjustment writers (migration 0395).
// ---------------------------------------------------------------------------

export interface MhdLeaveChecklistItemInput {
  caseId: string;
  stageKey: MhdLeaveChecklistStageKey;
  label: string;
  /** A calendar date (YYYY-MM-DD); the item is due by the end of that day, local time. */
  dueDate?: string | null;
  note?: string | null;
}

export interface MhdLeaveChecklistEditInput extends MhdLeaveChecklistItemInput {
  itemKey: string;
}

export interface MhdLeaveChecklistStatusInput {
  caseId: string;
  itemKey: string;
  action: MhdLeaveChecklistAction;
  note?: string | null;
}

export interface MhdLeaveChecklistRemoveInput {
  caseId: string;
  itemKey: string;
}

export interface MhdLeavePolicySetInput {
  companyId: string;
  yearMethod: MhdLeaveYearMethod;
  anchorMonth?: number | null;
  anchorDay?: number | null;
  effectiveFrom?: string | null;
  limitDesignatedPerson?: boolean | null;
  reason?: string | null;
  rtwCertificationUniform?: boolean | null;
}
