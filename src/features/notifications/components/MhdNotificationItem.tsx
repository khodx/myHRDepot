import type { MhdNotification } from '../Types';

interface MhdNotificationItemProps {
  notification: MhdNotification;
  onSelect: (notification: MhdNotification) => void;
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function MhdNotificationItem({ notification, onSelect }: MhdNotificationItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      aria-label={notification.isRead ? notification.title : `Unread: ${notification.title}`}
      className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
        !notification.isRead ? 'bg-accent-tint/60' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {!notification.isRead && (
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
        )}
        <div className={`min-w-0 ${notification.isRead ? 'pl-4' : ''}`}>
          <p className="line-clamp-1 text-sm font-medium text-foreground">{notification.title}</p>
          {notification.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}
