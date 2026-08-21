import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

export interface MhdStep {
  id: string;
  title: string;
  description?: string;
}

export interface MhdStepperProps {
  steps: MhdStep[];
  currentStepIndex: number;
  onNavigate: (nextIndex: number) => void;
  validateCurrentStep: () => boolean;
  /** Defaults to currentStepIndex + 1 when omitted. */
  resolveNextStepIndex?: (currentIndex: number) => number;
  isSubmitting?: boolean;
  onSubmit: () => void;
  /** Defaults to true. */
  showSubmit?: boolean;
}

export function MhdStepper({
  steps,
  currentStepIndex,
  onNavigate,
  validateCurrentStep,
  resolveNextStepIndex,
  isSubmitting = false,
  onSubmit,
  showSubmit = true,
}: MhdStepperProps) {
  const hasSteps = steps.length > 0;
  const lastStepIndex = steps.length - 1;
  const isLastStep = hasSteps && currentStepIndex >= lastStepIndex;

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (isLastStep) {
      onSubmit();
      return;
    }

    const requestedIndex = resolveNextStepIndex?.(currentStepIndex) ?? currentStepIndex + 1;
    const targetIndex = Math.min(lastStepIndex, Math.max(0, requestedIndex));
    onNavigate(targetIndex);
  };

  return (
    <div className="space-y-4">
      {steps.length > 0 && (
        <ol aria-label="Stepper progress" className="flex flex-wrap gap-3">
          {steps.map((step, index) => (
            <li
              key={step.id}
              aria-current={index === currentStepIndex ? 'step' : undefined}
              aria-label={`Step ${index + 1}: ${step.title}`}
              className={cn(
                'text-sm',
                index === currentStepIndex ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              <span>{step.title}</span>
              {step.description && <span className="sr-only"> — {step.description}</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={() => onNavigate(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex <= 0}
          className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
        >
          Previous
        </button>

        {hasSteps && !(isLastStep && !showSubmit) ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
          >
            {isLastStep ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
