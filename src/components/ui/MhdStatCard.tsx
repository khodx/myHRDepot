import type { ElementType } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { MhdCard } from './MhdCard';

/**
 * Icon-circle color. Reuses the same semantic palette as MhdBadge
 * (error/warning/success/info) rather than inventing a new one, so a stat
 * card's color and a status badge's color mean the same thing across the
 * app. 'accent' (the default) is the original single-brand-color look —
 * existing callers that don't pass `tone` are unaffected.
 */
type MhdStatCardTone = 'accent' | 'info' | 'success' | 'warning' | 'error';

const TONE_CLASSES: Record<MhdStatCardTone, string> = {
  accent: 'bg-accent-tint text-accent-hover',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
};

interface MhdStatCardProps {
  label: string;
  value: number | string;
  icon?: ElementType;
  /** Icon-circle color; defaults to the single brand accent. */
  tone?: MhdStatCardTone;
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
 * KPI stat card (MHD Design System §3/§6): icon in a tone-tinted circle,
 * big tabular number, optional ▲/▼ delta colored by whether the movement is
 * good — not by its sign.
 */
export function MhdStatCard({
  label,
  value,
  icon: Icon,
  tone = 'accent',
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
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            TONE_CLASSES[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
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
