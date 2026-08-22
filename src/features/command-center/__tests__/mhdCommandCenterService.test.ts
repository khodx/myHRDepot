import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => {
  const rpcMock = vi.fn<(name: string, args?: unknown) => unknown>();
  return { rpcMock };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
  },
}));

const { mhdCommandCenterService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ data: [], error: null });
});

describe('mhdCommandCenterService list RPC', () => {
  it('lists with the expected default RPC arguments', async () => {
    await mhdCommandCenterService.list({});

    expect(rpcMock).toHaveBeenCalledWith('mhd_command_center_list', {
      p_company_id: null,
      p_entity_types: null,
      p_status_categories: null,
      p_alert_only: false,
      p_date_from: null,
      p_date_to: null,
      p_search_text: null,
      p_scope: 'downline',
      p_limit: 200,
      p_offset: 0,
    });
  });

  it('maps every supplied filter to its RPC argument', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await mhdCommandCenterService.list({
      entityTypes: ['TASK', 'INVESTIGATION'],
      statusCategories: ['OPEN', 'PENDING_REVIEW'],
      alertOnly: true,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      searchText: 'urgent',
      scope: 'company',
      limit: 25,
      offset: 50,
      companyId: 'company-1',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_command_center_list', {
      p_company_id: 'company-1',
      p_entity_types: ['TASK', 'INVESTIGATION'],
      p_status_categories: ['OPEN', 'PENDING_REVIEW'],
      p_alert_only: true,
      p_date_from: '2026-07-01',
      p_date_to: '2026-07-31',
      p_search_text: 'urgent',
      p_scope: 'company',
      p_limit: 25,
      p_offset: 50,
    });
  });

  it('maps snake_case rows to camelCase and preserves nullable fields', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          item_id: 'item-1',
          entity_type: 'TASK',
          entity_id: 'task-1',
          reference_id: 'TASK-000001',
          title: 'Review handbook',
          status_raw: 'OPEN',
          status_category: 'OPEN',
          is_alert: true,
          person_id: 'person-1',
          person_name: 'Pat Person',
          company_id: 'company-1',
          primary_date: '2026-07-18T15:00:00.000Z',
          link_path: '/tasks/task-1',
          is_sensitive_category_only: false,
        },
        {
          item_id: 'item-2',
          entity_type: 'INVESTIGATION',
          entity_id: 'investigation-1',
          reference_id: null,
          title: 'Sensitive investigation',
          status_raw: null,
          status_category: 'PENDING_REVIEW',
          is_alert: false,
          person_id: null,
          person_name: null,
          company_id: 'company-1',
          primary_date: null,
          link_path: null,
          is_sensitive_category_only: true,
        },
      ],
      error: null,
    });

    await expect(mhdCommandCenterService.list({})).resolves.toEqual([
      {
        itemId: 'item-1',
        entityType: 'TASK',
        entityId: 'task-1',
        referenceId: 'TASK-000001',
        title: 'Review handbook',
        statusRaw: 'OPEN',
        statusCategory: 'OPEN',
        isAlert: true,
        personId: 'person-1',
        personName: 'Pat Person',
        companyId: 'company-1',
        primaryDate: '2026-07-18T15:00:00.000Z',
        linkPath: '/tasks/task-1',
        isSensitiveCategoryOnly: false,
      },
      {
        itemId: 'item-2',
        entityType: 'INVESTIGATION',
        entityId: 'investigation-1',
        referenceId: null,
        title: 'Sensitive investigation',
        statusRaw: null,
        statusCategory: 'PENDING_REVIEW',
        isAlert: false,
        personId: null,
        personName: null,
        companyId: 'company-1',
        primaryDate: null,
        linkPath: null,
        isSensitiveCategoryOnly: true,
      },
    ]);
  });

  it('throws an error containing the RPC failure message', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied for command center' },
    });

    await expect(mhdCommandCenterService.list({})).rejects.toThrow(
      'Unable to load command center items: permission denied for command center',
    );
  });
});
