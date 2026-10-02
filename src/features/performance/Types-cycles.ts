import type { MhdPerformanceReviewType } from './Types';

export type MhdPerformanceCycleStatus = 'ACTIVE' | 'CLOSED';

export type MhdPerformanceCycleRaterKind = 'PEER' | 'UPWARD';

/** A person who can be put into a review cycle, with what the server knows about them. */
export interface MhdPerformanceCycleCandidate {
  personId: string;
  displayName: string;
  jobTitle: string | null;
  managerPersonId: string | null;
  managerName: string | null;
  depth: number;
  /** The reviewer the hierarchy suggests; null when the manager has no user account. */
  reviewerUserId: string | null;
  reviewerName: string | null;
  hasPublishedJob: boolean;
  competencyCount: number;
  /** The reference of an existing review that already covers this person and period. */
  conflictingReviewReference: string | null;
}

export interface MhdPerformanceCycleCandidateFilters {
  companyId: string;
  rootPersonId?: string | null;
  includeIndirect?: boolean;
  reviewType?: MhdPerformanceReviewType | null;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface MhdPerformanceCycleRaterPlanInput {
  companyId: string;
  personIds: string[];
  includePeers: boolean;
  maxPeers: number;
  includeUpward: boolean;
  maxUpward: number;
}

/** A recommended rater a person can remove before launch. */
export interface MhdPerformanceCycleRaterSuggestion {
  subjectPersonId: string;
  raterPersonId: string;
  raterName: string;
  participantType: MhdPerformanceCycleRaterKind;
}

export interface MhdPerformanceCycleLaunchParticipant {
  personId: string;
  reviewerUserId: string;
  raters: Array<{ personId: string; participantType: MhdPerformanceCycleRaterKind }>;
}

export interface MhdPerformanceCycleLaunchInput {
  companyId: string;
  cycleName: string;
  reviewType: MhdPerformanceReviewType;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  selfAssessmentDue?: string | null;
  feedbackDue?: string | null;
  reviewDue: string;
  templateId?: string | null;
  includesSelfAssessment: boolean;
  isMultiRater: boolean;
  announcementNote?: string | null;
  participants: MhdPerformanceCycleLaunchParticipant[];
  competencyIds: string[];
}

export interface MhdPerformanceCycleLaunchResult {
  id: string;
  referenceId: string;
  reviewCount: number;
  participantCount: number;
}

export interface MhdPerformanceCycle {
  id: string;
  referenceId: string;
  cycleName: string;
  reviewType: MhdPerformanceReviewType;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  selfAssessmentDue: string | null;
  feedbackDue: string | null;
  reviewDue: string;
  status: MhdPerformanceCycleStatus;
  templateName: string | null;
  isMultiRater: boolean;
  launchedAt: string;
  reviewCount: number;
  completedCount: number;
  overdueCount: number;
}

export interface MhdPerformanceCycleProgress {
  reviewsByStatus: Record<string, number>;
  participants: Array<{ participantType: string; status: string; count: number }>;
  selfAssessmentsOverdue: number;
  feedbackOverdue: number;
  reviewsOverdue: number;
}
