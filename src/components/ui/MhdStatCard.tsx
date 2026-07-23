import type { ElementType } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { MhdCard } from './MhdCard';

interface MhdStatCardProps {
  label: string;
  value: number | string;
  icon?: ElementType;
  /** Signed percentage vs the prior period, e.g. 3.4 or -8.1. */
  deltaPct?: number;
  /** Whether an increase is good (employees) or bad (overdue tasks). */
  deltaGoodWhen?: 'up' | 'down';
  deltaLabel?: string;
  /** Muted line under the value when there is no delta (e.g. "312 of 480 completed"). */
  hint?: string;
  className?: string;
}

/**
 * KPI stat card (MHD Design System §3/§6): icon in an accent-tint circle,
 * big tabular number, optional ▲/▼ delta colored by whether the movement is
 * good — not by its sign.
 */
export function MhdStatCard({
  label,
  value,
  icon: Icon,
  deltaPct,
  deltaGoodWhen = 'up',
  deltaLabel = 'vs last month',
  hint,
  className,
}: MhdStatCardProps) {
  const showDelta = typeof deltaPct === 'number';
  const isUp = showDelta && deltaPct >= 0;
  const isGood = showDelta && (isUp ? deltaGoodWhen === 'up' : deltaGoodWhen === 'down');
  const DeltaArrow = isUp ? ArrowUp : ArrowDown;
  return (
    <MhdCard className={cn('flex items-start gap-3', className)}>
      {Icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-tint">
          <Icon className="h-5 w-5 text-accent-hover" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
        <p className="text-[28px] font-bold leading-tight tabular-nums text-foreground">{value}</p>
        {showDelta && (
          <p
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              isGood ? 'text-green-700' : 'text-red-700',
            )}
          >
            <DeltaArrow className="h-3 w-3" aria-hidden />
            {Math.abs(deltaPct).toFixed(1)}%
            <span className="font-normal text-muted-foreground">&nbsp;{deltaLabel}</span>
          </p>
        )}
        {!showDelta && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </MhdCard>
  );
}
