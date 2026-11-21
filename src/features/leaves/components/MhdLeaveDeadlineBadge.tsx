import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import type { MhdLeaveDeadline } from '../WorkflowTypes';
import { mhdLeaveDeadlineKindLabel } from './mhdLeaveLabels';

export interface MhdLeaveDeadlineBadgeProps {
  deadline: MhdLeaveDeadline;
}

/**
 * One legal clock on the case. The due date is computed by the database (deadline rules,
 * migration 0383); nothing here derives or edits it.
 */
export function MhdLeaveDeadlineBadge({ deadline }: MhdLeaveDeadlineBadgeProps) {
  const { state, variant } = deadlineState(deadline);
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
      title={deadline.legal_citation ?? undefined}
    >
      <span className="font-medium text-foreground">
        {mhdLeaveDeadlineKindLabel(deadline.deadline_kind)}
      </span>
      <span className="text-muted-foreground">Due {mhdFormatDate(deadline.due_at)}</span>
      <MhdBadge variant={variant}>{state}</MhdBadge>
    </div>
  );
}

function deadlineState(deadline: MhdLeaveDeadline): { state: string; variant: MhdBadgeVariant } {
  if (deadline.satisfied_at) return { state: 'Satisfied', variant: 'success' };
  if (deadline.waived_at)
    return {
      state: `Waived: ${deadline.waiver_reason ?? 'No reason recorded'}`,
      variant: 'neutral',
    };
  if (deadline.is_overdue) return { state: 'Overdue', variant: 'error' };
  return { state: 'Due', variant: 'warning' };
}
