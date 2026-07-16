import { useEffect, useRef } from 'react';
import { X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMhdNotifications } from '../Hook';
import type { MhdNotification } from '../Types';
import { MhdNotificationItem } from './MhdNotificationItem';
import { MhdMarkAllReadButton } from './MhdMarkAllReadButton';

interface MhdNotificationPanelProps {
  onClose: () => void;
}

export function MhdNotificationPanel({ onClose }: MhdNotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, error, markRead, markAllRead } = useMhdNotifications();

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
      className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-neutral-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
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
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-neutral-400">Loading…</p>
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center text-sm text-red-600">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-neutral-400">
            <Bell className="h-8 w-8" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {notifications.map((n) => (
              <MhdNotificationItem key={n.id} notification={n} onSelect={handleItemClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
