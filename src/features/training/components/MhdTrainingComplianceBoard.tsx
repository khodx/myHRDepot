import { useMemo, useState } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdTrainingComplianceMatrix } from '../Hook';
import {
  MHD_TRAINING_CATEGORIES,
  mhdFormatTrainingCategory,
  type MhdTrainingComplianceMatrixFilters,
} from '../Types';
import { MhdCourseCategoryBadge } from './MhdCourseCategoryBadge';
import { MhdTrainingStatusBadge } from './MhdTrainingStatusBadge';

interface Props {
  companyId: string;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

/**
 * The admin compliance board — reads `compliance_matrix`, one row per
 * (person × course) with its DERIVED status. The status comes from the server
 * (`mhd_training_compliance_status`) and is rendered through the badge; this
 * board never recomputes CURRENT/EXPIRED/OVERDUE/ASSIGNED from dates.
 *
 * Admin-only: the RPC refuses a non-privileged caller, and this component is only
 * mounted on the admin `/training` route.
 */
export function MhdTrainingComplianceBoard({ companyId }: Props) {
  const [filters, setFilters] = useState<MhdTrainingComplianceMatrixFilters>({
    companyId,
    category: 'ALL',
  });

  const matrix = useMhdTrainingComplianceMatrix(filters);
  const rows = useMemo(() => matrix.data ?? [], [matrix.data]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Compliance board</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Who is current, expired, overdue or assigned across the company. Status is derived from
            the frozen completion records — never stored.
          </p>
        </div>
        <select
          value={filters.category ?? 'ALL'}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              category: event.target.value as MhdTrainingComplianceMatrixFilters['category'],
            }))
          }
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="ALL">All categories</option>
          {MHD_TRAINING_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {mhdFormatTrainingCategory(category)}
            </option>
          ))}
        </select>
      </div>

      {matrix.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing assigned in this view.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Person</MhdTh>
                <MhdTh>Course</MhdTh>
                <MhdTh>Category</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Expires</MhdTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <MhdTr key={`${row.personId}-${row.courseId}`}>
                  <MhdTd className="whitespace-nowrap">{row.personDisplayName}</MhdTd>
                  <MhdTd>{row.courseTitle}</MhdTd>
                  <MhdTd>
                    <MhdCourseCategoryBadge category={row.category} />
                  </MhdTd>
                  <MhdTd>
                    <MhdTrainingStatusBadge status={row.status} />
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {formatDate(row.expiresAt)}
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </section>
  );
}
