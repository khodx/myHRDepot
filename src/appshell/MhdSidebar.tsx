import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, Building2, ClipboardList, Package2, Stamp } from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdRouteRoles } from './mhdRouteAccess';

interface NavItem {
  label: string;
  route: string;
  icon: React.ElementType;
  roles: MhdAuthRoleName[] | 'ALL';
}

// Roles come from mhdRouteAccess.ts (the same source MhdRoleGuardedRoute
// enforces against) so the sidebar can never drift from what the router
// actually allows — see MhdRoleGuardedRoute.tsx.
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard, roles: mhdRouteRoles('/dashboard') },
  { label: 'Tasks',     route: '/tasks',     icon: CheckSquare,     roles: mhdRouteRoles('/tasks') },
  { label: 'Forms',     route: '/forms',     icon: ClipboardList,   roles: mhdRouteRoles('/forms') },
  { label: 'Property',  route: '/property',  icon: Package2,        roles: mhdRouteRoles('/property') },
  { label: 'People',    route: '/people',    icon: Users,           roles: mhdRouteRoles('/people') },
  { label: 'Companies', route: '/companies', icon: Building2,       roles: mhdRouteRoles('/companies') },
  { label: 'Approvals', route: '/approvals', icon: Stamp,           roles: mhdRouteRoles('/approvals') },
];

export function MhdSidebar() {
  const { roles } = useMhdAuth();

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.roles === 'ALL') return true;
    return item.roles.some(r => roles.includes(r));
  });

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold tracking-tight text-primary">My HR Depot</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map(item => (
          <MhdNavItem key={item.route} item={item} />
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
