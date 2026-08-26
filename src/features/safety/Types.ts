export type MhdSafetyIncidentClassification =
  | 'DEATH'
  | 'DAYS_AWAY_FROM_WORK'
  | 'JOB_TRANSFER_OR_RESTRICTION'
  | 'OTHER_RECORDABLE';

export type MhdSafetyIllnessType =
  | 'INJURY'
  | 'SKIN_DISORDER'
  | 'RESPIRATORY_CONDITION'
  | 'POISONING'
  | 'HEARING_LOSS'
  | 'ALL_OTHER_ILLNESSES';

export type MhdSafetyIncidentStatus = 'DRAFT' | 'RECORDED' | 'ANNUAL_SUMMARY_LOCKED';

export type MhdOshaAnnualSummaryStatus = 'DRAFT' | 'CERTIFIED' | 'SUBMITTED_TO_ITA';

export interface MhdOshaEstablishmentRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  establishment_name: string;
  naics_code: string;
  address_street: string | null;
  address_city: string | null;
  address_state: string;
  address_zip: string | null;
  average_employee_count: number;
  total_hours_worked_ytd: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string | null;
}

export interface MhdOshaEstablishment {
  id: string;
  referenceId: string;
  companyId: string;
  establishmentName: string;
  naicsCode: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string;
  addressZip: string | null;
  averageEmployeeCount: number;
  totalHoursWorkedYtd: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MhdCreateOshaEstablishmentInput {
  companyId: string;
  establishmentName: string;
  naicsCode: string;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState: string;
  addressZip?: string | null;
  averageEmployeeCount?: number;
  totalHoursWorkedYtd?: number;
  isActive?: boolean;
}

export interface MhdUpdateOshaEstablishmentInput extends Partial<MhdCreateOshaEstablishmentInput> {
  id: string;
}

export interface MhdSafetyIncidentRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  establishment_id: string;
  person_id: string | null;
  displayed_subject_name: string;
  case_number: number;
  incident_year: number;
  job_title: string | null;
  date_of_incident: string;
  time_of_incident: string | null;
  location_description: string | null;
  what_happened: string;
  injury_illness_description: string;
  classification: MhdSafetyIncidentClassification;
  illness_type: MhdSafetyIllnessType | null;
  days_away_count: number;
  days_restricted_or_transferred_count: number;
  is_privacy_case: boolean;
  status: MhdSafetyIncidentStatus;
  created_at: string;
}

export interface MhdSafetyIncident {
  id: string;
  referenceId: string;
  companyId: string;
  establishmentId: string;
  personId: string | null;
  displayedSubjectName: string;
  caseNumber: number;
  incidentYear: number;
  jobTitle: string | null;
  dateOfIncident: string;
  timeOfIncident: string | null;
  locationDescription: string | null;
  whatHappened: string;
  injuryIllnessDescription: string;
  classification: MhdSafetyIncidentClassification;
  illnessType: MhdSafetyIllnessType | null;
  daysAwayCount: number;
  daysRestrictedOrTransferredCount: number;
  isPrivacyCase: boolean;
  status: MhdSafetyIncidentStatus;
  createdAt: string;
}

export interface MhdCreateSafetyIncidentInput {
  companyId: string;
  establishmentId: string;
  dateOfIncident: string;
  whatHappened: string;
  injuryIllnessDescription: string;
  classification: MhdSafetyIncidentClassification;
  personId?: string | null;
  nonEmployeeName?: string | null;
  jobTitle?: string | null;
  timeOfIncident?: string | null;
  locationDescription?: string | null;
  illnessType?: MhdSafetyIllnessType | null;
  daysAwayCount?: number;
  daysRestrictedOrTransferredCount?: number;
  isPrivacyCase?: boolean;
}

export interface MhdUpdateSafetyIncidentInput {
  incidentId: string;
  jobTitle?: string | null;
  locationDescription?: string | null;
  whatHappened?: string;
  injuryIllnessDescription?: string;
  classification?: MhdSafetyIncidentClassification;
  illnessType?: MhdSafetyIllnessType | null;
  daysAwayCount?: number;
  daysRestrictedOrTransferredCount?: number;
  isPrivacyCase?: boolean;
}

export interface MhdOshaThresholdResult {
  ruleKey: string;
  formsRequired: string[];
}

export interface MhdOshaAnnualSummary {
  id: string;
  referenceId: string;
  companyId: string;
  establishmentId: string;
  calendarYear: number;
  totalDeaths: number;
  totalDaysAwayCases: number;
  totalJobTransferRestrictionCases: number;
  totalOtherRecordableCases: number;
  totalDaysAwayCount: number;
  totalDaysRestrictedCount: number;
  totalInjuries: number;
  totalSkinDisorders: number;
  totalRespiratoryConditions: number;
  totalPoisonings: number;
  totalHearingLossCases: number;
  totalOtherIllnesses: number;
  averageEmployeeCount: number;
  totalHoursWorked: number;
  certifyingOfficialName: string | null;
  certifyingOfficialTitle: string | null;
  certifiedAt: string | null;
  signatureId: string | null;
  status: MhdOshaAnnualSummaryStatus;
}

export interface MhdCertifyOshaAnnualSummaryInput {
  summaryId: string;
  certifyingOfficialName: string;
  certifyingOfficialTitle: string;
  documentGenerationId?: string | null;
}
