import { cn } from '@/utils/cn';

interface MhdProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  percent: number;
  /**
   * Bar color: module accent (default), the success green for completions,
   * or "graduated" — a continuous red-to-green hue interpolated from
   * `percent` (0% = red, 100% = green), for progress fields like Task.
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

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** Walks MHD_GRADUATED_STOPS, interpolating within whichever segment `percent` falls in. */
function graduatedFillColor(percent: number): string {
  const stops = MHD_GRADUATED_STOPS;
  let segmentIndex = stops.length - 2;
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (percent <= stops[i + 1].at) {
      segmentIndex = i;
      break;
    }
  }
  const start = stops[segmentIndex];
  const end = stops[segmentIndex + 1];
  const segmentStart = start.at;
  const segmentEnd = end.at;
  const t = segmentEnd === segmentStart ? 0 : (percent - segmentStart) / (segmentEnd - segmentStart);

  const [r1, g1, b1] = hexToRgb(start.hex);
  const [r2, g2, b2] = hexToRgb(end.hex);
  return `rgb(${lerp(r1, r2, t)}, ${lerp(g1, g2, t)}, ${lerp(b1, b2, t)})`;
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
          className={cn(
            'h-full rounded-full',
            tone === 'success' ? 'bg-green-600' : tone === 'accent' ? 'bg-accent' : '',
          )}
          style={{
            width: `${clamped}%`,
            ...(tone === 'graduated' ? { backgroundColor: graduatedFillColor(clamped) } : {}),
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs tabular-nums text-muted-foreground">{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
