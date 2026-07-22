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
      <div className="p-6">
        <h1 className="text-xl font-semibold text-neutral-900">Interview question bank</h1>
        <p className="mt-2 text-sm text-neutral-600">
          No company is associated with your account.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <MhdQuestionBankPage companyId={companyId} canManage={canManage} />
    </div>
  );
}
