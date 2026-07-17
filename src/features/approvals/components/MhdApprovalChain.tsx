import { useQuery } from '@tanstack/react-query';
import { mhdApprovalService } from '../Service';
import type { MhdApprovalAssignment } from '@/types/approval';

export interface MhdApprovalChainProps {
  approvalId: string;
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

  if (isLoading) return <div className="text-sm text-gray-500">Loading approval chain...</div>;
  if (error) return <div className="text-sm text-red-600">{error.message}</div>;
  if (chain.length === 0) return <p className="text-sm text-gray-500">No approvers assigned.</p>;

  return (
    <div className="space-y-2">
      {chain.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded bg-gray-50 p-2">
          <div>
            <p className="font-semibold">{item.approverName || item.userId}</p>
            <p className="text-xs text-gray-500">Level {item.level}</p>
            {item.status === 'REJECTED' && item.rejectionReason ? (
              <p className="mt-1 text-xs text-red-600">Reason: {item.rejectionReason}</p>
            ) : null}
          </div>
          <span
            className={
              item.status === 'APPROVED'
                ? 'text-sm font-medium text-green-600'
                : item.status === 'REJECTED'
                  ? 'text-sm font-medium text-red-600'
                  : 'text-sm font-medium text-yellow-600'
            }
          >
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
}
