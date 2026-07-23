import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdCanReadEeoReport } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdEeoReportPage } from '../requisitions/components/MhdEeoReportPage';

/**
 * `/recruiting/eeo` — the Platform-Admin-only aggregate EEO report.
 *
 * This is the SOLE read path into the hard-restricted EEO partition (RLS
 * using(false) row-wise). The route is Platform-Admin-only (mhdRouteAccess), and
 * `mhd_recruiting_eeo_report` re-enforces that gate server-side and returns
 * aggregate COUNTS only. `isPlatformAdmin` decides whether the page even attempts
 * the call, so a non-admin who somehow reaches it sees the gate message, never a
 * thrown error — and never an individual applicant's self-identification.
 */
export function MhdEeoReportRoutePage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const isPlatformAdmin = mhdCanReadEeoReport(roles);

  if (!companyId) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          title="EEO report"
          description="No company is associated with your account."
        />
      </div>
    );
  }

  return <MhdEeoReportPage companyId={companyId} isPlatformAdmin={isPlatformAdmin} />;
}
