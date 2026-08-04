import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { useMhdComplianceReleaseBlockers } from '../Hook';

/**
 * Surfaces the pre-live counsel/compliance gate (mhd_compliance_release_blockers,
 * migration 0052) — the one real "feature flag"-shaped thing this app has
 * today. There is no generic feature-flag table to render here; inventing one
 * would just be decoration, so this section stays honest about what actually
 * gates production behavior.
 */
export function MhdAdminSystemSection() {
  const blockersQuery = useMhdComplianceReleaseBlockers();
  const blockers = blockersQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">
          Pre-Live Compliance Content Gate
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Leaves (FMLA/CFRA/PDL) and Reasonable Accommodations content is intentionally held back
          from production until counsel/compliance review approves it (see
          compliance_content_registry). This list is the release blocker — empty means the gate is
          fully clear.
        </p>

        {blockersQuery.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : blockersQuery.isError ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {blockersQuery.error instanceof Error
              ? blockersQuery.error.message
              : 'Unable to load compliance status.'}
          </p>
        ) : blockers.length === 0 ? (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            No blockers — every registered compliance content item is approved and production
            enabled.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Module</th>
                  <th className="py-2 pr-4">Content</th>
                  <th className="py-2 pr-4">Version</th>
                  <th className="py-2 pr-4">Review Status</th>
                  <th className="py-2 pr-4">Production Enabled</th>
                  <th className="py-2">Blocker</th>
                </tr>
              </thead>
              <tbody>
                {blockers.map((row) => (
                  <tr key={`${row.moduleKey}-${row.contentKey}-${row.version}`} className="border-b border-border/60">
                    <td className="py-2 pr-4">{row.moduleKey}</td>
                    <td className="py-2 pr-4">{row.contentKey}</td>
                    <td className="py-2 pr-4">v{row.version}</td>
                    <td className="py-2 pr-4">{row.reviewStatus}</td>
                    <td className="py-2 pr-4">{row.productionEnabled ? 'Yes' : 'No'}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1.5 text-amber-700">
                        <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {row.blocker}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
