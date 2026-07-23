import { Outlet, useLocation } from 'react-router-dom';
import { MhdSidebar } from './MhdSidebar';
import { MhdTopBar } from './MhdTopBar';
import { mhdModuleForPath } from './mhdModuleAccent';

/**
 * Root layout for all authenticated pages.
 * Renders the sidebar on the left, top bar at the top, and
 * the current route's page component in the main content area.
 * data-module keys the per-module accent variables (global.css) for the
 * whole shell, so the sidebar's active pill and page content share the hue.
 */
export function MhdAppShell() {
  const { pathname } = useLocation();
  return (
    <div
      data-module={mhdModuleForPath(pathname)}
      className="flex h-screen overflow-hidden bg-background"
    >
      <MhdSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MhdTopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
