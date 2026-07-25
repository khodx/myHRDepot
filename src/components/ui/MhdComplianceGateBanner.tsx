import { ShieldAlert } from 'lucide-react';
import type { MhdComplianceReadiness } from '@/types/mhdCompliance';

/**
 * The pre-live compliance gate, shown on every surface that can generate or
 * deliver regulated content. It lives in shared UI rather than inside a feature
 * because both Leaves and Reasonable Accommodations render it, and neither
 * module owns the other's release gate.
 *
 * Renders nothing when readiness is unknown (`null`) — silence is not approval,
 * and the gate is enforced server-side by `mhd_compliance_assert_content_enabled`
 * regardless of what this banner says.
 */
export function MhdComplianceGateBanner({
  readiness,
}: {
  readiness: MhdComplianceReadiness | null | undefined;
}) {
  if (!readiness || readiness.release_ready) return null;
  return (
    <div
      role="status"
      className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950"
    >
      <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="text-sm font-semibold">Pre-live compliance gate is active</p>
        <p className="mt-1 text-sm">
          This workflow is available for development and validation only. {readiness.blocker_count}{' '}
          regulated content item{readiness.blocker_count === 1 ? '' : 's'} must be reviewed and
          explicitly enabled before production.
        </p>
      </div>
    </div>
  );
}
