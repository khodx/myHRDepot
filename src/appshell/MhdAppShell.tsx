import { Outlet } from 'react-router-dom';
import { MhdSidebar } from './MhdSidebar';
import { MhdTopBar } from './MhdTopBar';

/**
 * Root layout for all authenticated pages.
 * Renders the sidebar on the left, top bar at the top, and
 * the current route's page component in the main content area.
 */
export function MhdAppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
