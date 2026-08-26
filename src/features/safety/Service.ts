import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdCertifyOshaAnnualSummaryInput,
  MhdCreateOshaEstablishmentInput,
  MhdCreateSafetyIncidentInput,
  MhdOshaAnnualSummary,
  MhdOshaEstablishment,
  MhdOshaEstablishmentRpcRow,
  MhdOshaThresholdResult,
  MhdSafetyIncident,
  MhdSafetyIncidentRpcRow,
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
};
