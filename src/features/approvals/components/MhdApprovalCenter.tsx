import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { mhdApprovalService } from '../Service';
import { MhdApprovalStatus } from './MhdApprovalStatus';
import type { MhdApproval } from '@/types/approval';

export interface MhdApprovalCenterProps {
  userId: string;
}

export function MhdApprovalCenter({ userId }: MhdApprovalCenterProps) {
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: approvals = [],
    isLoading,
    error,
    refetch,
  } = useQuery<MhdApproval[]>({
    queryKey: ['mhd-pending-approvals', userId],
    queryFn: () => mhdApprovalService.listPendingApprovalsForUser(userId),
  });

  async function handleApprove(approvalId: string) {
    setActioningId(approvalId);
    setActionError(null);
    try {
      await mhdApprovalService.approveApproval(approvalId);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(approvalId: string) {
    const reason = (rejectReasonById[approvalId] ?? '').trim();
    if (!reason) {
      setActionError('A rejection reason is required.');
      return;
    }
    setActioningId(approvalId);
    setActionError(null);
    try {
      await mhdApprovalService.rejectApproval(approvalId, reason);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setActioningId(null);
    }
  }

  if (isLoading) return <div>Loading approvals...</div>;

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
      {approvals.length === 0 ? (
        <p className="text-sm text-gray-500">No pending approvals</p>
      ) : (
        approvals.map((approval) => (
          <div key={approval.id} className="space-y-2 rounded border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Link to={`/approvals/${approval.id}`} className="font-semibold text-blue-700 hover:underline">
                  {approval.referenceId}
                </Link>
                <p className="text-xs text-gray-500">
                  {approval.entityType} · {approval.entityId} · Level {approval.currentLevel} of {approval.totalLevels}
                </p>
              </div>
              <MhdApprovalStatus status={approval.status} />
            </div>
            {approval.reason ? <p className="text-sm text-gray-600">{approval.reason}</p> : null}
            <p className="text-xs text-gray-500">Requested by {approval.requesterName || approval.requesterId}</p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleApprove(approval.id)}
                disabled={actioningId === approval.id}
                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                Approve
              </button>
              <input
                type="text"
                value={rejectReasonById[approval.id] ?? ''}
                onChange={(event) => setRejectReasonById((current) => ({ ...current, [approval.id]: event.target.value }))}
                placeholder="Rejection reason"
                className="flex-1 rounded border px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => void handleReject(approval.id)}
                disabled={actioningId === approval.id}
                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
