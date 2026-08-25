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
        className="mhd-topbar-icon-btn relative inline-flex flex-col items-center justify-center gap-0.5 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Bell className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" />
        <span aria-hidden className="text-[10px] font-medium leading-none whitespace-nowrap">Alerts</span>
        <MhdCountBadge
          count={unreadCount}
          className="h-[27px] w-[27px] text-[17px]"
        />
      </button>

      {isOpen && <MhdNotificationPanel onClose={() => setIsOpen(false)} />}
    </div>
  );
}
