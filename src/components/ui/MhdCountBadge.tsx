import { cn } from '@/utils/cn';

export type MhdCountBadgeVariant = 'error' | 'warning';

// error is red-500 (#ef4444) with each RGB channel scaled by 0.9 -- 10% darker.
const VARIANT_CLASSES: Record<MhdCountBadgeVariant, string> = {
  error: 'bg-[#d73d3d]',
  warning: 'bg-amber-500',
};

interface MhdCountBadgeProps {
  count: number;
  variant?: MhdCountBadgeVariant;
  className?: string;
}

/**
 * Small numeric corner dot — absolutely positioned over a corner of its
 * parent, which must be `relative`. Caps display at "9+"; renders nothing
 * at count <= 0 (there's nothing to flag). Purely visual: it's always
 * `aria-hidden`, so the real accessible text belongs on the parent (see
 * MhdNotificationBell's aria-label and MhdDashboardModuleLinks' per-tile
 * aria-label for the two current consumers).
 */
export function MhdCountBadge({ count, variant = 'error', className }: MhdCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      aria-hidden
      className={cn(
        'absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none text-white',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
