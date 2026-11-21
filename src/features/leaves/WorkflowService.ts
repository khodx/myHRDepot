import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdComplianceReadiness } from '@/types/mhdCompliance';
import type {
  MhdLeaveBenefitObligationInput,
  MhdLeaveBenefitObligationStatusInput,
  MhdLeaveBenefitTransactionInput,
  MhdLeaveBondingEventInput,
  MhdLeaveCertificationClearDatesInput,
  MhdLeaveDesignatedPersonInput,
  MhdLeaveDesignatedPersonVoidInput,
  MhdLeaveEligibilityInput,
  MhdLeaveKeyEmployeeInput,
  MhdLeavePaySourceInput,
  MhdLeavePaySourceStatusInput,
  MhdLeavePaySourceWarning,
  MhdLeaveReturnToWorkInput,
  MhdLeaveSegmentInput,
  MhdLeaveSegmentStatusInput,
  MhdLeaveWorkersCompInput,
  MhdLeaveWorkflow,
} from './WorkflowTypes';
import {
  mhdValidateLeaveBenefitObligation,
  mhdValidateLeaveBenefitObligationStatus,
  mhdValidateLeaveBenefitTransaction,
  mhdValidateLeaveBondingEvent,
  mhdValidateLeaveCertificationClearDates,
  mhdValidateLeaveDesignatedPerson,
  mhdValidateLeaveDesignatedPersonVoid,
  mhdValidateLeaveKeyEmployee,
  mhdValidateLeavePaySource,
  mhdValidateLeaveReturnToWork,
  mhdValidateLeaveSegment,
  mhdValidateLeaveSegmentStatus,
  mhdValidateLeaveWorkersComp,
} from './WorkflowValidation';

// supabaseClient.rpc is called directly rather than bound to a local alias.
// Binding instantiates the whole generated rpc overload set at once, which now
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema size.
// A direct call instantiates only the matching overload, so argument and return
// types remain fully checked.

