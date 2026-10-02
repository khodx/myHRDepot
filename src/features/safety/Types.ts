export type MhdSafetyRecordability = 'RECORDABLE' | 'NOT_RECORDABLE';

export type MhdSafetyTreatmentLevel = 'NONE' | 'FIRST_AID' | 'MEDICAL_BEYOND_FIRST_AID';

export const MHD_SAFETY_TREATMENT_LEVELS: readonly MhdSafetyTreatmentLevel[] = [
  'NONE',
  'FIRST_AID',
  'MEDICAL_BEYOND_FIRST_AID',
];

export const MHD_SAFETY_TREATMENT_LEVEL_LABELS: Record<MhdSafetyTreatmentLevel, string> = {
  NONE: 'No treatment',
  FIRST_AID: 'First aid only',
  MEDICAL_BEYOND_FIRST_AID: 'Medical treatment beyond first aid',
};

/** Why a case is a privacy concern case (29 CFR 1904.29(b)(7)); the wizard records one for every such case. */
export type MhdSafetyPrivacyReason =
  | 'INTIMATE_BODY_PART'
  | 'SEXUAL_ASSAULT'
  | 'MENTAL_ILLNESS'
  | 'INFECTIOUS_DISEASE'
  | 'CONTAMINATED_SHARPS'
  | 'EMPLOYEE_REQUEST';

export const MHD_SAFETY_PRIVACY_REASONS: readonly MhdSafetyPrivacyReason[] = [
  'INTIMATE_BODY_PART',
  'SEXUAL_ASSAULT',
  'MENTAL_ILLNESS',
  'INFECTIOUS_DISEASE',
  'CONTAMINATED_SHARPS',
  'EMPLOYEE_REQUEST',
];

export const MHD_SAFETY_PRIVACY_REASON_LABELS: Record<MhdSafetyPrivacyReason, string> = {
  INTIMATE_BODY_PART: 'An injury or illness to an intimate body part or the reproductive system',
  SEXUAL_ASSAULT: 'An injury or illness from a sexual assault',
  MENTAL_ILLNESS: 'A mental illness',
  INFECTIOUS_DISEASE: 'HIV infection, hepatitis or tuberculosis',
  CONTAMINATED_SHARPS: 'A needlestick or cut from a sharp object contaminated with another person’s blood',
  EMPLOYEE_REQUEST: 'Another illness, and the employee asked that their name be withheld',
};

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
  case_number: number | null;
  incident_year: number;
  job_title: string | null;
  date_of_incident: string;
  time_of_incident: string | null;
  location_description: string | null;
  what_happened: string;
  injury_illness_description: string;
  classification: MhdSafetyIncidentClassification | null;
  illness_type: MhdSafetyIllnessType | null;
  days_away_count: number;
  days_restricted_or_transferred_count: number;
  is_privacy_case: boolean;
  status: MhdSafetyIncidentStatus;
  created_at: string;
  recordability: MhdSafetyRecordability;
  work_related: boolean | null;
  body_part: string | null;
  object_substance: string | null;
  activity_before: string | null;
  treatment_level: MhdSafetyTreatmentLevel | null;
  treated_in_emergency_room: boolean | null;
  hospitalized_inpatient: boolean | null;
  physician_name: string | null;
  treatment_facility: string | null;
  loss_of_consciousness: boolean | null;
  death_date: string | null;
  employer_notified_at: string | null;
  first_day_away: string | null;
  return_to_work_date: string | null;
  privacy_case_reason: MhdSafetyPrivacyReason | null;
  leave_case_id: string | null;
}

