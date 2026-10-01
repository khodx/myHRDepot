import { useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import type { NavItem } from '@/appshell/mhdNavSections';
import { useMhdResponsiveColumns, type MhdColumnBreakpoint } from '@/utils/useMhdResponsiveColumns';
import { MhdCountBadge } from './MhdCountBadge';

// 15 tones cycle across rows in order; a 16th is reserved exclusively for
// the row containing "Users" (see mhd-module-tone-16 in global.css) and is
// never entered into this cycle.
const TONE_COUNT = 15;
const USERS_RESERVED_TONE = 16;

// Widest first. A row's tone is assigned by row index, so the column count
// feeds the tone math directly — the grid measures its own container and
// recomputes rows whenever the count changes.
const MODULE_GRID_BREAKPOINTS: readonly MhdColumnBreakpoint[] = [
  { minWidth: 1000, columns: 4 },
  { minWidth: 720, columns: 3 },
  { minWidth: 440, columns: 2 },
];

export interface MhdModuleCardGridProps {
  /**
   * Top-level modules to show, each carrying the children (companion
   * sub-pages) it should nest. The caller has already applied role filtering.
   */
  items: NavItem[];
  /**
   * Module "needs attention" counts keyed by route. A route absent here — or
   * present at zero — shows no badge.
   */
  alertCounts: Readonly<Record<string, number>>;
  /** Accessible name for the search box, e.g. "Search modules". */
  searchLabel?: string;
  searchPlaceholder?: string;
  /** `alphabetical` sorts by label; `given` keeps the caller's order. */
  order?: 'alphabetical' | 'given';
}

function descriptionIdFor(route: string): string {
  return `mhd-module-desc-${route.replace(/^\//, '').replace(/\//g, '-')}`;
}

function attentionLabel(label: string, count: number): string {
  return count > 0 ? `${label}, ${count} need${count === 1 ? 's' : ''} attention` : label;
}

/**
 * The module launcher: a searchable grid of bold, row-toned cards with an
 * attention badge, a lift/glow hover animation, and sub-page chips. Shared by
 * the dashboard and every category landing page so the two can never drift.
 * Border colour, width and shadow come from the .mhd-module-card rule
 * (global.css), driven by the --tone custom property set per row.
 */
export function MhdModuleCardGrid({
  items,
  alertCounts,
  searchLabel = 'Search modules',
  searchPlaceholder = 'Search modules…',
  order = 'alphabetical',
}: MhdModuleCardGridProps) {
  const [query, setQuery] = useState('');
  const [gridRef, columns] = useMhdResponsiveColumns<HTMLDivElement>(MODULE_GRID_BREAKPOINTS);

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // Search additionally reaches every nested child as its own result, but only
  // children the caller passed — nothing past the role boundary.
  const searchPool = items.flatMap((item) => [item, ...(item.children ?? [])]);
  const matched = isSearching
    ? searchPool.filter(
        (item) =>
          item.label.toLowerCase().includes(trimmedQuery) ||
          item.description.toLowerCase().includes(trimmedQuery),
      )
    : items;

  const visibleItems =
    order === 'alphabetical'
      ? matched.slice().sort((a, b) => a.label.localeCompare(b.label))
      : matched;

  const usersIndex = visibleItems.findIndex((item) => item.label === 'Users');
  const usersRow = usersIndex === -1 ? -1 : Math.floor(usersIndex / columns);

  const renderTile = (item: NavItem, toneIndex: number, isGreyRow: boolean) => {
    const Icon = item.icon;
    const descriptionId = descriptionIdFor(item.route);
    const alertCount = alertCounts[item.route] ?? 0;
    const tileLabel = attentionLabel(item.label, alertCount);
    const visibleChildren = isSearching ? [] : (item.children ?? []);
    const cardClassName = `mhd-module-card relative flex flex-col gap-2.5 rounded-lg p-4 text-foreground ${
      isGreyRow ? 'bg-[var(--mhd-module-row-grey)]' : 'bg-card'
    }`;
    const toneStyle = { '--tone': `var(--mhd-module-tone-${toneIndex})` } as CSSProperties;

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
          style={toneStyle}
        >
          {moduleContent}
        </NavLink>
      );
    }

    return (
      <div key={item.route} className={cardClassName} style={toneStyle}>
        <NavLink to={item.route} aria-label={tileLabel} aria-describedby={descriptionId}>
          {moduleContent}
        </NavLink>
        <div className="mt-1 flex flex-wrap gap-2 border-t border-border pt-2">
          {visibleChildren.map((child) => {
            const ChildIcon = child.icon;
            const childDescriptionId = descriptionIdFor(child.route);
            const childAlertCount = alertCounts[child.route] ?? 0;

            return (
              <NavLink
                key={child.route}
                to={child.route}
                aria-label={attentionLabel(child.label, childAlertCount)}
                aria-describedby={childDescriptionId}
                className="relative inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <ChildIcon className="h-3.5 w-3.5" aria-hidden />
                <span>{child.label}</span>
                {child.status === 'comingSoon' ? (
                  <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                    Coming Soon
                  </span>
                ) : null}
                <MhdCountBadge
                  count={childAlertCount}
                  className="-right-2 -top-2 h-[18px] w-auto min-w-[18px] px-1 text-[10px]"
                />
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

  return (
    <>
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
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

      {/* Always mounted so the column measurement survives an empty search. */}
      <div ref={gridRef}>
        {visibleItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No modules match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {visibleItems.map((item, index) => {
              const row = Math.floor(index / columns);
              const toneIndex = row === usersRow ? USERS_RESERVED_TONE : (row % TONE_COUNT) + 1;
              return renderTile(item, toneIndex, row % 2 === 1);
            })}
          </div>
        )}
      </div>
    </>
  );
}
