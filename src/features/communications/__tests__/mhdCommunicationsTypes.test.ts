import { describe, expect, it } from 'vitest';
import type { MhdNotification } from '@/features/notifications/Types';
import { mhdIsSystemAlertNotification } from '../Types';

function buildNotification(overrides: Partial<MhdNotification> = {}): MhdNotification {
  return {
    id: 'notif-1',
    referenceId: 'NTFY-000001',
    companyId: 'company-1',
    recipientUserId: 'user-1',
    actorUserId: null,
    notificationType: 'TASK_ASSIGNED',
    title: 'Task assigned',
    body: null,
    entityType: null,
    entityId: null,
    actionUrl: null,
    isRead: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  } as MhdNotification;
}

describe('mhdIsSystemAlertNotification', () => {
  it('returns true only for SYSTEM notifications', () => {
    expect(mhdIsSystemAlertNotification(buildNotification({ notificationType: 'SYSTEM' }))).toBe(
      true,
    );
  });

  it('returns false for every non-SYSTEM notification type', () => {
    const nonSystemTypes: MhdNotification['notificationType'][] = [
      'TASK_ASSIGNED',
      'TASK_UPDATED',
      'TASK_OVERDUE',
      'TASK_STATUS_CHANGED',
      'TASK_DUE_SOON',
      'NOTE_ADDED',
      'ATTACHMENT_ADDED',
      'MENTION',
    ];
    for (const notificationType of nonSystemTypes) {
      expect(mhdIsSystemAlertNotification(buildNotification({ notificationType }))).toBe(false);
    }
  });
});
