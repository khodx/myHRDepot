import { useEffect, useRef } from 'react';
import { X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMhdNotifications } from '../Hook';
import type { MhdNotification } from '../Types';
import { MhdNotificationItem } from './MhdNotificationItem';
import { MhdMarkAllReadButton } from './MhdMarkAllReadButton';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';

interface MhdNotificationPanelProps {
  onClose: () => void;
}

export function MhdNotificationPanel({ onClose }: MhdNotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, error, markRead, markAllRead } =
    useMhdNotifications();

  // Close panel on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  function handleItemClick(notification: MhdNotification) {
    if (!notification.isRead) {
      markRead([notification.id]);
    }
    if (notification.actionUrl) {
      void navigate(notification.actionUrl);
    }
    onClose();
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-card shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <MhdMarkAllReadButton unreadCount={unreadCount} onMarkAllRead={markAllRead} />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center text-sm text-red-600">{error}</div>
        ) : notifications.length === 0 ? (
          <MhdEmptyState icon={Bell} title="No notifications" className="py-10" />
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <MhdNotificationItem key={n.id} notification={n} onSelect={handleItemClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
