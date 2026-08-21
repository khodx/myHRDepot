import { MhdProgressBar } from '@/components/ui/MhdProgressBar';

interface MhdStepperProgressProps {
  currentStepIndex: number;
  totalSteps: number;
}

export function MhdStepperProgress({ currentStepIndex, totalSteps }: MhdStepperProgressProps) {
  const progressPercent = totalSteps <= 1 ? 100 : ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Step {currentStepIndex + 1}</span>
        <span>{totalSteps} total</span>
      </div>
      <MhdProgressBar percent={progressPercent} />
    </div>
  );
}
