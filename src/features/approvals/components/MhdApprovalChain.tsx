import { useQuery } from '@tanstack/react-query';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdApprovalService } from '../Service';
import type { MhdApprovalAssignment } from '@/types/approval';

export interface MhdApprovalChainProps {
  approvalId: string;
}

function assignmentBadgeVariant(status: MhdApprovalAssignment['status']): MhdBadgeVariant {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'error';
  return 'warning';
}

export function MhdApprovalChain({ approvalId }: MhdApprovalChainProps) {
  const {
    data: chain = [],
    isLoading,
    error,
  } = useQuery<MhdApprovalAssignment[]>({
    queryKey: ['mhd-approval-chain', approvalId],
    queryFn: () => mhdApprovalService.getApprovalChain(approvalId),
  });

  if (isLoading)
    return <div className="text-sm text-muted-foreground">Loading approval chain...</div>;
  if (error) return <div className="text-sm text-red-600">{error.message}</div>;
  if (chain.length === 0)
    return <p className="text-sm text-muted-foreground">No approvers assigned.</p>;

  return (
    <div className="space-y-2">
      {chain.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded bg-muted p-2">
          <div>
            <p className="font-semibold text-foreground">{item.approverName || item.userId}</p>
            <p className="text-xs text-muted-foreground">Level {item.level}</p>
            {item.status === 'REJECTED' && item.rejectionReason ? (
              <p className="mt-1 text-xs text-red-600">Reason: {item.rejectionReason}</p>
            ) : null}
          </div>
          <MhdBadge variant={assignmentBadgeVariant(item.status)}>{item.status}</MhdBadge>
        </div>
      ))}
    </div>
  );
}
