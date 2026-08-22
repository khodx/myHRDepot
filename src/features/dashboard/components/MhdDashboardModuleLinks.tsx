import { useEffect, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdCountBadge } from '@/components/ui/MhdCountBadge';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdDashboard } from '../Hook';
import type { MhdDashboardModuleAlerts } from '../Types';
import { NAV_SECTIONS } from '@/appshell/MhdSidebar';
import type { NavItem } from '@/appshell/MhdSidebar';

// Covers the 14 live modules with a genuine "needs attention" concept — not
// every module has one (see mhd_dashboard_module_alerts()'s migrations,
// 0177 and 0179, for the per-module scoping rationale and the audit of why
// the rest were excluded). Keyed by route, since that's the tile's stable
// identity (item.route is both the NavLink `to` and the React key below),
// not label.
const ALERT_ROUTE_KEYS: Record<string, keyof MhdDashboardModuleAlerts> = {
  '/tasks': 'tasksNeedsAttention',
  '/approvals': 'approvalsNeedsAttention',
  '/leaves': 'leavesNeedsAttention',
  '/activities': 'activitiesNeedsAttention',
  '/esignature': 'esignatureNeedsAttention',
  '/attendance': 'attendanceNeedsAttention',
  '/accommodations': 'accommodationsNeedsAttention',
  '/training': 'trainingNeedsAttention',
  '/my-training': 'myTrainingNeedsAttention',
  '/handbooks': 'handbooksNeedsAttention',
  '/my-handbooks': 'myHandbooksNeedsAttention',
  '/conduct': 'conductNeedsAttention',
  '/investigations': 'investigationsNeedsAttention',
  '/communications': 'communicationsNeedsAttention',
};

// 15 tones cycle across rows in order; a 16th is reserved exclusively for
// the row containing "Users" (see mhd-module-tone-16 in global.css) and is
// never entered into this cycle.
const TONE_COUNT = 15;
const USERS_RESERVED_TONE = 16;

/** Matches the grid's own Tailwind breakpoints below (sm: 3 cols, md: 4 cols). */
function currentColumnCount(): number {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth >= 768) return 4;
  if (window.innerWidth >= 640) return 3;
  return 2;
}

/**
 * Row membership shifts with the column count, so it's recomputed on resize
 * rather than fixed with CSS nth-child, which can't track a changing column
 * count across the grid's own responsive breakpoints.
 */
function useMhdModuleGridColumns(): number {
  const [columns, setColumns] = useState(currentColumnCount);

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => setColumns(currentColumnCount()), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return columns;
}

