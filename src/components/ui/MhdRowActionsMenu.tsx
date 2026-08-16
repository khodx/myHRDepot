import type { ElementType } from 'react';
import { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { useMhdClickOutside } from '@/utils/useMhdClickOutside';

export interface MhdRowActionsMenuAction {
  key: string;
  label: string;
  icon?: ElementType;
  onSelect: () => void;
  destructive?: boolean;
}

interface MhdRowActionsMenuProps {
  actions: MhdRowActionsMenuAction[];
  triggerLabel?: string;
  className?: string;
}

/**
 * Small anchored "..." menu for row-level actions (reply/edit/delete on a
 * message, and future row-action consumers). Mirrors MhdMultiSelectCombobox's
 * dropdown-panel pattern (useMhdClickOutside, absolute panel) since no
 * positioning library is installed in this codebase.
 */
export function MhdRowActionsMenu({ actions, triggerLabel = 'More actions', className }: MhdRowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useMhdClickOutside(containerRef, () => setOpen(false));

  if (actions.length === 0) return null;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        title={triggerLabel}
      >
        <MoreVertical className="h-3.5 w-3.5" aria-hidden />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 min-w-[9rem] rounded-md border border-border bg-card py-1 shadow-lg"
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted',
                  action.destructive ? 'text-red-700' : 'text-foreground',
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
