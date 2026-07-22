import {
  mhdFormatClassification,
  mhdFormatProtectedLeaveCategory,
  type MhdAttendanceClassification,
  type MhdProtectedLeaveCategory,
} from '../Types';

// PROTECTED reads green rather than neutral, deliberately: it is the state that
// shields the employee, and it should be unmistakable at a glance in a list an
// administrator scans quickly.
const CLASSIFICATION_STYLES: Record<MhdAttendanceClassification, string> = {
  UNEXCUSED: 'bg-rose-100 text-rose-800',
  EXCUSED_UNPAID: 'bg-sky-100 text-sky-800',
  EXCUSED_PAID: 'bg-blue-100 text-blue-800',
  PROTECTED: 'bg-emerald-100 text-emerald-800',
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
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASSIFICATION_STYLES[classification]}`}
      >
        {mhdFormatClassification(classification)}
      </span>
      {showCategory && protectedLeaveCategory ? (
        <span className="text-xs text-neutral-600">
          {mhdFormatProtectedLeaveCategory(protectedLeaveCategory)}
        </span>
      ) : null}
    </span>
  );
}
