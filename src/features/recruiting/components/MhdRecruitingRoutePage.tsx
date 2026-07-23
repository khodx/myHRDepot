import { useNavigate } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdRequisitionListPage } from '../requisitions/components/MhdRequisitionListPage';

/**
 * `/recruiting` — the admin + hiring-manager requisitions surface. Reads
 * `useMhdAuth()` itself (the route-entry convention) and passes the company scope
 * plus the privileged `canManage` flag into the package list page. A hiring
 * manager (also one of the privileged roles) sees only their own requisitions via
 * RLS; Viewer never reaches this route (see mhdRouteAccess).
 */
export function MhdRecruitingRoutePage() {
  const { profile, roles } = useMhdAuth();
  const navigate = useNavigate();
  const companyId = profile?.companyId ?? null;
  const canManage = mhdRecruitingIsPrivileged(roles);

  if (!companyId) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          title="Recruiting"
          description="No company is associated with your account, so there are no requisitions to show."
        />
      </div>
    );
  }

  return (
    <MhdRequisitionListPage
      companyId={companyId}
      canManage={canManage}
      onOpenRequisition={(requisitionId) => navigate(`/recruiting/requisitions/${requisitionId}`)}
    />
  );
}
