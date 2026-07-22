import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdMyTrainingPage } from './MhdMyTrainingPage';

/**
 * `/my-training` route entry — the employee self-service surface.
 *
 * Route-entry page: reads `useMhdAuth()` itself, per the app convention. The
 * route admits Client User only (mhdRouteAccess); the page shows ONLY the signed-in
 * employee's own assignments and completions (RLS narrows the RPCs to their rows).
 *
 * `onAttachCertificate` is deliberately not injected here: the certificate soft-link
 * flows through the host Attachments surface, which is exercised in the browser
 * walkthrough (Stage 5). Without it the attach affordance is simply not offered,
 * and a `requires_evidence` course's bare-ATTESTED completion is still refused
 * server-side — the gate is the server's, never this component's.
 */
export function MhdMyTrainingRoutePage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const personId = profile?.personId ?? '';

  if (!companyId || !personId) {
    return (
      <div className="p-6">
        <p className="text-sm text-neutral-500">
          Your account is not linked to an employee record, so there is no training to show.
        </p>
      </div>
    );
  }

  return <MhdMyTrainingPage companyId={companyId} personId={personId} />;
}
