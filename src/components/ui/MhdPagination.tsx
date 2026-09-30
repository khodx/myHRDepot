import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { type MhdPagination } from './MhdPaginationUtils';

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
      <MhdPaginationGoToPage pagination={pagination} />
    </div>
  );
}

/**
 * Numeric "go to page" input, additive to the prev/next arrows — clamps via
 * `pagination.setPage`, no-ops on invalid entry. Uncontrolled and keyed on
 * `pagination.page` (rather than mirrored via useState+useEffect) so an
 * external page change — Previous/Next, or a filter-driven reset — remounts
 * the input back to the current page without a setState-in-effect render.
 */
function MhdPaginationGoToPage({ pagination }: { pagination: MhdPagination }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const parsed = Number.parseInt(inputRef.current?.value ?? '', 10);
    if (Number.isFinite(parsed)) {
      pagination.setPage(parsed);
    } else if (inputRef.current) {
      inputRef.current.value = String(pagination.page);
    }
  }

  return (
    // Not a <form>: MhdPaginationControls renders inside 22 different pages,
    // some of which already wrap their table in a filter <form> — nesting a
    // second <form> inside that would be invalid HTML and break submission
    // bubbling. Enter-to-commit is handled directly via onKeyDown instead.
    <div className="ml-1 flex items-center gap-1.5 border-l border-border pl-3">
      <label className="text-[13px] text-muted-foreground" htmlFor="mhd-pagination-go-to-page">
        Go to
      </label>
      <input
        key={pagination.page}
        ref={inputRef}
        id="mhd-pagination-go-to-page"
        type="number"
        min={1}
        max={pagination.pageCount}
        defaultValue={pagination.page}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
        className="h-8 w-14 rounded-md border border-border bg-card px-2 text-center text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-label="Go to page"
      />
    </div>
  );
}
