import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdComplianceReadiness } from '@/types/mhdCompliance';
import type { MhdLeaveEligibilityInput, MhdLeaveWorkflow } from './WorkflowTypes';

// supabaseClient.rpc is called directly rather than bound to a local alias.
// Binding instantiates the whole generated rpc overload set at once, which now
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema size.
// A direct call instantiates only the matching overload, so argument and return
// types remain fully checked.

export const mhdLeaveWorkflowService = {
  async get(caseId: string): Promise<MhdLeaveWorkflow> {
    const { data, error } = await supabaseClient.rpc('mhd_leave_workflow_get', { p_case_id: caseId });
    if (error) throw error;
    return data as unknown as MhdLeaveWorkflow;
  },

  async evaluate(input: MhdLeaveEligibilityInput) {
    const { data, error } = await supabaseClient.rpc('mhd_leave_eligibility_evaluate', {
      p_case_id: input.caseId,
      p_as_of_date: input.asOfDate,
      p_employer_employee_count: input.employerEmployeeCount,
      p_months_of_service: input.monthsOfService,
      p_hours_worked_12_months: input.hoursWorked12Months,
      p_worksite_employee_count_75: input.worksiteEmployeeCount75,
      p_scheduled_weekly_hours: input.scheduledWeeklyHours,
      p_reason_code: input.reasonCode,
      p_family_relationship: input.familyRelationship || undefined,
      p_designated_person_selected: input.designatedPersonSelected,
      p_facts_source: 'ADMIN_ENTERED',
      p_eligibility_context: {
        covered_employer_override: input.coveredEmployerOverride,
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Human confirmation of a whole fact SNAPSHOT — never a single determination.
   * Confirming per-basis would let the confirmed set drift away from the facts
   * it was derived from. This call is also what writes `leave_case_bases`, so
   * until it happens `mhd_leave_designate` has nothing to decrement and raises
   * 22023: designating hours before a human confirms is structurally
   * impossible, not merely discouraged.
   */
  async confirm(snapshotId: string) {
    const { error } = await supabaseClient.rpc('mhd_leave_eligibility_confirm', {
      p_snapshot_id: snapshotId,
    });
    if (error) throw error;
  },

  /**
   * The documented-override half of the same rule. A rule-engine result is a
   * recommendation; a human may depart from it, but only on the record — the
   * evaluated outcome, the findings, and the rule-set version all survive
   * alongside the override reason as evidence.
   */
  async override(input: {
    determinationId: string;
    effectiveOutcome: 'ELIGIBLE' | 'INELIGIBLE' | 'UNDETERMINED';
    overrideReason: string;
  }) {
    const reason = input.overrideReason.trim();
    if (!reason) {
      throw new Error('An eligibility override requires a recorded reason.');
    }
    const { error } = await supabaseClient.rpc('mhd_leave_eligibility_override', {
      p_determination_id: input.determinationId,
      p_effective_outcome: input.effectiveOutcome,
      p_override_reason: reason,
    });
    if (error) throw error;
  },

  async recordEvent(input: {
    caseId: string;
    eventType: string;
    channel: string;
    summary: string;
    visibility: 'EMPLOYEE' | 'HR_ONLY';
  }) {
    const { data, error } = await supabaseClient.rpc('mhd_leave_event_record', {
      p_case_id: input.caseId,
      p_event_type: input.eventType,
      p_channel: input.channel,
      p_occurred_at: new Date().toISOString(),
      p_summary: input.summary.trim(),
      p_visibility: input.visibility,
    });
    if (error) throw error;
    return data as string;
  },

  async recordReturnToWork(input: {
    caseId: string;
    expectedReturnDate: string;
    actualReturnDate?: string | null;
    sameOrComparableJob?: boolean | null;
    fitnessRequired: boolean;
    restrictionsPresent: boolean;
    accommodationReferralRequired: boolean;
  }) {
    const { data, error } = await supabaseClient.rpc('mhd_leave_return_to_work_record', {
      p_case_id: input.caseId,
      p_expected_return_date: input.expectedReturnDate,
      p_actual_return_date: input.actualReturnDate || undefined,
      p_same_or_comparable_job: input.sameOrComparableJob ?? undefined,
      p_fitness_required: input.fitnessRequired,
      p_restrictions_present: input.restrictionsPresent,
      p_accommodation_referral_required: input.accommodationReferralRequired,
    });
    if (error) throw error;
    return data as string;
  },

  async readiness(): Promise<MhdComplianceReadiness | null> {
    const { data, error } = await supabaseClient.rpc('mhd_compliance_module_readiness', {
      p_module_key: 'LEAVES',
    });
    if (error) throw error;
    return ((data ?? []) as MhdComplianceReadiness[])[0] ?? null;
  },
};
