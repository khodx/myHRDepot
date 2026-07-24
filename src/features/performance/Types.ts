import type { MhdCompanyId } from '@/features/companies/Types';
import type { Database } from '@/types/database.types';

type MhdPerformanceFunctions = Database['public']['Functions'];
export type MhdPerformanceReviewRpcRow =
  MhdPerformanceFunctions['mhd_list_performance_reviews']['Returns'][number];
export type MhdCoachingPlanRpcRow =
  MhdPerformanceFunctions['mhd_list_coaching_plans']['Returns'][number];
export type MhdCoachingPlanItemRpcRow =
  MhdPerformanceFunctions['mhd_list_coaching_plan_items']['Returns'][number];
export type MhdPerformanceMutationRpcRow =
  MhdPerformanceFunctions['mhd_create_performance_review']['Returns'][number];

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdPerformanceReviewId = string;
export type MhdPerformanceReviewReferenceId = `PRFR-${string}`;
export type MhdCoachingPlanId = string;
export type MhdCoachingPlanReferenceId = `COCH-${string}`;
export type MhdCoachingPlanItemId = string;
export type MhdCoachingPlanItemReferenceId = `COPI-${string}`;

export type MhdPerformanceReviewType = 'INTRODUCTORY' | 'ANNUAL';

export type MhdPerformanceReviewStatus =
  'DRAFT' | 'IN_REVIEW' | 'PENDING_SIGNATURE' | 'COMPLETED' | 'CANCELLED';

export type MhdCoachingPlanStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type MhdCoachingPlanItemStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const MHD_PERFORMANCE_REVIEW_TYPES = [
  'INTRODUCTORY',
  'ANNUAL',
] as const satisfies readonly MhdPerformanceReviewType[];

export const MHD_PERFORMANCE_REVIEW_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'PENDING_SIGNATURE',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly MhdPerformanceReviewStatus[];

