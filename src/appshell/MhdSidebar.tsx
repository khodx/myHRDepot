import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Accessibility,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  Bot,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  Car,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  FileSearch,
  FileSignature,
  FileText,
  FolderOpen,
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
  UserPlus,
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
      {
        label: 'Reports',
        route: '/reports',
        icon: FileText,
        roles: mhdRouteRoles('/reports'),
      },
      { label: 'Property', route: '/property', icon: Package2, roles: mhdRouteRoles('/property') },
      {
        label: 'E-Signature',
        route: '/esignature',
        icon: FileSignature,
        roles: mhdRouteRoles('/esignature'),
      },
    ],
  },
  {
    label: 'People & Org',
    items: [
      { label: 'People', route: '/people', icon: Users, roles: mhdRouteRoles('/people') },
      // The new-hire packet roster. Sits beside People rather than next to
      // Offboarding because it is the hire-side intake surface and reads the
      // same people directory; Employee Relations covers conduct and exit.
      {
        label: 'Onboarding',
        route: '/onboarding',
        icon: UserPlus,
        roles: mhdRouteRoles('/onboarding'),
      },
      {
        label: 'Employee Files',
        route: '/employees',
        icon: FolderOpen,
        roles: mhdRouteRoles('/employees'),
      },
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
      {
        label: 'Accommodations',
        route: '/accommodations',
        icon: Accessibility,
        roles: mhdRouteRoles('/accommodations'),
      },
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
      // Platform Admin / HR Partner only — same strictly-gated,
      // no-subject-facing precedent as Conduct/Investigations above. The
      // audit trail it reads (mhd_list_audit_events) spans every task,
      // note, attachment, and activity across the company, including IP
      // addresses and user agents.
      {
        label: 'Audit Reports',
        route: '/audit-reports',
        icon: FileSearch,
        roles: mhdRouteRoles('/audit-reports'),
      },
    ],
  },
  {
    label: 'Communications',
    items: [
      {
        label: 'Communications',
        route: '/communications',
        icon: MessageSquare,
        roles: mhdRouteRoles('/communications'),
      },
    ],
  },
  {
    label: 'Automation',
    items: [
      {
        label: 'Automations',
        route: '/automations',
        icon: Bot,
        roles: mhdRouteRoles('/automations'),
      },
    ],
  },
];

const MHD_NAV_COLLAPSE_KEY = 'mhd:nav:collapsed';
const MHD_RAIL_STATE_KEY = 'mhd:nav:rail';

function readCollapsedGroups(): string[] {
  try {
    const raw = window.localStorage.getItem(MHD_NAV_COLLAPSE_KEY);
    // No stored preference: default every group collapsed. Once a user
    // toggles anything, their stored choice always wins over this default.
    return raw ? (JSON.parse(raw) as string[]) : NAV_SECTIONS.map((section) => section.label);
  } catch {
    // localStorage genuinely unavailable (private mode / non-browser env) —
    // fall back to expanded rather than compounding one degraded experience
    // (no persistence) with another (everything hidden behind a click).
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
 * Desktop rail. Dark navy surface (bg-rail, #00157A) — the active nav item is
 * marked by a raised bevel on its amber selected fill (bg-rail-selected),
 * not by flooding the whole sidebar. 252px expanded, 72px collapsed
 * (icon-only, persisted separately from the per-group collapse).
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
    >
      <MhdSidebarContent collapsed={railCollapsed} />
      <button
        type="button"
        onClick={toggleRail}
        aria-label={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        title={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        className="flex min-h-10 items-center justify-center gap-2 border-t border-rail-border px-3 text-rail-muted transition-colors duration-150 hover:bg-rail-hover hover:text-rail-hover-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none"
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
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-2 top-6 rounded-md p-2 text-rail-muted transition-colors hover:bg-rail-hover hover:text-rail-hover-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
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
  // Collapsed group labels, remembered per user. Missing storage = all collapsed.
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() => readCollapsedGroups());

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));

  // Accordion behavior: expanding one section collapses every other one.
  // Clicking the already-expanded section collapses it too, leaving none
  // expanded — there is no "expand all" state.
  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const allLabels = NAV_SECTIONS.map((section) => section.label);
      // Currently collapsed -> expand just this one (collapsing every other
      // group). Currently expanded -> collapse it too, leaving none open.
      const next = prev.includes(label) ? allLabels.filter((l) => l !== label) : allLabels;
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
        <span className="text-[23px] font-bold leading-tight tracking-tight text-white">
          {collapsed ? 'HR' : 'myHRDepot'}
        </span>
        {collapsed ? null : (
          <span
            title="Your one stop shop for everything HR."
            className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-tight tracking-tight text-rail-muted"
          >
            Your one stop shop for everything HR.
          </span>
        )}
      </div>

      {/* Company band — the tenant the session is scoped to. Same flush-strip
          treatment as the logo band above (no card box, no outline): a fixed
          height with a bottom divider line. That gives the scrollable nav
          below a clean, full-width edge to butt up against, instead of a
          floating rounded card whose bottom edge the scrolled content could
          appear to clip into. */}
      {profile?.companyName ? (
        <div
          title={profile.companyName}
          className={`flex h-11 shrink-0 items-center gap-2 border-b border-rail-border ${
            collapsed ? 'justify-center px-2' : 'px-4'
          }`}
        >
          <Building2 className="h-4 w-4 shrink-0 text-white" aria-hidden />
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
      <nav className="mhd-rail-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
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
                className="flex min-h-10 w-full items-center justify-between rounded-md px-3 text-[17px] font-semibold text-rail-text transition-colors duration-150 hover:bg-rail-hover hover:text-rail-hover-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none"
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
        `relative flex min-h-10 items-center rounded-full text-[17px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none ${
          collapsed ? 'justify-center px-0' : 'gap-3 px-3'
        } ${
          isActive
            ? // Raised-bevel emphasis, deliberately heavier than a flat fill: a
              // wide soft drop shadow plus a tight contact shadow lift the row
              // off the rail, and a bright top edge / dark bottom edge (inset
              // shadows) read as a pushed-out, embossed button rather than a
              // flat color block. This carries the whole "active" signal now
              // that there's no separate indicator dot.
              'bg-rail-selected font-semibold text-rail-selected-text shadow-[0_6px_14px_rgba(0,0,0,0.55),0_2px_4px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_0_rgba(0,0,0,0.4)]'
            : 'font-medium text-rail-text hover:bg-rail-hover hover:text-rail-hover-text'
        }`
      }
    >
      {() => (
        <>
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {collapsed ? null : <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}
