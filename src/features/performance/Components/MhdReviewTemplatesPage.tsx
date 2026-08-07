import { mhdCanMutatePerformance, mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdReviewTemplateEditor } from './MhdReviewTemplateEditor';

/**
 * /performance/templates — module-owned, versioned review templates.
 *
 * Privileged config (Platform Admin / HR Partner / Client Admin — see
 * mhdRouteAccess). A published template is immutable, so the editor only creates
 * and publishes; the null-company GLOBAL DEFAULT is authorable by Platform Admins
 * only, gated inside the editor by `isPlatformAdmin`.
 */
export function MhdReviewTemplatesPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const isPlatformAdmin = mhdIsPlatformAdmin(roles);
  const canManage = mhdCanMutatePerformance(roles);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Review templates"
        description="The sections raters answer against, versioned so a completed review stays explicable under the exact template that produced it."
      />

      {!canManage || !companyId ? (
        <p className="text-sm text-muted-foreground">
          You do not have access to manage review templates.
        </p>
      ) : (
        <MhdCard className="p-6">
          <MhdReviewTemplateEditor companyId={companyId} isPlatformAdmin={isPlatformAdmin} />
        </MhdCard>
      )}
    </div>
  );
}
