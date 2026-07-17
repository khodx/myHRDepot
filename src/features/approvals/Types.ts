import { z } from 'zod';

export type MhdApprovalId = string;
export type MhdApprovalReferenceId = `APRV-${string}`;
export type MhdApprovalAssignmentId = string;
export type MhdApprovalCommentId = string;
export type MhdCompanyId = string;
export type MhdTaskId = string;
export type MhdUserId = string;

export type MhdApprovalEntityType = 'TASK' | 'SUBTASK' | 'REASSIGNMENT' | 'CUSTOM';
export type MhdApprovalType = 'APPROVAL_REQUIRED' | 'APPROVAL_FOR_INFO' | 'APPROVAL_TO_ASSIGN';
export type MhdApprovalChainMode = 'SEQUENTIAL' | 'PARALLEL';
export type MhdApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type MhdApprovalAssignmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MhdApprovalRow {
  id: string;
  reference_id: string;
  company_id: string;
  task_id: string | null;
  entity_type: MhdApprovalEntityType | null;
  entity_id: string | null;
  approval_type: MhdApprovalType;
  status: MhdApprovalStatus;
  requester_id: string;
  requester_name: string | null;
  current_level: number | null;
  total_levels: number;
  reason: string | null;
  created_at: string;
  created_by: string;
  resolved_at: string | null;
  resolved_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface MhdApprovalAssignmentRow {
  id: string;
  approval_id: string;
  user_id: string;
  approver_name: string | null;
  level: number;
  status: MhdApprovalAssignmentStatus;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  rejection_reason: string | null;
}

export interface MhdApprovalCommentRow {
  id: string;
  approval_id: string;
  user_id: string;
  author_name: string | null;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface MhdApproval {
  id: MhdApprovalId;
  referenceId: MhdApprovalReferenceId;
  companyId: MhdCompanyId;
  taskId: MhdTaskId | null;
  entityType: MhdApprovalEntityType | null;
  entityId: string | null;
  approvalType: MhdApprovalType;
  status: MhdApprovalStatus;
  requesterId: MhdUserId;
  requesterName: string;
  currentLevel: number;
  totalLevels: number;
  reason: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  chain: MhdApprovalAssignment[];
}

export interface MhdApprovalAssignment {
  id: MhdApprovalAssignmentId;
  approvalId: MhdApprovalId;
  userId: MhdUserId;
  approverName: string;
  level: number;
  status: MhdApprovalAssignmentStatus;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectionReason: string | null;
}

export interface MhdApprovalComment {
  id: MhdApprovalCommentId;
  approvalId: MhdApprovalId;
  userId: MhdUserId;
  authorName: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

export interface MhdApprovalMutationResult {
  id: MhdApprovalId;
  referenceId: MhdApprovalReferenceId;
}

export const MhdCreateApprovalInput = z.object({
  companyId: z.string().min(1, 'Company is required.'),
  taskId: z.string().min(1).optional(),
  entityType: z.enum(['TASK', 'SUBTASK', 'REASSIGNMENT', 'CUSTOM']),
  entityId: z.string().min(1),
  approvalType: z.enum(['APPROVAL_REQUIRED', 'APPROVAL_FOR_INFO', 'APPROVAL_TO_ASSIGN']),
  chainMode: z.enum(['SEQUENTIAL', 'PARALLEL']).default('SEQUENTIAL'),
  approverIds: z.array(z.string().min(1)).min(1, 'Select at least one approver.'),
  reason: z.string().max(2000).optional(),
});

export type MhdCreateApprovalInput = z.infer<typeof MhdCreateApprovalInput>;

export const MhdAddApprovalCommentInput = z.object({
  approvalId: z.string().min(1, 'Approval is required.'),
  comment: z.string().min(1, 'Comment text is required.').max(4000),
  isInternal: z.boolean().default(false),
});

export type MhdAddApprovalCommentInput = z.infer<typeof MhdAddApprovalCommentInput>;
