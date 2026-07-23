import { mhdCanMutatePerformance } from '@/appshell/mhdRouteAccess';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdFeedbackSettingsForm } from './MhdFeedbackSettingsForm';

/**
 * /performance/settings — the company's 360 anonymity dial.
 *
 * Privileged config (Platform Admin / HR Partner / Client Admin — see
 * mhdRouteAccess). The release threshold has a hard floor of 3, matching the
 * database CHECK; the form refuses a lower value for the same reason the database
 * refuses to store one. This screen never touches an individual peer or upward
 * response — there is no such read anywhere in v2, by design.
 */
export function MhdFeedbackSettingsPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canManage = mhdCanMutatePerformance(roles);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Performance settings"
        description="How anonymous 360 feedback is released for your company."
      />

      {!canManage || !companyId ? (
        <p className="text-sm text-muted-foreground">
          You do not have access to manage feedback settings.
        </p>
      ) : (
        <MhdCard className="p-6">
          <MhdFeedbackSettingsForm companyId={companyId} />
        </MhdCard>
      )}
    </div>
  );
}
