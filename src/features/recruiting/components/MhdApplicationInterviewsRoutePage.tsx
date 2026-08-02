import { useNavigate, useParams } from 'react-router-dom';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdApplicationInterviewsPage } from '../requisitions/components/MhdApplicationInterviewsPage';

/**
 * `/recruiting/applications/:appId/interviews` — the application's
 * Interviews tab (package 2). Reads `useMhdAuth()` itself; inherits the
 * `/recruiting` role rule.
 */
export function MhdApplicationInterviewsRoutePage() {
  const { appId } = useParams<{ appId: string }>();
  const { profile, roles } = useMhdAuth();
  const navigate = useNavigate();
  const companyId = profile?.companyId ?? null;
  const canManage = mhdRecruitingIsPrivileged(roles);

  if (!companyId || !appId) {
    return (
      <div className="text-sm text-muted-foreground">
        This application could not be resolved for your account.
      </div>
    );
  }

  return (
    <MhdApplicationInterviewsPage
      companyId={companyId}
      applicationId={appId}
      canManage={canManage}
      onOpenWorksheet={(interviewId) => navigate(`/recruiting/interviews/${interviewId}`)}
    />
  );
}
