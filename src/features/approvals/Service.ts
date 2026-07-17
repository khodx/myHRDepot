import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAddApprovalCommentInput,
  MhdApproval,
  MhdApprovalAssignment,
  MhdApprovalAssignmentRow,
  MhdApprovalComment,
  MhdApprovalCommentRow,
  MhdApprovalMutationResult,
  MhdApprovalRow,
  MhdCreateApprovalInput,
} from '@/types/approval';

type MhdApprovalMutationResultRow = {
  id: string;
  reference_id: string;
};

function mapApprovalRow(row: MhdApprovalRow, chain: MhdApprovalAssignment[] = []): MhdApproval {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdApproval['referenceId'],
    companyId: row.company_id,
    taskId: row.task_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    approvalType: row.approval_type,
    status: row.status,
    requesterId: row.requester_id,
    requesterName: row.requester_name ?? '',
    currentLevel: row.current_level ?? 1,
    totalLevels: row.total_levels,
    reason: row.reason,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    chain,
  };
}

function mapAssignmentRow(row: MhdApprovalAssignmentRow): MhdApprovalAssignment {
  return {
    id: row.id,
    approvalId: row.approval_id,
    userId: row.user_id,
    approverName: row.approver_name ?? '',
    level: row.level,
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    rejectionReason: row.rejection_reason,
  };
}

function mapCommentRow(row: MhdApprovalCommentRow): MhdApprovalComment {
  return {
    id: row.id,
    approvalId: row.approval_id,
    userId: row.user_id,
    authorName: row.author_name ?? '',
    comment: row.comment,
    isInternal: row.is_internal,
    createdAt: row.created_at,
  };
}

async function executeApproveApprovalStep(approvalId: string, comment?: string) {
  return supabaseClient.rpc('mhd_approve_approval_step', {
    p_approval_id: approvalId,
    p_comment: comment?.trim() ? comment.trim() : undefined,
    p_actor_user_id: undefined,
  });
}

export const mhdApprovalService = {
  async createApprovalRequest(input: MhdCreateApprovalInput): Promise<MhdApprovalMutationResult> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_approval_request', {
        p_company_id: input.companyId,
        p_entity_type: input.entityType,
        p_entity_id: input.entityId,
        p_approval_type: input.approvalType,
        p_chain_mode: input.chainMode,
        p_approver_ids: input.approverIds,
        p_task_id: input.taskId,
        p_reason: input.reason?.trim() ? input.reason.trim() : undefined,
        p_actor_user_id: undefined,
      })
      .returns<MhdApprovalMutationResultRow[]>();

    if (error) {
      throw new Error(`Unable to create approval request: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create approval request: no record returned.');
    }

    return {
      id: row.id,
      referenceId: row.reference_id as MhdApprovalMutationResult['referenceId'],
    };
  },

  async getApprovalById(approvalId: string): Promise<MhdApproval> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_approval_by_id', { p_approval_id: approvalId })
      .returns<MhdApprovalRow[]>();

    if (error) {
      throw new Error(`Unable to load approval: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error(`Approval not found: ${approvalId}`);
    }

    const chain = await this.getApprovalChain(approvalId);
    return mapApprovalRow(row, chain);
  },

  async listApprovalsForEntity(entityType: string, entityId: string): Promise<MhdApproval[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_approvals_for_entity', { p_entity_type: entityType, p_entity_id: entityId })
      .returns<MhdApprovalRow[]>();

    if (error) {
      throw new Error(`Unable to load approvals: ${error.message}`);
    }

    return (data ?? []).map((row) => mapApprovalRow(row));
  },

  async listPendingApprovalsForUser(userId: string): Promise<MhdApproval[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_pending_approvals_for_user', { p_user_id: userId })
      .returns<MhdApprovalRow[]>();

    if (error) {
      throw new Error(`Unable to load pending approvals: ${error.message}`);
    }

    return (data ?? []).map((row) => mapApprovalRow(row));
  },

  async approveApproval(approvalId: string, comment?: string): Promise<MhdApproval> {
    const trimmedComment = comment?.trim();
    const { error } = await executeApproveApprovalStep(approvalId, trimmedComment);

    if (error) {
      const canFallbackInlineComment =
        !!trimmedComment && error.message.includes('column reference "id" is ambiguous');

      if (!canFallbackInlineComment) {
        throw new Error(`Unable to approve approval: ${error.message}`);
      }

      await this.addApprovalComment({
        approvalId,
        comment: trimmedComment,
        isInternal: false,
      });

      const retry = await executeApproveApprovalStep(approvalId);
      if (retry.error) {
        throw new Error(`Unable to approve approval: ${retry.error.message}`);
      }
    }

    return this.getApprovalById(approvalId);
  },

  async rejectApproval(approvalId: string, reason: string): Promise<MhdApproval> {
    const { error } = await supabaseClient.rpc('mhd_reject_approval_step', {
      p_approval_id: approvalId,
      p_reason: reason.trim(),
      p_actor_user_id: undefined,
    });

    if (error) {
      throw new Error(`Unable to reject approval: ${error.message}`);
    }

    return this.getApprovalById(approvalId);
  },

  async getApprovalChain(approvalId: string): Promise<MhdApprovalAssignment[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_approval_chain', { p_approval_id: approvalId })
      .returns<MhdApprovalAssignmentRow[]>();

    if (error) {
      throw new Error(`Unable to load approval chain: ${error.message}`);
    }

    return (data ?? []).map(mapAssignmentRow);
  },

  async listApprovalComments(approvalId: string): Promise<MhdApprovalComment[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_approval_comments', { p_approval_id: approvalId })
      .returns<MhdApprovalCommentRow[]>();

    if (error) {
      throw new Error(`Unable to load approval comments: ${error.message}`);
    }

    return (data ?? []).map(mapCommentRow);
  },

  async addApprovalComment(input: MhdAddApprovalCommentInput): Promise<MhdApprovalComment> {
    const { data, error } = await supabaseClient
      .rpc('mhd_add_approval_comment', {
        p_approval_id: input.approvalId,
        p_comment: input.comment.trim(),
        p_is_internal: input.isInternal,
        p_actor_user_id: undefined,
      })
      .returns<Omit<MhdApprovalCommentRow, 'author_name'>[]>();

    if (error) {
      throw new Error(`Unable to add approval comment: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to add approval comment: no record returned.');
    }

    return {
      id: row.id,
      approvalId: row.approval_id,
      userId: row.user_id,
      authorName: '',
      comment: row.comment,
      isInternal: row.is_internal,
      createdAt: row.created_at,
    };
  },
};
