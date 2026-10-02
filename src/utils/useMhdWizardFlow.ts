import { useCallback, useEffect, useRef, useState } from 'react';
import type { MhdStep, MhdStepperProps } from '@/components/ui/MhdStepper';

/**
 * One step of a guided wizard. Extends the presentational {@link MhdStep} with the
 * behaviour the flow engine runs when someone moves forward past it.
 */
export interface MhdWizardStepDefinition extends MhdStep {
  /**
   * Returns the message to show when the step cannot be left going forward, or `null`
   * when it is valid. Runs on every forward move, including a jump across several
   * steps (each skipped step is validated in order). Never runs going back.
   */
  validate?: () => string | null;
  /**
   * Side effect run once the step is valid and the person moves forward past it —
   * typically persisting what the step collected. A rejection aborts the move, keeps
   * the person on the step and surfaces the message. Never runs going back.
   */
  onLeave?: () => Promise<unknown> | unknown;
}

export interface UseMhdWizardFlowOptions {
  steps: MhdWizardStepDefinition[];
  /** Opens the wizard on this step instead of the first (resuming an existing record). */
  initialStepId?: string;
  /** Runs when the last step is submitted. A rejection is shown, never swallowed. */
  onSubmit: () => Promise<unknown>;
  /** True once the person has entered something worth protecting from an accidental exit. */
  isDirty?: boolean;
  /** Message used when a thrown value carries none. */
  fallbackError?: string;
}

export const MHD_WIZARD_DEFAULT_ERROR = 'Something went wrong. Please try again.';

/** The server's own message when there is one — for the RPC-backed modules those are deliberate. */
export function mhdWizardErrorMessage(caught: unknown, fallback: string = MHD_WIZARD_DEFAULT_ERROR) {
  return caught instanceof Error && caught.message ? caught.message : fallback;
}

/** Keeps a ref pointing at the latest value so stable callbacks never close over stale state. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

/**
 * The shared state machine behind every guided wizard.
 *
 * It owns what each wizard used to re-implement: the step index, back-always-allowed
 * navigation, validate-before-forward, an awaited per-step `onLeave` side effect that
 * aborts the move on failure, run-once guards that reset on failure, and a single
 * error / pending surface. A wizard keeps only what is genuinely its own — the
 * domain state, each step's fields and rules, and what a step persists.
 *
 * Pair it with {@link MhdWizardShell} (page chrome, stepper, error region, unsaved-changes
 * dialog) or spread `stepperProps` into `MhdStepper` directly.
 */
export function useMhdWizardFlow({
  steps,
  initialStepId,
  onSubmit,
  isDirty = false,
  fallbackError = MHD_WIZARD_DEFAULT_ERROR,
}: UseMhdWizardFlowOptions) {
  const [index, setIndex] = useState(() => {
    const start = initialStepId ? steps.findIndex((step) => step.id === initialStepId) : 0;
    return start < 0 ? 0 : start;
  });
  const [furthestIndex, setFurthestIndex] = useState(index);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const stepsRef = useLatest(steps);
  const onSubmitRef = useLatest(onSubmit);
  const fallbackRef = useLatest(fallbackError);
  const indexRef = useRef(index);
  const busyRef = useRef(false);
  const onceRef = useRef(new Map<string, Promise<unknown>>());

  // The step list can shrink under a wizard (a conditional step drops out), so the
  // position is clamped rather than trusted.
  const stepIndex = Math.min(index, Math.max(0, steps.length - 1));

  const moveTo = useCallback((target: number) => {
    indexRef.current = target;
    setIndex(target);
    setFurthestIndex((current) => Math.max(current, target));
  }, []);

  const validateStep = useCallback(
    (at: number): boolean => {
      const message = stepsRef.current[at]?.validate?.() ?? null;
      setError(message);
      return message === null;
    },
    [stepsRef],
  );

  const advanceTo = useCallback(
    async (target: number): Promise<void> => {
      if (busyRef.current) return;
      const lastIndex = Math.max(0, stepsRef.current.length - 1);
      const clamped = Math.min(lastIndex, Math.max(0, target));

      // Going back is always allowed and never runs a side effect.
      if (clamped <= indexRef.current) {
        setError(null);
        setFieldError(null);
        moveTo(clamped);
        return;
      }

      busyRef.current = true;
      setIsAdvancing(true);
      setFieldError(null);
      try {
        while (indexRef.current < clamped) {
          const at = indexRef.current;
          if (!validateStep(at)) return;
          const leave = stepsRef.current[at]?.onLeave;
          if (leave) {
            try {
              await leave();
            } catch (caught) {
              setError(mhdWizardErrorMessage(caught, fallbackRef.current));
              return;
            }
          }
          moveTo(at + 1);
        }
        setError(null);
      } finally {
        busyRef.current = false;
        setIsAdvancing(false);
      }
    },
    [fallbackRef, moveTo, stepsRef, validateStep],
  );

  const submit = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    if (!validateStep(indexRef.current)) return false;
    busyRef.current = true;
    setIsSubmitting(true);
    setFieldError(null);
    try {
      await onSubmitRef.current();
      setError(null);
      setIsComplete(true);
      return true;
    } catch (caught) {
      setError(mhdWizardErrorMessage(caught, fallbackRef.current));
      return false;
    } finally {
      busyRef.current = false;
      setIsSubmitting(false);
    }
  }, [fallbackRef, onSubmitRef, validateStep]);

  /**
   * Runs `action` once per `key` and hands every later caller the same result, so a
   * back-then-forward walk through a creating step never creates twice. A failure
   * clears the key so the retry can run.
   */
  const runOnce = useCallback(<T,>(key: string, action: () => Promise<T>): Promise<T> => {
    const existing = onceRef.current.get(key);
    if (existing) return existing as Promise<T>;
    const pending = (async () => action())().catch((caught: unknown) => {
      onceRef.current.delete(key);
      throw caught;
    });
    onceRef.current.set(key, pending);
    return pending;
  }, []);

  /** Forgets a run-once key — for when what it produced no longer reflects the inputs. */
  const resetOnce = useCallback((key: string) => {
    onceRef.current.delete(key);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setFieldError(null);
  }, []);

  const next = useCallback(() => advanceTo(indexRef.current + 1), [advanceTo]);
  const back = useCallback(() => advanceTo(indexRef.current - 1), [advanceTo]);
  const goTo = useCallback((target: number) => advanceTo(target), [advanceTo]);

  const isBusy = isAdvancing || isSubmitting;

  const stepperProps: MhdStepperProps = {
    steps,
    currentStepIndex: stepIndex,
    onNavigate: (target: number) => void advanceTo(target),
    validateCurrentStep: () => validateStep(indexRef.current),
    onSubmit: () => void submit(),
    isSubmitting: isBusy,
  };

  return {
    steps,
    stepIndex,
    currentStep: steps[stepIndex],
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex >= steps.length - 1,
    furthestIndex,
    error,
    fieldError,
    setError,
    setFieldError,
    clearError,
    isAdvancing,
    isSubmitting,
    isBusy,
    isComplete,
    /** True while leaving the page would lose unsaved input. */
    guardUnsaved: isDirty && !isComplete,
    next,
    back,
    goTo,
    submit,
    runOnce,
    resetOnce,
    stepperProps,
  };
}

export type MhdWizardFlow = ReturnType<typeof useMhdWizardFlow>;
