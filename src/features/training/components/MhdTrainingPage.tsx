import { mhdTrainingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdTrainingCatalogPage } from './MhdTrainingCatalogPage';

/**
 * `/training` route entry — the admin catalog + compliance board.
 *
 * Route-entry page: reads `useMhdAuth()` itself, per the app convention. The
 * route is restricted to Platform Admin / HR Partner / Client Admin by
 * mhdRouteAccess (MhdRoleGuardedRoute enforces it; Client User and Viewer are
 * refused). `canManage` (mhdTrainingIsPrivileged) governs the authoring / assign /
 * retire affordances — the training RPCs re-check `mhd_training_is_privileged`
 * server-side regardless. A global course is read-only to every tenant admin.
 */
export function MhdTrainingPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const canManage = mhdTrainingIsPrivileged(roles);

  if (!companyId) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">No company is associated with your account.</p>
      </div>
    );
  }

  return <MhdTrainingCatalogPage companyId={companyId} canManage={canManage} />;
}
