import { CheckCircle2, XCircle, Clock, Ban, AlertTriangle } from 'lucide-react';
import type { MhdApprovalStatus as MhdApprovalStatusValue } from '@/types/approval';

export interface MhdApprovalStatusProps {
  status: MhdApprovalStatusValue;
}

const STATUS_CONFIG: Record<MhdApprovalStatusValue, { icon: typeof Clock; label: string; color: string }> = {
  PENDING: { icon: Clock, label: 'Pending', color: 'text-yellow-600' },
  APPROVED: { icon: CheckCircle2, label: 'Approved', color: 'text-green-600' },
  REJECTED: { icon: XCircle, label: 'Rejected', color: 'text-red-600' },
  CANCELLED: { icon: Ban, label: 'Cancelled', color: 'text-gray-500' },
  EXPIRED: { icon: AlertTriangle, label: 'Expired', color: 'text-orange-600' },
};

export function MhdApprovalStatus({ status }: MhdApprovalStatusProps) {
  const { icon: Icon, label, color } = STATUS_CONFIG[status];

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}
