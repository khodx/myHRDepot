import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabaseClient as mhdSupabase } from '@/lib/supabase/supabaseClient';
import { useMhdAuth } from '../Hook';

const MHD_COMPLETE_PROFILE_PATH = '/complete-profile';
const MHD_ENROLL_MFA_PATH = '/enroll-mfa';
const MHD_MFA_CHALLENGE_PATH = '/mfa-challenge';

interface MhdMfaGateState {
  isLoading: boolean;
  hasVerifiedFactor: boolean;
  needsChallenge: boolean;
  error: string | null;
}

export function MhdProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading, profile, listMfaFactors } = useMhdAuth();
  const [mfaGate, setMfaGate] = useState<MhdMfaGateState>({
    isLoading: true,
    hasVerifiedFactor: false,
    needsChallenge: false,
    error: null,
  });

  // Re-checking on every `location.pathname` change would re-run this on
  // every in-app navigation, not just the ones that matter, flashing the
  // full-screen loading state on each link click. The only time a stale
  // result actually needs refreshing is a transition into/out of the two
  // MFA gate pages themselves (e.g. finishing enrollment on /enroll-mfa and
  // navigating to /dashboard needs to pick up the newly-verified factor) —
  // so the effect keys off THAT boolean, not the raw path.
  const isOnMfaGatePath =
    location.pathname === MHD_ENROLL_MFA_PATH || location.pathname === MHD_MFA_CHALLENGE_PATH;

  useEffect(() => {
    let isMounted = true;

    async function loadMfaGate() {
      // Deliberately leaves mfaGate in its current (initially isLoading: true)
      // state instead of settling it to a resolved "no verified factor" result
      // here. On a hard reload, MhdAuthProvider's isAuthenticated/profile go
      // through their own async transition from false/null to true/populated;
      // this effect's dependency array re-runs it for BOTH the transient
      // unauthenticated render and the authenticated one that follows a
      // moment later. Settling mfaGate to {isLoading: false, hasVerifiedFactor:
      // false} on the transient pass made the render below — which reads
      // mfaGate the instant isAuthenticated flips true, before this effect's
      // authenticated re-run has resolved — treat "haven't checked yet" as
      // "checked, found nothing," redirecting to /enroll-mfa for an account
      // that already has a verified factor, which then self-corrected back to
      // /dashboard once the real check landed. Every render path that reads
      // mfaGate is already gated on `profile?.personId`, so leaving isLoading
      // true here is inert for a genuinely signed-out user — it's simply
      // never read — and correctly keeps the loading screen up until the
      // authenticated re-run produces a real answer.
      if (!isAuthenticated || !profile?.personId) {
        return;
      }

      setMfaGate((current) => ({ ...current, isLoading: true, error: null }));

      try {
        const factors = await listMfaFactors();
        const hasVerifiedFactor = factors.some((factor) => factor.status === 'verified');
        const { data, error } = await mhdSupabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) throw error;

        if (isMounted) {
          setMfaGate({
            isLoading: false,
            hasVerifiedFactor,
            needsChallenge: hasVerifiedFactor && data.currentLevel !== data.nextLevel,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setMfaGate({
            isLoading: false,
            hasVerifiedFactor: false,
            needsChallenge: false,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to verify multi-factor authentication status.',
          });
        }
      }
    }

    void loadMfaGate();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, listMfaFactors, isOnMfaGatePath, profile?.personId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading My HR Depot...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Third invite path (see MhdCompleteProfilePage): a login invited with no
  // linked person is routed here before it can reach the rest of the app,
  // regardless of role — mhdCanAccessRoute would otherwise deny most routes
  // anyway for a user with zero role assignments, but this makes the "why"
  // explicit instead of a confusing wall of access-denied pages.
  if (!profile?.personId && location.pathname !== MHD_COMPLETE_PROFILE_PATH) {
    return <Navigate to={MHD_COMPLETE_PROFILE_PATH} replace />;
  }

  // Already-linked accounts have nothing to do here — mhd_self_complete_profile
  // only allows the one-time completion, so this route is a dead end for them.
  if (profile?.personId && location.pathname === MHD_COMPLETE_PROFILE_PATH) {
    return <Navigate to="/dashboard" replace />;
  }

  if (profile?.personId && mfaGate.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading My HR Depot...
      </div>
    );
  }

  if (profile?.personId && mfaGate.error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-red-700">
        {mfaGate.error}
      </div>
    );
  }

  // Dev-build-only relaxation of the app-ENTRY gate — see the 2026-08-16
  // amendment in 04.15 Access Security Engine's Specification.md. This does
  // NOT touch mhd_require_aal2() or any of the 9 sensitive RPCs/edge
  // functions it guards; those stay fully unconditional in every
  // environment, so testing one of those flows locally still requires a
  // real, completed TOTP enrollment. import.meta.env.DEV is a Vite
  // compile-time constant (already used the same way at
  // MhdAppShell.tsx:30) — dead-code-eliminated on any `vite build`, which
  // is the only command a Vercel deployment ever runs, so this can never
  // evaluate true in production.
  if (
    profile?.personId &&
    !mfaGate.hasVerifiedFactor &&
    location.pathname !== MHD_ENROLL_MFA_PATH &&
    !import.meta.env.DEV
  ) {
    return <Navigate to={MHD_ENROLL_MFA_PATH} replace />;
  }

  if (
    profile?.personId &&
    mfaGate.hasVerifiedFactor &&
    mfaGate.needsChallenge &&
    location.pathname !== MHD_MFA_CHALLENGE_PATH &&
    !import.meta.env.DEV
  ) {
    return <Navigate to={MHD_MFA_CHALLENGE_PATH} replace state={{ from: location }} />;
  }

  // Accounts that already satisfy MFA have nothing to do on these focused
  // gate pages; they are only waypoints before the main app.
  if (
    profile?.personId &&
    mfaGate.hasVerifiedFactor &&
    !mfaGate.needsChallenge &&
    (location.pathname === MHD_ENROLL_MFA_PATH || location.pathname === MHD_MFA_CHALLENGE_PATH)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
