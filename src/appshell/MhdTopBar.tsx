import { Link, NavLink } from 'react-router-dom';
import {
  Calendar,
  CalendarClock,
  CheckSquare,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  Zap,
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
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b bg-card px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
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
              `inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Zap className="h-[39.6px] w-[39.6px]" aria-hidden />
          </NavLink>
        ) : null}
        {mhdCanAccessRoute('/tasks', roles) ? (
          <NavLink
            to="/tasks"
            title="Tasks"
            aria-label="Tasks"
            className={({ isActive }) =>
              `inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <CheckSquare className="h-[39.6px] w-[39.6px]" aria-hidden />
          </NavLink>
        ) : null}
        {mhdCanAccessRoute('/activities', roles) ? (
          <NavLink
            to="/activities"
            title="Activities"
            aria-label="Activities"
            className={({ isActive }) =>
              `inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <CalendarClock className="h-[39.6px] w-[39.6px]" aria-hidden />
          </NavLink>
        ) : null}
        {mhdCanAccessRoute('/communications', roles) ? (
          <NavLink
            to="/communications"
            title="Communications"
            aria-label="Communications"
            className={({ isActive }) =>
              `inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <MessageSquare className="h-[39.6px] w-[39.6px]" aria-hidden />
          </NavLink>
        ) : null}
        {mhdCanAccessRoute('/calendar', roles) ? (
          <NavLink
            to="/calendar"
            title="Calendar"
            aria-label="Calendar"
            className={({ isActive }) =>
              `inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Calendar className="h-[39.6px] w-[39.6px]" aria-hidden />
          </NavLink>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <MhdThemeToggle />
        <Link
          to="/account/security"
          title="Account security"
          aria-label="Account security"
          className="inline-flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <ShieldCheck className="h-[39.6px] w-[39.6px]" aria-hidden />
        </Link>
        <MhdNotificationBell />
        <MhdActingAsMenu />
        <MhdImpersonationMenu />
        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
