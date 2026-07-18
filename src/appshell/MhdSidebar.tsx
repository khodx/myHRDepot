import { NavLink } from 'react-router-dom';
import { Building2, CalendarClock, CheckSquare, ClipboardList, FileSignature, LayoutDashboard, Package2, Stamp, Users } from 'lucide-react';
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

// Roles come from mhdRouteAccess.ts (the same source MhdRoleGuardedRoute
// enforces against) so the sidebar can never drift from what the router
// actually allows — see MhdRoleGuardedRoute.tsx.
const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Workspace',
    items: [{ label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard, roles: mhdRouteRoles('/dashboard') }],
  },
  {
    label: 'Productivity',
    items: [
      { label: 'Tasks', route: '/tasks', icon: CheckSquare, roles: mhdRouteRoles('/tasks') },
      { label: 'Activities', route: '/activities', icon: CalendarClock, roles: mhdRouteRoles('/activities') },
      { label: 'Forms', route: '/forms', icon: ClipboardList, roles: mhdRouteRoles('/forms') },
      { label: 'Approvals', route: '/approvals', icon: Stamp, roles: mhdRouteRoles('/approvals') },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Property', route: '/property', icon: Package2, roles: mhdRouteRoles('/property') },
      { label: 'E-Signature', route: '/esignature', icon: FileSignature, roles: mhdRouteRoles('/esignature') },
    ],
  },
  {
    label: 'Directory',
    items: [
      { label: 'People', route: '/people', icon: Users, roles: mhdRouteRoles('/people') },
      { label: 'Companies', route: '/companies', icon: Building2, roles: mhdRouteRoles('/companies') },
    ],
  },
];

export function MhdSidebar() {
  const { roles } = useMhdAuth();

  const visibleSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => (item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role)))),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold tracking-tight text-primary">My HR Depot</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 p-3">
        {visibleSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              {section.label}
            </p>
            {section.items.map((item) => (
              <MhdNavItem key={item.route} item={item} />
            ))}
          </div>
        ))}
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
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </NavLink>
  );
}
