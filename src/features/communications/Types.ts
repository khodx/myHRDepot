import type { MhdNotification } from '@/features/notifications/Types';

/**
 * A "system alert" is simply a notification with `notificationType ===
 * 'SYSTEM'`. Before 2026-08-06 (audit finding M11), MhdCommunicationsPage
 * and MhdSystemAlertsPage each independently re-derived this filter — this
 * is the one selector both now call.
 */
export function mhdIsSystemAlertNotification(notification: MhdNotification): boolean {
  return notification.notificationType === 'SYSTEM';
}
