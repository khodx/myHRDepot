import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdAnnouncementsService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdAnnouncementsService', () => {
  it('lists announcements for a company and maps rows', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'ann-1',
          reference_id: 'ANN-001',
          title: 'Office closed Friday',
          status: 'published',
          audience_scope: 'company',
          audience_roles: null,
          publish_at: '2026-08-19T00:00:00.000Z',
          published_at: '2026-08-19T00:00:00.000Z',
          expires_at: null,
        },
      ],
      error: null,
    });

    const [item] = await mhdAnnouncementsService.listAnnouncements('company-1', 'published');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_announcements', {
      p_company_id: 'company-1',
      p_status: 'published',
    });
    expect(item).toEqual({
      id: 'ann-1',
      referenceId: 'ANN-001',
      title: 'Office closed Friday',
      status: 'published',
      audienceScope: 'company',
      audienceRoles: null,
      publishAt: '2026-08-19T00:00:00.000Z',
      publishedAt: '2026-08-19T00:00:00.000Z',
      expiresAt: null,
    });
  });

  it('lists only active announcements visible to the caller', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'ann-1',
          reference_id: 'ANN-001',
          title: 'Office closed Friday',
          body_plain_text: 'The office will be closed.',
          published_at: '2026-08-19T00:00:00.000Z',
          expires_at: null,
        },
      ],
      error: null,
    });

    const [item] = await mhdAnnouncementsService.listActiveAnnouncements('company-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_active_announcements', { p_company_id: 'company-1' });
    expect(item.bodyPlainText).toBe('The office will be closed.');
  });

  it('creates a company-wide draft announcement', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'ann-2' }], error: null });

    await mhdAnnouncementsService.createAnnouncement({
      companyId: 'company-1',
      title: 'New Benefits Portal',
      bodyRichText: { type: 'doc' },
      bodyPlainText: 'Check out the new benefits portal.',
      audienceScope: 'company',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_create_announcement', {
      p_company_id: 'company-1',
      p_title: 'New Benefits Portal',
      p_body_rich_text: { type: 'doc' },
      p_body_plain_text: 'Check out the new benefits portal.',
      p_audience_scope: 'company',
      p_audience_roles: undefined,
      p_publish_at: undefined,
      p_expires_at: undefined,
    });
  });

  it('creates a role-scoped announcement carrying the selected roles', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'ann-3' }], error: null });

    await mhdAnnouncementsService.createAnnouncement({
      companyId: 'company-1',
      title: 'Admin Only Notice',
      bodyRichText: { type: 'doc' },
      bodyPlainText: 'For admins only.',
      audienceScope: 'roles',
      audienceRoles: ['Client Admin'],
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_create_announcement', expect.objectContaining({
      p_audience_scope: 'roles',
      p_audience_roles: ['Client Admin'],
    }));
  });

  it('publishes an announcement', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdAnnouncementsService.publishAnnouncement('ann-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_publish_announcement', { p_id: 'ann-1' });
  });

  it('archives an announcement', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdAnnouncementsService.archiveAnnouncement('ann-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_archive_announcement', { p_id: 'ann-1' });
  });
});
