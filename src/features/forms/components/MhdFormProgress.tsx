import { MhdStepperProgress } from '@/components/ui/MhdStepperProgress';

interface MhdFormProgressProps {
  currentPageIndex: number;
  totalPages: number;
}

export function MhdFormProgress({ currentPageIndex, totalPages }: MhdFormProgressProps) {
  return (
    <MhdStepperProgress
      currentStepIndex={currentPageIndex}
      totalSteps={totalPages}
      stepLabel="Page"
    />
  );
}
