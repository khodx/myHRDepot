import { useParams } from 'react-router-dom';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdApplicationDetailPage } from '../requisitions/components/MhdApplicationDetailPage';

/**
 * `/recruiting/applications/:appId` — the application's Detail tab: the
 * applicant record + stage controls (package 1). Interviews/evaluation
 * (package 2) and the offer/hire handoff (package 3) now live on their own
 * routed tabs — see `MhdApplicationRecordTabs`, `MhdApplicationInterviewsRoutePage`,
 * `MhdApplicationEvaluationRoutePage`, and `MhdApplicationOfferRoutePage`.
 *
 * EEO NOTE: this is a recruiter/HM decision surface, so it renders NO EEO
 * self-identification — none of the composed panels reads that partition. The only
 * EEO read anywhere is the Platform-Admin aggregate at /recruiting/eeo.
 */
export function MhdApplicationDetailRoutePage() {
  const { appId } = useParams<{ appId: string }>();
  const { profile, roles } = useMhdAuth();
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
    <MhdApplicationDetailPage companyId={companyId} applicationId={appId} canManage={canManage} />
  );
}
