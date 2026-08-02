import { useNavigate, useParams } from 'react-router-dom';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdRequisitionPipelinePage } from '../requisitions/components/MhdRequisitionPipelinePage';

/**
 * `/recruiting/requisitions/:reqId/pipeline` — the requisition's Pipeline tab:
 * the invite panel (privileged only) and the stage board. Reads `useMhdAuth()`
 * itself; inherits the `/recruiting` role rule.
 */
export function MhdRequisitionPipelineRoutePage() {
  const { reqId } = useParams<{ reqId: string }>();
  const { profile, roles } = useMhdAuth();
  const navigate = useNavigate();
  const companyId = profile?.companyId ?? null;
  const canManage = mhdRecruitingIsPrivileged(roles);

  if (!companyId || !reqId) {
    return (
      <div className="text-sm text-muted-foreground">
        This requisition could not be resolved for your account.
      </div>
    );
  }

  return (
    <MhdRequisitionPipelinePage
      companyId={companyId}
      requisitionId={reqId}
      canManage={canManage}
      onOpenApplication={(applicationId) => navigate(`/recruiting/applications/${applicationId}`)}
    />
  );
}
