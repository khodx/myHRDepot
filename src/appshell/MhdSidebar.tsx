import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  Car,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  FileSignature,
  Gavel,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Library,
  MessageSquare,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Stamp,
  UserSearch,
  Users,
  TrendingUp,
  X,
} from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdRouteRoles } from './mhdRouteAccess';

interface NavItem {
  label: string;
  route: string;
  icon: React.ElementType;
  roles: MhdAuthRoleName[] | 'ALL';
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Dashboard sits above the collapsible groups as the app's home — it belongs to
// no group so it is always one click away.
const DASHBOARD_ITEM: NavItem = {
  label: 'Dashboard',
  route: '/dashboard',
  icon: LayoutDashboard,
  roles: mhdRouteRoles('/dashboard'),
};

// Grouped by HR domain rather than one long flat list. Roles come from
// mhdRouteAccess.ts (the same source MhdRoleGuardedRoute enforces against) so the
// sidebar can never drift from what the router actually allows — see
// MhdRoleGuardedRoute.tsx. Each group is collapsible (state persisted per user in
// localStorage) so a large module set stays manageable. The five groups plus
// Dashboard are exactly the six category themes — the rail color follows the
// active route's category via the shell's data-mhd-theme stamp.
const NAV_SECTIONS: NavSection[] = [
  {
    label: 'People & Org',
    items: [
      { label: 'People', route: '/people', icon: Users, roles: mhdRouteRoles('/people') },
      {
        label: 'Companies',
        route: '/companies',
        icon: Building2,
        roles: mhdRouteRoles('/companies'),
      },
      // Privileged only. Employees reach their own description via "My Job".
      { label: 'Job Descriptions', route: '/jobs', icon: Briefcase, roles: mhdRouteRoles('/jobs') },
      // The employee's own published job description — a SEPARATE route from the
      // privileged /jobs list (Client User only), so the list never has to be
      // correct for two audiences.
      { label: 'My Job', route: '/my-job', icon: IdCard, roles: mhdRouteRoles('/my-job') },
    ],
  },
  {
    label: 'Time & Leave',
    items: [
      {
        label: 'Schedule',
        route: '/schedule',
        icon: CalendarDays,
        roles: mhdRouteRoles('/schedule'),
      },
      {
        label: 'Attendance',
        route: '/attendance',
        icon: ClipboardCheck,
        roles: mhdRouteRoles('/attendance'),
      },
      // Renders for Client Users (their own cases) and privileged roles (the full
      // company board) behind the same link; Viewer is excluded. The medical
      // partition is gated deeper in the case detail page.
      { label: 'Leaves', route: '/leaves', icon: CalendarOff, roles: mhdRouteRoles('/leaves') },
      { label: 'Mileage', route: '/mileage', icon: Car, roles: mhdRouteRoles('/mileage') },
    ],
  },
  {
    label: 'Talent',
    items: [
      {
        label: 'Performance',
        route: '/performance',
        icon: TrendingUp,
        roles: mhdRouteRoles('/performance'),
      },
      // 360 feedback requests addressed to the signed-in user. A SEPARATE route
      // from /performance because a rater cannot load the review behind their
      // invitation.
      {
        label: 'Feedback Requests',
        route: '/performance/invitations',
        icon: MessageSquare,
        roles: mhdRouteRoles('/performance/invitations'),
      },
      {
        label: 'Recruiting',
        route: '/recruiting',
        icon: UserSearch,
        roles: mhdRouteRoles('/recruiting'),
      },
      // Platform-Admin ONLY — the sole read path into the hard-restricted EEO
      // partition, aggregate counts only.
      {
        label: 'EEO Report',
        route: '/recruiting/eeo',
        icon: BarChart3,
        roles: mhdRouteRoles('/recruiting/eeo'),
      },
      {
        label: 'Training',
        route: '/training',
        icon: GraduationCap,
        roles: mhdRouteRoles('/training'),
      },
      {
        label: 'My Training',
        route: '/my-training',
        icon: BookOpen,
        roles: mhdRouteRoles('/my-training'),
      },
      {
        label: 'Handbooks',
        route: '/handbooks',
        icon: Library,
        roles: mhdRouteRoles('/handbooks'),
      },
      {
        label: 'My Handbooks',
        route: '/my-handbooks',
        icon: BookMarked,
        roles: mhdRouteRoles('/my-handbooks'),
      },
    ],
  },
  {
    label: 'Employee Relations',
    items: [
      // Admin-only (Platform Admin / HR Partner / Client Admin); no subject route.
      { label: 'Conduct', route: '/conduct', icon: Gavel, roles: mhdRouteRoles('/conduct') },
      // Role-gated for the privileged set. Showing the link is NOT access control:
      // case visibility stays grant-based server-side, so an ungranted admin who
      // opens the board sees an empty, non-disclosing list.
      {
        label: 'Investigations',
        route: '/investigations',
        icon: ShieldAlert,
        roles: mhdRouteRoles('/investigations'),
      },
      {
        label: 'Offboarding',
        route: '/offboarding',
        icon: DoorOpen,
        roles: mhdRouteRoles('/offboarding'),
      },
    ],
  },
  {
    label: 'Work Tools',
    items: [
      { label: 'Tasks', route: '/tasks', icon: CheckSquare, roles: mhdRouteRoles('/tasks') },
      {
        label: 'Activities',
        route: '/activities',
        icon: CalendarClock,
        roles: mhdRouteRoles('/activities'),
      },
      { label: 'Forms', route: '/forms', icon: ClipboardList, roles: mhdRouteRoles('/forms') },
      { label: 'Approvals', route: '/approvals', icon: Stamp, roles: mhdRouteRoles('/approvals') },
      { label: 'Property', route: '/property', icon: Package2, roles: mhdRouteRoles('/property') },
      {
        label: 'E-Signature',
        route: '/esignature',
        icon: FileSignature,
        roles: mhdRouteRoles('/esignature'),
      },
    ],
  },
];

const MHD_NAV_COLLAPSE_KEY = 'mhd:nav:collapsed';
const MHD_RAIL_STATE_KEY = 'mhd:nav:rail';

function readCollapsedGroups(): string[] {
  try {
    const raw = window.localStorage.getItem(MHD_NAV_COLLAPSE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    // localStorage unavailable (private mode / non-browser env) — start expanded.
    return [];
  }
}

function readRailCollapsed(): boolean {
  try {
    return window.localStorage.getItem(MHD_RAIL_STATE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

/**
 * Desktop rail. The whole surface takes the active category's darker rail
 * color (bg-rail resolves from the shell's data-mhd-theme stamp); every state
 * uses the shared white-alpha scale. 252px expanded, 72px collapsed (icon-only,
 * persisted separately from the per-group collapse).
 */
export function MhdSidebar() {
  const [railCollapsed, setRailCollapsed] = useState<boolean>(() => readRailCollapsed());

  const toggleRail = () => {
    setRailCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MHD_RAIL_STATE_KEY, next ? 'collapsed' : 'expanded');
      } catch {
        // localStorage unavailable — rail state stays in-memory only.
      }
      return next;
    });
  };

  return (
    <aside
      className={`hidden h-full flex-col border-r border-rail-border bg-rail text-rail-text transition-[width] duration-200 motion-reduce:transition-none lg:flex ${
        railCollapsed ? 'w-[72px]' : 'w-[252px]'
      }`}
      style={{ backgroundImage: 'linear-gradient(rgb(255 255 255 / 0.04), transparent 220px)' }}
    >
      <MhdSidebarContent collapsed={railCollapsed} />
      <button
        type="button"
        onClick={toggleRail}
        aria-label={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        title={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        className="flex min-h-10 items-center justify-center gap-2 border-t border-rail-border px-3 text-rail-muted transition-colors duration-150 hover:bg-rail-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none"
      >
        {railCollapsed ? (
          <PanelLeftOpen className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-xs font-medium">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

/**
 * Mobile navigation drawer — same rail tokens and content as the desktop rail.
 * Traps focus, closes on Escape or backdrop click, and restores focus to the
 * trigger (the previously focused element) when it closes.
 */
export function MhdMobileNavDrawer({ onClose }: { onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;

    const focusables = () =>
      drawer
        ? Array.from(
            drawer.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 flex w-[252px] flex-col border-r border-rail-border bg-rail text-rail-text shadow-xl transition-transform duration-200 motion-reduce:transition-none"
        style={{ backgroundImage: 'linear-gradient(rgb(255 255 255 / 0.04), transparent 220px)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-2 top-6 rounded-md p-2 text-rail-muted transition-colors hover:bg-rail-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <MhdSidebarContent collapsed={false} />
      </div>
    </div>
  );
}

/** Shared rail content: logo band, company card, and the grouped navigation. */
function MhdSidebarContent({ collapsed }: { collapsed: boolean }) {
  const { roles, profile } = useMhdAuth();
  // Collapsed group labels, remembered per user. Default (empty) = all expanded.
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() => readCollapsedGroups());

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label];
      try {
        window.localStorage.setItem(MHD_NAV_COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — collapse state stays in-memory only.
      }
      return next;
    });
  };

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(hasRole),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Logo band — aligns with the 72px neutral top bar. */}
      <div
        className={`flex h-[72px] shrink-0 flex-col justify-center border-b border-rail-border ${
          collapsed ? 'items-center px-2' : 'px-4'
        }`}
      >
        <span className="text-lg font-bold leading-tight tracking-tight text-white">
          {collapsed ? 'HR' : 'myHRDepot'}
        </span>
        {collapsed ? null : (
          <span className="text-[11px] leading-tight text-rail-muted">
            Your one stop shop for everything HR.
          </span>
        )}
      </div>

      {/* Company card — the tenant the session is scoped to. */}
      {profile?.companyName ? (
        <div
          title={profile.companyName}
          className={`mx-3 mt-3 flex shrink-0 items-center gap-2 rounded-md border border-rail-border bg-rail-surface px-3 py-2 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <Building2 className="h-4 w-4 shrink-0 text-rail-muted" aria-hidden />
          {collapsed ? null : (
            <span className="truncate text-[13px] font-semibold text-white">
              {profile.companyName}
            </span>
          )}
        </div>
      ) : null}

      {/* Navigation — scrolls independently when the item list exceeds the
          viewport (min-h-0 lets the flex child shrink below its content so
          overflow-y-auto engages instead of the ancestor clipping it). Each
          domain group collapses to keep the list short. */}
      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {hasRole(DASHBOARD_ITEM) ? (
          <MhdNavItem item={DASHBOARD_ITEM} collapsed={collapsed} />
        ) : null}
        {visibleSections.map((section) => {
          const isCollapsed = collapsedGroups.includes(section.label);
          if (collapsed) {
            // Icon-only rail: group headers become separators; items keep their
            // role filtering and active state, with tooltips for labels.
            return (
              <div key={section.label} className="space-y-1">
                <div className="mx-2 border-t border-rail-border" aria-hidden />
                {section.items.map((item) => (
                  <MhdNavItem key={item.route} item={item} collapsed />
                ))}
              </div>
            );
          }
          return (
            <div key={section.label} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(section.label)}
                aria-expanded={!isCollapsed}
                className="flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-rail-muted transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none"
              >
                <span>{section.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform motion-reduce:transition-none ${isCollapsed ? '-rotate-90' : ''}`}
                  aria-hidden
                />
              </button>
              {isCollapsed
                ? null
                : section.items.map((item) => (
                    <MhdNavItem key={item.route} item={item} collapsed={false} />
                  ))}
            </div>
          );
        })}
      </nav>
    </>
  );
}

function MhdNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.route}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `relative flex min-h-10 items-center rounded-md text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none ${
          collapsed ? 'justify-center px-0' : 'gap-3 px-3'
        } ${
          isActive
            ? 'bg-rail-selected font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.10)]'
            : 'font-medium text-rail-text hover:bg-rail-hover hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-white"
              aria-hidden
            />
          ) : null}
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {collapsed ? null : <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}
