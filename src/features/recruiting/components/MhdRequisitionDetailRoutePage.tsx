import { useNavigate, useParams } from 'react-router-dom';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdRequisitionDetailPage } from '../requisitions/components/MhdRequisitionDetailPage';
import { MhdInterviewGuideBuilder } from '../interviews/components/MhdInterviewGuideBuilder';

/**
 * `/recruiting/requisitions/:reqId` — a requisition's detail, its invite panel and
 * pipeline board (package 1), plus the interview guide builder (package 2), which
 * derives its job-specific questions from the requisition's job's published-JD
 * competencies. Reads `useMhdAuth()` itself; inherits the `/recruiting` role rule.
 */
export function MhdRequisitionDetailRoutePage() {
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
    <div className="space-y-6">
      <MhdRequisitionDetailPage
        companyId={companyId}
        requisitionId={reqId}
        canManage={canManage}
        onBack={() => navigate('/recruiting')}
        onOpenApplication={(applicationId) => navigate(`/recruiting/applications/${applicationId}`)}
      />
      {canManage ? (
        <MhdInterviewGuideBuilder
          companyId={companyId}
          requisitionId={reqId}
          canManage={canManage}
        />
      ) : null}
    </div>
  );
}
