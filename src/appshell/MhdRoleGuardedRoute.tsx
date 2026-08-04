import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanAccessRoute, mhdIsRouteComingSoon } from './mhdRouteAccess';
import { MhdComingSoonPage } from './components/MhdComingSoonPage';

/**
 * Route-level enforcement of MHD_ROUTE_ACCESS. MhdSidebar hiding a nav link
 * only affects discoverability — a signed-in user who is authenticated but
 * lacks the required role for the current path (e.g. navigating directly to
 * /companies, following a stale bookmark, or pasting a shared link) is
 * redirected to /404 rather than rendering the restricted page. Must sit
 * inside MhdProtectedRoute so `roles` is guaranteed to be populated. Routes
 * marked comingSoon render the placeholder page for non-Platform Admins.
 */
export function MhdRoleGuardedRoute() {
  const location = useLocation();
  const { roles } = useMhdAuth();

  if (!mhdCanAccessRoute(location.pathname, roles)) {
    return <Navigate to="/404" replace />;
  }

  if (mhdIsRouteComingSoon(location.pathname, roles)) {
    return <MhdComingSoonPage />;
  }

  return <Outlet />;
}
