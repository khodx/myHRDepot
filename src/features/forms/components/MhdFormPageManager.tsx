import type { MhdFormPage as MhdFormPageType } from '../Types';
import { mhdFormLogicEngine } from '../Service';

interface MhdFormPageManagerProps {
  pages: MhdFormPageType[];
  currentPageIndex: number;
  onNavigate: (nextPageIndex: number) => void;
  validateCurrentPage: () => boolean;
  values: Record<string, unknown>;
  isSubmitting?: boolean;
  onSubmit: () => void;
  /** When false (read-only / preview), the last page shows no Submit button. */
  showSubmit?: boolean;
}

export function MhdFormPageManager({
  pages,
  currentPageIndex,
  onNavigate,
  validateCurrentPage,
  values,
  isSubmitting,
  onSubmit,
  showSubmit = true,
}: MhdFormPageManagerProps) {
  const sortedPages = [...pages].sort((left, right) => left.order - right.order);
  const currentPage = sortedPages[currentPageIndex];
  const isLastPage = currentPageIndex >= sortedPages.length - 1;

  const resolveNextPageIndex = (): number => {
    const skipLogic = currentPage?.skipLogic;
    if (skipLogic && mhdFormLogicEngine.evaluateNode(skipLogic.condition, values)) {
      const targetIndex = sortedPages.findIndex((page) => page.id === skipLogic.targetPageId);
      if (targetIndex >= 0) return targetIndex;
    }
    return currentPageIndex + 1;
  };

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <button
        type="button"
        onClick={() => onNavigate(Math.max(0, currentPageIndex - 1))}
        disabled={currentPageIndex === 0}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
      >
        Previous
      </button>

      {isLastPage && !showSubmit ? null : (
        <button
          type="button"
          onClick={() => {
            if (!validateCurrentPage()) return;
            if (isLastPage) {
              onSubmit();
              return;
            }
            onNavigate(resolveNextPageIndex());
          }}
          disabled={isSubmitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover disabled:opacity-50"
        >
          {isLastPage ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next'}
        </button>
      )}
    </div>
  );
}
