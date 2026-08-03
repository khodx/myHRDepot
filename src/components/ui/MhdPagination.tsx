import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Standard page size for every list in the app unless a page has a documented reason to differ. */
export const MHD_DEFAULT_PAGE_SIZE = 200;

interface UseMhdPaginationOptions {
  totalItems: number;
  pageSize?: number;
  /** Bump this when filters change so the view resets to page 1 instead of stranding the user past the end. */
  resetKey?: string | number;
}

export interface MhdPagination {
  page: number;
  pageCount: number;
  pageSize: number;
  /** 1-based index of the first item on the current page, or 0 when there are no items. */
  rangeStart: number;
  /** 1-based index of the last item on the current page. */
  rangeEnd: number;
  canPrev: boolean;
  canNext: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  /** Slice a full (already-filtered) items array down to just the current page. */
  sliceItems: <T>(items: T[]) => T[];
}

/**
 * Client-side pagination over an already-filtered array. Every list in the app filters/sorts
 * in memory today (no server-side paging), so this slices locally rather than re-querying.
 */
export function useMhdPagination(
  totalItems: number,
  { pageSize = MHD_DEFAULT_PAGE_SIZE, resetKey }: Omit<UseMhdPaginationOptions, 'totalItems'> = {},
): MhdPagination {
  return useMhdPaginationInternal({ totalItems, pageSize, resetKey });
}

function useMhdPaginationInternal({
  totalItems,
  pageSize = MHD_DEFAULT_PAGE_SIZE,
  resetKey,
}: UseMhdPaginationOptions): MhdPagination {
  const [page, setPageState] = usePageState(resetKey);
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(Math.max(page, 1), pageCount);
  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  function setPage(next: number) {
    setPageState(Math.min(Math.max(next, 1), pageCount));
  }

  return {
    page: clampedPage,
    pageCount,
    pageSize,
    rangeStart: totalItems === 0 ? 0 : startIndex + 1,
    rangeEnd: endIndex,
    canPrev: clampedPage > 1,
    canNext: clampedPage < pageCount,
    setPage,
    nextPage: () => setPage(clampedPage + 1),
    prevPage: () => setPage(clampedPage - 1),
    sliceItems: (items) => items.slice(startIndex, endIndex),
  };
}

// Tiny local hook so `resetKey` changes (e.g. a filters object turning into a new dependency
// string) reset the page without every caller having to wire its own effect.
function usePageState(resetKey: string | number | undefined): [number, (page: number) => void] {
  const [page, setPage] = useState(1);
  const previousResetKey = useRef(resetKey);

  useEffect(() => {
    if (previousResetKey.current !== resetKey) {
      previousResetKey.current = resetKey;
      setPage(1);
    }
  }, [resetKey]);

  return [page, setPage];
}

/** `Showing {rangeStart} to {rangeEnd} of {total} {noun}` — the standard footer summary string. */
export function mhdPaginationSummary(pagination: MhdPagination, total: number, noun: string): string {
  if (total === 0) return `No ${noun} found`;
  return `Showing ${pagination.rangeStart} to ${pagination.rangeEnd} of ${total} ${noun}`;
}

interface MhdPaginationControlsProps {
  pagination: MhdPagination;
  className?: string;
}

const navButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring';

/** Real "page N of M" controls with working Previous/Next arrows — drop into `<MhdTableFooter>`'s children slot. */
export function MhdPaginationControls({ pagination, className }: MhdPaginationControlsProps) {
  if (pagination.pageCount <= 1) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={pagination.prevPage}
        disabled={!pagination.canPrev}
        className={navButtonClass}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <span className="min-w-[72px] text-center text-[13px] font-medium text-foreground">
        {pagination.page} of {pagination.pageCount}
      </span>
      <button
        type="button"
        onClick={pagination.nextPage}
        disabled={!pagination.canNext}
        className={navButtonClass}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
