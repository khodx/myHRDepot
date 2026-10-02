import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdCertifyOshaAnnualSummaryInput,
  MhdCreateOshaEstablishmentInput,
  MhdCreateSafetyIncidentInput,
  MhdOshaAnnualSummary,
  MhdOshaEstablishment,
  MhdOshaEstablishmentRpcRow,
  MhdOshaThresholdResult,
  MhdRecordSevereInjuryReportInput,
  MhdSafetyFacts,
  MhdSafetyIncident,
  MhdSafetyIncidentClassification,
  MhdSafetyIncidentEvidence,
  MhdSafetyIncidentRpcRow,
  MhdSafetyIntakeIncident,
  MhdSafetyIntakeInput,
  MhdSafetyIntakeResult,
  MhdSafetyLeaveContext,
  MhdSafetyRecordabilityEvaluation,
  MhdSafetyRecordabilityFinding,
  MhdSafetyRecordabilityRule,
  MhdSafetyReportMethod,
  MhdSafetySevereInjuryEvaluation,
  MhdSafetySevereInjuryReport,
  MhdSafetySevereInjuryRule,
  MhdSafetySevereTriggerKind,
  MhdUpdateOshaEstablishmentInput,
  MhdUpdateSafetyIncidentInput,
} from './Types';

// supabaseClient.rpc is called directly rather than bound to a local alias —
// binding instantiates the whole generated rpc overload set at once, which
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema
// size. Same convention as src/features/accommodations/Service.ts.

