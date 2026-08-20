// ============================================================
// MHD-04.2 Notification Engine — TypeScript Types
// ============================================================

export type MhdNotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_OVERDUE'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DUE_SOON'
  | 'NOTE_ADDED'
  | 'ATTACHMENT_ADDED'
  | 'MENTION'
  | 'ANNOUNCEMENT'
  | 'SYSTEM';

export type MhdNotificationEntityType =
  | 'TASK'
  | 'PERSON'
  | 'COMPANY'
  | 'NOTE'
  | 'ATTACHMENT'
  | 'ANNOUNCEMENT';

export interface MhdNotification {
  id: string;
  referenceId: string;
  companyId: string;
  recipientUserId: string;
  actorUserId: string | null;
  notificationType: MhdNotificationType;
  title: string;
  body: string | null;
  entityType: MhdNotificationEntityType | null;
  entityId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface MhdNotificationState {
  notifications: MhdNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// Human-readable labels for notification types
export const MHD_NOTIFICATION_TYPE_LABELS: Record<MhdNotificationType, string> = {
  TASK_ASSIGNED: 'Task Assigned',
  TASK_UPDATED: 'Task Updated',
  TASK_OVERDUE: 'Task Overdue',
  TASK_STATUS_CHANGED: 'Status Changed',
  TASK_DUE_SOON: 'Due Soon',
  NOTE_ADDED: 'Note Added',
  ATTACHMENT_ADDED: 'File Uploaded',
  MENTION: 'You Were Mentioned',
  ANNOUNCEMENT: 'Announcement',
  SYSTEM: 'System',
};
