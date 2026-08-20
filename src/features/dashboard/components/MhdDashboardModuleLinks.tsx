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

  // The default (no search) view stays live-modules-only, same as before —
  // this also gates whether the card renders at all, unchanged from prior
  // behavior.
  const liveItems = NAV_SECTIONS.flatMap((section) => section.items).filter(
    (item) => hasRole(item) && isLive(item),
  );

  if (liveItems.length === 0) return null;

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // Search reaches every module the role can see — including comingSoon
  // ones the default grid hides — so looking up a not-yet-live module
  // surfaces it instead of coming back empty. It never reaches past the
  // role boundary: an item a role can't open is never searchable by that
  // role either.
  const searchableItems = isSearching
    ? NAV_SECTIONS.flatMap((section) => section.items).filter(hasRole)
    : liveItems;

  const matchedItems = isSearching
    ? searchableItems.filter(
        (item) =>
          item.label.toLowerCase().includes(trimmedQuery) ||
          item.description.toLowerCase().includes(trimmedQuery),
      )
    : searchableItems;

  const visibleItems = matchedItems.slice().sort((a, b) => a.label.localeCompare(b.label));

  // The row containing "Users" always gets the reserved tone, wherever that
  // row lands as the grid reflows across breakpoints.
  const usersIndex = visibleItems.findIndex((item) => item.label === 'Users');
  const usersRow = usersIndex === -1 ? -1 : Math.floor(usersIndex / columns);

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
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const row = Math.floor(index / columns);
            const toneIndex = row === usersRow ? USERS_RESERVED_TONE : (row % TONE_COUNT) + 1;
            const isGreyRow = row % 2 === 1;
            const descriptionId = `mhd-module-desc-${item.route.replace(/^\//, '').replace(/\//g, '-')}`;
            const alertKey = ALERT_ROUTE_KEYS[item.route];
            const alertCount = alertKey ? (moduleAlerts?.[alertKey] ?? 0) : 0;
            const tileLabel =
              alertCount > 0
                ? `${item.label}, ${alertCount} need${alertCount === 1 ? 's' : ''} attention`
                : item.label;

            return (
              <NavLink
                key={item.route}
                to={item.route}
                aria-label={tileLabel}
                aria-describedby={descriptionId}
                className={`mhd-module-card flex flex-col gap-2.5 rounded-lg border border-border p-4 text-foreground ${
                  isGreyRow ? 'bg-[var(--mhd-module-row-grey)]' : 'bg-card'
                }`}
                style={{ '--tone': `var(--mhd-module-tone-${toneIndex})` } as CSSProperties}
              >
                <div className="flex items-center gap-3">
                  <span className="mhd-module-icon relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
                    <Icon className="h-[21px] w-[21px]" aria-hidden />
                    <MhdCountBadge
                      count={alertCount}
                      className="h-[22px] w-[22px] text-[14px]"
                    />
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
              </NavLink>
            );
          })}
        </div>
      )}
    </MhdCard>
  );
}
