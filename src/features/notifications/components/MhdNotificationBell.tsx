import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useMhdNotifications } from '../Hook';
import { MhdNotificationPanel } from './MhdNotificationPanel';

export function MhdNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useMhdNotifications();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <MhdNotificationPanel onClose={() => setIsOpen(false)} />}
    </div>
  );
}
