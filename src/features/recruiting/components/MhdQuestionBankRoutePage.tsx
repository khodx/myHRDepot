import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdQuestionBankPage } from '../interviews/components/MhdQuestionBankPage';

/**
 * `/recruiting/questions` — the interview question bank (global pack + company
 * questions), each row carrying its compliance flag. Privileged recruiters author
 * questions; everyone with company access reads. Inherits the `/recruiting` role
 * rule (Platform Admin / HR Partner / Client Admin).
 */
export function MhdQuestionBankRoutePage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canManage = mhdRecruitingIsPrivileged(roles);

  if (!companyId) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          title="Interview question bank"
          description="No company is associated with your account."
        />
      </div>
    );
  }

  return <MhdQuestionBankPage companyId={companyId} canManage={canManage} />;
}
