import { useNavigate, useSearchParams } from 'react-router-dom';
import { mhdHandbookIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdCreateHandbookFormValues } from '../Schemas';
import { MhdHandbookListPage } from './MhdHandbookListPage';

/**
 * `/handbooks` route entry — the admin handbook list + create flow.
 *
 * Route-entry page: reads `useMhdAuth()` and `useNavigate()` itself, per the app
 * convention. The route is restricted to Platform Admin / HR Partner / Client
 * Admin by mhdRouteAccess (MhdRoleGuardedRoute enforces it; Client User and Viewer
 * are refused). `canManage` (mhdHandbookIsPrivileged) governs the create / manage
 * affordances — the handbook RPCs re-check `mhd_handbook_is_privileged` server-side
 * regardless. Opening a handbook navigates to the wizard at `/handbooks/:handbookId`.
 */
export function MhdHandbooksPage() {
  const { profile, roles } = useMhdAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = profile?.companyId ?? '';
  const canManage = mhdHandbookIsPrivileged(roles);

  // Cross-link from the Workplace Safety module
  // (`/handbooks?handbookType=SAFETY&establishmentId=...`) — pre-fills and
  // auto-opens the existing create flow; this route never duplicates it.
  const requestedHandbookType = searchParams.get('handbookType');
  const initialHandbookType: MhdCreateHandbookFormValues['handbookType'] | undefined =
    requestedHandbookType === 'SAFETY' || requestedHandbookType === 'EMPLOYEE'
      ? requestedHandbookType
      : undefined;
  const initialEstablishmentId = searchParams.get('establishmentId');

  if (!companyId) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">No company is associated with your account.</p>
      </div>
    );
  }

  return (
    <MhdHandbookListPage
      companyId={companyId}
      canManage={canManage}
      onOpenHandbook={(handbookId) => navigate(`/handbooks/${handbookId}`)}
      initialHandbookType={initialHandbookType}
      initialEstablishmentId={initialEstablishmentId}
    />
  );
}
