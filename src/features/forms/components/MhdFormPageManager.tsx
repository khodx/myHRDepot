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
}

export function MhdFormPageManager({
  pages,
  currentPageIndex,
  onNavigate,
  validateCurrentPage,
  values,
  isSubmitting,
  onSubmit,
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
    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={() => onNavigate(Math.max(0, currentPageIndex - 1))}
        disabled={currentPageIndex === 0}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
      >
        Previous
      </button>

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
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isLastPage ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next'}
      </button>
    </div>
  );
}
