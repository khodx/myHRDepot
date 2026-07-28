import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdMessagingService } from '../Service';

// vi.hoisted: the vi.mock factory is hoisted above these declarations.
const { mockRpc, mockReturns } = vi.hoisted(() => {
  const mockReturns = vi.fn();
  // listThreads and listMessages chain `.returns<Row[]>()`; the other RPCs are awaited directly.
  const mockRpc = vi.fn((..._args: unknown[]): unknown => ({ returns: mockReturns }));
  return { mockRpc, mockReturns };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const rawThread = {
  id: 'thread-001',
  reference_id: 'MSGT-000001',
  company_id: 'company-001',
  subject: 'Benefits question',
  thread_type: 'DIRECT',
  entity_type: null,
  entity_id: null,
  created_by: 'user-001',
  created_at: '2026-07-01T10:00:00.000Z',
  updated_at: null,
  last_message_at: '2026-07-01T10:05:00.000Z',
  is_archived: false,
};

const rawThreadWithMeta = {
  ...rawThread,
  unread_count: 2,
  participant_count: 3,
  last_message_body: 'Can you review this?',
};

const rawParticipant = {
  id: 'participant-001',
  thread_id: 'thread-001',
  user_id: 'user-002',
  role: 'MEMBER',
  last_read_at: null,
  is_muted: false,
  joined_at: '2026-07-01T10:00:00.000Z',
  left_at: null,
};

const rawMessage = {
  id: 'message-001',
  reference_id: 'MSG-000001',
  thread_id: 'thread-001',
  company_id: 'company-001',
  sender_user_id: 'user-001',
  body: 'Can you review this?',
  is_system: false,
  created_at: '2026-07-01T10:05:00.000Z',
  edited_at: null,
  deleted_at: null,
};

describe('mhdMessagingService', () => {
  beforeEach(() => {
    mockRpc.mockClear();
    mockRpc.mockImplementation((..._args: unknown[]): unknown => ({ returns: mockReturns }));
    mockReturns.mockReset();
  });

  describe('listThreads', () => {
    it('should call mhd_list_message_threads with default filters', async () => {
      mockReturns.mockResolvedValueOnce({ data: [rawThreadWithMeta], error: null });

      const result = await mhdMessagingService.listThreads();

      expect(mockRpc).toHaveBeenCalledWith('mhd_list_message_threads', {
        p_thread_type: undefined,
        p_entity_type: undefined,
        p_entity_id: undefined,
        p_include_archived: false,
        p_limit: 50,
      });
      expect(result).toEqual([
        {
          id: 'thread-001',
          referenceId: 'MSGT-000001',
          companyId: 'company-001',
          subject: 'Benefits question',
          threadType: 'DIRECT',
          entityType: null,
          entityId: null,
          createdBy: 'user-001',
          createdAt: '2026-07-01T10:00:00.000Z',
          updatedAt: null,
          lastMessageAt: '2026-07-01T10:05:00.000Z',
          isArchived: false,
          unreadCount: 2,
          participantCount: 3,
          lastMessageBody: 'Can you review this?',
        },
      ]);
    });

    it('should pass custom filters', async () => {
      mockReturns.mockResolvedValueOnce({ data: [], error: null });

      await mhdMessagingService.listThreads({
        threadType: 'MODULE',
        entityType: 'TASK',
        entityId: 'task-001',
        includeArchived: true,
        limit: 20,
      });

      expect(mockRpc).toHaveBeenCalledWith('mhd_list_message_threads', {
        p_thread_type: 'MODULE',
        p_entity_type: 'TASK',
        p_entity_id: 'task-001',
        p_include_archived: true,
        p_limit: 20,
      });
    });

    it('should return an empty array when no rows are returned', async () => {
      mockReturns.mockResolvedValueOnce({ data: null, error: null });

      const result = await mhdMessagingService.listThreads();

      expect(result).toEqual([]);
    });

    it('should default nullable and aggregate fields when absent from the row', async () => {
      mockReturns.mockResolvedValueOnce({
        data: [
          {
            ...rawThreadWithMeta,
            subject: undefined,
            entity_type: undefined,
            entity_id: undefined,
            updated_at: undefined,
            last_message_at: undefined,
            unread_count: undefined,
            participant_count: undefined,
            last_message_body: undefined,
          },
        ],
        error: null,
      });

      const [thread] = await mhdMessagingService.listThreads();

      expect(thread.subject).toBeNull();
      expect(thread.entityType).toBeNull();
      expect(thread.entityId).toBeNull();
      expect(thread.updatedAt).toBeNull();
      expect(thread.lastMessageAt).toBeNull();
      expect(thread.unreadCount).toBe(0);
      expect(thread.participantCount).toBe(0);
      expect(thread.lastMessageBody).toBeNull();
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockReturns.mockResolvedValueOnce({ data: null, error: { message: 'rpc failed' } });

      await expect(mhdMessagingService.listThreads()).rejects.toThrow(
        'Unable to list message threads: rpc failed',
      );
    });
  });

  describe('getThread', () => {
    it('should call mhd_get_message_thread and map participants', async () => {
      mockRpc.mockReturnValueOnce(
        Promise.resolve({ data: { ...rawThread, participants: [rawParticipant] }, error: null }),
      );

      const result = await mhdMessagingService.getThread('thread-001');

      expect(mockRpc).toHaveBeenCalledWith('mhd_get_message_thread', {
        p_thread_id: 'thread-001',
      });
      expect(result.participants).toEqual([
        {
          id: 'participant-001',
          threadId: 'thread-001',
          userId: 'user-002',
          role: 'MEMBER',
          lastReadAt: null,
          isMuted: false,
          joinedAt: '2026-07-01T10:00:00.000Z',
          leftAt: null,
        },
      ]);
    });

    it('should default missing participants to an empty array', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: rawThread, error: null }));

      const result = await mhdMessagingService.getThread('thread-001');

      expect(result.participants).toEqual([]);
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'denied' } }));

      await expect(mhdMessagingService.getThread('thread-001')).rejects.toThrow(
        'Unable to get message thread: denied',
      );
    });
  });

  describe('listMessages', () => {
    it('should call mhd_list_messages with default paging', async () => {
      mockReturns.mockResolvedValueOnce({ data: [rawMessage], error: null });

      const result = await mhdMessagingService.listMessages({ threadId: 'thread-001' });

      expect(mockRpc).toHaveBeenCalledWith('mhd_list_messages', {
        p_thread_id: 'thread-001',
        p_limit: 100,
        p_before: undefined,
      });
      expect(result[0]).toEqual({
        id: 'message-001',
        referenceId: 'MSG-000001',
        threadId: 'thread-001',
        companyId: 'company-001',
        senderUserId: 'user-001',
        body: 'Can you review this?',
        isSystem: false,
        createdAt: '2026-07-01T10:05:00.000Z',
        editedAt: null,
        deletedAt: null,
      });
    });

    it('should pass custom paging', async () => {
      mockReturns.mockResolvedValueOnce({ data: [], error: null });

      await mhdMessagingService.listMessages({
        threadId: 'thread-001',
        limit: 25,
        before: '2026-07-01T10:00:00.000Z',
      });

      expect(mockRpc).toHaveBeenCalledWith('mhd_list_messages', {
        p_thread_id: 'thread-001',
        p_limit: 25,
        p_before: '2026-07-01T10:00:00.000Z',
      });
    });

    it('should return an empty array when no rows are returned', async () => {
      mockReturns.mockResolvedValueOnce({ data: null, error: null });

      const result = await mhdMessagingService.listMessages({ threadId: 'thread-001' });

      expect(result).toEqual([]);
    });

    it('should default nullable message fields when absent from the row', async () => {
      mockReturns.mockResolvedValueOnce({
        data: [{ ...rawMessage, body: undefined, edited_at: undefined, deleted_at: undefined }],
        error: null,
      });

      const [message] = await mhdMessagingService.listMessages({ threadId: 'thread-001' });

      expect(message.body).toBeNull();
      expect(message.editedAt).toBeNull();
      expect(message.deletedAt).toBeNull();
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockReturns.mockResolvedValueOnce({ data: null, error: { message: 'timeout' } });

      await expect(mhdMessagingService.listMessages({ threadId: 'thread-001' })).rejects.toThrow(
        'Unable to list messages: timeout',
      );
    });
  });

  describe('createThread', () => {
    it('should call mhd_create_message_thread with trimmed nullable params', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: 'thread-001', error: null }));

      const result = await mhdMessagingService.createThread({
        companyId: 'company-001',
        threadType: 'MODULE',
        subject: ' Benefits question ',
        entityType: ' TASK ',
        entityId: 'task-001',
        participantUserIds: ['user-002'],
        initialBody: ' Hello ',
      });

      expect(mockRpc).toHaveBeenCalledWith('mhd_create_message_thread', {
        p_company_id: 'company-001',
        p_thread_type: 'MODULE',
        p_subject: 'Benefits question',
        p_entity_type: 'TASK',
        p_entity_id: 'task-001',
        p_participant_user_ids: ['user-002'],
        p_initial_body: 'Hello',
      });
      expect(result).toBe('thread-001');
    });

    it('should send null optional fields when blank', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: 'thread-001', error: null }));

      await mhdMessagingService.createThread({
        companyId: 'company-001',
        threadType: 'DIRECT',
        subject: ' ',
        entityType: ' ',
        entityId: null,
        participantUserIds: ['user-002'],
        initialBody: 'Hello',
      });

      expect(mockRpc).toHaveBeenCalledWith('mhd_create_message_thread', {
        p_company_id: 'company-001',
        p_thread_type: 'DIRECT',
        p_subject: null,
        p_entity_type: null,
        p_entity_id: null,
        p_participant_user_ids: ['user-002'],
        p_initial_body: 'Hello',
      });
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'invalid' } }));

      await expect(
        mhdMessagingService.createThread({
          companyId: 'company-001',
          threadType: 'DIRECT',
          participantUserIds: ['user-002'],
          initialBody: 'Hello',
        }),
      ).rejects.toThrow('Unable to create message thread: invalid');
    });
  });

  describe('sendMessage', () => {
    it('should call mhd_send_message with a trimmed body', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: 'message-001', error: null }));

      const result = await mhdMessagingService.sendMessage({
        threadId: 'thread-001',
        body: ' Hello ',
      });

      expect(mockRpc).toHaveBeenCalledWith('mhd_send_message', {
        p_thread_id: 'thread-001',
        p_body: 'Hello',
      });
      expect(result).toBe('message-001');
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'blocked' } }));

      await expect(
        mhdMessagingService.sendMessage({ threadId: 'thread-001', body: 'Hello' }),
      ).rejects.toThrow('Unable to send message: blocked');
    });
  });

  describe('editMessage', () => {
    it('should call mhd_edit_message with a trimmed body', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await mhdMessagingService.editMessage('message-001', ' Updated ');

      expect(mockRpc).toHaveBeenCalledWith('mhd_edit_message', {
        p_message_id: 'message-001',
        p_body: 'Updated',
      });
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'denied' } }));

      await expect(mhdMessagingService.editMessage('message-001', 'Updated')).rejects.toThrow(
        'Unable to edit message: denied',
      );
    });
  });

  describe('deleteMessage', () => {
    it('should call mhd_delete_message', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await mhdMessagingService.deleteMessage('message-001');

      expect(mockRpc).toHaveBeenCalledWith('mhd_delete_message', {
        p_message_id: 'message-001',
      });
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'denied' } }));

      await expect(mhdMessagingService.deleteMessage('message-001')).rejects.toThrow(
        'Unable to delete message: denied',
      );
    });
  });

  describe('markThreadRead', () => {
    it('should call mhd_mark_thread_read', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await mhdMessagingService.markThreadRead('thread-001');

      expect(mockRpc).toHaveBeenCalledWith('mhd_mark_thread_read', {
        p_thread_id: 'thread-001',
      });
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'denied' } }));

      await expect(mhdMessagingService.markThreadRead('thread-001')).rejects.toThrow(
        'Unable to mark thread read: denied',
      );
    });
  });

  describe('addParticipants', () => {
    it('should call mhd_add_message_thread_participants', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await mhdMessagingService.addParticipants('thread-001', ['user-002', 'user-003']);

      expect(mockRpc).toHaveBeenCalledWith('mhd_add_message_thread_participants', {
        p_thread_id: 'thread-001',
        p_user_ids: ['user-002', 'user-003'],
      });
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'denied' } }));

      await expect(
        mhdMessagingService.addParticipants('thread-001', ['user-002']),
      ).rejects.toThrow('Unable to add message thread participants: denied');
    });
  });

  describe('removeParticipant', () => {
    it('should call mhd_remove_message_thread_participant', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await mhdMessagingService.removeParticipant('thread-001', 'user-002');

      expect(mockRpc).toHaveBeenCalledWith('mhd_remove_message_thread_participant', {
        p_thread_id: 'thread-001',
        p_user_id: 'user-002',
      });
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'denied' } }));

      await expect(
        mhdMessagingService.removeParticipant('thread-001', 'user-002'),
      ).rejects.toThrow('Unable to remove message thread participant: denied');
    });
  });

  describe('archiveThread', () => {
    it('should call mhd_archive_message_thread', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await mhdMessagingService.archiveThread('thread-001', true);

      expect(mockRpc).toHaveBeenCalledWith('mhd_archive_message_thread', {
        p_thread_id: 'thread-001',
        p_is_archived: true,
      });
    });

    it('should throw a prefixed error when supabase returns an error', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'denied' } }));

      await expect(mhdMessagingService.archiveThread('thread-001', false)).rejects.toThrow(
        'Unable to archive message thread: denied',
      );
    });
  });
});
