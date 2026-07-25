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
