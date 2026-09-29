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

  const items = mhdVisibleNavItems(section.items, roles);

  return (
    <div className="space-y-6">
      <MhdPageHeader title={section.label} description={section.description} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No modules in {section.label} are available for your current role.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <MhdCard
              key={item.route}
              className="relative h-full space-y-3 transition-shadow hover:shadow-lg"
            >
              <item.icon className="h-6 w-6 text-accent" aria-hidden />
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-foreground">
                  {/* Stretched link: the whole card is the click target while
                      the child links below stay independently clickable. */}
                  <Link
                    to={item.route}
                    className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-focus-ring focus-visible:after:rounded-lg"
                  >
                    {item.label}
                  </Link>
                  {item.status === 'comingSoon' ? (
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                      Coming Soon
                    </span>
                  ) : null}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
              {(item.children ?? []).length > 0 ? (
                <ul className="relative z-10 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {(item.children ?? []).map((child) => (
                    <li key={child.route}>
                      <Link to={child.route} className="font-medium text-accent hover:underline">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </MhdCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default MhdCategoryLandingPage;
