import { cn } from '@/utils/cn';

interface MhdProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  percent: number;
  /**
   * Bar color: module accent (default), the success green for completions,
   * or "graduated" — a fixed red->gold->green gradient revealed left-to-right
   * as `percent` fills the track, for progress fields like Task.
   */
  tone?: 'accent' | 'success' | 'graduated';
  showLabel?: boolean;
  className?: string;
}

// Deliberately 4 stops, not 3: a straight red->gold->green lerp reads as
// orange through most of the low-to-mid range (red+yellow blend *is*
// orange), so low-but-nonzero progress never looked like "red." Holding a
// bold red through 0-35% before the gold transition begins fixes that.
const MHD_GRADUATED_STOPS = [
  { at: 0, hex: '#8B0000' }, // deep red / maroon
  { at: 35, hex: '#C1121F' }, // bold red — still unambiguously red at 25-35%
  { at: 65, hex: '#E8B923' }, // deep/bold gold
  { at: 100, hex: '#0B7A26' }, // deep bold green
] as const;

// Fixed red->gold->green gradient spanning the full track width. The filled
// portion reveals a slice of this gradient starting at red (left edge); it
// does not shift color based on `percent` alone, so filling the bar plays
// as one continuous red-to-yellow-to-green slide rather than jumping straight
// to whatever solid hue matches the current percent.
const MHD_GRADUATED_CSS = `linear-gradient(to right, ${MHD_GRADUATED_STOPS.map(
  (stop) => `${stop.hex} ${stop.at}%`,
).join(', ')})`;

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
        className="relative h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-muted"
      >
        {tone === 'graduated' ? (
          <>
            {/* Full-width gradient, always painted red->gold->green; the mask
                to its right hides everything past `clamped`, so filling the
                bar reveals progressively further into the same gradient
                instead of jumping straight to a solid interpolated hue. */}
            <div className="absolute inset-0 rounded-full" style={{ background: MHD_GRADUATED_CSS }} />
            <div
              className="absolute inset-y-0 right-0 rounded-r-full bg-muted"
              style={{ width: `${100 - clamped}%` }}
            />
          </>
        ) : (
          <div
            className={cn('h-full rounded-full', tone === 'success' ? 'bg-green-600' : 'bg-accent')}
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs tabular-nums text-muted-foreground">{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
