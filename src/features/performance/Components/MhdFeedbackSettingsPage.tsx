import { mhdCanMutatePerformance } from '@/appshell/mhdRouteAccess';
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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">Performance settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            How anonymous 360 feedback is released for your company.
          </p>
        </header>

        {!canManage || !companyId ? (
          <p className="text-sm text-slate-500">
            You do not have access to manage feedback settings.
          </p>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
            <MhdFeedbackSettingsForm companyId={companyId} />
          </section>
        )}
      </div>
    </main>
  );
}
