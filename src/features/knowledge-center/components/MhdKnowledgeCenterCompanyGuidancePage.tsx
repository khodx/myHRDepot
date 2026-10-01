import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdKbArticleManager } from './MhdKbArticleManager';

export function MhdKnowledgeCenterCompanyGuidancePage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const companyName = profile?.companyName ?? 'your company';

  if (!companyId) {
    return (
      <p className="text-sm text-muted-foreground">No company is associated with your profile.</p>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Company Guidance"
        description={`Articles and FAQs written for the people at ${companyName}.`}
      />
      <MhdKbArticleManager scope="COMPANY" companyId={companyId} />
    </div>
  );
}
