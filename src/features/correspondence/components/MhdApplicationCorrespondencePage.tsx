import { useParams } from 'react-router-dom';
import { MhdApplicationRecordTabs } from '@/appshell/components/MhdApplicationRecordTabs';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdCorrespondencePanel } from './MhdCorrespondencePanel';

export function MhdApplicationCorrespondencePage() {
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
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/recruiting/applications/${appId}`}
        backLabel="Application"
        title="Application Correspondence"
        description="Email correspondence attached to this recruiting application."
      />

      <MhdApplicationRecordTabs
        appId={appId}
        active="correspondence"
        showOfferTab={canManage}
      />

      <MhdCorrespondencePanel
        companyId={companyId}
        entityType="RECRUITING_APPLICATION"
        entityId={appId}
      />
    </div>
  );
}
