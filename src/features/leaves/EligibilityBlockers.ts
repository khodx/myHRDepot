/**
 * Readable wording for the blocker codes returned by the eligibility run (`mhd_leave_eligibility_run`). Each code names a
 * missing input; the run does not evaluate until HR supplies it. One shared map so every screen words a blocker the same way.
 */
const BLOCKER_MESSAGES: Record<string, string> = {
  SCHEDULE_ASSIGNMENT_REQUIRED:
    'This person has no work schedule assigned. Assign a schedule, then run the evaluation again.',
  REASON_CODE_REQUIRED:
    'The leave reason is missing. Set the reason on the case, then run the evaluation again.',
};

export function mhdEligibilityBlockerMessage(code: string): string {
  return (
    BLOCKER_MESSAGES[code] ??
    'The eligibility evaluation could not be completed. Review the case details and run it again.'
  );
}
