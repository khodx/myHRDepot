import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mhdDashboardService } from '../Service';

// vi.hoisted: the vi.mock factory is hoisted above this declaration.
const mockRpc = vi.hoisted(() => vi.fn());

// Service.ts imports the named export `supabaseClient` (not `supabase`) from
// this module, so the mock must export that same name to intercept the import.
vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: mockRpc },
}));

describe('mhdDashboardService', () => {
  beforeEach(() => vi.resetAllMocks());

  describe('getTaskSummary', () => {
    it('maps RPC row to typed summary object', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            total_tasks: '10',
            not_started: '3',
            in_progress: '4',
            on_hold: '1',
            waiting_on_client: '0',
            completed: '2',
            cancelled: '0',
            overdue_count: '2',
            completion_rate: '20.00',
          },
        ],
        error: null,
      });

      const result = await mhdDashboardService.getTaskSummary();

      expect(result.totalTasks).toBe(10);
      expect(result.inProgress).toBe(4);
      expect(result.overdueCount).toBe(2);
      expect(result.completionRate).toBe(20);
      expect(result.completed).toBe(2);
    });

    it('throws on RPC error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Permission denied' } });
      await expect(mhdDashboardService.getTaskSummary()).rejects.toThrow('Permission denied');
    });

    it('returns an all-zero summary when data is empty (never throws on an empty DB)', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });
      const result = await mhdDashboardService.getTaskSummary();
      expect(result).toEqual({
        totalTasks: 0,
        notStarted: 0,
        inProgress: 0,
        onHold: 0,
        waitingOnClient: 0,
        completed: 0,
        cancelled: 0,
        overdueCount: 0,
        completionRate: 0,
      });
    });
  });

  describe('getMyTasks', () => {
    it('returns empty array when no tasks assigned', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });
      const result = await mhdDashboardService.getMyTasks();
      expect(result).toEqual([]);
    });

    it('maps task row fields to camelCase', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            task_id: 'task-abc',
            reference_id: 'TASK-000001',
            title: 'Onboard Client X',
            status_name: 'In Progress',
            status_color_token: '#3b82f6',
            priority_name: 'High',
            priority_color_token: '#f97316',
            due_date: '2026-08-01',
            is_overdue: false,
            company_name: 'Acme Corp',
            overall_progress_percent: '50',
          },
        ],
        error: null,
      });

      const result = await mhdDashboardService.getMyTasks();
      expect(result).toHaveLength(1);
      expect(result[0].taskId).toBe('task-abc');
      expect(result[0].overallProgressPercent).toBe(50);
      expect(result[0].isOverdue).toBe(false);
      expect(result[0].dueDate).toBe('2026-08-01');
    });

    it('maps null due_date correctly', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            task_id: 'task-xyz',
            reference_id: 'TASK-000002',
            title: 'No Due Date Task',
            status_name: 'Not Started',
            status_color_token: '#6b7280',
            priority_name: 'Normal',
            priority_color_token: '#3b82f6',
            due_date: null,
            is_overdue: false,
            company_name: 'Test Co',
            overall_progress_percent: '0',
          },
        ],
        error: null,
      });

      const result = await mhdDashboardService.getMyTasks();
      expect(result[0].dueDate).toBeNull();
    });
  });

  describe('getRecentActivity', () => {
    it('maps activity row to typed object', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            event_id: 'evt-001',
            entity_type: 'TASK',
            action_type: 'CREATE',
            summary: 'Task created: Onboard Client X',
            performed_by: 'Jane Doe',
            performed_at: '2026-07-05T10:00:00Z',
            reference_id: 'TASK-000001',
          },
        ],
        error: null,
      });

      const result = await mhdDashboardService.getRecentActivity();
      expect(result[0].eventId).toBe('evt-001');
      expect(result[0].performedBy).toBe('Jane Doe');
      expect(result[0].referenceId).toBe('TASK-000001');
    });

    it('handles null reference_id', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            event_id: 'evt-002',
            entity_type: 'PERSON',
            action_type: 'UPDATE',
            summary: 'Person profile updated',
            performed_by: 'Admin',
            performed_at: '2026-07-05T09:00:00Z',
            reference_id: null,
          },
        ],
        error: null,
      });

      const result = await mhdDashboardService.getRecentActivity();
      expect(result[0].referenceId).toBeNull();
    });
  });
});
