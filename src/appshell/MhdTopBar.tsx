import { Link, NavLink } from 'react-router-dom';
import {
  Calendar,
  ClipboardCheck,
  HeartHandshake,
  LogOut,
  Menu,
  MessageSquarePlus,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdActingAsMenu } from '@/features/authentication/components/MhdActingAsMenu';
import { MhdImpersonationMenu } from '@/features/authentication/components/MhdImpersonationMenu';
import { MhdNotificationBell } from '@/features/notifications/components/MhdNotificationBell';
import { MhdThemeToggle } from './MhdThemeToggle';
import { mhdCanAccessRoute } from './mhdRouteAccess';

/**
 * Neutral 72px utility bar. Never takes the category color — only restrained
 * accents (the notification dot, focus rings) may use it. The company identity
 * lives on the rail's company card.
 */
export function MhdTopBar({ onOpenNav }: { onOpenNav?: () => void }) {
  const { roles, signOut } = useMhdAuth();

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b-2 bg-card px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
        {onOpenNav ? (
          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Open navigation"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {mhdCanAccessRoute('/command-center', roles) ? (
          <NavLink
            to="/command-center"
            title="Command Center"
            aria-label="Command Center"
            className={({ isActive }) =>
              `mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              }`
            }
          >
            <Target className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" aria-hidden />
            <span aria-hidden className="text-sm font-medium leading-none whitespace-nowrap">Command Center</span>
          </NavLink>
        ) : null}
        {mhdCanAccessRoute('/tasks', roles) ? (
          <NavLink
            to="/tasks"
            title="Tasks"
            aria-label="Tasks"
            className={({ isActive }) =>
              `mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              }`
            }
          >
            <ClipboardCheck className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" aria-hidden />
            <span aria-hidden className="text-sm font-medium leading-none whitespace-nowrap">Tasks</span>
          </NavLink>
        ) : null}
        {mhdCanAccessRoute('/activities', roles) ? (
          <NavLink
            to="/activities"
            title="Activities"
            aria-label="Activities"
            className={({ isActive }) =>
              `mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              }`
            }
          >
            <HeartHandshake className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" aria-hidden />
            <span aria-hidden className="text-sm font-medium leading-none whitespace-nowrap">Activities</span>
          </NavLink>
        ) : null}
        {mhdCanAccessRoute('/communications', roles) ? (
          <NavLink
            to="/communications"
            title="Communications"
            aria-label="Communications"
            className={({ isActive }) =>
              `mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              }`
            }
          >
            <MessageSquarePlus className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" aria-hidden />
            <span aria-hidden className="text-sm font-medium leading-none whitespace-nowrap">Communications</span>
          </NavLink>
        ) : null}
        {mhdCanAccessRoute('/calendar', roles) ? (
          <NavLink
            to="/calendar"
            title="Calendar"
            aria-label="Calendar"
            className={({ isActive }) =>
              `mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              }`
            }
          >
            <Calendar className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" aria-hidden />
            <span aria-hidden className="text-sm font-medium leading-none whitespace-nowrap">Calendar</span>
          </NavLink>
        ) : null}
        <MhdThemeToggle />
        <Link
          to="/account/security"
          title="Account security"
          aria-label="Account security"
          className="mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <ShieldCheck className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" aria-hidden />
          <span aria-hidden className="text-sm font-medium leading-none whitespace-nowrap">Security</span>
        </Link>
        <MhdNotificationBell />
      </div>

      <div className="flex items-center gap-3">
        <MhdActingAsMenu />
        <MhdImpersonationMenu />
        <button
          type="button"
          onClick={() => signOut()}
          className="mhd-topbar-icon-btn inline-flex h-16 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-base font-semibold text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
