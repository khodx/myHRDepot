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

const MHD_GRADUATED_STOPS = [
  { at: 0, hex: '#CF0000' },
  { at: 50, hex: '#E8C13A' },
  { at: 100, hex: '#00A316' },
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

/** 0% -> #CF0000 (red), 50% -> #E8C13A (gold), 100% -> #00A316 (green). */
function graduatedFillColor(percent: number): string {
  const [start, end] =
    percent <= 50
      ? [MHD_GRADUATED_STOPS[0], MHD_GRADUATED_STOPS[1]]
      : [MHD_GRADUATED_STOPS[1], MHD_GRADUATED_STOPS[2]];
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
