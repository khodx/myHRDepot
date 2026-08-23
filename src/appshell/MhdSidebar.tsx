import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Accessibility,
  Award,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  Bot,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  Car,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Cog,
  DoorOpen,
  FileSearch,
  FileSignature,
  FileText,
  FlaskConical,
  FolderOpen,
  Gavel,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Library,
  Mail,
  MessageCircle,
  MessageSquare,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Settings,
  ShieldAlert,
  Stamp,
  UserSearch,
  UserPlus,
  UserCog,
  Users,
  UsersRound,
  TrendingUp,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { useMhdFocusTrap } from '@/utils/useMhdFocusTrap';
import { mhdRouteRoles, mhdRouteStatus } from './mhdRouteAccess';

export interface NavItem {
  label: string;
  /** One-line summary shown on the dashboard's Modules card. */
  description: string;
  route: string;
  icon: React.ElementType;
  roles: MhdAuthRoleName[] | 'ALL';
  status?: 'live' | 'comingSoon';
  /**
   * A self-service or narrower-scope companion view nested under this item
   * (e.g. "My Training" under "Training"). Rendered as an indented sub-row in
   * the sidebar, and as a secondary in-card link on the dashboard, rather
   * than a sibling top-level entry.
   */
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

// Dashboard sits above the collapsible groups as the app's home — it belongs to
// no group so it is always one click away.
const DASHBOARD_ITEM: NavItem = {
  label: 'Dashboard',
  description: 'Your personal snapshot of tasks, activity, and modules.',
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
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Work Tools',
    icon: Wrench,
    items: [
      {
        label: 'Tasks',
        description: 'Track and complete your assigned tasks.',
        route: '/tasks',
        icon: CheckSquare,
        roles: mhdRouteRoles('/tasks'),
      },
      {
        label: 'Activities',
        description: 'Log calls, meetings, and notes tied to any record.',
        route: '/activities',
        icon: CalendarClock,
        roles: mhdRouteRoles('/activities'),
      },
      {
        label: 'Calendar',
        description: 'View scheduled events, deadlines, and time off.',
        route: '/calendar',
        icon: Calendar,
        roles: mhdRouteRoles('/calendar'),
      },
      {
        label: 'Command Center',
        description: 'See your most important HR priorities in one place.',
        route: '/command-center',
        icon: Zap,
        roles: mhdRouteRoles('/command-center'),
      },
      {
        label: 'Forms',
        description: 'Build and submit HR forms and requests.',
        route: '/forms',
        icon: ClipboardList,
        roles: mhdRouteRoles('/forms'),
      },
      {
        label: 'Approvals',
        description: 'Review and act on pending approval requests.',
        route: '/approvals',
        icon: Stamp,
        roles: mhdRouteRoles('/approvals'),
      },
      {
        label: 'Reports',
        description: 'Run and export operational HR reports.',
        route: '/reports',
        icon: FileText,
        roles: mhdRouteRoles('/reports'),
      },
      {
        label: 'Property',
        description: 'Track company property assigned to employees.',
        route: '/property',
        icon: Package2,
        roles: mhdRouteRoles('/property'),
        status: mhdRouteStatus('/property'),
      },
      {
        label: 'E-Signature',
        description: 'Send documents out for electronic signature.',
        route: '/esignature',
        icon: FileSignature,
        roles: mhdRouteRoles('/esignature'),
      },
    ],
  },
  {
    label: 'People & Org',
    icon: UsersRound,
    items: [
      {
        label: 'People',
        description: 'Search and manage the company people directory.',
        route: '/people',
        icon: Users,
        roles: mhdRouteRoles('/people'),
      },
      {
        label: 'Users',
        description: 'Manage platform user accounts and access.',
        route: '/users',
        icon: UserCog,
        roles: mhdRouteRoles('/users'),
      },
      // The new-hire packet roster. Sits beside People rather than next to
      // Offboarding because it is the hire-side intake surface and reads the
      // same people directory; Employee Relations covers conduct and exit.
      {
        label: 'Onboarding',
        description: 'Guide new hires through their onboarding packet.',
        route: '/onboarding',
        icon: UserPlus,
        roles: mhdRouteRoles('/onboarding'),
        status: mhdRouteStatus('/onboarding'),
      },
      {
        label: 'Employee Files',
        description: "Browse each employee's document cabinet.",
        route: '/employees',
        icon: FolderOpen,
        roles: mhdRouteRoles('/employees'),
      },
      {
        label: 'Companies',
        description: 'Manage company profiles and organizational entities.',
        route: '/companies',
        icon: Building2,
        roles: mhdRouteRoles('/companies'),
      },
      // Privileged only. Employees reach their own description via "My Job".
      {
        label: 'Job Descriptions',
        description: 'Maintain job descriptions across the company.',
        route: '/jobs',
        icon: Briefcase,
        roles: mhdRouteRoles('/jobs'),
      },
      // The employee's own published job description — a SEPARATE route from the
      // privileged /jobs list (Client User only), so the list never has to be
      // correct for two audiences. NOT nested under Job Descriptions: the two
      // routes' role sets are fully disjoint (mhdRouteAccess.ts), so no single
      // user ever qualifies for both — nesting would never actually render as
      // a two-link card for anyone, only ever resolve to one or the other.
      {
        label: 'My Job',
        description: 'View your own published job description.',
        route: '/my-job',
        icon: IdCard,
        roles: mhdRouteRoles('/my-job'),
      },
    ],
  },
  {
    label: 'Time & Leave',
    icon: Clock,
    items: [
      {
        label: 'Schedule',
        description: 'View and manage employee work schedules.',
        route: '/schedule',
        icon: CalendarDays,
        roles: mhdRouteRoles('/schedule'),
      },
      {
        label: 'Attendance',
        description: 'Record and monitor daily time and attendance.',
        route: '/attendance',
        icon: ClipboardCheck,
        roles: mhdRouteRoles('/attendance'),
      },
      // Renders for Client Users (their own cases) and privileged roles (the full
      // company board) behind the same link; Viewer is excluded. The medical
      // partition is gated deeper in the case detail page.
      {
        label: 'Leaves',
        description: 'Manage leave of absence cases and balances.',
        route: '/leaves',
        icon: CalendarOff,
        roles: mhdRouteRoles('/leaves'),
      },
      {
        label: 'Accommodations',
        description: 'Track reasonable accommodation requests and the interactive process.',
        route: '/accommodations',
        icon: Accessibility,
        roles: mhdRouteRoles('/accommodations'),
      },
      {
        label: 'Mileage',
        description: 'Submit and review mileage reimbursement claims.',
        route: '/mileage',
        icon: Car,
        roles: mhdRouteRoles('/mileage'),
      },
    ],
  },
  {
    label: 'Talent',
    icon: Award,
    items: [
      {
        label: 'Performance',
        description: 'Run performance reviews and track goals.',
        route: '/performance',
        icon: TrendingUp,
        roles: mhdRouteRoles('/performance'),
        status: mhdRouteStatus('/performance'),
        children: [
          // 360 feedback requests addressed to the signed-in user. A SEPARATE route
          // from /performance because a rater cannot load the review behind their
          // invitation.
          {
            label: 'Feedback Requests',
            description: 'Respond to 360 feedback requests addressed to you.',
            route: '/performance/invitations',
            icon: MessageSquare,
            roles: mhdRouteRoles('/performance/invitations'),
            status: mhdRouteStatus('/performance/invitations'),
          },
        ],
      },
      {
        label: 'Recruiting',
        description: 'Manage job requisitions and candidate pipelines.',
        route: '/recruiting',
        icon: UserSearch,
        roles: mhdRouteRoles('/recruiting'),
        status: mhdRouteStatus('/recruiting'),
      },
      // Platform-Admin ONLY — the sole read path into the hard-restricted EEO
      // partition, aggregate counts only.
      {
        label: 'EEO Report',
        description: 'View aggregate EEO compliance counts.',
        route: '/recruiting/eeo',
        icon: BarChart3,
        roles: mhdRouteRoles('/recruiting/eeo'),
        status: mhdRouteStatus('/recruiting/eeo'),
      },
      {
        label: 'Training',
        description: 'Assign and monitor company training programs.',
        route: '/training',
        icon: GraduationCap,
        roles: mhdRouteRoles('/training'),
      },
      // NOT nested under Training: the two routes' role sets are fully
      // disjoint by design ("Two separate routes, never one filtered
      // surface" — mhdRouteAccess.ts), so no single user ever qualifies for
      // both and a nested card would never actually render as one for anyone.
      {
        label: 'My Training',
        description: 'Complete your assigned training courses.',
        route: '/my-training',
        icon: BookOpen,
        roles: mhdRouteRoles('/my-training'),
      },
      {
        label: 'Handbooks',
        description: 'Publish and manage employee handbooks.',
        route: '/handbooks',
        icon: Library,
        roles: mhdRouteRoles('/handbooks'),
      },
      // NOT nested under Handbooks — same fully-disjoint-roles reasoning as
      // Training / My Training above.
      {
        label: 'My Handbooks',
        description: 'Read the handbooks assigned to you.',
        route: '/my-handbooks',
        icon: BookMarked,
        roles: mhdRouteRoles('/my-handbooks'),
      },
      {
        label: 'Checklists',
        description: 'Create and fork reusable checklist templates.',
        route: '/checklists',
        icon: ClipboardList,
        roles: mhdRouteRoles('/checklists'),
        children: [
          {
            label: 'My Checklists',
            description: 'Complete checklists assigned to you.',
            route: '/my-checklists',
            icon: ClipboardCheck,
            roles: mhdRouteRoles('/my-checklists'),
          },
        ],
      },
      {
        label: 'Policies',
        description: 'Author and publish company policies.',
        route: '/policies',
        icon: FileText,
        roles: mhdRouteRoles('/policies'),
        children: [
          {
            label: 'My Policies',
            description: 'Review and acknowledge policies assigned to you.',
            route: '/my-policies',
            icon: FileSignature,
            roles: mhdRouteRoles('/my-policies'),
          },
        ],
      },
    ],
  },
  {
    label: 'Employee Relations',
    icon: Scale,
    items: [
      // Admin-only (Platform Admin / HR Partner / Client Admin); no subject route.
      {
        label: 'Conduct',
        description: 'Track workplace conduct cases and outcomes.',
        route: '/conduct',
        icon: Gavel,
        roles: mhdRouteRoles('/conduct'),
      },
      // Role-gated for the privileged set. Showing the link is NOT access control:
      // case visibility stays grant-based server-side, so an ungranted admin who
      // opens the board sees an empty, non-disclosing list.
      {
        label: 'Investigations',
        description: 'Manage formal workplace investigations.',
        route: '/investigations',
        icon: ShieldAlert,
        roles: mhdRouteRoles('/investigations'),
      },
      {
        label: 'Offboarding',
        description: 'Manage employee exit and offboarding cases.',
        route: '/offboarding',
        icon: DoorOpen,
        roles: mhdRouteRoles('/offboarding'),
        status: mhdRouteStatus('/offboarding'),
      },
      // Platform Admin / HR Partner only — same strictly-gated,
      // no-subject-facing precedent as Conduct/Investigations above. The
      // audit trail it reads (mhd_list_audit_events) spans every task,
      // note, attachment, and activity across the company, including IP
      // addresses and user agents.
      {
        label: 'Audit Reports',
        description: 'Review the company-wide activity and access audit trail.',
        route: '/audit-reports',
        icon: FileSearch,
        roles: mhdRouteRoles('/audit-reports'),
      },
    ],
  },
  {
    label: 'Communications',
    icon: MessageCircle,
    items: [
      {
        label: 'Communications',
        description: 'Send messages and manage system alerts.',
        route: '/communications',
        icon: MessageSquare,
        roles: mhdRouteRoles('/communications'),
      },
      {
        label: 'Memorandums',
        description: 'Author and distribute formal company memorandums.',
        route: '/memorandums',
        icon: Mail,
        roles: mhdRouteRoles('/memorandums'),
        children: [
          {
            label: 'My Memorandums',
            description: 'Memorandums sent to you.',
            route: '/my-memorandums',
            icon: Mail,
            roles: mhdRouteRoles('/my-memorandums'),
          },
        ],
      },
    ],
  },
  {
    label: 'Automation',
    icon: Zap,
    items: [
      {
        label: 'Automations',
        description: 'Build and manage automated workflow rules.',
        route: '/automations',
        icon: Bot,
        roles: mhdRouteRoles('/automations'),
      },
    ],
  },
  // Platform Admin only — see mhdRouteAccess.ts. Deliberately its own group at
  // the bottom of the rail rather than folded into Work Tools, so it reads as
  // platform operator tooling, not an HR module.
  {
    label: 'Administration',
    icon: Cog,
    items: [
      {
        label: 'Admin Settings',
        description: 'Configure company-wide settings and platform options.',
        route: '/admin',
        icon: Settings,
        roles: mhdRouteRoles('/admin'),
      },
      {
        label: 'Lab & Sandbox',
        description: 'Experimental tools for platform testing.',
        route: '/lab',
        icon: FlaskConical,
        roles: mhdRouteRoles('/lab'),
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
 * not by flooding the whole sidebar. 365.7px expanded, 72px collapsed
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
        railCollapsed ? 'w-[72px]' : 'w-[365.7px]'
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
  useMhdFocusTrap(drawerRef, onClose, {
    focusableSelector: 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  });

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 flex w-[365.7px] flex-col border-r border-rail-border bg-rail text-rail-text shadow-xl transition-transform duration-200 motion-reduce:transition-none"
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

  // Dashboard is the app's home — returning to it resets the rail to a known,
  // uncluttered state rather than leaving whatever group the user last opened
  // expanded.
  const collapseAllGroups = () => {
    const allLabels = NAV_SECTIONS.map((section) => section.label);
    setCollapsedGroups(allLabels);
    try {
      window.localStorage.setItem(MHD_NAV_COLLAPSE_KEY, JSON.stringify(allLabels));
    } catch {
      // localStorage unavailable — collapse state stays in-memory only.
    }
  };

  // A child (e.g. "My Training") can be visible to a role that cannot see its
  // parent (e.g. "Training" is Platform Admin/HR Partner/Client Admin only,
  // while My Training is Employee/Manager/Supervisor/Lead) — nesting must
  // never hide a role from a route it's independently entitled to. When the
  // parent passes the role check, keep only its role-visible children nested
  // under it; when the parent fails, promote any role-visible children to
  // their own un-nested top-level entries instead of losing them.
  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.flatMap((item) => {
      const visibleChildren = (item.children ?? []).filter(hasRole);
      if (hasRole(item)) return [{ ...item, children: visibleChildren }];
      return visibleChildren;
    }),
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
            <span className="truncate text-[18.72px] font-semibold text-white">
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
          <MhdNavItem item={DASHBOARD_ITEM} collapsed={collapsed} onClick={collapseAllGroups} />
        ) : null}
        {visibleSections.map((section) => {
          const isCollapsed = collapsedGroups.includes(section.label);
          if (collapsed) {
            // Icon-only rail: group headers become separators; items keep their
            // role filtering and active state, with tooltips for labels.
            return (
              <div key={section.label} className="space-y-1">
                <div className="mx-2 border-t border-rail-border" aria-hidden />
                {section.items.flatMap((item) => [item, ...(item.children ?? [])]).map((item) => (
                  <MhdNavItem key={item.route} item={item} collapsed />
                ))}
              </div>
            );
          }
          const SectionIcon = section.icon;
          return (
            <div key={section.label} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(section.label)}
                aria-expanded={!isCollapsed}
                className="flex min-h-10 w-full items-center justify-between rounded-md px-3 text-[17px] font-semibold text-rail-text transition-colors duration-150 hover:bg-rail-hover hover:text-rail-hover-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none"
              >
                <span className="flex items-center gap-3">
                  <SectionIcon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span>{section.label}</span>
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform motion-reduce:transition-none ${isCollapsed ? '-rotate-90' : ''}`}
                  aria-hidden
                />
              </button>
              {isCollapsed
                ? null
                : section.items.flatMap((item) => [
                    <MhdNavItem key={item.route} item={item} collapsed={false} />,
                    ...(item.children ?? []).map((child) => (
                      <MhdNavItem key={child.route} item={child} collapsed={false} nested />
                    )),
                  ])}
            </div>
          );
        })}
      </nav>
    </>
  );
}

function MhdNavItem({
  item,
  collapsed,
  nested,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  nested?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const title =
    collapsed && item.status === 'comingSoon'
      ? `${item.label} (Coming Soon)`
      : collapsed
        ? item.label
        : undefined;

  return (
    <NavLink
      to={item.route}
      title={title}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex min-h-10 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none ${
          collapsed ? 'justify-center px-0 text-[17px]' : nested ? 'gap-3 pl-8 text-[15px]' : 'gap-3 px-3 text-[17px]'
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
          <Icon className={nested ? 'h-4 w-4 shrink-0' : 'h-[18px] w-[18px] shrink-0'} aria-hidden />
          {collapsed ? null : <span className="truncate">{item.label}</span>}
          {item.status === 'comingSoon' && !collapsed ? (
            <span className="ml-auto shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              Coming Soon
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}