export const MHD_COACHING_PLAN_STATUSES = [
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly MhdCoachingPlanStatus[];

export const MHD_COACHING_PLAN_ITEM_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly MhdCoachingPlanItemStatus[];

export const MHD_PERFORMANCE_RATING_MIN = 1;
export const MHD_PERFORMANCE_RATING_MAX = 5;

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

export interface MhdPerformanceReview {
  id: MhdPerformanceReviewId;
  referenceId: MhdPerformanceReviewReferenceId;
  companyId: MhdCompanyId;
  companyName: string;
  personId: string;
  personDisplayName: string;
  reviewerUserId: string;
  reviewerDisplayName: string;
  reviewType: MhdPerformanceReviewType;
  status: MhdPerformanceReviewStatus;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  dueDate: string | null;
  overallRating: number | null;
  strengthsSummary: string | null;
  improvementSummary: string | null;
  goalsSummary: string | null;
  reviewerComments: string | null;
  employeeComments: string | null;
  reviewActivityId: string | null;
  reviewActivityTitle: string | null;
  documentGenerationId: string | null;
  documentGenerationReferenceId: string | null;
  documentGenerationStatus: string | null;
  esignatureRequestId: string | null;
  esignatureRequestReferenceId: string | null;
  esignatureRequestStatus: string | null;
  signatureStatus: string | null;
  acknowledgedAt: string | null;
  waiverReason: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MhdCoachingPlan {
  id: MhdCoachingPlanId;
  referenceId: MhdCoachingPlanReferenceId;
  companyId: MhdCompanyId;
  companyName: string;
  personId: string;
  personDisplayName: string;
  coachUserId: string;
  coachDisplayName: string;
  title: string;
  objective: string | null;
  startDate: string | null;
  targetDate: string | null;
  status: MhdCoachingPlanStatus;
  outcomeSummary: string | null;
  sourceReviewId: string | null;
  sourceReviewReferenceId: string | null;
  itemTotalCount: number;
  itemDoneCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MhdCoachingPlanItem {
  id: MhdCoachingPlanItemId;
  referenceId: MhdCoachingPlanItemReferenceId;
  planId: MhdCoachingPlanId;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: MhdCoachingPlanItemStatus;
  activityId: string | null;
  activityReferenceId: string | null;
  activityStatus: string | null;
  activityTitle: string | null;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface MhdCreatePerformanceReviewInput {
  companyId: MhdCompanyId;
  personId: string;
  reviewerUserId: string;
  reviewType: MhdPerformanceReviewType;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  dueDate?: string | null;
  reviewActivityId?: string | null;
}

export interface MhdUpdatePerformanceReviewInput {
  reviewType?: MhdPerformanceReviewType;
  reviewerUserId?: string;
  reviewPeriodStart?: string;
  reviewPeriodEnd?: string;
  dueDate?: string | null;
  overallRating?: number | null;
  strengthsSummary?: string | null;
  improvementSummary?: string | null;
  goalsSummary?: string | null;
  reviewerComments?: string | null;
  employeeComments?: string | null;
  reviewActivityId?: string | null;
}

export interface MhdTransitionPerformanceReviewInput {
  newStatus: MhdPerformanceReviewStatus;
  waiverReason?: string | null;
}

export interface MhdLinkReviewDocumentsInput {
  documentGenerationId?: string | null;
  esignatureRequestId?: string | null;
}

export interface MhdPerformanceReviewFilters {
  companyId: MhdCompanyId;
  personId: string | 'ALL';
  reviewerUserId: string | 'ALL';
  reviewType: MhdPerformanceReviewType | 'ALL';
  status: MhdPerformanceReviewStatus | 'ALL';
  searchTerm: string;
  dueFrom: string;
  dueTo: string;
}

export interface MhdCreateCoachingPlanInput {
  companyId: MhdCompanyId;
  personId: string;
  coachUserId: string;
  title: string;
  objective?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  sourceReviewId?: string | null;
}

export interface MhdUpdateCoachingPlanInput {
  title?: string;
  objective?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  outcomeSummary?: string | null;
  coachUserId?: string;
}

export interface MhdTransitionCoachingPlanInput {
  newStatus: MhdCoachingPlanStatus;
  outcomeSummary?: string | null;
}

export interface MhdCoachingPlanFilters {
  companyId: MhdCompanyId;
  personId: string | 'ALL';
  coachUserId: string | 'ALL';
  status: MhdCoachingPlanStatus | 'ALL';
  searchTerm: string;
}

export interface MhdCreateCoachingPlanItemInput {
  planId: MhdCoachingPlanId;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  activityId?: string | null;
  sortOrder?: number;
}

export interface MhdUpdateCoachingPlanItemInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  status?: MhdCoachingPlanItemStatus;
  activityId?: string | null;
  sortOrder?: number;
}

/** Signer target for the review acknowledgment ceremony (rule 5). */
export type MhdReviewSignerInput =
  | { kind: 'internal'; userId: string }
  | { kind: 'external'; externalEmail: string; externalName: string };

export interface MhdFinalizeReviewForSignatureInput {
  reviewId: MhdPerformanceReviewId;
  /**
   * Optional pin to a specific document template. When omitted, the Service
   * resolves the seeded global "Performance Review" template via
   * `mhd_get_performance_review_template_id` (published lookup RPC).
   */
  templateId?: string;
  signer: MhdReviewSignerInput;
  /**
   * Manual fallback for the document hash. Normally the 04.8 auto-hash stamp
   * (`document_generations.output_document_hash`) is used; this is only read
   * when the stamp is absent.
   */
  manualDocumentHash?: string | null;
  expiresAt?: string | null;
  actorUserId?: string | null;
  /** Poll tuning for the generation status check (test seam; defaults apply in production). */
  pollAttempts?: number;
  pollIntervalMs?: number;
  /** UI-only progress callback; no progress state is persisted client-side. */
  onStep?: (stepNumber: number) => void;
}

export interface MhdFinalizeReviewForSignatureResult {
  review: MhdPerformanceReview;
  documentGenerationId: string;
  esignatureRequestId: string;
  documentHash: string;
  /** Non-fatal signer invitation delivery failures surfaced by the E-Signature composer. */
  invitationErrors: string[];
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function mhdFormatPerformanceReviewType(reviewType: MhdPerformanceReviewType): string {
  const labels: Record<MhdPerformanceReviewType, string> = {
    INTRODUCTORY: 'Introductory',
    ANNUAL: 'Annual',
  };

  return labels[reviewType];
}

export function mhdFormatPerformanceReviewStatus(status: MhdPerformanceReviewStatus): string {
  const labels: Record<MhdPerformanceReviewStatus, string> = {
    DRAFT: 'Draft',
    IN_REVIEW: 'In Review',
    PENDING_SIGNATURE: 'Pending Signature',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  return labels[status];
}

export function mhdFormatCoachingPlanStatus(status: MhdCoachingPlanStatus): string {
  const labels: Record<MhdCoachingPlanStatus, string> = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  return labels[status];
}

export function mhdFormatCoachingPlanItemStatus(status: MhdCoachingPlanItemStatus): string {
  const labels: Record<MhdCoachingPlanItemStatus, string> = {
    PLANNED: 'Planned',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  return labels[status];
}

export function mhdIsPerformanceReviewOverdue(
  review: Pick<MhdPerformanceReview, 'status' | 'dueDate'>,
): boolean {
  return (
    (review.status === 'DRAFT' ||
      review.status === 'IN_REVIEW' ||
      review.status === 'PENDING_SIGNATURE') &&
    !!review.dueDate &&
    new Date(`${review.dueDate}T23:59:59.999Z`).getTime() < Date.now()
  );
}

// Compatibility names used by the approved component scaffold; keep one domain model beneath them.
export type MhdPerformanceOption = { id: string; label: string };
export type MhdReviewType = MhdPerformanceReviewType;
export type MhdReviewStatus = MhdPerformanceReviewStatus;
export type MhdReviewBoardFilters = MhdPerformanceReviewFilters;
export interface MhdReviewFinalizeStepState {
  key: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  errorMessage?: string;
}
export type MhdCoachingPlanBoardFilters = MhdCoachingPlanFilters;
export const MHD_REVIEW_TYPES = MHD_PERFORMANCE_REVIEW_TYPES;
export const MHD_REVIEW_STATUSES = MHD_PERFORMANCE_REVIEW_STATUSES;
export const mhdFormatReviewType = mhdFormatPerformanceReviewType;
export const mhdFormatReviewStatus = mhdFormatPerformanceReviewStatus;
export const mhdIsReviewOverdue = mhdIsPerformanceReviewOverdue;
