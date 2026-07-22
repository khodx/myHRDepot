import { useMemo, useState } from 'react';
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
          <h2 className="text-base font-semibold text-neutral-900">Compliance board</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
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
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
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
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing assigned in this view.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Person</th>
                <th className="py-2 pr-4 font-medium">Course</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.personId}-${row.courseId}`}
                  className="border-b border-neutral-100 text-neutral-800"
                >
                  <td className="py-2 pr-4 whitespace-nowrap">{row.personDisplayName}</td>
                  <td className="py-2 pr-4">{row.courseTitle}</td>
                  <td className="py-2 pr-4">
                    <MhdCourseCategoryBadge category={row.category} />
                  </td>
                  <td className="py-2 pr-4">
                    <MhdTrainingStatusBadge status={row.status} />
                  </td>
                  <td className="py-2 whitespace-nowrap text-neutral-600">
                    {formatDate(row.expiresAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
