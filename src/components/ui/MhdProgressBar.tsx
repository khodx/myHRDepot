import { cn } from '@/utils/cn';

interface MhdProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  percent: number;
  /** Bar color: module accent (default) or the success green for completions. */
  tone?: 'accent' | 'success';
  showLabel?: boolean;
  className?: string;
}

/** Inline progress bar for table cells and progress cards (§6). */
export function MhdProgressBar({
  percent,
  tone = 'accent',
  showLabel,
  className,
}: MhdProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn('h-full rounded-full', tone === 'success' ? 'bg-green-600' : 'bg-accent')}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs tabular-nums text-muted-foreground">{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
