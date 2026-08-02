import { useParams } from 'react-router-dom';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdApplicationEvaluationPage } from '../requisitions/components/MhdApplicationEvaluationPage';

/**
 * `/recruiting/applications/:appId/evaluation` — the application's
 * Evaluation tab (package 2). Reads `useMhdAuth()` itself; inherits the
 * `/recruiting` role rule.
 */
export function MhdApplicationEvaluationRoutePage() {
  const { appId } = useParams<{ appId: string }>();
  const { roles } = useMhdAuth();
  const canManage = mhdRecruitingIsPrivileged(roles);

  if (!appId) {
    return (
      <div className="text-sm text-muted-foreground">
        This application could not be resolved for your account.
      </div>
    );
  }

  return <MhdApplicationEvaluationPage applicationId={appId} canManage={canManage} />;
}
