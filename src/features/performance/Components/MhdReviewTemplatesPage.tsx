import { mhdCanMutatePerformance } from '@/appshell/mhdRouteAccess';
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
  const isPlatformAdmin = roles.includes('Platform Admin');
  const canManage = mhdCanMutatePerformance(roles);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">Review templates</h1>
          <p className="mt-1 text-sm text-slate-600">
            The sections raters answer against, versioned so a completed review stays explicable
            under the exact template that produced it.
          </p>
        </header>

        {!canManage || !companyId ? (
          <p className="text-sm text-slate-500">
            You do not have access to manage review templates.
          </p>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <MhdReviewTemplateEditor companyId={companyId} isPlatformAdmin={isPlatformAdmin} />
          </section>
        )}
      </div>
    </main>
  );
}