export function MhdDashboardModuleLinks() {
  const { roles } = useMhdAuth();
  const { moduleAlerts } = useMhdDashboard();
  const columns = useMhdModuleGridColumns();
  const [query, setQuery] = useState('');

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));
  const isLive = (item: NavItem) => item.status !== 'comingSoon';

  const allItems = NAV_SECTIONS.flatMap((section) =>
    section.items.flatMap((item) => [item, ...(item.children ?? [])]),
  );
  const liveItems = allItems.filter((item) => hasRole(item) && isLive(item));

  if (liveItems.length === 0) return null;

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // Search reaches every module the role can see — including comingSoon
  // ones the default grid hides — so looking up a not-yet-live module
  // surfaces it instead of coming back empty. It never reaches past the
  // role boundary: an item a role can't open is never searchable by that
  // role either.
  const searchableItems = isSearching
    ? allItems.filter(hasRole)
    : liveItems;

  const matchedItems = isSearching
    ? searchableItems.filter(
        (item) =>
          item.label.toLowerCase().includes(trimmedQuery) ||
          item.description.toLowerCase().includes(trimmedQuery),
      )
    : searchableItems;

  const visibleItems = matchedItems.slice().sort((a, b) => a.label.localeCompare(b.label));

  const renderModuleTile = (
    item: NavItem,
    toneIndex: number,
    isGreyRow: boolean,
    includeChildren = true,
  ) => {
    const Icon = item.icon;
    const descriptionId = `mhd-module-desc-${item.route.replace(/^\//, '').replace(/\//g, '-')}`;
    const alertKey = ALERT_ROUTE_KEYS[item.route];
    const alertCount = alertKey ? (moduleAlerts?.[alertKey] ?? 0) : 0;
    const tileLabel =
      alertCount > 0
        ? `${item.label}, ${alertCount} need${alertCount === 1 ? 's' : ''} attention`
        : item.label;
    const visibleChildren = includeChildren
      ? (item.children ?? []).filter((child) => hasRole(child) && isLive(child))
      : [];
    const cardClassName = `mhd-module-card relative flex flex-col gap-2.5 rounded-lg border border-border p-4 text-foreground ${
      isGreyRow ? 'bg-[var(--mhd-module-row-grey)]' : 'bg-card'
    }`;

    const moduleContent = (
      <>
        <MhdCountBadge
          count={alertCount}
          className="absolute right-3 top-3 h-[29px] w-[29px] text-[19px]"
        />
        <div className="flex items-center gap-3">
          <span className="mhd-module-icon relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
            <Icon className="h-[21px] w-[21px]" aria-hidden />
          </span>
          <span className="truncate text-[18.15px] font-bold">{item.label}</span>
          {item.status === 'comingSoon' ? (
            <span className="ml-auto shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              Coming Soon
            </span>
          ) : null}
        </div>
        <p id={descriptionId} className="text-[13.75px] leading-snug text-muted-foreground">
          {item.description}
        </p>
      </>
    );

    if (visibleChildren.length === 0) {
      return (
        <NavLink
          key={item.route}
          to={item.route}
          aria-label={tileLabel}
          aria-describedby={descriptionId}
          className={cardClassName}
          style={{ '--tone': `var(--mhd-module-tone-${toneIndex})` } as CSSProperties}
        >
          {moduleContent}
        </NavLink>
      );
    }

    return (
      <div
        key={item.route}
        className={cardClassName}
        style={{ '--tone': `var(--mhd-module-tone-${toneIndex})` } as CSSProperties}
      >
        <NavLink to={item.route} aria-label={tileLabel} aria-describedby={descriptionId}>
          {moduleContent}
        </NavLink>
        <div className="mt-1 flex flex-wrap gap-2 border-t border-border pt-2">
          {visibleChildren.map((child) => {
            const ChildIcon = child.icon;
            const childDescriptionId = `mhd-module-desc-${child.route.replace(/^\//, '').replace(/\//g, '-')}`;
            const childAlertKey = ALERT_ROUTE_KEYS[child.route];
            const childAlertCount = childAlertKey ? (moduleAlerts?.[childAlertKey] ?? 0) : 0;
            const childTileLabel =
              childAlertCount > 0
                ? `${child.label}, ${childAlertCount} need${childAlertCount === 1 ? 's' : ''} attention`
                : child.label;

            return (
              <NavLink
                key={child.route}
                to={child.route}
                aria-label={childTileLabel}
                aria-describedby={childDescriptionId}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <ChildIcon className="h-3.5 w-3.5" aria-hidden />
                <span>{child.label}</span>
                <MhdCountBadge count={childAlertCount} className="h-4 min-w-4 text-[10px]" />
                <span id={childDescriptionId} className="sr-only">
                  {child.description}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  };

  const sectionItems = (section: (typeof NAV_SECTIONS)[number]) =>
    section.items.flatMap((item) => {
      if (hasRole(item) && isLive(item)) return [item];
      return (item.children ?? []).filter((child) => hasRole(child) && isLive(child));
    });

  const renderGrid = (items: NavItem[], includeChildren = true) => {
    const usersIndex = items.findIndex((item) => item.label === 'Users');
    const usersRow = usersIndex === -1 ? -1 : Math.floor(usersIndex / columns);

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item, index) => {
          const row = Math.floor(index / columns);
          const toneIndex = row === usersRow ? USERS_RESERVED_TONE : (row % TONE_COUNT) + 1;
          return renderModuleTile(item, toneIndex, row % 2 === 1, includeChildren);
        })}
      </div>
    );
  };

  return (
    <MhdCard elevated>
      <MhdCardHeader title={<span className="text-[23px] font-bold">MyHR Depot Modules</span>} />
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search modules…"
          aria-label="Search modules"
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {isSearching
          ? `${visibleItems.length} module${visibleItems.length === 1 ? '' : 's'} match "${query.trim()}"`
          : ''}
      </p>

      {visibleItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No modules match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : isSearching ? (
        renderGrid(visibleItems, false)
      ) : (
        <div className="space-y-5">
          {NAV_SECTIONS.map((section) => sectionItems(section).length > 0 ? section : null)
            .filter((section): section is (typeof NAV_SECTIONS)[number] => section !== null)
            .map((section, index) => {
            const items = sectionItems(section);
            const SectionIcon = section.icon;
            return (
              <section key={section.label}>
                <h3 className={`mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground ${index === 0 ? '' : 'mt-1'}`}>
                  <SectionIcon className="h-4 w-4" aria-hidden />
                  {section.label}
                </h3>
                {renderGrid(items)}
              </section>
            );
          })}
        </div>
      )}
    </MhdCard>
  );
}
