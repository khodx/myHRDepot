import { Link, Navigate, useParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { NAV_SECTIONS, mhdVisibleNavItems } from '@/appshell/MhdSidebar';

/**
 * Landing page for a left-nav category (Work Tools, People & Org, ...). It is
 * generated from the same NAV_SECTIONS data the rail and the dashboard read,
 * filtered through the same role/parent-promotion rule as the rail
 * (mhdVisibleNavItems), so a category page can never list a module the rail
 * would hide from that role. Each card links to the module's own existing
 * route; nothing here duplicates or moves a module.
 */
export function MhdCategoryLandingPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { roles } = useMhdAuth();

  const section = NAV_SECTIONS.find((s) => s.route === `/categories/${categorySlug}`);
  if (!section) return <Navigate to="/404" replace />;

  // Every module the role can open gets its own card, companion sub-pages
  // (Announcements under Communications, My Memorandums under Memorandums, ...)
  // included, so this page lists exactly what the rail lists. A sub-page's card
  // notes which module it belongs to.
  const cards = mhdVisibleNavItems(section.items, roles).flatMap((item) => [
    { item, parentLabel: undefined as string | undefined },
    ...(item.children ?? []).map((child) => ({ item: child, parentLabel: item.label })),
  ]);

  // A role with nothing in this category is refused exactly like any other
  // route it cannot open (MhdRoleGuardedRoute sends those to /404); the rail
  // already hides such a category, so this only catches a typed URL.
  if (cards.length === 0) return <Navigate to="/404" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader title={section.label} description={section.description} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ item, parentLabel }) => (
          <MhdCard
            key={item.route}
            className="relative h-full space-y-3 transition-shadow hover:shadow-lg"
          >
            <item.icon className="h-6 w-6 text-accent" aria-hidden />
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                {/* Stretched link: the whole card is the click target. */}
                <Link
                  to={item.route}
                  className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-focus-ring"
                >
                  {item.label}
                </Link>
                {item.status === 'comingSoon' ? (
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                    Coming Soon
                  </span>
                ) : null}
              </h2>
              {parentLabel ? (
                <p className="text-xs font-medium text-accent">Part of {parentLabel}</p>
              ) : null}
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          </MhdCard>
        ))}
      </div>
    </div>
  );
}

export default MhdCategoryLandingPage;
