import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MHD_LEAVE_CASE_STATUSES, mhdFormatLeaveCaseStatus } from '../Types';
import type { MhdLeaveCaseSummary } from '../Types';
import { MhdLeaveStatusBadge } from './MhdLeaveStatusBadge';

interface MhdLeaveBoardProps {
  cases: MhdLeaveCaseSummary[];
  isLoading: boolean;
  /** Client User boards omit the employee name column in the list view too — same rule here. */
  isPrivileged: boolean;
}

/**
 * Condensed kanban board for Leaves. Columns are the fixed
 * `MHD_LEAVE_CASE_STATUSES` enum (REQUESTED, APPROVED, ACTIVE, COMPLETED,
 * DENIED, CANCELLED). Consumes the same `cases` data the list view already
 * received from `useMhdLeaveCases(filters)` in `MhdLeavesPage` — the
 * privileged-vs-self `personId` scoping happens once, in that hook's filters,
 * so this board never issues a separate, less-restrictive query.
 */
export function MhdLeaveBoard({ cases, isLoading, isPrivileged }: MhdLeaveBoardProps) {
  const navigate = useNavigate();

  const byStatus = useMemo(() => {
    const groups = new Map<string, MhdLeaveCaseSummary[]>();
    for (const leaveCase of cases) {
      const bucket = groups.get(leaveCase.status) ?? [];
      bucket.push(leaveCase);
      groups.set(leaveCase.status, bucket);
    }
    return groups;
  }, [cases]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {MHD_LEAVE_CASE_STATUSES.map((status) => {
        const cards = byStatus.get(status) ?? [];
        return (
          <div key={status} className="w-64 flex-shrink-0 space-y-2 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {mhdFormatLeaveCaseStatus(status)}
              </h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {cards.length}
              </span>
            </div>
            {cards.length === 0 ? (
              <p className="text-xs text-muted-foreground">Empty</p>
            ) : (
              cards.map((leaveCase) => (
                <button
                  key={leaveCase.id}
                  type="button"
                  onClick={() => navigate(`/leaves/${leaveCase.id}`)}
                  className="w-full space-y-1.5 rounded-md border border-border bg-card p-2 text-left shadow-sm hover:border-accent"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="truncate text-xs font-medium text-foreground">
                      {isPrivileged ? leaveCase.personDisplayName : leaveCase.referenceId}
                    </span>
                    <MhdLeaveStatusBadge status={leaveCase.status} />
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {leaveCase.reasonCategory}
                  </p>
                </button>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
