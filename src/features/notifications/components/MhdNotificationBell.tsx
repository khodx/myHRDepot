import { useState } from 'react';
import { Bell } from 'lucide-react';
import { MhdCountBadge } from '@/components/ui/MhdCountBadge';
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
        <Bell className="h-6 w-6" />
        <MhdCountBadge
          count={unreadCount}
          className="h-[19px] w-[19px] text-[12px]"
        />
      </button>

      {isOpen && <MhdNotificationPanel onClose={() => setIsOpen(false)} />}
    </div>
  );
}
