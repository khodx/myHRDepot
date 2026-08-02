import { useParams } from 'react-router-dom';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdRequisitionDetailPage } from '../requisitions/components/MhdRequisitionDetailPage';

/**
 * `/recruiting/requisitions/:reqId` — the requisition's Detail tab: its own
 * fields and status transition. The pipeline (invite + board) and interview
 * guide builder now live on their own routed tabs — see
 * `MhdRequisitionPipelineRoutePage` and `MhdRequisitionInterviewGuideRoutePage`,
 * wired together by `MhdRequisitionRecordTabs`. Reads `useMhdAuth()` itself;
 * inherits the `/recruiting` role rule.
 */
export function MhdRequisitionDetailRoutePage() {
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
    <MhdRequisitionDetailPage companyId={companyId} requisitionId={reqId} canManage={canManage} />
  );
}
