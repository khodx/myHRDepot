import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdNotification, MhdNotificationEntityType, MhdNotificationType } from './Types';

// Row shape of mhd_list_notifications per the generated database.types.ts
// (SETOF public.notifications).
type MhdNotificationRow = {
  id: string;
  reference_id: string;
  company_id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  notification_type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  created_by: string | null;
};

function mapNotification(row: MhdNotificationRow): MhdNotification {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    recipientUserId: row.recipient_user_id,
    actorUserId: row.actor_user_id ?? null,
    notificationType: row.notification_type as MhdNotificationType,
    title: row.title,
    body: row.body ?? null,
    entityType: (row.entity_type ?? null) as MhdNotificationEntityType | null,
    entityId: row.entity_id ?? null,
    actionUrl: row.action_url ?? null,
    isRead: row.is_read,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
    createdBy: row.created_by ?? null,
  };
}

export const mhdNotificationService = {
  async listNotifications(limit = 50): Promise<MhdNotification[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_notifications', { p_limit: limit })
      .returns<MhdNotificationRow[]>();

    if (error) throw new Error('Unable to list notifications: ' + error.message);
    return (data ?? []).map(mapNotification);
  },

  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabaseClient.rpc('mhd_notification_unread_count');
    if (error) throw new Error('Unable to fetch unread notification count: ' + error.message);
    return Number(data ?? 0);
  },

  async markRead(notificationIds: string[]): Promise<void> {
    // mhd_mark_notification_read (singular) only accepts one notification id at a time --
    // there is no bulk "mark these ids read" function deployed -- so we call it once per id.
    const results = await Promise.all(
      notificationIds.map((id) =>
        supabaseClient.rpc('mhd_mark_notification_read', { p_notification_id: id }),
      ),
    );
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw new Error('Unable to mark notifications read: ' + firstError.message);
  },

  async markAllRead(): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_mark_all_notifications_read');
    if (error) throw new Error('Unable to mark all notifications read: ' + error.message);
  },
};
