import type { MhdFormPage as MhdFormPageType } from '../Types';
import { mhdFormLogicEngine } from '../Service';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';

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
  const steps: MhdStep[] = sortedPages.map((page) => ({
    id: page.id,
    title: page.title,
    description: page.description,
  }));

  const resolveNextPageIndex = (): number => {
    const skipLogic = currentPage?.skipLogic;
    if (skipLogic && mhdFormLogicEngine.evaluateNode(skipLogic.condition, values)) {
      const targetIndex = sortedPages.findIndex((page) => page.id === skipLogic.targetPageId);
      if (targetIndex >= 0) return targetIndex;
    }
    return currentPageIndex + 1;
  };

  return (
    <MhdStepper
      steps={steps}
      currentStepIndex={currentPageIndex}
      onNavigate={onNavigate}
      validateCurrentStep={validateCurrentPage}
      resolveNextStepIndex={(_currentIndex) => resolveNextPageIndex()}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      showSubmit={showSubmit}
    />
  );
}