export interface MhdSafetyIncident {
  id: string;
  referenceId: string;
  companyId: string;
  establishmentId: string;
  personId: string | null;
  displayedSubjectName: string;
  caseNumber: number | null;
  incidentYear: number;
  jobTitle: string | null;
  dateOfIncident: string;
  timeOfIncident: string | null;
  locationDescription: string | null;
  whatHappened: string;
  injuryIllnessDescription: string;
  classification: MhdSafetyIncidentClassification | null;
  illnessType: MhdSafetyIllnessType | null;
  daysAwayCount: number;
  daysRestrictedOrTransferredCount: number;
  isPrivacyCase: boolean;
  status: MhdSafetyIncidentStatus;
  createdAt: string;
  recordability: MhdSafetyRecordability;
  workRelated: boolean | null;
  bodyPart: string | null;
  objectSubstance: string | null;
  activityBefore: string | null;
  treatmentLevel: MhdSafetyTreatmentLevel | null;
  treatedInEmergencyRoom: boolean | null;
  hospitalizedInpatient: boolean | null;
  physicianName: string | null;
  treatmentFacility: string | null;
  lossOfConsciousness: boolean | null;
  deathDate: string | null;
  employerNotifiedAt: string | null;
  firstDayAway: string | null;
  returnToWorkDate: string | null;
  privacyCaseReason: MhdSafetyPrivacyReason | null;
  leaveCaseId: string | null;
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

// ---------------------------------------------------------------------------
// Incident wizard (0370)
// ---------------------------------------------------------------------------

/** A fact the wizard collects: a yes/no answer, or a count of days. */
export type MhdSafetyFacts = Record<string, boolean | number>;

export interface MhdSafetyRecordabilityRule {
  ruleKey: string;
  kind: 'PRECONDITION' | 'CRITERION';
  factKey: string;
  answerType: 'BOOLEAN' | 'NUMBER';
  outcomeClassification: MhdSafetyIncidentClassification | null;
  label: string;
  guidance: string | null;
  citation: string;
}

export interface MhdSafetyRecordabilityFinding {
  ruleKey: string;
  label: string;
  citation: string;
  classification?: MhdSafetyIncidentClassification;
}

/** The rules' recommendation. `recordable` is null while questions are unanswered. */
export interface MhdSafetyRecordabilityEvaluation {
  ruleSetVersion: number;
  registryReviewStatus: string | null;
  recordable: boolean | null;
  classification: MhdSafetyIncidentClassification | null;
  failedPreconditions: MhdSafetyRecordabilityFinding[];
  matchedCriteria: MhdSafetyRecordabilityFinding[];
  missingFacts: Array<{ ruleKey: string; factKey: string; label: string }>;
}

export type MhdSafetySevereTriggerKind =
  | 'FATALITY'
  | 'INPATIENT_HOSPITALIZATION'
  | 'AMPUTATION'
  | 'EYE_LOSS'
  | 'SERIOUS_DISFIGUREMENT';

export interface MhdSafetySevereInjuryRule {
  ruleKey: string;
  jurisdiction: 'FEDERAL' | 'CALIFORNIA';
  triggerKind: MhdSafetySevereTriggerKind;
  factKey: string;
  deadlineHours: number;
  label: string;
  guidance: string | null;
  citation: string;
}

export interface MhdSafetySevereTrigger {
  triggerKind: MhdSafetySevereTriggerKind;
  label: string;
  guidance: string | null;
  citation: string;
  deadlineHours: number;
  deadlineAt: string | null;
}

export interface MhdSafetySevereInjuryEvaluation {
  jurisdiction: 'FEDERAL' | 'CALIFORNIA';
  triggers: MhdSafetySevereTrigger[];
  earliestDeadlineAt: string | null;
  needsNotifiedTime: boolean;
}

export type MhdSafetyReportMethod = 'PHONE' | 'ONLINE' | 'IN_PERSON';

export interface MhdSafetyLeaveContextCase {
  id: string;
  referenceId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  suggestedCalendarDays: number;
}

/** `visible` is false when the caller may not see this person's leaves; the days are then entered by hand. */
export interface MhdSafetyLeaveContext {
  visible: boolean;
  cases: MhdSafetyLeaveContextCase[];
}

export interface MhdSafetyIntakeIncident {
  personId?: string | null;
  nonEmployeeName?: string | null;
  jobTitle?: string | null;
  dateOfIncident: string;
  timeOfIncident?: string | null;
  locationDescription?: string | null;
  whatHappened: string;
  injuryIllnessDescription: string;
  illnessType?: MhdSafetyIllnessType | null;
  daysAwayCount: number;
  daysRestrictedOrTransferredCount: number;
  isPrivacyCase: boolean;
  privacyCaseReason?: MhdSafetyPrivacyReason | null;
  bodyPart?: string | null;
  objectSubstance?: string | null;
  activityBefore?: string | null;
  treatmentLevel?: MhdSafetyTreatmentLevel | null;
  treatedInEmergencyRoom?: boolean | null;
  hospitalizedInpatient?: boolean | null;
  physicianName?: string | null;
  treatmentFacility?: string | null;
  deathDate?: string | null;
  employerNotifiedAt?: string | null;
  firstDayAway?: string | null;
  returnToWorkDate?: string | null;
  leaveCaseId?: string | null;
}

export interface MhdSafetySevereDecision {
  triggerKind: MhdSafetySevereTriggerKind;
  decision: 'REPORT_REQUIRED' | 'NOT_REQUIRED';
  reason?: string | null;
}

export interface MhdSafetyIntakeInput {
  companyId: string;
  establishmentId: string;
  incident: MhdSafetyIntakeIncident;
  facts: MhdSafetyFacts;
  decision: {
    recordable: boolean;
    classification: MhdSafetyIncidentClassification | null;
    overrideReason?: string | null;
  };
  severeDecisions: MhdSafetySevereDecision[];
}

export interface MhdSafetyIntakeResult {
  id: string;
  referenceId: string;
  caseNumber: number | null;
  recordable: boolean;
  classification: MhdSafetyIncidentClassification | null;
  severeInjuryReports: Array<{
    id: string;
    triggerKind: MhdSafetySevereTriggerKind;
    decision: 'REPORT_REQUIRED' | 'NOT_REQUIRED';
    deadlineAt: string | null;
  }>;
}

export interface MhdSafetyDetermination {
  ruleSetVersion: number;
  registryReviewStatus: string | null;
  recommendation: MhdSafetyRecordabilityEvaluation;
  recommendedRecordable: boolean;
  recommendedClassification: MhdSafetyIncidentClassification | null;
  decidedRecordable: boolean;
  decidedClassification: MhdSafetyIncidentClassification | null;
  isOverride: boolean;
  overrideReason: string | null;
  decidedAt: string;
}

export interface MhdSafetySevereInjuryReport {
  id: string;
  incidentId: string;
  triggerKind: MhdSafetySevereTriggerKind;
  jurisdiction: string;
  ruleCitation: string;
  deadlineHours: number;
  deadlineAt: string | null;
  decision: 'REPORT_REQUIRED' | 'NOT_REQUIRED';
  decisionReason: string | null;
  reportedAt: string | null;
  reportMethod: MhdSafetyReportMethod | null;
  agencyReference: string | null;
}

export interface MhdSafetyIncidentEvidence {
  determination: MhdSafetyDetermination | null;
  severeInjuryReports: MhdSafetySevereInjuryReport[];
}

export interface MhdRecordSevereInjuryReportInput {
  reportId: string;
  reportedAt: string;
  method: MhdSafetyReportMethod;
  agencyReference?: string | null;
}
