import { CheckCheck } from 'lucide-react';

interface MhdMarkAllReadButtonProps {
  unreadCount: number;
  onMarkAllRead: () => void;
  disabled?: boolean;
}

export function MhdMarkAllReadButton({ unreadCount, onMarkAllRead, disabled = false }: MhdMarkAllReadButtonProps) {
  if (unreadCount === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onMarkAllRead}
      disabled={disabled}
      title="Mark all as read"
      aria-label={`Mark all ${unreadCount} notifications as read`}
      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      <CheckCheck className="h-4 w-4" />
    </button>
  );
}
