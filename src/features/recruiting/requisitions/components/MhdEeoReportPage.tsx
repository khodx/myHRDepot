import { useMemo } from 'react';
import { useMhdRecruitingEeoReport } from '../Hook';
import {
  mhdFormatEeoBucket,
  mhdFormatEeoDimension,
  type MhdRecruitingEeoReportRow,
} from '../Types';

interface Props {
  companyId: string;
  /** Optionally scope the aggregate to a single requisition. */
  requisitionId?: string | null;
  /**
   * Whether the viewer is a Platform Admin. The EEO report RPC is
   * Platform-Admin-gated server-side and raises for anyone else; this prop only
   * governs whether the page even attempts the call, so a non-admin sees the gate
   * message rather than a thrown error. This is the ONLY EEO read surface in the
   * whole app — the partition is otherwise write-only.
   */
  isPlatformAdmin: boolean;
}

/**
 * `/recruiting/eeo` — the Platform-Admin-only aggregate EEO report.
 *
 * This is the SOLE read path into the hard-restricted EEO partition. It renders
 * ONLY aggregate counts, grouped by dimension — never an individual applicant's
 * self-identification, and never anything tied back to a person. `eeo_report`
 * enforces the Platform-Admin gate and the aggregate-only shape server-side; this
 * page mirrors that posture and shows counts as simple proportion bars + a table.
 */
export function MhdEeoReportPage({ companyId, requisitionId = null, isPlatformAdmin }: Props) {
  const report = useMhdRecruitingEeoReport(
    isPlatformAdmin ? { companyId, requisitionId } : { companyId: null },
  );

  // Group the flat (dimension, bucket, count) rows into dimensions, preserving a
  // stable dimension order and computing each dimension's total for the bars.
  const grouped = useMemo(() => {
    const order = ['race_ethnicity', 'gender', 'veteran_status', 'disability_status'];
    const map = new Map<string, MhdRecruitingEeoReportRow[]>();
    for (const row of report.data ?? []) {
      const bucket = map.get(row.dimension) ?? [];
      bucket.push(row);
      map.set(row.dimension, bucket);
    }
    return order
      .filter((dimension) => map.has(dimension))
      .map((dimension) => {
        const rows = (map.get(dimension) ?? []).slice().sort((a, b) => b.applicantCount - a.applicantCount);
        const total = rows.reduce((sum, row) => sum + row.applicantCount, 0);
        return { dimension, rows, total };
      });
  }, [report.data]);

  if (!isPlatformAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-neutral-900">EEO report</h1>
        <p className="mt-2 text-sm text-neutral-600">
          EEO self-identification data is aggregate-only and restricted to Platform Admin. You do
          not have access to this report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900">EEO report</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Voluntary self-identification, shown as aggregate counts only. No individual responses are
          ever displayed, and nothing here is tied to a person or a hiring decision.
        </p>
      </header>

      {report.isLoading ? (
        <p className="text-sm text-neutral-500">Loading report…</p>
      ) : report.isError ? (
        <p className="text-sm text-rose-600">
          {report.error instanceof Error ? report.error.message : 'Unable to load the EEO report.'}
        </p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No self-identification has been submitted for this scope yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {grouped.map(({ dimension, rows, total }) => (
            <section key={dimension} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-semibold text-neutral-900">
                  {mhdFormatEeoDimension(dimension)}
                </h2>
                <span className="text-xs text-neutral-500">{total} total</span>
              </div>

              <ul className="mt-3 space-y-2">
                {rows.map((row) => {
                  const pct = total > 0 ? Math.round((row.applicantCount / total) * 100) : 0;
                  return (
                    <li key={`${dimension}-${row.bucket}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-700">{mhdFormatEeoBucket(row.bucket)}</span>
                        <span className="text-neutral-500">
                          {row.applicantCount} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