function mapEstablishment(row: MhdOshaEstablishmentRpcRow): MhdOshaEstablishment {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    establishmentName: row.establishment_name,
    naicsCode: row.naics_code,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    averageEmployeeCount: row.average_employee_count,
    totalHoursWorkedYtd: row.total_hours_worked_ytd,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapIncident(row: MhdSafetyIncidentRpcRow): MhdSafetyIncident {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    establishmentId: row.establishment_id,
    personId: row.person_id,
    displayedSubjectName: row.displayed_subject_name,
    caseNumber: row.case_number,
    incidentYear: row.incident_year,
    jobTitle: row.job_title,
    dateOfIncident: row.date_of_incident,
    timeOfIncident: row.time_of_incident,
    locationDescription: row.location_description,
    whatHappened: row.what_happened,
    injuryIllnessDescription: row.injury_illness_description,
    classification: row.classification,
    illnessType: row.illness_type,
    daysAwayCount: row.days_away_count,
    daysRestrictedOrTransferredCount: row.days_restricted_or_transferred_count,
    isPrivacyCase: row.is_privacy_case,
    status: row.status,
    createdAt: row.created_at,
    recordability: row.recordability,
    workRelated: row.work_related,
    bodyPart: row.body_part,
    objectSubstance: row.object_substance,
    activityBefore: row.activity_before,
    treatmentLevel: row.treatment_level,
    treatedInEmergencyRoom: row.treated_in_emergency_room,
    hospitalizedInpatient: row.hospitalized_inpatient,
    physicianName: row.physician_name,
    treatmentFacility: row.treatment_facility,
    lossOfConsciousness: row.loss_of_consciousness,
    deathDate: row.death_date,
    employerNotifiedAt: row.employer_notified_at,
    firstDayAway: row.first_day_away,
    returnToWorkDate: row.return_to_work_date,
    privacyCaseReason: row.privacy_case_reason,
    leaveCaseId: row.leave_case_id,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function text(value: unknown): string | null {
  return value == null ? null : String(value);
}

function mapFinding(row: Record<string, unknown>): MhdSafetyRecordabilityFinding {
  return {
    ruleKey: String(row.rule_key),
    label: String(row.label),
    citation: String(row.citation),
    ...(row.classification ? { classification: row.classification as MhdSafetyIncidentClassification } : {}),
  };
}

function mapEvaluation(value: unknown): MhdSafetyRecordabilityEvaluation {
  const raw = asRecord(value);
  return {
    ruleSetVersion: Number(raw.rule_set_version),
    registryReviewStatus: text(raw.registry_review_status),
    recordable: raw.recordable == null ? null : Boolean(raw.recordable),
    classification: (raw.classification as MhdSafetyIncidentClassification | null) ?? null,
    failedPreconditions: asArray(raw.failed_preconditions).map(mapFinding),
    matchedCriteria: asArray(raw.matched_criteria).map(mapFinding),
    missingFacts: asArray(raw.missing_facts).map((fact) => ({
      ruleKey: String(fact.rule_key),
      factKey: String(fact.fact_key),
      label: String(fact.label),
    })),
  };
}

function mapSevereReport(row: Record<string, unknown>): MhdSafetySevereInjuryReport {
  return {
    id: String(row.id),
    incidentId: String(row.incident_id),
    triggerKind: row.trigger_kind as MhdSafetySevereTriggerKind,
    jurisdiction: String(row.jurisdiction),
    ruleCitation: String(row.rule_citation),
    deadlineHours: Number(row.deadline_hours),
    deadlineAt: text(row.deadline_at),
    decision: row.decision as MhdSafetySevereInjuryReport['decision'],
    decisionReason: text(row.decision_reason),
    reportedAt: text(row.reported_at),
    reportMethod: (row.report_method as MhdSafetyReportMethod | null) ?? null,
    agencyReference: text(row.agency_reference),
  };
}

function incidentPayload(incident: MhdSafetyIntakeIncident) {
  return {
    person_id: incident.personId ?? null,
    non_employee_name: incident.nonEmployeeName ?? null,
    job_title: incident.jobTitle ?? null,
    date_of_incident: incident.dateOfIncident,
    time_of_incident: incident.timeOfIncident || null,
    location_description: incident.locationDescription ?? null,
    what_happened: incident.whatHappened,
    injury_illness_description: incident.injuryIllnessDescription,
    illness_type: incident.illnessType ?? null,
    days_away_count: incident.daysAwayCount,
    days_restricted_or_transferred_count: incident.daysRestrictedOrTransferredCount,
    is_privacy_case: incident.isPrivacyCase,
    privacy_case_reason: incident.privacyCaseReason ?? null,
    body_part: incident.bodyPart ?? null,
    object_substance: incident.objectSubstance ?? null,
    activity_before: incident.activityBefore ?? null,
    treatment_level: incident.treatmentLevel ?? null,
    treated_in_emergency_room: incident.treatedInEmergencyRoom ?? null,
    hospitalized_inpatient: incident.hospitalizedInpatient ?? null,
    physician_name: incident.physicianName ?? null,
    treatment_facility: incident.treatmentFacility ?? null,
    death_date: incident.deathDate ?? null,
    employer_notified_at: incident.employerNotifiedAt ?? null,
    first_day_away: incident.firstDayAway ?? null,
    return_to_work_date: incident.returnToWorkDate ?? null,
    leave_case_id: incident.leaveCaseId ?? null,
  };
}

interface MhdOshaAnnualSummaryRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  establishment_id: string;
  calendar_year: number;
  total_deaths: number;
  total_days_away_cases: number;
  total_job_transfer_restriction_cases: number;
  total_other_recordable_cases: number;
  total_days_away_count: number;
  total_days_restricted_count: number;
  total_injuries: number;
  total_skin_disorders: number;
  total_respiratory_conditions: number;
  total_poisonings: number;
  total_hearing_loss_cases: number;
  total_other_illnesses: number;
  average_employee_count: number;
  total_hours_worked: number;
  certifying_official_name: string | null;
  certifying_official_title: string | null;
  certified_at: string | null;
  signature_id: string | null;
  status: MhdOshaAnnualSummary['status'];
}

function mapAnnualSummary(row: MhdOshaAnnualSummaryRpcRow): MhdOshaAnnualSummary {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    establishmentId: row.establishment_id,
    calendarYear: row.calendar_year,
    totalDeaths: row.total_deaths,
    totalDaysAwayCases: row.total_days_away_cases,
    totalJobTransferRestrictionCases: row.total_job_transfer_restriction_cases,
    totalOtherRecordableCases: row.total_other_recordable_cases,
    totalDaysAwayCount: row.total_days_away_count,
    totalDaysRestrictedCount: row.total_days_restricted_count,
    totalInjuries: row.total_injuries,
    totalSkinDisorders: row.total_skin_disorders,
    totalRespiratoryConditions: row.total_respiratory_conditions,
    totalPoisonings: row.total_poisonings,
    totalHearingLossCases: row.total_hearing_loss_cases,
    totalOtherIllnesses: row.total_other_illnesses,
    averageEmployeeCount: row.average_employee_count,
    totalHoursWorked: row.total_hours_worked,
    certifyingOfficialName: row.certifying_official_name,
    certifyingOfficialTitle: row.certifying_official_title,
    certifiedAt: row.certified_at,
    signatureId: row.signature_id,
    status: row.status,
  };
}

