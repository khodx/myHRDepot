import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { mhdApprovalService } from '../Service';
import { MhdApprovalStatus } from './MhdApprovalStatus';
import type { MhdApproval, MhdApprovalComment, MhdApprovalEntityType } from '@/types/approval';

export interface MhdApprovalHistoryProps {
  entityType: MhdApprovalEntityType;
  entityId: string;
}

interface MhdApprovalHistoryEntry {
  approval: MhdApproval;
  comments: MhdApprovalComment[];
}

export function MhdApprovalHistory({ entityType, entityId }: MhdApprovalHistoryProps) {
  const [entries, setEntries] = useState<MhdApprovalHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const approvals = await mhdApprovalService.listApprovalsForEntity(entityType, entityId);
        const withComments = await Promise.all(
          approvals.map(async (approval) => ({
            approval,
            comments: await mhdApprovalService.listApprovalComments(approval.id),
          })),
        );
        if (!cancelled) {
          setEntries(withComments);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (isLoading) return <div className="text-sm text-gray-500">Loading approval history...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Approval History</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No approvals have been requested for this item.</p>
      ) : (
        entries.map(({ approval, comments }) => (
          <div key={approval.id} className="space-y-2 rounded border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Link to={`/approvals/${approval.id}`} className="font-medium text-blue-700 hover:underline">
                  {approval.referenceId}
                </Link>
              </div>
              <MhdApprovalStatus status={approval.status} />
            </div>
            <p className="text-xs text-gray-500">
              Requested by {approval.requesterName || approval.requesterId} on {format(new Date(approval.createdAt), 'PPp')}
              {approval.resolvedAt ? ` · Resolved ${format(new Date(approval.resolvedAt), 'PPp')}` : ''}
            </p>
            {approval.reason ? <p className="text-sm text-gray-700">{approval.reason}</p> : null}
            {comments.length > 0 ? (
              <ul className="space-y-1 border-t pt-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="text-xs text-gray-600">
                    <span className="font-medium">{comment.authorName || comment.userId}</span> ({format(new Date(comment.createdAt), 'Pp')}):{' '}
                    {comment.comment}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
