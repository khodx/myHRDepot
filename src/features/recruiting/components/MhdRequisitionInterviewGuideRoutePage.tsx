import { useParams } from 'react-router-dom';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdRequisitionInterviewGuidePage } from '../requisitions/components/MhdRequisitionInterviewGuidePage';

/**
 * `/recruiting/requisitions/:reqId/interview-guide` — the requisition's
 * Interview Guide tab (package 2). Reads `useMhdAuth()` itself; inherits the
 * `/recruiting` role rule. The guide builder itself is privileged-gated by
 * `canManage`, which also controls whether the tab even renders (see
 * `MhdRequisitionRecordTabs`).
 */
export function MhdRequisitionInterviewGuideRoutePage() {
  const { reqId } = useParams<{ reqId: string }>();
  const { profile, roles } = useMhdAuth();
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
    <MhdRequisitionInterviewGuidePage
      companyId={companyId}
      requisitionId={reqId}
      canManage={canManage}
    />
  );
}
