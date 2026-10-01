import { useEffect, useRef, useState, type RefObject } from 'react';

export interface MhdColumnBreakpoint {
  /** Container width, in px, at or above which `columns` applies. */
  minWidth: number;
  columns: number;
}

/**
 * Column count for a grid, driven by the grid container's own width rather than
 * the viewport — so it stays correct when the left rail collapses or expands.
 * `breakpoints` must be ordered widest first; below the last one the grid is a
 * single column. When the width is unknown (first paint, or an environment
 * with no layout) the widest layout is used so row membership is deterministic.
 */
export function useMhdResponsiveColumns<T extends HTMLElement>(
  breakpoints: readonly MhdColumnBreakpoint[],
): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const widest = breakpoints[0]?.columns ?? 1;
  const [columns, setColumns] = useState<number>(widest);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const resolve = (width: number) => {
      if (width <= 0) return widest;
      return breakpoints.find((bp) => width >= bp.minWidth)?.columns ?? 1;
    };

    setColumns(resolve(element.clientWidth));
    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setColumns(resolve(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [breakpoints, widest]);

  return [ref, columns];
}
