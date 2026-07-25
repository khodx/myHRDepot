import type { MhdBadgeVariant } from '@/components/ui/MhdBadge';
import type { MhdAutomationSensitivity, MhdAutomationStepStatus } from './Types';

/**
 * Badge mapping for automation statuses and sensitivity tiers.
 *
 * Kept out of the page components so a component file exports only components
 * (react-refresh/only-export-components), and so the run list, rule detail and
 * run detail surfaces all read a status the same way.
 */

/**
 * Takes the STEP status because it is the wider of the two: a step can also be
 * SCHEDULED (a delayed action parked in automation_scheduled_actions), which a
 * run never is. Run statuses are a subset and pass through unchanged.
 */
export function mhdAutomationRunVariant(status: MhdAutomationStepStatus): MhdBadgeVariant {
  switch (status) {
    case 'SUCCEEDED':
      return 'success';
    case 'FAILED':
      return 'error';
    // BLOCKED is a guard refusing to run, not a crash. It is warning rather than
    // error so an operator can tell "the engine stopped this on purpose" from
    // "the action threw" at a glance.
    case 'BLOCKED':
      return 'warning';
    case 'RUNNING':
    case 'PENDING':
    case 'SCHEDULED':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Ascending severity, matching mhd_automation_sensitivity_rank in 0081. */
export function mhdAutomationSensitivityVariant(level: MhdAutomationSensitivity): MhdBadgeVariant {
  switch (level) {
    case 'MEDICAL':
      return 'error';
    case 'RESTRICTED':
      return 'warning';
    case 'IMPLEMENTATION':
      return 'info';
    default:
      return 'neutral';
  }
}