export const mhdLeaveWorkflowService = {
  async get(caseId: string): Promise<MhdLeaveWorkflow> {
    const { data, error } = await supabaseClient.rpc('mhd_leave_workflow_get', {
      p_case_id: caseId,
    });
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
      p_designated_person_selected: input.designatedPersonSelected ?? false,
      p_facts_source: 'ADMIN_ENTERED',
      p_eligibility_context: {
        covered_employer_override: input.coveredEmployerOverride,
        // Facts the 0382 rules read: an adult child's self-care and employer agreement to
        // intermittent bonding. Left out when unknown, so the engine reports UNDETERMINED.
        ...(input.incapableOfSelfCare == null
          ? {}
          : { incapable_of_self_care: input.incapableOfSelfCare }),
        ...(input.employerAgreedIntermittentBonding == null
          ? {}
          : { employer_agreed_intermittent_bonding: input.employerAgreedIntermittentBonding }),
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

  async recordReturnToWork(input: MhdLeaveReturnToWorkInput) {
    const invalid = mhdValidateLeaveReturnToWork(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabaseClient.rpc('mhd_leave_return_to_work_record', {
      p_case_id: input.caseId,
      p_expected_return_date: input.expectedReturnDate,
      p_actual_return_date: input.actualReturnDate || undefined,
      p_same_or_comparable_job: input.sameOrComparableJob ?? undefined,
      p_fitness_required: input.fitnessRequired,
      p_restrictions_present: input.restrictionsPresent,
      p_accommodation_referral_required: input.accommodationReferralRequired,
      p_reinstatement_note: input.reinstatementNote?.trim() || undefined,
      p_reinstatement_outcome: input.reinstatementOutcome || undefined,
      p_exception_reason: input.exceptionReason?.trim() || undefined,
      p_rtw_certification_requested_on: input.rtwCertificationRequestedOn || undefined,
      p_rtw_certification_received_on: input.rtwCertificationReceivedOn || undefined,
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

  async updateSegmentStatus(input: MhdLeaveSegmentStatusInput): Promise<void> {
    mhdValidateLeaveSegmentStatus(input);
    const { error } = await supabaseClient.rpc('mhd_leave_schedule_update_status', {
      p_segment_id: input.segmentId,
      p_status: input.status,
      p_actual_hours: input.actualHours ?? undefined,
    });
    if (error) throw error;
  },

  async recordBenefitObligation(input: MhdLeaveBenefitObligationInput): Promise<string> {
    const invalid = mhdValidateLeaveBenefitObligation(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabaseClient.rpc('mhd_leave_benefit_obligation_record', {
      p_case_id: input.caseId,
      p_benefit_type: input.benefitType,
      p_coverage_start: input.coverageStart,
      // The generated argument type is non-nullable, but the column and the RPC accept
      // NULL for an open-ended coverage period.
      p_coverage_end: (input.coverageEnd || null) as string,
      p_employer_amount: input.employerAmount,
      p_employee_amount: input.employeeAmount,
      p_frequency: input.frequency,
      p_due_date: input.dueDate || undefined,
      p_grace_period_days: input.gracePeriodDays ?? undefined,
      p_continuation_basis: input.continuationBasis || undefined,
      p_seniority_credit_through: input.seniorityCreditThrough || undefined,
      p_benefit_label: input.benefitLabel?.trim() || undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async updateBenefitObligationStatus(input: MhdLeaveBenefitObligationStatusInput): Promise<void> {
    mhdValidateLeaveBenefitObligationStatus(input);
    const { error } = await supabaseClient.rpc('mhd_leave_benefit_obligation_update_status', {
      p_obligation_id: input.obligationId,
      p_status: input.status,
      p_reason: input.reason?.trim() || undefined,
    });
    if (error) throw error;
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
      p_reversal_of: input.reversalOf || undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async setBondingEvent(input: MhdLeaveBondingEventInput): Promise<void> {
    const invalid = mhdValidateLeaveBondingEvent(input);
    if (invalid) throw new Error(invalid);
    const { error } = await supabaseClient.rpc('mhd_leave_case_set_bonding_event', {
      p_case_id: input.caseId,
      p_event_date: input.eventDate,
      p_event_type: input.eventType,
    });
    if (error) throw error;
  },

  /**
   * A designated person is a recorded fact (who, by whom, when), not a flag. The employer's one-per-12-months
   * limit, when it elected one, is enforced here by the database.
   */
  async recordDesignatedPerson(input: MhdLeaveDesignatedPersonInput): Promise<string> {
    const invalid = mhdValidateLeaveDesignatedPerson(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabaseClient.rpc('mhd_leave_designated_person_record', {
      p_case_id: input.caseId,
      p_designated_name: input.designatedName.trim(),
      p_relationship_note: input.relationshipNote?.trim() || undefined,
      p_pfl_attested_on: input.pflAttestedOn || undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async voidDesignatedPerson(input: MhdLeaveDesignatedPersonVoidInput): Promise<void> {
    const invalid = mhdValidateLeaveDesignatedPersonVoid(input);
    if (invalid) throw new Error(invalid);
    const { error } = await supabaseClient.rpc('mhd_leave_designated_person_void', {
      p_designated_person_id: input.designatedPersonId,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
  },

  /** Returns the new row's id and any non-blocking warnings (e.g. SDI_PFL_OVERLAP). */
  async recordPaySource(
    input: MhdLeavePaySourceInput,
  ): Promise<{ id: string; warnings: MhdLeavePaySourceWarning[] }> {
    const invalid = mhdValidateLeavePaySource(input);
    if (invalid) throw new Error(invalid);
    const { data, error } = await supabaseClient.rpc('mhd_leave_pay_source_record', {
      p_case_id: input.caseId,
      p_source_key: input.sourceKey,
      p_status: input.status,
      p_claim_ref: input.claimRef?.trim() || undefined,
      p_paid_from: input.paidFrom || undefined,
      p_paid_to: input.paidTo || undefined,
      p_employer_required: input.employerRequired ?? false,
      p_mutual_agreement: input.mutualAgreement ?? false,
      p_note: input.note?.trim() || undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ pay_source_id: string; warnings: string[] | null }>)[0];
    if (!row) throw new Error('Recording the pay source returned no row.');
    return { id: row.pay_source_id, warnings: (row.warnings ?? []) as MhdLeavePaySourceWarning[] };
  },

  async updatePaySourceStatus(
    input: MhdLeavePaySourceStatusInput,
  ): Promise<MhdLeavePaySourceWarning[]> {
    if (input.paidFrom && input.paidTo && input.paidTo < input.paidFrom)
      throw new Error('The pay period cannot end before it starts.');
    const { data, error } = await supabaseClient.rpc('mhd_leave_pay_source_update_status', {
      p_pay_source_id: input.paySourceId,
      p_status: input.status,
      p_paid_from: input.paidFrom || undefined,
      p_paid_to: input.paidTo || undefined,
      p_claim_ref: input.claimRef?.trim() || undefined,
    });
    if (error) throw error;
    return (data ?? []) as MhdLeavePaySourceWarning[];
  },

  async setWorkersComp(input: MhdLeaveWorkersCompInput): Promise<void> {
    const invalid = mhdValidateLeaveWorkersComp(input);
    if (invalid) throw new Error(invalid);
    const { error } = await supabaseClient.rpc('mhd_leave_case_set_workers_comp', {
      p_case_id: input.caseId,
      p_claim: input.claim,
      p_filed_on: input.filedOn || undefined,
      p_concurrent_designated_on: input.concurrentDesignatedOn || undefined,
      p_light_duty_declined_note: input.lightDutyDeclinedNote?.trim() || undefined,
    });
    if (error) throw error;
  },

  async setKeyEmployee(input: MhdLeaveKeyEmployeeInput): Promise<void> {
    const invalid = mhdValidateLeaveKeyEmployee(input);
    if (invalid) throw new Error(invalid);
    const { error } = await supabaseClient.rpc('mhd_leave_case_set_key_employee', {
      p_case_id: input.caseId,
      p_status: input.status,
      p_determined_on: input.determinedOn || undefined,
      p_notice_on: input.noticeOn || undefined,
      p_restoration_denied_notice_on: input.restorationDeniedNoticeOn || undefined,
    });
    if (error) throw error;
  },

  /** Records delivery of the essential-functions list; returns the published job description it was. */
  async recordEssentialFunctions(caseId: string, providedOn?: string | null): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_leave_case_record_essential_functions', {
      p_case_id: caseId,
      p_provided_on: providedOn || undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async clearCertificationDates(input: MhdLeaveCertificationClearDatesInput): Promise<void> {
    const invalid = mhdValidateLeaveCertificationClearDates(input);
    if (invalid) throw new Error(invalid);
    const { error } = await supabaseClient.rpc('mhd_leave_certification_clear_dates', {
      p_certification_id: input.certificationId,
      p_fields: input.fields,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
  },

  async readiness(): Promise<MhdComplianceReadiness | null> {
    const { data, error } = await supabaseClient.rpc('mhd_compliance_module_readiness', {
      p_module_key: 'LEAVES',
    });
    if (error) throw error;
    return ((data ?? []) as MhdComplianceReadiness[])[0] ?? null;
  },
};
