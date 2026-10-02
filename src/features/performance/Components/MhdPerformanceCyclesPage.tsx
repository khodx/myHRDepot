import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdClosePerformanceCycle,
  useMhdPerformanceCycleProgress,
  useMhdPerformanceCycles,
} from '../Hook-cycles';
import { mhdFormatPerformanceReviewType } from '../Types';
import type { MhdPerformanceCycle } from '../Types-cycles';

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface ProgressPanelProps {
  cycle: MhdPerformanceCycle;
}

function MhdCycleProgressPanel({ cycle }: ProgressPanelProps) {
  const progress = useMhdPerformanceCycleProgress(cycle.id);
  const close = useMhdClosePerformanceCycle();
  const [confirming, setConfirming] = useState(false);

  if (progress.isLoading) {
    return <MhdCard className="p-4 text-sm text-muted-foreground">Loading progress…</MhdCard>;
  }
  if (progress.isError || !progress.data) {
    return (
      <MhdCard className="p-4 text-sm" role="alert">
        {progress.error instanceof Error ? progress.error.message : 'Unable to load progress.'}
      </MhdCard>
    );
  }
  const data = progress.data;

  return (
    <MhdCard className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">{cycle.cycleName} — Progress</h2>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        {Object.entries(data.reviewsByStatus).map(([status, count]) => (
          <div key={status}>
            <dt className="text-muted-foreground">{statusLabel(status)} reviews</dt>
            <dd className="font-medium">{count}</dd>
          </div>
        ))}
        <div>
          <dt className="text-muted-foreground">Self-assessments overdue</dt>
          <dd className="font-medium">{data.selfAssessmentsOverdue}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Feedback overdue</dt>
          <dd className="font-medium">{data.feedbackOverdue}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Reviews overdue</dt>
          <dd className="font-medium">{data.reviewsOverdue}</dd>
        </div>
      </dl>
      {data.participants.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-4 font-medium">Invitation</th>
              <th className="py-1 pr-4 font-medium">Status</th>
              <th className="py-1 font-medium">People</th>
            </tr>
          </thead>
          <tbody>
            {data.participants.map((row) => (
              <tr key={`${row.participantType}:${row.status}`}>
                <td className="py-1 pr-4">{statusLabel(row.participantType)}</td>
                <td className="py-1 pr-4">{statusLabel(row.status)}</td>
                <td className="py-1">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {cycle.status === 'ACTIVE' ? (
        <div className="space-y-2">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Close this cycle? This cannot be undone.</span>
              <Button
                disabled={close.isPending}
                onClick={() =>
                  void close
                    .mutateAsync(cycle.id)
                    .then(() => setConfirming(false))
                    .catch(() => undefined)
                }
              >
                Confirm Close
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Keep Open
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Close Cycle
            </Button>
          )}
          {close.isError ? (
            <p role="alert" className="text-sm text-rose-700">
              {close.error instanceof Error ? close.error.message : 'Unable to close the cycle.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </MhdCard>
  );
}

/**
 * `/performance/cycles` — the review cycles of the company: how far along each is, and the way
 * to close a finished one. A cycle is launched from the guided wizard.
 */
export function MhdPerformanceCyclesPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const cycles = useMhdPerformanceCycles(companyId || null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = cycles.data ?? [];
  const selected = rows.find((cycle) => cycle.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Review Cycles"
        description="Each cycle groups the reviews for one period: their deadlines, template and progress."
        actions={
          <Link
            to="/performance/cycles/new"
            className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            New Cycle
          </Link>
        }
      />

      {cycles.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading review cycles…</MhdCard>
      ) : cycles.isError ? (
        <MhdCard className="p-6 text-sm" role="alert">
          {cycles.error instanceof Error ? cycles.error.message : 'Unable to load review cycles.'}
        </MhdCard>
      ) : rows.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState icon={ClipboardList} title="No review cycles yet." />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Cycle</MhdTh>
                <MhdTh>Type</MhdTh>
                <MhdTh>Period</MhdTh>
                <MhdTh>Reviews due</MhdTh>
                <MhdTh>Completed</MhdTh>
                <MhdTh>Overdue</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>
                  <span className="sr-only">Actions</span>
                </MhdTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((cycle) => (
                <MhdTr key={cycle.id}>
                  <MhdTd className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {cycle.referenceId}
                  </MhdTd>
                  <MhdTd className="font-medium">{cycle.cycleName}</MhdTd>
                  <MhdTd>{mhdFormatPerformanceReviewType(cycle.reviewType)}</MhdTd>
                  <MhdTd className="whitespace-nowrap">
                    {formatDate(cycle.reviewPeriodStart)} – {formatDate(cycle.reviewPeriodEnd)}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap">{formatDate(cycle.reviewDue)}</MhdTd>
                  <MhdTd>
                    {cycle.completedCount} of {cycle.reviewCount}
                  </MhdTd>
                  <MhdTd>{cycle.overdueCount}</MhdTd>
                  <MhdTd>
                    <MhdBadge variant={cycle.status === 'ACTIVE' ? 'accent' : 'info'}>
                      {statusLabel(cycle.status)}
                    </MhdBadge>
                  </MhdTd>
                  <MhdTd>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedId(selectedId === cycle.id ? null : cycle.id)}
                    >
                      {selectedId === cycle.id ? 'Hide Progress' : 'View Progress'}
                    </Button>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}

      {selected ? <MhdCycleProgressPanel cycle={selected} /> : null}
    </div>
  );
}

export default MhdPerformanceCyclesPage;