export const mhdSafetyService = {
  async listEstablishments(companyId: string): Promise<MhdOshaEstablishment[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_osha_establishments', {
      p_company_id: companyId,
    });
    if (error) throw new Error(`Unable to load establishments: ${error.message}`);
    return ((data ?? []) as MhdOshaEstablishmentRpcRow[]).map(mapEstablishment);
  },

  async createEstablishment(input: MhdCreateOshaEstablishmentInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_osha_establishment_upsert', {
      p_company_id: input.companyId,
      p_establishment_name: input.establishmentName,
      p_naics_code: input.naicsCode,
      p_address_street: input.addressStreet ?? undefined,
      p_address_city: input.addressCity ?? undefined,
      p_address_state: input.addressState,
      p_address_zip: input.addressZip ?? undefined,
      p_average_employee_count: input.averageEmployeeCount ?? undefined,
      p_total_hours_worked_ytd: input.totalHoursWorkedYtd ?? undefined,
      p_is_active: input.isActive ?? undefined,
    });
    if (error) throw new Error(`Unable to create establishment: ${error.message}`);
    return data as string;
  },

  async updateEstablishment(input: MhdUpdateOshaEstablishmentInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_osha_establishment_upsert', {
      p_id: input.id,
      p_establishment_name: input.establishmentName ?? undefined,
      p_naics_code: input.naicsCode ?? undefined,
      p_address_street: input.addressStreet ?? undefined,
      p_address_city: input.addressCity ?? undefined,
      p_address_state: input.addressState ?? undefined,
      p_address_zip: input.addressZip ?? undefined,
      p_average_employee_count: input.averageEmployeeCount ?? undefined,
      p_total_hours_worked_ytd: input.totalHoursWorkedYtd ?? undefined,
      p_is_active: input.isActive ?? undefined,
    });
    if (error) throw new Error(`Unable to update establishment: ${error.message}`);
    return data as string;
  },

  async listIncidents(
    companyId: string,
    establishmentId?: string | null,
    calendarYear?: number | null,
  ): Promise<MhdSafetyIncident[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_safety_incidents', {
      p_company_id: companyId,
      p_establishment_id: establishmentId ?? undefined,
      p_calendar_year: calendarYear ?? undefined,
    });
    if (error) throw new Error(`Unable to load safety incidents: ${error.message}`);
    return ((data ?? []) as MhdSafetyIncidentRpcRow[]).map(mapIncident);
  },

  async getIncident(incidentId: string): Promise<MhdSafetyIncident | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_safety_incident', {
      p_incident_id: incidentId,
    });
    if (error) throw new Error(`Unable to load safety incident: ${error.message}`);
    const row = ((data ?? []) as MhdSafetyIncidentRpcRow[])[0];
    return row ? mapIncident(row) : null;
  },

  async createIncident(input: MhdCreateSafetyIncidentInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_safety_incident_create', {
      p_company_id: input.companyId,
      p_establishment_id: input.establishmentId,
      p_date_of_incident: input.dateOfIncident,
      p_what_happened: input.whatHappened.trim(),
      p_injury_illness_description: input.injuryIllnessDescription.trim(),
      p_classification: input.classification,
      p_person_id: input.personId ?? undefined,
      p_non_employee_name: input.nonEmployeeName?.trim() || undefined,
      p_job_title: input.jobTitle?.trim() || undefined,
      p_time_of_incident: input.timeOfIncident ?? undefined,
      p_location_description: input.locationDescription?.trim() || undefined,
      p_illness_type: input.illnessType ?? undefined,
      p_days_away_count: input.daysAwayCount ?? undefined,
      p_days_restricted_or_transferred_count: input.daysRestrictedOrTransferredCount ?? undefined,
      p_is_privacy_case: input.isPrivacyCase ?? undefined,
    });
    if (error) throw new Error(`Unable to record safety incident: ${error.message}`);
    return data as string;
  },

  async updateIncident(input: MhdUpdateSafetyIncidentInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_safety_incident_update', {
      p_incident_id: input.incidentId,
      p_job_title: input.jobTitle ?? undefined,
      p_location_description: input.locationDescription ?? undefined,
      p_what_happened: input.whatHappened ?? undefined,
      p_injury_illness_description: input.injuryIllnessDescription ?? undefined,
      p_classification: input.classification ?? undefined,
      p_illness_type: input.illnessType ?? undefined,
      p_days_away_count: input.daysAwayCount ?? undefined,
      p_days_restricted_or_transferred_count: input.daysRestrictedOrTransferredCount ?? undefined,
      p_is_privacy_case: input.isPrivacyCase ?? undefined,
    });
    if (error) throw new Error(`Unable to update safety incident: ${error.message}`);
  },

  async computeThresholds(establishmentId: string): Promise<MhdOshaThresholdResult[]> {
    const { data, error } = await supabaseClient.rpc('mhd_compute_osha_thresholds', {
      p_establishment_id: establishmentId,
    });
    if (error) throw new Error(`Unable to compute OSHA thresholds: ${error.message}`);
    return ((data ?? []) as Array<{ rule_key: string; forms_required: string[] }>).map((row) => ({
      ruleKey: row.rule_key,
      formsRequired: row.forms_required,
    }));
  },

  async getAnnualSummary(summaryId: string): Promise<MhdOshaAnnualSummary | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_osha_annual_summary', {
      p_summary_id: summaryId,
    });
    if (error) throw new Error(`Unable to load Form 300A summary: ${error.message}`);
    const row = ((data ?? []) as MhdOshaAnnualSummaryRpcRow[])[0];
    return row ? mapAnnualSummary(row) : null;
  },

  async listAnnualSummaries(establishmentId: string): Promise<MhdOshaAnnualSummary[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_osha_annual_summaries', {
      p_establishment_id: establishmentId,
    });
    if (error) throw new Error(`Unable to load Form 300A summaries: ${error.message}`);
    return ((data ?? []) as MhdOshaAnnualSummaryRpcRow[]).map(mapAnnualSummary);
  },

  async generateAnnualSummary(establishmentId: string, calendarYear: number): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_osha_annual_summary_generate', {
      p_establishment_id: establishmentId,
      p_calendar_year: calendarYear,
    });
    if (error) throw new Error(`Unable to generate Form 300A summary: ${error.message}`);
    return data as string;
  },

  async certifyAnnualSummary(input: MhdCertifyOshaAnnualSummaryInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_osha_annual_summary_certify', {
      p_summary_id: input.summaryId,
      p_certifying_official_name: input.certifyingOfficialName.trim(),
      p_certifying_official_title: input.certifyingOfficialTitle.trim(),
      p_document_generation_id: input.documentGenerationId ?? undefined,
    });
    if (error) throw new Error(`Unable to certify Form 300A summary: ${error.message}`);
  },

  async queueItaSubmission(summaryId: string): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_osha_ita_submission_queue', {
      p_summary_id: summaryId,
    });
    if (error) throw new Error(`Unable to queue ITA submission: ${error.message}`);
    return data as string;
  },
  // -------------------------------------------------------------------------
  // Incident wizard (0370)
  // -------------------------------------------------------------------------

  /** The recordability rules the wizard asks its questions from; nothing about the regulation is hard-coded in the UI. */
  async listRecordabilityRules(companyId: string): Promise<MhdSafetyRecordabilityRule[]> {
    const { data, error } = await supabaseClient.rpc('mhd_safety_recordability_rules_list', {
      p_company_id: companyId,
    });
    if (error) throw new Error(`Unable to load the recordability questions: ${error.message}`);
    return (data ?? []).map((row) => ({
      ruleKey: row.rule_key,
      kind: row.kind as MhdSafetyRecordabilityRule['kind'],
      factKey: row.fact_key,
      answerType: row.answer_type as MhdSafetyRecordabilityRule['answerType'],
      outcomeClassification: (row.outcome_classification as MhdSafetyIncidentClassification | null) ?? null,
      label: row.label,
      guidance: row.guidance,
      citation: row.citation,
    }));
  },

  /** A recommendation only: the person confirms it or records why they differ. */
  async evaluateRecordability(
    companyId: string,
    facts: MhdSafetyFacts,
  ): Promise<MhdSafetyRecordabilityEvaluation> {
    const { data, error } = await supabaseClient.rpc('mhd_safety_recordability_evaluate', {
      p_company_id: companyId,
      p_facts: facts,
    });
    if (error) throw new Error(`Unable to evaluate recordability: ${error.message}`);
    return mapEvaluation(data);
  },

  async listSevereInjuryRules(establishmentId: string): Promise<MhdSafetySevereInjuryRule[]> {
    const { data, error } = await supabaseClient.rpc('mhd_safety_severe_injury_rules_list', {
      p_establishment_id: establishmentId,
    });
    if (error) throw new Error(`Unable to load the severe-injury reporting rules: ${error.message}`);
    return (data ?? []).map((row) => ({
      ruleKey: row.rule_key,
      jurisdiction: row.jurisdiction as MhdSafetySevereInjuryRule['jurisdiction'],
      triggerKind: row.trigger_kind as MhdSafetySevereTriggerKind,
      factKey: row.fact_key,
      deadlineHours: row.deadline_hours,
      label: row.label,
      guidance: row.guidance,
      citation: row.citation,
    }));
  },

  async evaluateSevereInjury(
    establishmentId: string,
    facts: MhdSafetyFacts,
    employerNotifiedAt: string | null,
  ): Promise<MhdSafetySevereInjuryEvaluation> {
    const { data, error } = await supabaseClient.rpc('mhd_safety_severe_injury_evaluate', {
      p_establishment_id: establishmentId,
      p_facts: facts,
      ...(employerNotifiedAt ? { p_employer_notified_at: employerNotifiedAt } : {}),
    });
    if (error) throw new Error(`Unable to check the reporting deadlines: ${error.message}`);
    const raw = asRecord(data);
    return {
      jurisdiction: raw.jurisdiction as MhdSafetySevereInjuryEvaluation['jurisdiction'],
      triggers: asArray(raw.triggers).map((trigger) => ({
        triggerKind: trigger.trigger_kind as MhdSafetySevereTriggerKind,
        label: String(trigger.label),
        guidance: text(trigger.guidance),
        citation: String(trigger.citation),
        deadlineHours: Number(trigger.deadline_hours),
        deadlineAt: text(trigger.deadline_at),
      })),
      earliestDeadlineAt: text(raw.earliest_deadline_at),
      needsNotifiedTime: Boolean(raw.needs_notified_time),
    };
  },

  /** Dates and status of the employee's leaves after the incident - never the reason for a leave. */
  async getLeaveContext(
    companyId: string,
    personId: string,
    incidentDate: string,
  ): Promise<MhdSafetyLeaveContext> {
    const { data, error } = await supabaseClient.rpc('mhd_safety_incident_leave_context', {
      p_company_id: companyId,
      p_person_id: personId,
      p_incident_date: incidentDate,
    });
    if (error) throw new Error(`Unable to look up the employee's leaves: ${error.message}`);
    const raw = asRecord(data);
    return {
      visible: Boolean(raw.visible),
      cases: asArray(raw.cases).map((leave) => ({
        id: String(leave.id),
        referenceId: String(leave.reference_id),
        status: String(leave.status),
        startDate: String(leave.start_date),
        endDate: text(leave.end_date),
        suggestedCalendarDays: Number(leave.suggested_calendar_days),
      })),
    };
  },

  /** Opens the incident, the recordability decision and the reporting decisions in one transaction. */
  async openFromIntake(input: MhdSafetyIntakeInput): Promise<MhdSafetyIntakeResult> {
    const { data, error } = await supabaseClient.rpc('mhd_safety_incident_intake_open', {
      p_company_id: input.companyId,
      p_establishment_id: input.establishmentId,
      p_incident: incidentPayload(input.incident),
      p_facts: input.facts,
      p_decision: {
        recordable: input.decision.recordable,
        classification: input.decision.classification,
        override_reason: input.decision.overrideReason ?? null,
      },
      p_severe_decisions: input.severeDecisions.map((decision) => ({
        trigger_kind: decision.triggerKind,
        decision: decision.decision,
        reason: decision.reason ?? null,
      })),
    });
    if (error) throw new Error(error.message);
    const raw = asRecord(data);
    return {
      id: String(raw.id),
      referenceId: String(raw.reference_id),
      caseNumber: raw.case_number == null ? null : Number(raw.case_number),
      recordable: Boolean(raw.recordable),
      classification: (raw.classification as MhdSafetyIncidentClassification | null) ?? null,
      severeInjuryReports: asArray(raw.severe_injury_reports).map((report) => ({
        id: String(report.id),
        triggerKind: report.trigger_kind as MhdSafetySevereTriggerKind,
        decision: report.decision as 'REPORT_REQUIRED' | 'NOT_REQUIRED',
        deadlineAt: text(report.deadline_at),
      })),
    };
  },

  async getEvidence(incidentId: string): Promise<MhdSafetyIncidentEvidence> {
    const { data, error } = await supabaseClient.rpc('mhd_safety_incident_determination_get', {
      p_incident_id: incidentId,
    });
    if (error) throw new Error(`Unable to load the recordability record: ${error.message}`);
    const raw = asRecord(data);
    const det = raw.determination ? asRecord(raw.determination) : null;
    return {
      determination: det
        ? {
            ruleSetVersion: Number(det.rule_set_version),
            registryReviewStatus: text(det.registry_review_status),
            recommendation: mapEvaluation(det.recommendation),
            recommendedRecordable: Boolean(det.recommended_recordable),
            recommendedClassification:
              (det.recommended_classification as MhdSafetyIncidentClassification | null) ?? null,
            decidedRecordable: Boolean(det.decided_recordable),
            decidedClassification:
              (det.decided_classification as MhdSafetyIncidentClassification | null) ?? null,
            isOverride: Boolean(det.is_override),
            overrideReason: text(det.override_reason),
            decidedAt: String(det.decided_at),
          }
        : null,
      severeInjuryReports: asArray(raw.severe_injury_reports).map(mapSevereReport),
    };
  },

  async recordSevereInjuryReport(input: MhdRecordSevereInjuryReportInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_safety_severe_injury_record_report', {
      p_report_id: input.reportId,
      p_reported_at: input.reportedAt,
      p_method: input.method,
      ...(input.agencyReference ? { p_agency_reference: input.agencyReference } : {}),
    });
    if (error) throw new Error(error.message);
  },

};
