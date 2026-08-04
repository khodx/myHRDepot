import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMhdAuth } from '../Hook';

const MHD_COMPLETE_PROFILE_PATH = '/complete-profile';

export function MhdProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading, profile } = useMhdAuth();

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

  return <Outlet />;
}
