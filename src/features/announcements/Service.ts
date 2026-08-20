import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdActiveAnnouncement,
  MhdActiveAnnouncementRpcRow,
  MhdAnnouncementDetail,
  MhdAnnouncementDetailRpcRow,
  MhdAnnouncementListItem,
  MhdAnnouncementRpcRow,
  MhdCreateAnnouncementInput,
  MhdUpdateAnnouncementInput,
} from './Types';

function mapListItem(row: MhdAnnouncementRpcRow): MhdAnnouncementListItem {
  return {
    id: row.id,
    referenceId: row.reference_id,
    title: row.title,
    status: row.status,
    audienceScope: row.audience_scope,
    audienceRoles: row.audience_roles,
    publishAt: row.publish_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  };
}

function mapDetail(row: MhdAnnouncementDetailRpcRow): MhdAnnouncementDetail {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    title: row.title,
    bodyRichText: row.body_rich_text,
    bodyPlainText: row.body_plain_text,
    status: row.status,
    audienceScope: row.audience_scope,
    audienceRoles: row.audience_roles,
    publishAt: row.publish_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    archivedAt: row.archived_at,
  };
}

function mapActive(row: MhdActiveAnnouncementRpcRow): MhdActiveAnnouncement {
  return {
    id: row.id,
    referenceId: row.reference_id,
    title: row.title,
    bodyPlainText: row.body_plain_text,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  };
}

export const mhdAnnouncementsService = {
  async listAnnouncements(companyId: string, status?: string | null): Promise<MhdAnnouncementListItem[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_announcements', {
      p_company_id: companyId,
      p_status: status ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdAnnouncementRpcRow[]).map(mapListItem);
  },

  async listActiveAnnouncements(companyId: string): Promise<MhdActiveAnnouncement[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_active_announcements', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdActiveAnnouncementRpcRow[]).map(mapActive);
  },

  async getAnnouncement(id: string): Promise<MhdAnnouncementDetail | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_announcement', { p_id: id });
    if (error) throw error;
    const row = ((data ?? []) as unknown as MhdAnnouncementDetailRpcRow[])[0];
    return row ? mapDetail(row) : null;
  },

  async createAnnouncement(input: MhdCreateAnnouncementInput): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_create_announcement',
      {
        p_company_id: input.companyId,
        p_title: input.title.trim(),
        p_body_rich_text: input.bodyRichText as never,
        p_body_plain_text: input.bodyPlainText,
        p_audience_scope: input.audienceScope,
        p_audience_roles: input.audienceScope === 'roles' ? input.audienceRoles : undefined,
        p_publish_at: input.publishAt ?? undefined,
        p_expires_at: input.expiresAt ?? undefined,
      } as never,
    );
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string }>)[0];
    if (!row) throw new Error('Announcement creation returned no row.');
    return { id: row.id };
  },

  async updateAnnouncement(input: MhdUpdateAnnouncementInput): Promise<void> {
    const { error } = await supabaseClient.rpc(
      'mhd_update_announcement',
      {
        p_id: input.id,
        p_title: input.title ?? undefined,
        p_body_rich_text: (input.bodyRichText as never) ?? undefined,
        p_body_plain_text: input.bodyPlainText ?? undefined,
        p_audience_scope: input.audienceScope ?? undefined,
        p_audience_roles: input.audienceScope === 'roles' ? input.audienceRoles : undefined,
        p_publish_at: input.publishAt ?? undefined,
        p_expires_at: input.expiresAt ?? undefined,
      } as never,
    );
    if (error) throw error;
  },

  async publishAnnouncement(id: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_publish_announcement', { p_id: id });
    if (error) throw error;
  },

  async archiveAnnouncement(id: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_archive_announcement', { p_id: id });
    if (error) throw error;
  },
};
