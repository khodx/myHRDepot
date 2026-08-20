import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdMemorandumsService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdMemorandumsService', () => {
  it('lists memorandums for a company and maps rows', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'memo-1',
          reference_id: 'MEMO-001',
          title: 'Office Closure',
          category: 'FACILITIES',
          requires_acknowledgment: false,
          status: 'PUBLISHED',
          audience_label: 'All Company',
          published_at: '2026-08-19T00:00:00.000Z',
          created_at: '2026-08-18T00:00:00.000Z',
          recipient_count: '4',
        },
      ],
      error: null,
    });

    const [item] = await mhdMemorandumsService.listMemorandums('company-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_memorandums', {
      p_company_id: 'company-1',
      p_status: undefined,
    });
    expect(item.recipientCount).toBe(4);
    expect(item.audienceLabel).toBe('All Company');
  });

  it('creates a memorandum draft', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'memo-2' }], error: null });

    await mhdMemorandumsService.createMemorandum({
      companyId: 'company-1',
      title: 'New Benefits Portal',
      body: 'Check out the new benefits portal.',
      category: 'BENEFITS',
      requiresAcknowledgment: true,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_create_memorandum', {
      p_company_id: 'company-1',
      p_title: 'New Benefits Portal',
      p_body: 'Check out the new benefits portal.',
      p_category: 'BENEFITS',
      p_requires_acknowledgment: true,
    });
  });

  it('publishes a memorandum to a resolved recipient list', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await mhdMemorandumsService.publishMemorandum({
      memorandumId: 'memo-1',
      recipientPersonIds: ['person-1', 'person-2'],
      audienceLabel: 'Engineering',
      sendEmail: true,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_publish_memorandum', {
      p_memorandum_id: 'memo-1',
      p_recipient_person_ids: ['person-1', 'person-2'],
      p_audience_label: 'Engineering',
      p_send_email: true,
    });
  });

  it('marks a delivery read', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdMemorandumsService.markRead('memo-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_mark_memorandum_read', { p_memorandum_id: 'memo-1' });
  });

  it('acknowledges by the acknowledgment id, not the memorandum id', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdMemorandumsService.acknowledge('ack-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_acknowledge_memorandum', { p_acknowledgment_id: 'ack-1' });
  });
});
