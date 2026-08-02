import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { cn } from '@/utils/cn';
import { mhdApprovalService } from '../Service';
import { MhdApprovalStatus } from './MhdApprovalStatus';
import type { MhdApproval } from '@/types/approval';

export interface MhdApprovalCenterProps {
  userId: string;
}

/**
 * The pending-approvals table for the signed-in user, on the `/approvals`
 * list page. Uses the platform table convention (MhdTable/MhdTh/MhdTr/MhdTd)
 * and pill-styled action buttons (buttonBaseClasses + buttonVariantClasses,
 * h-9/px-3/text-[16.8px]) matching the Task Dashboard's action row, rather
 * than the earlier ad-hoc bordered-div cards.
 */
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

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading approvals...</div>;

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
      {approvals.length === 0 ? (
        <MhdEmptyState title="No pending approvals" description="You're all caught up." />
      ) : (
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>Reference</MhdTh>
              <MhdTh>Entity</MhdTh>
              <MhdTh>Level</MhdTh>
              <MhdTh>Status</MhdTh>
              <MhdTh>Requested By</MhdTh>
              <MhdTh>Reject Reason</MhdTh>
              <MhdTh />
            </tr>
          </thead>
          <tbody>
            {approvals.map((approval) => (
              <MhdTr key={approval.id} to={`/approvals/${approval.id}`}>
                <MhdTd className="font-semibold text-foreground">{approval.referenceId}</MhdTd>
                <MhdTd>
                  <p className="text-foreground">{approval.entityType}</p>
                  <p className="text-xs text-muted-foreground">{approval.entityId}</p>
                  {approval.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">{approval.reason}</p>
                  ) : null}
                </MhdTd>
                <MhdTd className="whitespace-nowrap text-muted-foreground">
                  {approval.currentLevel} of {approval.totalLevels}
                </MhdTd>
                <MhdTd>
                  <MhdApprovalStatus status={approval.status} />
                </MhdTd>
                <MhdTd className="whitespace-nowrap text-muted-foreground">
                  {approval.requesterName || approval.requesterId}
                </MhdTd>
                <MhdTd data-row-click-ignore>
                  <input
                    type="text"
                    value={rejectReasonById[approval.id] ?? ''}
                    onChange={(event) =>
                      setRejectReasonById((current) => ({
                        ...current,
                        [approval.id]: event.target.value,
                      }))
                    }
                    placeholder="Rejection reason"
                    className="h-9 w-full min-w-40 rounded-md border border-border bg-card px-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </MhdTd>
                <MhdTd className="whitespace-nowrap" data-row-click-ignore>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApprove(approval.id)}
                      disabled={actioningId === approval.id}
                      className={cn(
                        buttonBaseClasses,
                        'h-9 gap-1.5 bg-green-600 px-3 text-[16.8px] text-white focus-visible:ring-green-600',
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(approval.id)}
                      disabled={actioningId === approval.id}
                      className={cn(
                        buttonBaseClasses,
                        buttonVariantClasses.destructive,
                        'h-9 gap-1.5 px-3 text-[16.8px]',
                      )}
                    >
                      <XCircle className="h-4 w-4" aria-hidden />
                      Reject
                    </button>
                  </div>
                </MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
      )}
    </div>
  );
}
