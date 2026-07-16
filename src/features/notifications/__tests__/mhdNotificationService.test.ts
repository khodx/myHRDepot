import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mhdNotificationService } from '../Service';

// vi.hoisted: the vi.mock factory is hoisted above these declarations.
const { mockRpc, mockReturns } = vi.hoisted(() => {
  const mockReturns = vi.fn();
  // listNotifications chains `.returns<Row[]>()`; the other RPCs are awaited directly and
  // use `mockRpc.mockReturnValueOnce(Promise.resolve(...))` / `mockResolvedValue*` per test.
  const mockRpc = vi.fn((..._args: unknown[]): unknown => ({ returns: mockReturns }));
  return { mockRpc, mockReturns };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const rawNotification = {
  id: 'notif-001',
  reference_id: 'NOTF-000001',
  company_id: 'company-001',
  recipient_user_id: 'user-001',
  actor_user_id: 'user-002',
  notification_type: 'TASK_ASSIGNED',
  title: 'You were assigned a task',
  body: 'Jane Doe assigned task TASK-000042: Prepare Q3 report',
  entity_type: 'TASK',
  entity_id: 'task-001',
  action_url: '/tasks/task-001',
  is_read: false,
  read_at: null,
  created_at: '2026-07-01T10:00:00.000Z',
  created_by: 'user-002',
};

describe('mhdNotificationService', () => {
  beforeEach(() => {
    mockRpc.mockClear();
    mockRpc.mockImplementation((..._args: unknown[]): unknown => ({ returns: mockReturns }));
    mockReturns.mockReset();
  });

  describe('listNotifications', () => {
    it('should call mhd_list_notifications with the default limit of 50', async () => {
      mockReturns.mockResolvedValueOnce({ data: [rawNotification], error: null });

      const result = await mhdNotificationService.listNotifications();

      expect(mockRpc).toHaveBeenCalledWith('mhd_list_notifications', { p_limit: 50 });
      expect(result).toHaveLength(1);
    });

    it('should respect a custom limit', async () => {
      mockReturns.mockResolvedValueOnce({ data: [], error: null });

      await mhdNotificationService.listNotifications(10);

      expect(mockRpc).toHaveBeenCalledWith('mhd_list_notifications', { p_limit: 10 });
    });

    it('should map snake_case rows to camelCase MhdNotification objects', async () => {
      mockReturns.mockResolvedValueOnce({ data: [rawNotification], error: null });

      const [notification] = await mhdNotificationService.listNotifications();

      expect(notification).toEqual({
        id: 'notif-001',
        referenceId: 'NOTF-000001',
        companyId: 'company-001',
        recipientUserId: 'user-001',
        actorUserId: 'user-002',
        notificationType: 'TASK_ASSIGNED',
        title: 'You were assigned a task',
        body: 'Jane Doe assigned task TASK-000042: Prepare Q3 report',
        entityType: 'TASK',
        entityId: 'task-001',
        actionUrl: '/tasks/task-001',
        isRead: false,
        readAt: null,
        createdAt: '2026-07-01T10:00:00.000Z',
        createdBy: 'user-002',
      });
    });

    it('should default nullable fields to null when absent from the row', async () => {
      mockReturns.mockResolvedValueOnce({
        data: [
          {
            ...rawNotification,
            body: undefined,
            entity_type: undefined,
            entity_id: undefined,
            action_url: undefined,
            read_at: undefined,
          },
        ],
        error: null,
      });

      const [notification] = await mhdNotificationService.listNotifications();

      expect(notification.body).toBeNull();
      expect(notification.entityType).toBeNull();
      expect(notification.entityId).toBeNull();
      expect(notification.actionUrl).toBeNull();
      expect(notification.readAt).toBeNull();
    });

    it('should return an empty array when no rows are returned', async () => {
      mockReturns.mockResolvedValueOnce({ data: null, error: null });

      const result = await mhdNotificationService.listNotifications();

      expect(result).toEqual([]);
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockReturns.mockResolvedValueOnce({ data: null, error: { message: 'connection refused' } });

      await expect(mhdNotificationService.listNotifications()).rejects.toThrow(
        'Unable to list notifications: connection refused',
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should call the mhd_notification_unread_count RPC and coerce the result to a number', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: 3, error: null }));

      const count = await mhdNotificationService.getUnreadCount();

      expect(mockRpc).toHaveBeenCalledWith('mhd_notification_unread_count');
      expect(count).toBe(3);
    });

    it('should default to 0 when data is null', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      const count = await mhdNotificationService.getUnreadCount();

      expect(count).toBe(0);
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'rpc failed' } }));

      await expect(mhdNotificationService.getUnreadCount()).rejects.toThrow(
        'Unable to fetch unread notification count: rpc failed',
      );
    });
  });

  describe('markRead', () => {
    it('should call mhd_mark_notification_read once per id (no bulk function exists)', async () => {
      mockRpc.mockImplementation((..._args: unknown[]): unknown => Promise.resolve({ data: null, error: null }));

      await mhdNotificationService.markRead(['notif-001', 'notif-002']);

      expect(mockRpc).toHaveBeenCalledWith('mhd_mark_notification_read', {
        p_notification_id: 'notif-001',
      });
      expect(mockRpc).toHaveBeenCalledWith('mhd_mark_notification_read', {
        p_notification_id: 'notif-002',
      });
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'not permitted' } }));

      await expect(mhdNotificationService.markRead(['notif-001'])).rejects.toThrow(
        'Unable to mark notifications read: not permitted',
      );
    });
  });

  describe('markAllRead', () => {
    it('should call the mhd_mark_all_notifications_read RPC with no arguments', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await mhdNotificationService.markAllRead();

      expect(mockRpc).toHaveBeenCalledWith('mhd_mark_all_notifications_read');
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'not authenticated' } }));

      await expect(mhdNotificationService.markAllRead()).rejects.toThrow(
        'Unable to mark all notifications read: not authenticated',
      );
    });
  });
});
