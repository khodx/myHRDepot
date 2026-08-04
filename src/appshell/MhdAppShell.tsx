import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MhdImpersonationBanner } from '@/features/authentication/components/MhdImpersonationBanner';
import { MhdMobileNavDrawer, MhdSidebar } from './MhdSidebar';
import { MhdTopBar } from './MhdTopBar';
import { mhdCategoryThemeForPath } from './mhdModuleAccent';

/* Unmapped authenticated routes render with the neutral fallback tokens; warn
   once per prefix in dev so a new route can't ship without a category. */
const warnedPaths = new Set<string>();

/**
 * Root layout for all authenticated pages.
 * Renders the sidebar on the left, top bar at the top, and
 * the current route's page component in the main content area.
 * data-mhd-theme keys the six category theme variables (global.css) for the
 * whole shell, so the rail, primary actions, and page content share the hue —
 * every descendant route inherits its navigation category from this stamp.
 */
export function MhdAppShell() {
  const { pathname } = useLocation();
  const theme = mhdCategoryThemeForPath(pathname);

  // The drawer records the pathname it was opened on; navigating anywhere else
  // closes it by derivation — no effect, no cascading render.
  const [navOpenedAt, setNavOpenedAt] = useState<string | null>(null);
  const mobileNavOpen = navOpenedAt === pathname;

  useEffect(() => {
    if (import.meta.env.DEV && !theme && !warnedPaths.has(pathname)) {
      warnedPaths.add(pathname);
      console.warn(
        `[mhd] No category theme maps to "${pathname}" — assign the route to one of the six categories in mhdModuleAccent.ts.`,
      );
    }
  }, [pathname, theme]);

  return (
    <div data-mhd-theme={theme} className="flex h-screen overflow-hidden bg-background">
      <MhdSidebar />
      {mobileNavOpen ? <MhdMobileNavDrawer onClose={() => setNavOpenedAt(null)} /> : null}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MhdImpersonationBanner />
        <MhdTopBar onOpenNav={() => setNavOpenedAt(pathname)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
