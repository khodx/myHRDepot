import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdModuleCardGrid } from '@/components/ui/MhdModuleCardGrid';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdModuleAlerts } from '@/features/module-alerts/Hook';
import { NAV_SECTIONS } from '@/appshell/mhdNavSections';
import type { NavItem } from '@/appshell/mhdNavSections';

export function MhdDashboardModuleLinks() {
  const { roles } = useMhdAuth();
  const { counts } = useMhdModuleAlerts();

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));

  // Every module the role can open gets a tile — Coming Soon ones included,
  // carrying the same badge the sidebar shows — so the dashboard never
  // disagrees with the nav about what exists. The default view must never
  // show a child both nested under its visible parent card AND as its own
  // separate top-level card — promote a child to a standalone top-level entry
  // only when its parent isn't visible to this role (mirrors the identical
  // promotion logic in mhdNavSections.ts's own nesting). Each parent carries
  // only its role-visible children.
  const topLevelItems = NAV_SECTIONS.flatMap((section) =>
    section.items.flatMap((item) => {
      if (hasRole(item)) return [{ ...item, children: (item.children ?? []).filter(hasRole) }];
      return (item.children ?? []).filter(hasRole);
    }),
  );

  if (topLevelItems.length === 0) return null;

  return (
    <MhdCard elevated>
      <MhdCardHeader title={<span className="text-[23px] font-bold">MyHR Depot Modules</span>} />
      <MhdModuleCardGrid items={topLevelItems} alertCounts={counts} order="alphabetical" />
    </MhdCard>
  );
}
