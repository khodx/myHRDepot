import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import {
  mhdFormatClassification,
  mhdFormatProtectedLeaveCategory,
  type MhdAttendanceClassification,
  type MhdProtectedLeaveCategory,
} from '../Types';

// PROTECTED reads green (success) rather than neutral, deliberately: it is the
// state that shields the employee, and it should be unmistakable at a glance in
// a list an administrator scans quickly. UNEXCUSED is the disciplinary state
// (error); the excused states read neutral/informational.
const CLASSIFICATION_VARIANTS: Record<MhdAttendanceClassification, MhdBadgeVariant> = {
  UNEXCUSED: 'error',
  EXCUSED_UNPAID: 'neutral',
  EXCUSED_PAID: 'info',
  PROTECTED: 'success',
};

interface Props {
  classification: MhdAttendanceClassification;
  protectedLeaveCategory?: MhdProtectedLeaveCategory | null;
  /**
   * Show the specific protected category alongside the badge. Off by default.
   *
   * VICTIM_OF_VIOLENCE is a safe-time category, and surfacing "why" in a
   * general-purpose list is a confidentiality hazard even inside the privileged
   * role set. Turn this on only where the category is the point of the view —
   * the occurrence detail, the reassessment queue — never in a roster.
   */
  showCategory?: boolean;
}

export function MhdClassificationBadge({
  classification,
  protectedLeaveCategory,
  showCategory = false,
}: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <MhdBadge variant={CLASSIFICATION_VARIANTS[classification]}>
        {mhdFormatClassification(classification)}
      </MhdBadge>
      {showCategory && protectedLeaveCategory ? (
        <span className="text-xs text-muted-foreground">
          {mhdFormatProtectedLeaveCategory(protectedLeaveCategory)}
        </span>
      ) : null}
    </span>
  );
}
