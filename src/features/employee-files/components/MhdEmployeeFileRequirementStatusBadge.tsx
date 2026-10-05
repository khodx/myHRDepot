import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { cn } from '@/utils/cn';
import type { MhdEmployeeFileRequirementStatus } from '../Types';

const STATUS_PRESENTATION: Record<
  MhdEmployeeFileRequirementStatus,
  { variant: MhdBadgeVariant; label: string }
> = {
  SATISFIED: { variant: 'success', label: 'Satisfied' },
  MISSING: { variant: 'warning', label: 'Missing' },
  OVERDUE: { variant: 'error', label: 'Overdue' },
};

/** Overdue is the actionable state, so it is visually stronger than Missing. */
export function MhdEmployeeFileRequirementStatusBadge({
  status,
}: {
  status: MhdEmployeeFileRequirementStatus;
}) {
  const presentation = STATUS_PRESENTATION[status];
  return (
    <MhdBadge
      variant={presentation.variant}
      className={cn(status === 'OVERDUE' && 'font-bold ring-2 ring-red-300')}
    >
      {presentation.label}
    </MhdBadge>
  );
}
