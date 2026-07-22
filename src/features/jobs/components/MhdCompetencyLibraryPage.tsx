import { Link } from 'react-router-dom';
import { mhdCanMutateJobs } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdCompetencyLibraryPanel } from './MhdCompetencyLibraryPanel';

/**
 * `/jobs/competencies` route entry — the competency library on its own
 * deep-linkable page. Privileged only (the router guard shares the /jobs rule);
 * only Platform Admin may edit the seeded GLOBAL rows, which is what
 * `isPlatformAdmin` gates inside the panel.
 */
export function MhdCompetencyLibraryPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const isPlatformAdmin = roles.includes('Platform Admin');
  const canEdit = mhdCanMutateJobs(roles);

  if (!companyId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading competencies…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Link to="/jobs" className="text-sm text-neutral-500 underline">
        ← All jobs
      </Link>
      <MhdCompetencyLibraryPanel
        companyId={companyId}
        isPlatformAdmin={isPlatformAdmin}
        canEdit={canEdit}
      />
    </div>
  );
}
