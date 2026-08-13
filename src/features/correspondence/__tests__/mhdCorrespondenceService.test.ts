import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdCorrespondenceService } from '../Service';

const { mockRpc, mockReturns, mockInvoke } = vi.hoisted(() => {
  const mockReturns = vi.fn();
  const mockRpc = vi.fn((..._args: unknown[]): unknown => ({ returns: mockReturns }));
  const mockInvoke = vi.fn();
  return { mockRpc, mockReturns, mockInvoke };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

const rawThreadListRow = {
  id: 'thread-001',
  reference_id: 'CORT-000001',
  company_id: 'company-001',
  mailbox_id: 'mailbox-001',
  subject: 'Benefits question',
  entity_type: null,
  entity_id: null,
  subject_person_id: null,
  sensitivity_level: 'STANDARD',
  origin: 'OUTBOUND',
  is_archived: false,
  created_by: 'user-001',
  linked_at: null,
  linked_by: null,
  created_at: '2026-07-01T10:00:00.000Z',
  updated_at: null,
  last_message_at: '2026-07-01T10:05:00.000Z',
  // mhd_list_correspondence_threads computes this server-side via a
  // correlated subquery (migration 0155) — no follow-up messages fetch.
  last_message_preview: 'Can you review this?',
};

describe('mhdCorrespondenceService', () => {
  beforeEach(() => {
    mockRpc.mockClear();
    mockRpc.mockImplementation((..._args: unknown[]): unknown => ({ returns: mockReturns }));
    mockReturns.mockReset();
    mockInvoke.mockReset();
  });

  it('lists threads with a required company scope and a server-computed preview', async () => {
    mockReturns.mockResolvedValueOnce({ data: [rawThreadListRow], error: null });

    const result = await mhdCorrespondenceService.listThreads({
      companyId: 'company-001',
      includeGeneral: true,
      limit: 25,
    });

    expect(mockRpc).toHaveBeenNthCalledWith(1, 'mhd_list_correspondence_threads', {
      p_company_id: 'company-001',
      p_entity_type: undefined,
      p_entity_id: undefined,
      p_include_general: true,
      p_limit: 25,
      p_offset: 0,
    });
    expect(result[0]).toEqual(expect.objectContaining({
      id: 'thread-001',
      referenceId: 'CORT-000001',
      lastMessagePreview: 'Can you review this?',
    }));
  });

  it('sends a new thread through the send-email edge function', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, thread_id: 'thread-001' },
      error: null,
    });

    const result = await mhdCorrespondenceService.send({
      companyId: 'company-001',
      subject: 'Benefits question',
      entityType: 'LEAVE_CASE',
      entityId: 'leave-001',
      recipientEmails: ['employee@example.com'],
      ccEmails: [],
      bodyHtml: 'Hello',
      bodyText: 'Hello',
    });

    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: {
        company_id: 'company-001',
        subject: 'Benefits question',
        entity_type: 'LEAVE_CASE',
        entity_id: 'leave-001',
        recipient_emails: ['employee@example.com'],
        cc_emails: [],
        body_html: 'Hello',
        body_text: 'Hello',
        in_reply_to_message_id: null,
      },
    });
    expect(result).toBe('thread-001');
  });

  it('sends a reply through the send-email edge function', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, thread_id: 'thread-001' },
      error: null,
    });

    await mhdCorrespondenceService.send({
      threadId: 'thread-001',
      recipientEmails: ['employee@example.com'],
      ccEmails: ['manager@example.com'],
      bodyHtml: 'Reply',
      bodyText: 'Reply',
      inReplyToMessageId: 'message-001',
    });

    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: {
        thread_id: 'thread-001',
        recipient_emails: ['employee@example.com'],
        cc_emails: ['manager@example.com'],
        body_html: 'Reply',
        body_text: 'Reply',
        in_reply_to_message_id: 'message-001',
      },
    });
  });

  it('links a general thread to a supported record target', async () => {
    const { last_message_preview: _unused, ...rawThread } = rawThreadListRow;
    mockRpc.mockReturnValueOnce(Promise.resolve({ data: rawThread, error: null }));

    await mhdCorrespondenceService.linkThread({
      threadId: 'thread-001',
      entityType: 'ACCOMMODATION_CASE',
      entityId: 'case-001',
    });

    expect(mockRpc).toHaveBeenCalledWith('mhd_link_correspondence_thread', {
      p_thread_id: 'thread-001',
      p_entity_type: 'ACCOMMODATION_CASE',
      p_entity_id: 'case-001',
    });
  });
});
