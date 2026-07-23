import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, BookMarked, BookOpen, Briefcase, Building2, CalendarClock, CalendarDays, CalendarOff, Car, CheckSquare, ChevronDown, ClipboardCheck, ClipboardList, DoorOpen, FileSignature, Gavel, GraduationCap, IdCard, LayoutDashboard, Library, MessageSquare, Package2, ShieldAlert, Stamp, UserSearch, Users, TrendingUp } from 'lucide-react';
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
// localStorage) so a large module set stays manageable.
const NAV_SECTIONS: NavSection[] = [
  {
    label: 'People & Org',
    items: [
      { label: 'People', route: '/people', icon: Users, roles: mhdRouteRoles('/people') },
      { label: 'Companies', route: '/companies', icon: Building2, roles: mhdRouteRoles('/companies') },
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
      { label: 'Schedule', route: '/schedule', icon: CalendarDays, roles: mhdRouteRoles('/schedule') },
      { label: 'Attendance', route: '/attendance', icon: ClipboardCheck, roles: mhdRouteRoles('/attendance') },
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
      { label: 'Performance', route: '/performance', icon: TrendingUp, roles: mhdRouteRoles('/performance') },
      // 360 feedback requests addressed to the signed-in user. A SEPARATE route
      // from /performance because a rater cannot load the review behind their
      // invitation.
      { label: 'Feedback Requests', route: '/performance/invitations', icon: MessageSquare, roles: mhdRouteRoles('/performance/invitations') },
      { label: 'Recruiting', route: '/recruiting', icon: UserSearch, roles: mhdRouteRoles('/recruiting') },
      // Platform-Admin ONLY — the sole read path into the hard-restricted EEO
      // partition, aggregate counts only.
      { label: 'EEO Report', route: '/recruiting/eeo', icon: BarChart3, roles: mhdRouteRoles('/recruiting/eeo') },
      { label: 'Training', route: '/training', icon: GraduationCap, roles: mhdRouteRoles('/training') },
      { label: 'My Training', route: '/my-training', icon: BookOpen, roles: mhdRouteRoles('/my-training') },
      { label: 'Handbooks', route: '/handbooks', icon: Library, roles: mhdRouteRoles('/handbooks') },
      { label: 'My Handbooks', route: '/my-handbooks', icon: BookMarked, roles: mhdRouteRoles('/my-handbooks') },
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
      { label: 'Investigations', route: '/investigations', icon: ShieldAlert, roles: mhdRouteRoles('/investigations') },
      { label: 'Offboarding', route: '/offboarding', icon: DoorOpen, roles: mhdRouteRoles('/offboarding') },
    ],
  },
  {
    label: 'Work Tools',
    items: [
      { label: 'Tasks', route: '/tasks', icon: CheckSquare, roles: mhdRouteRoles('/tasks') },
      { label: 'Activities', route: '/activities', icon: CalendarClock, roles: mhdRouteRoles('/activities') },
      { label: 'Forms', route: '/forms', icon: ClipboardList, roles: mhdRouteRoles('/forms') },
      { label: 'Approvals', route: '/approvals', icon: Stamp, roles: mhdRouteRoles('/approvals') },
      { label: 'Property', route: '/property', icon: Package2, roles: mhdRouteRoles('/property') },
      { label: 'E-Signature', route: '/esignature', icon: FileSignature, roles: mhdRouteRoles('/esignature') },
    ],
  },
];

const MHD_NAV_COLLAPSE_KEY = 'mhd:nav:collapsed';

function readCollapsedGroups(): string[] {
  try {
    const raw = window.localStorage.getItem(MHD_NAV_COLLAPSE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    // localStorage unavailable (private mode / non-browser env) — start expanded.
    return [];
  }
}

export function MhdSidebar() {
  const { roles } = useMhdAuth();
  // Collapsed group labels, remembered per user. Default (empty) = all expanded.
  const [collapsed, setCollapsed] = useState<string[]>(() => readCollapsedGroups());

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => {
      const next = prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label];
      try {
        window.localStorage.setItem(MHD_NAV_COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — collapse state stays in-memory only.
      }
      return next;
    });
  };

  const visibleSections = NAV_SECTIONS
    .map((section) => ({ ...section, items: section.items.filter(hasRole) }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold tracking-tight text-primary">My HR Depot</span>
      </div>

      {/* Navigation — scrolls independently when the item list exceeds the
          viewport (min-h-0 lets the flex child shrink below its content so
          overflow-y-auto engages instead of the ancestor clipping it). Each
          domain group collapses to keep the list short. */}
      <nav className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3">
        {hasRole(DASHBOARD_ITEM) ? <MhdNavItem item={DASHBOARD_ITEM} /> : null}
        {visibleSections.map((section) => {
          const isCollapsed = collapsed.includes(section.label);
          return (
            <div key={section.label} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(section.label)}
                aria-expanded={!isCollapsed}
                className="flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 transition-colors hover:text-foreground"
              >
                <span>{section.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  aria-hidden
                />
              </button>
              {isCollapsed ? null : section.items.map((item) => <MhdNavItem key={item.route} item={item} />)}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function MhdNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.route}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-accent text-accent-on'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </NavLink>
  );
}
