export const MHD_BENEFIT_INTAKE_REASONS = [
  'Your own health condition',
  'Caring for a family member',
  'Pregnancy',
  'Bonding with a new child',
  'Military family: qualifying exigency',
  'Military family: caring for a service member',
  'Another protected need',
] as const;
export type MhdBenefitIntakeReason =
  | 'OWN_HEALTH'
  | 'FAMILY_HEALTH'
  | 'PREGNANCY'
  | 'BONDING'
  | 'MILITARY_EXIGENCY'
  | 'MILITARY_CAREGIVER'
  | 'OTHER';
export type MhdBenefitIntakeOutcome = 'LEAVE' | 'ACCOMMODATION' | 'BOTH' | 'NO_MATCH';
export interface MhdBenefitIntakeAnswers {
  reason: MhdBenefitIntakeReason;
  needsTimeAway: boolean;
  needsWorkplaceChange: boolean;
}
export interface MhdBenefitIntakePayload extends MhdBenefitIntakeAnswers {
  subjectPersonId?: string;
  familyRelationship?: string;
  requestedStart?: string;
  requestedEnd?: string;
  requestedMode?: 'CONTINUOUS' | 'INTERMITTENT' | 'REDUCED_SCHEDULE';
  bondingEventType?: 'BIRTH' | 'ADOPTION' | 'FOSTER';
  bondingEventDate?: string;
  leaveReasonCategory?: string;
  fileCategory?: string;
  intakeChannel?: 'HR_ENTRY' | 'MANAGER_REFERRAL' | 'OTHER';
  accommodation?: {
    requestSummary: string;
    requestSource?: string;
    requestChannel?: string;
    details?: Record<string, unknown>;
  };
}
export interface MhdBenefitIntakeResult {
  outcome: MhdBenefitIntakeOutcome;
  leaveCaseId?: string;
  leaveReviewTaskId?: string;
  eligibility?: { ran: boolean; snapshotId?: string; blockers: string[]; message?: string };
  accommodationCaseId?: string;
  accommodationReviewTaskId?: string;
}
export interface MhdInformationRequest {
  activityId: string;
  title: string;
  question: string;
  status: string;
  dueAt: string;
  createdAt: string;
  followUpTaskId: string | null;
}
export interface MhdBenefitCaseLink {
  id: string;
  companyId: string;
  caseType: MhdBenefitCaseType;
  caseId: string;
  linkKind: string;
  activityId: string | null;
  taskId: string | null;
  subjectVisible: boolean;
  createdAt: string;
}
export type MhdBenefitCaseType = 'LEAVE' | 'ACCOMMODATION';
export interface MhdInformationRequestInput {
  caseType: MhdBenefitCaseType;
  caseId: string;
  question: string;
  dueDate: string;
}
export interface MhdInformationResponseInput {
  activityId: string;
  response: string;
}
