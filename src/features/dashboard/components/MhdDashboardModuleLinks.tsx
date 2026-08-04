import { NavLink } from 'react-router-dom';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { useMhdAuth } from '@/features/authentication/Hook';
import { NAV_SECTIONS } from '@/appshell/MhdSidebar';
import type { NavItem, NavSection } from '@/appshell/MhdSidebar';

export function MhdDashboardModuleLinks() {
  const { roles } = useMhdAuth();

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));
  const isLive = (item: NavItem) => item.status !== 'comingSoon';

  const visibleSections: NavSection[] = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasRole(item) && isLive(item)),
  })).filter((section) => section.items.length > 0);

  if (visibleSections.length === 0) return null;

  const visibleItems = visibleSections.flatMap((section) => section.items);

  return (
    <MhdCard>
      <MhdCardHeader title="Modules" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.route}
              to={item.route}
              className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </MhdCard>
  );
}
