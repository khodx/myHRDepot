import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdMyHandbooksPage } from './MhdMyHandbooksPage';

/**
 * `/my-handbooks` route entry — the employee acknowledgment surface.
 *
 * Route-entry page: reads `useMhdAuth()` itself, per the app convention. The route
 * admits Client User only (mhdRouteAccess); the page shows ONLY the signed-in
 * employee's own acknowledgments (`my_acknowledgments`, narrowed by `auth.uid()`
 * server-side).
 *
 * `onSign` is deliberately not injected here: the signature ceremony flows through
 * the host signing surface, exercised in the browser walkthrough (Stage 5).
 * Without it, an acknowledgment with no linked signature request is recorded
 * directly, and one WITH a linked request is still refused server-side until the
 * signature COMPLETES — the gate is the server's, never this component's.
 */
export function MhdMyHandbooksRoutePage() {
  const { profile } = useMhdAuth();

  if (!profile?.personId) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Your account is not linked to an employee record, so there are no handbooks to
          acknowledge.
        </p>
      </div>
    );
  }

  return <MhdMyHandbooksPage />;
}
