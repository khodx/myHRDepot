import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdApprovalService } from '../Service';
import { MhdApprovalChain } from './MhdApprovalChain';
import { MhdApprovalStatus } from './MhdApprovalStatus';
import type { MhdApproval, MhdApprovalComment } from '@/types/approval';

export function MhdApprovalDetailPage() {
  const { approvalId } = useParams<{ approvalId: string }>();
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const [approval, setApproval] = useState<MhdApproval | null>(null);
  const [comments, setComments] = useState<MhdApprovalComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approveComment, setApproveComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!approvalId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [nextApproval, nextComments] = await Promise.all([
          mhdApprovalService.getApprovalById(approvalId),
          mhdApprovalService.listApprovalComments(approvalId),
        ]);
        if (!cancelled) {
          setApproval(nextApproval);
          setComments(nextComments);
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
  }, [approvalId]);

  async function reload() {
    if (!approvalId) return;
    const [nextApproval, nextComments] = await Promise.all([
      mhdApprovalService.getApprovalById(approvalId),
      mhdApprovalService.listApprovalComments(approvalId),
    ]);
    setApproval(nextApproval);
    setComments(nextComments);
  }

  async function handleApprove() {
    if (!approvalId) return;
    setIsActing(true);
    setError(null);
    try {
      await mhdApprovalService.approveApproval(approvalId, approveComment || undefined);
      setApproveComment('');
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsActing(false);
    }
  }

  async function handleReject() {
    if (!approvalId) return;
    if (!rejectReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    setIsActing(true);
    setError(null);
    try {
      await mhdApprovalService.rejectApproval(approvalId, rejectReason);
      setRejectReason('');
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsActing(false);
    }
  }

  async function handleAddComment() {
    if (!approvalId || !newComment.trim()) {
      setError('Comment text is required.');
      return;
    }
    setIsActing(true);
    setError(null);
    try {
      await mhdApprovalService.addApprovalComment({
        approvalId,
        comment: newComment,
        isInternal: isInternalComment,
      });
      setNewComment('');
      setIsInternalComment(false);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsActing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading approval...
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{error ?? 'Approval not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/approvals')}
          className="text-sm text-accent hover:text-accent-hover"
        >
          Back to Approvals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/approvals"
        backLabel="Approvals"
        title="Approval Detail"
        chips={<MhdApprovalStatus status={approval.status} />}
        description={
          <>
            {approval.referenceId} · {approval.entityType} · {approval.entityId}
            {approval.taskId ? (
              <>
                {' '}
                ·{' '}
                <Link
                  to={`/tasks/${approval.taskId}`}
                  className="text-accent hover:text-accent-hover"
                >
                  Open Task
                </Link>
              </>
            ) : null}
          </>
        }
      />

      <MhdCard className="p-6">
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <p>Requester: {approval.requesterName || approval.requesterId}</p>
          <p>
            Current level: {approval.currentLevel} of {approval.totalLevels}
          </p>
          <p>Created: {format(new Date(approval.createdAt), 'PPp')}</p>
          <p>Updated: {approval.updatedAt ? format(new Date(approval.updatedAt), 'PPp') : '—'}</p>
          <p>Type: {approval.approvalType}</p>
          <p>Viewer: {profile?.displayName || profile?.email || 'Unknown user'}</p>
        </div>

        {approval.reason ? (
          <p className="mt-4 rounded-md bg-muted p-3 text-sm text-foreground">{approval.reason}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </MhdCard>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <MhdCard className="p-6">
            <MhdCardHeader title="Chain" />
            <MhdApprovalChain approvalId={approval.id} />
          </MhdCard>

          <MhdCard className="p-6">
            <MhdCardHeader title="Comments" />
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : null}
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {comment.authorName || comment.userId}
                    </span>
                    <span>{format(new Date(comment.createdAt), 'PPp')}</span>
                    {comment.isInternal ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                        Internal
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-foreground">{comment.comment}</p>
                </div>
              ))}
            </div>
          </MhdCard>
        </div>

        <div className="space-y-6">
          <MhdCard className="p-6">
            <MhdCardHeader title="Decision" />
            <div className="space-y-3">
              <textarea
                value={approveComment}
                onChange={(event) => setApproveComment(event.target.value)}
                placeholder="Approval comment (optional)"
                className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={isActing || approval.status !== 'PENDING'}
                className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Approve
              </button>

              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Rejection reason"
                className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={isActing || approval.status !== 'PENDING'}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </MhdCard>

          <MhdCard className="p-6">
            <MhdCardHeader title="Add Comment" />
            <div className="space-y-3">
              <textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="Comment"
                className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isInternalComment}
                  onChange={(event) => setIsInternalComment(event.target.checked)}
                />
                Internal comment
              </label>
              <button
                type="button"
                onClick={() => void handleAddComment()}
                disabled={isActing}
                className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover disabled:opacity-50"
              >
                Add Comment
              </button>
            </div>
          </MhdCard>
        </div>
      </section>
    </div>
  );
}
