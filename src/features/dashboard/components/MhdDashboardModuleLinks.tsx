import { useEffect, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { useMhdAuth } from '@/features/authentication/Hook';
import { NAV_SECTIONS } from '@/appshell/MhdSidebar';
import type { NavItem, NavSection } from '@/appshell/MhdSidebar';

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
  const columns = useMhdModuleGridColumns();

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));
  const isLive = (item: NavItem) => item.status !== 'comingSoon';

  const visibleSections: NavSection[] = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasRole(item) && isLive(item)),
  })).filter((section) => section.items.length > 0);

  if (visibleSections.length === 0) return null;

  const visibleItems = visibleSections
    .flatMap((section) => section.items)
    .sort((a, b) => a.label.localeCompare(b.label));

  // The row containing "Users" always gets the reserved tone, wherever that
  // row lands as the grid reflows across breakpoints.
  const usersIndex = visibleItems.findIndex((item) => item.label === 'Users');
  const usersRow = usersIndex === -1 ? -1 : Math.floor(usersIndex / columns);

  return (
    <MhdCard>
      <MhdCardHeader title={<span className="text-xl font-bold">Modules</span>} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const row = Math.floor(index / columns);
          const toneIndex = row === usersRow ? USERS_RESERVED_TONE : (row % TONE_COUNT) + 1;
          const isGreyRow = row % 2 === 1;
          const descriptionId = `mhd-module-desc-${item.route.replace(/^\//, '').replace(/\//g, '-')}`;

          return (
            <NavLink
              key={item.route}
              to={item.route}
              aria-label={item.label}
              aria-describedby={descriptionId}
              className={`mhd-module-card flex flex-col gap-2.5 rounded-lg border border-border p-4 text-foreground ${
                isGreyRow ? 'bg-muted' : 'bg-card'
              }`}
              style={{ '--tone': `var(--mhd-module-tone-${toneIndex})` } as CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="mhd-module-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
                  <Icon className="h-[21px] w-[21px]" aria-hidden />
                </span>
                <span className="truncate text-[16.5px] font-bold">{item.label}</span>
              </div>
              <p id={descriptionId} className="text-[12.5px] leading-snug text-muted-foreground">
                {item.description}
              </p>
            </NavLink>
          );
        })}
      </div>
    </MhdCard>
  );
}
