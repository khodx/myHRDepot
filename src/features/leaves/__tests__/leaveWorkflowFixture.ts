import { vi } from 'vitest';
import type { MhdLeaveWorkflow } from '../WorkflowTypes';

// Shared test scaffolding for the Leaves workflow components: a complete, empty workflow
// bundle and an idle mutation for every write hook the panel calls.

export function mhdTestLeaveWorkflow(
  caseId: string,
  overrides: Partial<MhdLeaveWorkflow> = {},
  caseOverrides: Partial<MhdLeaveWorkflow['case']> = {},
): MhdLeaveWorkflow {
  return {
    case: {
      id: caseId,
      reference_id: 'LV-004127',
      person_id: 'c2f81d4e-7a39-4b60-95de-1e8f3a6c4b27',
      company_id: '9b5e2c71-3d84-4f1a-a6c0-58d27e4f1b93',
      reason_code: 'OWN_SERIOUS_HEALTH_CONDITION',
      family_relationship: null,
      requested_mode: 'CONTINUOUS',
      intake_channel: 'HR_ENTRY',
      is_intermittent: false,
      requested_start: '2026-08-03',
      requested_end: '2026-09-11',
      actual_start: null,
      actual_end: null,
      status: 'REQUESTED',
      bonding_event_date: null,
      bonding_event_type: null,
      essential_functions_provided_on: null,
      workers_comp: {
        claim: false,
        claim_filed_on: null,
        concurrent_designated_on: null,
        light_duty_declined_note: null,
      },
      key_employee: {
        status: 'NOT_DETERMINED',
        determined_on: null,
        notice_on: null,
        restoration_denied_notice_on: null,
      },
      ...caseOverrides,
    },
    eligibility: [],
    designated_persons: [],
    notices: [],
    deadlines: [],
    checklist: [],
    segments: [],
    events: [],
    certifications: [],
    pay_sources: [],
    benefits: [],
    health_continuation: [],
    return_to_work: null,
    policy: {
      election_recorded: false,
      year_method: null,
      anchor_month: null,
      anchor_day: null,
      effective_from: null,
      limit_designated_person: false,
      rtw_certification_uniform_policy: false,
      method_text_key: 'LEAVE_YEAR_METHOD_MOST_FAVORABLE',
      upcoming: null,
      history: [],
    },
    ...overrides,
  };
}

/** One idle mutation (never pending, resolving undefined) per workflow write hook. */
export function mhdIdleLeaveWorkflowHooks() {
  const idle = () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false });
  return {
    useMhdLeaveReadiness: () => ({ data: undefined }),
    useMhdLeaveEligibility: idle,
    useMhdConfirmLeaveEligibility: idle,
    useMhdOverrideLeaveEligibility: idle,
    useMhdLeaveEvent: idle,
    useMhdLeaveReturnToWork: idle,
    useMhdLeaveNotice: idle,
    useMhdLeaveNoticeDelivery: idle,
    useMhdLeaveSegment: idle,
    useMhdLeaveSegmentStatus: idle,
    useMhdLeaveBenefitObligation: idle,
    useMhdLeaveBenefitObligationStatus: idle,
    useMhdLeaveBenefitTransaction: idle,
    useMhdLeaveBondingEvent: idle,
    useMhdLeaveDesignatedPerson: idle,
    useMhdLeaveDesignatedPersonVoid: idle,
    useMhdLeavePaySource: idle,
    useMhdLeavePaySourceStatus: idle,
    useMhdLeaveWorkersComp: idle,
    useMhdLeaveKeyEmployee: idle,
    useMhdLeaveEssentialFunctions: idle,
    useMhdLeaveCertificationClearDates: idle,
    useMhdLeaveChecklistAdd: idle,
    useMhdLeaveChecklistEdit: idle,
    useMhdLeaveChecklistStatus: idle,
    useMhdLeaveChecklistRemove: idle,
  };
}
