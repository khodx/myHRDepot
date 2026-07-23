import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMhdAuth } from '../Hook';

export function MhdProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useMhdAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading My HR Depot...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
