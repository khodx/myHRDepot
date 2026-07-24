import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mhdApprovalService } from '../Service';

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

function mockRpcOnce(data: unknown, error: { message: string } | null = null) {
  mockRpc.mockReturnValueOnce({
    returns: () => Promise.resolve({ data, error }),
  });
}

describe('mhdApprovalService', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('calls mhd_create_approval_request with mapped params and returns the new id/reference', async () => {
    mockRpcOnce([{ id: 'apr-1', reference_id: 'APRV-000001' }]);

    const result = await mhdApprovalService.createApprovalRequest({
      companyId: 'comp-1',
      entityType: 'TASK',
      entityId: 'task-1',
      approvalType: 'APPROVAL_REQUIRED',
      chainMode: 'SEQUENTIAL',
      approverIds: ['user-1', 'user-2'],
      reason: 'High priority completion',
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'mhd_create_approval_request',
      expect.objectContaining({
        p_company_id: 'comp-1',
        p_entity_type: 'TASK',
        p_entity_id: 'task-1',
        p_approval_type: 'APPROVAL_REQUIRED',
        p_chain_mode: 'SEQUENTIAL',
        p_approver_ids: ['user-1', 'user-2'],
        p_reason: 'High priority completion',
      }),
    );
    expect(result).toEqual({ id: 'apr-1', referenceId: 'APRV-000001' });
  });

  it('calls mhd_approve_approval_step then re-fetches the approval', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'apr-1',
          reference_id: 'APRV-000001',
          status: 'APPROVED',
          current_level: 2,
          total_levels: 2,
        },
      ],
      error: null,
    });
    mockRpcOnce([
      {
        id: 'apr-1',
        reference_id: 'APRV-000001',
        company_id: 'comp-1',
        task_id: 'task-1',
        entity_type: 'TASK',
        entity_id: 'task-1',
        approval_type: 'APPROVAL_REQUIRED',
        status: 'APPROVED',
        requester_id: 'user-9',
        requester_name: 'Jamie Requester',
        current_level: 2,
        total_levels: 2,
        reason: null,
        created_at: '2026-07-01T10:00:00Z',
        created_by: 'user-9',
        resolved_at: '2026-07-03T09:00:00Z',
        resolved_by: 'user-2',
        updated_at: '2026-07-03T09:00:00Z',
        updated_by: 'user-2',
      },
    ]);
    mockRpcOnce([]);

    const approval = await mhdApprovalService.approveApproval('apr-1', 'Looks good');

    expect(mockRpc).toHaveBeenNthCalledWith(1, 'mhd_approve_approval_step', {
      p_approval_id: 'apr-1',
      p_comment: 'Looks good',
      p_actor_user_id: undefined,
    });
    expect(approval.status).toBe('APPROVED');
  });

  it('falls back to add-comment plus approval retry when inline approve comments hit the ambiguous-id RPC bug', async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'column reference "id" is ambiguous' },
      })
      .mockReturnValueOnce({
        returns: () =>
          Promise.resolve({
            data: [
              {
                id: 'comment-1',
                approval_id: 'apr-1',
                user_id: 'user-2',
                comment: 'Looks good',
                is_internal: false,
                created_at: '2026-07-17T18:40:00Z',
              },
            ],
            error: null,
          }),
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'apr-1',
            reference_id: 'APRV-000001',
            status: 'APPROVED',
            current_level: 2,
            total_levels: 2,
          },
        ],
        error: null,
      });
    mockRpcOnce([
      {
        id: 'apr-1',
        reference_id: 'APRV-000001',
        company_id: 'comp-1',
        task_id: 'task-1',
        entity_type: 'TASK',
        entity_id: 'task-1',
        approval_type: 'APPROVAL_REQUIRED',
        status: 'APPROVED',
        requester_id: 'user-9',
        requester_name: 'Jamie Requester',
        current_level: 2,
        total_levels: 2,
        reason: null,
        created_at: '2026-07-01T10:00:00Z',
        created_by: 'user-9',
        resolved_at: '2026-07-03T09:00:00Z',
        resolved_by: 'user-2',
        updated_at: '2026-07-03T09:00:00Z',
        updated_by: 'user-2',
      },
    ]);
    mockRpcOnce([]);

    const approval = await mhdApprovalService.approveApproval('apr-1', 'Looks good');

    expect(mockRpc).toHaveBeenNthCalledWith(1, 'mhd_approve_approval_step', {
      p_approval_id: 'apr-1',
      p_comment: 'Looks good',
      p_actor_user_id: undefined,
    });
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'mhd_add_approval_comment', {
      p_approval_id: 'apr-1',
      p_comment: 'Looks good',
      p_is_internal: false,
      p_actor_user_id: undefined,
    });
    expect(mockRpc).toHaveBeenNthCalledWith(3, 'mhd_approve_approval_step', {
      p_approval_id: 'apr-1',
      p_comment: undefined,
      p_actor_user_id: undefined,
    });
    expect(approval.status).toBe('APPROVED');
  });
});
