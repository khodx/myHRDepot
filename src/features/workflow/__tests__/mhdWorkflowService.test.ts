import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mhdWorkflowService } from '../Service';
import { supabaseClient } from '@/lib/supabase/supabaseClient';

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: vi.fn(),
  },
}));

const mockRpc = supabaseClient.rpc as unknown as ReturnType<typeof vi.fn>;

function rpcResult(data: unknown, error: { message: string } | null = null) {
  return { data, error, returns: () => ({ data, error }) };
}

describe('mhdWorkflowService', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('calls mhd_workflow_transition_allowed and returns allowed=true', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });

    const result = await mhdWorkflowService.isTransitionAllowed(
      'task-123',
      'not-started-id',
      'in-progress-id',
      'user-456',
    );

    expect(mockRpc).toHaveBeenCalledWith('mhd_workflow_transition_allowed', {
      p_task_id: 'task-123',
      p_from_status_id: 'not-started-id',
      p_to_status_id: 'in-progress-id',
      p_user_id: 'user-456',
    });
    expect(result.allowed).toBe(true);
  });

  it('validates input, executes the transition, and returns the latest history entry', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        id: 'wt-1',
        task_id: 'task-123',
        from_status_id: 'ns',
        to_status_id: 'ip',
        created_at: '2026-07-09T00:00:00Z',
      },
      error: null,
    });
    mockRpc.mockReturnValueOnce(
      rpcResult([
        {
          id: 'wt-1',
          task_id: 'task-123',
          from_status_id: 'ns',
          to_status_id: 'ip',
          from_status_name: 'Not Started',
          to_status_name: 'In Progress',
          from_status_color: null,
          to_status_color: null,
          reason: 'Starting work',
          created_by_name: 'Jane Doe',
          created_at: '2026-07-09T00:00:00Z',
        },
      ]),
    );

    const result = await mhdWorkflowService.transitionTask({
      taskId: 'task-123',
      toStatusId: 'ip',
      reason: 'Starting work',
    });

    expect(mockRpc).toHaveBeenNthCalledWith(1, 'mhd_workflow_transition', {
      p_task_id: 'task-123',
      p_to_status_id: 'ip',
      p_reason: 'Starting work',
    });
    expect(result.taskId).toBe('task-123');
    expect(result.toStatusName).toBe('In Progress');
  });
});
