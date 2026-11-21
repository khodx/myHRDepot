import type {
  MhdLeaveAdminIntakeChannel,
  MhdLeaveContinuationBasis,
  MhdLeaveDeadlineKind,
  MhdLeaveNoticeType,
  MhdLeavePaySourceWarning,
} from '../WorkflowTypes';

// Display wording for the Leaves workflow vocabularies. The values themselves live in
// WorkflowTypes.ts; this module only turns them into words, so every Leaves component
// labels a value the same way.

/** Words in the vocabularies that are acronyms and stay upper case when labelled. */
const ACRONYMS = new Set([
  'CA',
  'CFRA',
  'EDD',
  'FMLA',
  'FSA',
  'HR',
  'HSA',
  'PDL',
  'PFL',
  'PTO',
  'RTW',
  'SDI',
  'UI',
  'WC',
]);

/** `PARENT_IN_LAW` -> `Parent In Law`; acronyms such as `CFRA` keep their case. */
export function mhdLeaveEnumLabel(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word) ? word : `${word.charAt(0)}${word.slice(1).toLowerCase()}`))
    .join(' ');
}

/** The list member equal to `value`, or null. Narrows a select's string without a cast. */
export function mhdLeavePick<T extends string>(list: readonly T[], value: string): T | null {
  return list.find((item) => item === value) ?? null;
}

/** A deadline kind without its `LEAVE_` prefix, e.g. `LEAVE_CERT_DUE` -> `Cert Due`. */
export function mhdLeaveDeadlineKindLabel(kind: MhdLeaveDeadlineKind): string {
  return mhdLeaveEnumLabel(kind.replace(/^LEAVE_/, ''));
}

export const MHD_LEAVE_INTAKE_CHANNEL_LABELS: Readonly<Record<MhdLeaveAdminIntakeChannel, string>> =
  {
    HR_ENTRY: 'HR Entry',
    MANAGER_REFERRAL: 'Manager Referral',
    OTHER: 'Other',
  };

export const MHD_LEAVE_CONTINUATION_BASIS_LABELS: Readonly<
  Record<MhdLeaveContinuationBasis, string>
> = {
  FMLA_CFRA: 'FMLA/CFRA (12 workweeks)',
  PDL: 'Pregnancy Disability (4 months)',
};

export const MHD_LEAVE_PAY_SOURCE_WARNING_MESSAGES: Readonly<
  Record<MhdLeavePaySourceWarning, string>
> = {
  SDI_PFL_OVERLAP: 'SDI and Paid Family Leave cannot be paid for the same period.',
};

/**
 * The deadlines an issued notice closes. Mirrors the notice trigger in migration 0385
 * (`mhd_leave_close_deadlines` calls by notice type); other notice types close none.
 */
export const MHD_LEAVE_NOTICE_DEADLINE_KINDS: Readonly<
  Partial<Record<MhdLeaveNoticeType, readonly MhdLeaveDeadlineKind[]>>
> = {
  ELIGIBILITY: ['LEAVE_ELIGIBILITY_NOTICE', 'LEAVE_CFRA_RESPONSE'],
  RIGHTS_RESPONSIBILITIES: ['LEAVE_ELIGIBILITY_NOTICE', 'LEAVE_CFRA_RESPONSE'],
  DESIGNATION: ['LEAVE_DESIGNATION_NOTICE', 'LEAVE_CFRA_RESPONSE'],
  CHANGE_IN_RELATIONSHIP: ['LEAVE_CHANGE_IN_RELATIONSHIP'],
};

/** Readable wording for the eligibility engine's finding codes (migration 0382). */
const FINDING_MESSAGES: Readonly<Record<string, string>> = {
  EMPLOYER_COVERAGE_NOT_MET:
    'The employer does not meet the employee-count threshold for this basis.',
  MONTHS_OF_SERVICE_NOT_MET: 'The employee has not completed the required months of service.',
  HOURS_WORKED_NOT_MET: 'The employee has not worked the required hours in the prior 12 months.',
  FMLA_75_MILE_WORKSITE_NOT_MET:
    'Fewer than 50 employees work within 75 miles of the worksite (an FMLA-only test).',
  REASON_NOT_COVERED: 'This leave reason is not covered by this basis.',
  FAMILY_RELATIONSHIP_NOT_COVERED: 'This family relationship is not covered by this basis.',
  CFRA_EXCLUDES_PREGNANCY_DISABILITY:
    'CFRA does not cover a pregnancy disability; Pregnancy Disability Leave applies instead.',
  ADULT_CHILD_INCAPABLE_OF_SELF_CARE_UNKNOWN:
    'Whether the adult child is incapable of self-care is not yet known, so FMLA family care cannot be decided.',
  ADULT_CHILD_NOT_INCAPABLE_OF_SELF_CARE:
    'The adult child is not incapable of self-care, so FMLA family care does not apply.',
  DESIGNATED_PERSON_SELECTION_REQUIRED: 'Record the designated person before this basis can apply.',
  BONDING_EVENT_DATE_REQUIRED: 'Record the date of the birth, adoption or foster placement.',
  BONDING_WINDOW_EXPIRED:
    'Bonding leave must be taken within 12 months of the birth or placement, and that window has passed.',
  BONDING_INTERMITTENT_REQUIRES_EMPLOYER_AGREEMENT:
    "Intermittent bonding leave under FMLA needs the employer's agreement.",
  CFRA_BONDING_MINIMUM_PERIOD_MAY_APPLY:
    'The employer may ask that CFRA bonding leave be taken in periods of at least two weeks.',
  CFRA_BONDING_SHORTER_REQUEST_MUST_BE_HONORED:
    'A request for CFRA bonding leave shorter than two weeks must be honored on any two occasions.',
  PFL_DESIGNATED_PERSON_ATTESTATION_APPLIES:
    "Paid Family Leave for a designated person needs the employee's attestation.",
};

/** The finding's readable line, or its raw code when the code is not yet known here. */
export function mhdLeaveFindingMessage(code: string): string {
  return FINDING_MESSAGES[code] ?? code;
}
