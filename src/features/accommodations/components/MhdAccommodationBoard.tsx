import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MHD_ACCOMMODATION_STATUSES, mhdFormatAccommodationValue } from '../Types';
import type { MhdAccommodationSummary } from '../Types';
import { MhdAccommodationStatusBadge } from './MhdAccommodationStatusBadge';

interface MhdAccommodationBoardProps {
  cases: MhdAccommodationSummary[];
  isLoading: boolean;
}

/**
 * Condensed kanban board for Reasonable Accommodations. All nine
 * `MHD_ACCOMMODATION_STATUSES` render as their own column, scrolling
 * horizontally — the same pattern already proven by the Recruiting, Tasks,
 * and Leaves boards — rather than inventing a new grouped-phase taxonomy that
 * doesn't exist in the domain model. Consumes the same `cases` data the list
 * view already received from `useMhdAccommodationCases(...)` in
 * `MhdAccommodationsPage`, so role/visibility scoping (privileged vs.
 * self-only) is identical — this board never issues a separate query.
 */
export function MhdAccommodationBoard({ cases, isLoading }: MhdAccommodationBoardProps) {
  const navigate = useNavigate();

  const byStatus = useMemo(() => {
    const groups = new Map<string, MhdAccommodationSummary[]>();
    for (const item of cases) {
      const bucket = groups.get(item.status) ?? [];
      bucket.push(item);
      groups.set(item.status, bucket);
    }
    return groups;
  }, [cases]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading accommodation cases…</p>;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {MHD_ACCOMMODATION_STATUSES.map((status) => {
        const cards = byStatus.get(status) ?? [];
        return (
          <div key={status} className="w-60 flex-shrink-0 space-y-2 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {mhdFormatAccommodationValue(status)}
              </h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {cards.length}
              </span>
            </div>
            {cards.length === 0 ? (
              <p className="text-xs text-muted-foreground">Empty</p>
            ) : (
              cards.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/accommodations/${item.id}`)}
                  className="w-full space-y-1.5 rounded-md border border-border bg-card p-2 text-left shadow-sm hover:border-accent"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="truncate text-xs font-medium text-foreground">
                      {item.personDisplayName}
                    </span>
                    <MhdAccommodationStatusBadge status={item.status} />
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {mhdFormatAccommodationValue(item.requestSource)}
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
