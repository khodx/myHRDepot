import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import type { MhdApprovalStatus as MhdApprovalStatusValue } from '@/types/approval';

export interface MhdApprovalStatusProps {
  status: MhdApprovalStatusValue;
}

const STATUS_CONFIG: Record<MhdApprovalStatusValue, { label: string; variant: MhdBadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'error' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },
  EXPIRED: { label: 'Expired', variant: 'error' },
};

/** Thin wrapper over MhdBadge preserving the original enum-driven API. */
export function MhdApprovalStatus({ status }: MhdApprovalStatusProps) {
  const { label, variant } = STATUS_CONFIG[status];
  return <MhdBadge variant={variant}>{label}</MhdBadge>;
}
