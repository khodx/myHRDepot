import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdMyHandbooksPage } from './MhdMyHandbooksPage';

/**
 * `/my-handbooks` route entry — the employee acknowledgment surface.
 *
 * Route-entry page: reads `useMhdAuth()` itself, per the app convention. The route
 * admits every internal role (MHD_HANDBOOK_ACKNOWLEDGER_ROLES); the page shows ONLY the signed-in
 * employee's own acknowledgments (`my_acknowledgments`, narrowed by `auth.uid()`
 * server-side).
 *
 * Signing is not driven from this page. When a handbook requires a signature, an
 * administrator sends the person a signature request for a short receipt; they sign
 * from the emailed link, then acknowledge here. Acknowledging is refused server-side
 * until that request COMPLETES (and, when a signature is required, until one exists) —
 * the gate is the server's, never this component's.
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
