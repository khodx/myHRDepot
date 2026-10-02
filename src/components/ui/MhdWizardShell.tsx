import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdStepper } from '@/components/ui/MhdStepper';
import { MhdStepperProgress } from '@/components/ui/MhdStepperProgress';
import { useMhdUnsavedChangesGuard } from '@/utils/useMhdUnsavedChangesGuard';
import type { MhdWizardFlow } from '@/utils/useMhdWizardFlow';

interface MhdWizardShellProps {
  title: ReactNode;
  description?: ReactNode;
  backTo?: string;
  backLabel?: string;
  /** The flow returned by `useMhdWizardFlow`. */
  flow: MhdWizardFlow;
  /** Rendered between the header and the stepper — typically an `MhdComplianceGateBanner`. */
  gateBanner?: ReactNode;
  /** Where Cancel goes. Omit to hide Cancel. */
  cancelTo?: string;
  /** Adds a progress bar above the stepper. Off by default. */
  showProgress?: boolean;
  /**
   * Shown in place of the stepper once the flow has been submitted. A wizard whose record is
   * created on submit uses this for what happens next: the Generate A Document step and a link
   * to the new record. Nothing to leave unsaved at that point, so the exit guard is already off.
   */
  completion?: ReactNode;
  /** The body of the current step. */
  children: ReactNode;
}

/**
 * The page chrome every guided wizard shares: header, optional gate banner, stepper,
 * the current step's card with the flow's error region, Cancel, and the
 * unsaved-changes confirmation. The wizard supplies only the step body.
 *
 * Deliberately not named `*Wizard.tsx`: the hub test treats every such file as a
 * wizard that needs a card on `/wizards`.
 */
export function MhdWizardShell({
  title,
  description,
  backTo,
  backLabel,
  flow,
  gateBanner,
  cancelTo,
  showProgress = false,
  completion,
  children,
}: MhdWizardShellProps) {
  const guard = useMhdUnsavedChangesGuard(flow.guardUnsaved);
  const showCompletion = flow.isComplete && completion !== undefined;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={title}
        description={description}
        backTo={backTo}
        backLabel={backLabel}
      />
      {gateBanner}

      {showCompletion ? (
        completion
      ) : (
        <>
          {showProgress ? (
            <MhdStepperProgress currentStepIndex={flow.stepIndex} totalSteps={flow.steps.length} />
          ) : null}
          <MhdStepper {...flow.stepperProps} />

          <MhdCard>
            <h2 className="text-lg font-semibold text-foreground">{flow.currentStep?.title}</h2>
            <div className="mt-4">{children}</div>
            {flow.error ? (
              <p role="alert" className="mt-4 text-sm text-rose-700">
                {flow.error}
              </p>
            ) : null}
          </MhdCard>
        </>
      )}

      {cancelTo && !showCompletion ? (
        <div>
          <Button variant="secondary" onClick={() => guard.requestLeave(cancelTo)}>
            Cancel
          </Button>
        </div>
      ) : null}

      {guard.pendingPath ? (
        <MhdModal title="Leave this page?" onClose={guard.stay}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Leave This Page?</h2>
            <p className="text-sm text-muted-foreground">
              You have progress on this page that has not been saved. If you leave now it will be
              lost.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={guard.stay}>
                Stay On This Page
              </Button>
              <Button onClick={guard.confirmLeave}>Leave Without Saving</Button>
            </div>
          </div>
        </MhdModal>
      ) : null}
    </div>
  );
}
