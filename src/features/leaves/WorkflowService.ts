import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdComplianceReadiness } from '@/types/mhdCompliance';
import type {
  MhdLeaveBenefitObligationInput,
  MhdLeaveBenefitTransactionInput,
  MhdLeaveEligibilityInput,
  MhdLeaveSegmentInput,
  MhdLeaveWorkflow,
} from './WorkflowTypes';
import {
  mhdValidateLeaveBenefitObligation,
  mhdValidateLeaveBenefitTransaction,
  mhdValidateLeaveSegment,
} from './WorkflowValidation';

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
    visibility: 'EMPLOYEE' | 'ADMIN_ONLY';
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

  async recordNotice(input: {
    caseId: string;
    noticeType: string;
    templateKey: string;
    templateVersion: number;
    leaveTypeId?: string | null;
    dueAt?: string | null;
    authorityName?: string | null;
    authoritySourceUrl?: string | null;
    contentRegistryId?: string | null;
    snapshot?: Record<string, unknown>;
    documentGenerationId?: string | null;
  }): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_leave_notice_record', {
      p_case_id: input.caseId,
      p_notice_type: input.noticeType,
      p_template_key: input.templateKey,
      p_template_version: input.templateVersion,
      p_leave_type_id: input.leaveTypeId ?? undefined,
      p_due_at: input.dueAt ?? undefined,
      p_authority_name: input.authorityName ?? undefined,
      p_authority_source_url: input.authoritySourceUrl ?? undefined,
      p_content_registry_id: input.contentRegistryId ?? undefined,
      p_snapshot: input.snapshot ?? {},
      p_document_generation_id: input.documentGenerationId ?? undefined,
    } as never);
    if (error) throw error;
    return data as string;
  },

  async markNoticeDelivery(input: {
    noticeId: string;
    status: 'DELIVERED' | 'ACKNOWLEDGED' | 'VOID';
    deliveryMethod?: string | null;
    deliveryReference?: string | null;
  }): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_leave_notice_mark_delivery', {
      p_notice_id: input.noticeId,
      p_status: input.status,
      p_delivery_method: input.deliveryMethod ?? undefined,
      p_delivery_reference: input.deliveryReference ?? undefined,
    } as never);
    if (error) throw error;
  },

  /**
   * A TAKEN segment debits the ledger, so the database also runs the designation
   * guard (confirmed eligibility, balance ceiling). Its refusal is thrown as-is so the
   * caller shows the exact reason.
   */
  async recordSegment(input: MhdLeaveSegmentInput): Promise<string> {
    const invalid = mhdValidateLeaveSegment(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabaseClient.rpc('mhd_leave_schedule_record', {
      p_case_id: input.caseId,
      p_segment_mode: input.segmentMode,
      p_start_at: input.startAt,
      p_end_at: input.endAt || undefined,
      p_planned_hours: input.plannedHours ?? undefined,
      p_actual_hours: input.actualHours ?? undefined,
      p_status: input.status,
    });
    if (error) throw error;
    return data as string;
  },

  async recordBenefitObligation(input: MhdLeaveBenefitObligationInput): Promise<string> {
    const invalid = mhdValidateLeaveBenefitObligation(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabaseClient.rpc('mhd_leave_benefit_obligation_record', {
      p_case_id: input.caseId,
      p_benefit_type: input.benefitType.trim(),
      p_coverage_start: input.coverageStart,
      // The generated argument type is non-nullable, but the column and the RPC accept
      // NULL for an open-ended coverage period.
      p_coverage_end: (input.coverageEnd || null) as string,
      p_employer_amount: input.employerAmount,
      p_employee_amount: input.employeeAmount,
      p_frequency: input.frequency.trim(),
    });
    if (error) throw error;
    return data as string;
  },

  async recordBenefitTransaction(input: MhdLeaveBenefitTransactionInput): Promise<string> {
    const invalid = mhdValidateLeaveBenefitTransaction(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabaseClient.rpc('mhd_leave_benefit_transaction_record', {
      p_obligation_id: input.obligationId,
      p_transaction_type: input.transactionType,
      p_amount: input.amount,
      p_effective_date: input.effectiveDate,
      p_reference_note: input.referenceNote?.trim() || undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async readiness():Promise<MhdComplianceReadiness | null> {
    const { data, error } = await supabaseClient.rpc('mhd_compliance_module_readiness', {
      p_module_key: 'LEAVES',
    });
    if (error) throw error;
    return ((data ?? []) as MhdComplianceReadiness[])[0] ?? null;
  },
};
