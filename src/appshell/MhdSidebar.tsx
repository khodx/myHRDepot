import { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Building2, LayoutDashboard, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';

import { useMhdFocusTrap } from '@/utils/useMhdFocusTrap';
import { mhdRouteRoles } from './mhdRouteAccess';
import { mhdVisibleNavItems, NAV_SECTIONS, type NavItem, type NavSection } from './mhdNavSections';

// Dashboard sits above the categories as the app's home — it belongs to no
// category so it is always one click away.
const DASHBOARD_ITEM: NavItem = {
  label: 'Dashboard',
  description: 'Your personal snapshot of tasks, activity, and modules.',
  route: '/dashboard',
  icon: LayoutDashboard,
  roles: mhdRouteRoles('/dashboard'),
};

const MHD_RAIL_STATE_KEY = 'mhd:nav:rail';

function readRailCollapsed(): boolean {
  try {
    return window.localStorage.getItem(MHD_RAIL_STATE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

/** True when the pathname is the route itself or any descendant of it. */
function pathIsWithin(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/** True when the pathname is the category's landing page or inside any of its modules. */
function sectionContainsPath(section: NavSection, pathname: string): boolean {
  if (section.route && pathIsWithin(pathname, section.route)) return true;
  return section.items.some(
    (item) =>
      pathIsWithin(pathname, item.route) ||
      (item.children ?? []).some((child) => pathIsWithin(pathname, child.route)),
  );
}

/**
 * Desktop rail. Dark navy surface (bg-rail, #00157A) — the active nav item is
 * marked by a raised bevel on its selected fill (bg-rail-selected), not by
 * flooding the whole sidebar. 329.13px expanded, 72px collapsed (icon-only,
 * persisted under its own key).
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
        railCollapsed ? 'w-[72px]' : 'w-[329.13px]'
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
        className="absolute inset-y-0 left-0 flex w-[329.13px] flex-col border-r border-rail-border bg-rail text-rail-text shadow-xl transition-transform duration-200 motion-reduce:transition-none"
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

/** Shared rail content: logo band, company card, and the category list. */
function MhdSidebarContent({ collapsed }: { collapsed: boolean }) {
  const { roles, profile } = useMhdAuth();

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: mhdVisibleNavItems(section.items, roles),
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
          appear to clip into. The row is a size container (`[container-type:size]`)
          so the name's font-size is expressed in `cqh` — a percentage of this
          row's own height — rather than a hardcoded px value that has to be
          hand-recalculated every time the row or rail is resized. */}
      {profile?.companyName ? (
        <div
          title={profile.companyName}
          className={`flex h-11 shrink-0 items-center gap-2 border-b border-rail-border [container-type:size] ${
            collapsed ? 'justify-center px-2' : 'px-4'
          }`}
        >
          <Building2 className="h-4 w-4 shrink-0 text-white" aria-hidden />
          {collapsed ? null : (
            <h3 className="truncate text-[42.5cqh] font-semibold text-white">
              {profile.companyName}
            </h3>
          )}
        </div>
      ) : null}

      {/* Navigation — Dashboard plus one link per category. A category opens its
          landing page, which lists every module and sub-page in it; the rail
          itself never expands. */}
      <nav className="mhd-rail-scroll min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {hasRole(DASHBOARD_ITEM) ? (
          <MhdNavItem item={DASHBOARD_ITEM} collapsed={collapsed} />
        ) : null}
        {visibleSections.map((section) => (
          <MhdNavCategory key={section.label} section={section} collapsed={collapsed} />
        ))}
      </nav>
    </>
  );
}

/**
 * One category in the rail: a single link to the category's landing page,
 * lit for the landing page and for every module page inside the category. A
 * single-module category (Automation, Wizards) has no landing page, so its
 * entry links straight to its only module.
 */
function MhdNavCategory({ section, collapsed }: { section: NavSection; collapsed: boolean }) {
  const { pathname } = useLocation();

  if (!section.route) {
    const only = section.items[0];
    return (
      <MhdNavItem
        item={{ label: section.label, route: only.route, icon: section.icon, status: only.status }}
        collapsed={collapsed}
      />
    );
  }

  return (
    <MhdNavItem
      item={{ label: section.label, route: section.route, icon: section.icon }}
      collapsed={collapsed}
      end
      active={sectionContainsPath(section, pathname)}
    />
  );
}

function MhdNavItem({
  item,
  collapsed,
  end,
  active,
}: {
  item: Pick<NavItem, 'label' | 'route' | 'icon' | 'status'>;
  collapsed: boolean;
  /** Match the route exactly (a category landing page, not its descendants). */
  end?: boolean;
  /** Overrides the route match, e.g. a category lit for any module page inside it. */
  active?: boolean;
}) {
  const Icon = item.icon;
  const title =
    collapsed && item.status === 'comingSoon'
      ? `${item.label} (Coming Soon)`
      : collapsed
        ? item.label
        : undefined;

  const size = collapsed ? 'justify-center px-0 text-[17px]' : 'gap-3 px-3 text-[17px]';

  // Raised-bevel emphasis, deliberately heavier than a flat fill: a wide soft
  // drop shadow plus a tight contact shadow lift the row off the rail, and a
  // bright top edge / dark bottom edge (inset shadows) read as a
  // pushed-out, embossed button rather than a flat color block. This carries
  // the whole "active" signal now that there's no separate indicator dot.
  const activeClasses =
    'bg-rail-selected font-semibold text-rail-selected-text shadow-[0_6px_14px_rgba(0,0,0,0.55),0_2px_4px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_0_rgba(0,0,0,0.4)]';
  const inactive = 'font-semibold text-rail-text hover:bg-rail-hover hover:text-rail-hover-text';

  return (
    <NavLink
      to={item.route}
      end={end}
      title={title}
      className={({ isActive }) =>
        `relative flex min-h-10 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none ${size} ${
          (active ?? isActive) ? activeClasses : inactive
        }`
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {collapsed ? null : <span className="truncate">{item.label}</span>}
      {item.status === 'comingSoon' && !collapsed ? (
        <span className="ml-auto shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
          Coming Soon
        </span>
      ) : null}
    </NavLink>
  );
}
