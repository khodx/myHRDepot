import { Navigate, useParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdModuleCardGrid } from '@/components/ui/MhdModuleCardGrid';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdModuleAlerts } from '@/features/module-alerts/Hook';
import { NAV_SECTIONS, mhdVisibleNavItems } from '@/appshell/mhdNavSections';

/**
 * Landing page for a left-nav category (Work Tools, People & Org, ...). It is
 * generated from the same NAV_SECTIONS data the rail and the dashboard read,
 * filtered through the same role/parent-promotion rule as the rail
 * (mhdVisibleNavItems), so a category page can never list a module the rail
 * would hide from that role. The cards are the dashboard's own module cards
 * (MhdModuleCardGrid) — same tones, animation, badges and sub-page chips; each
 * links to the module's own existing route and nothing here duplicates or
 * moves a module.
 */
export function MhdCategoryLandingPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { roles } = useMhdAuth();
  const { counts } = useMhdModuleAlerts();

  const section = NAV_SECTIONS.find((s) => s.route === `/categories/${categorySlug}`);
  if (!section) return <Navigate to="/404" replace />;

  // Companion sub-pages (Announcements under Communications, My Memorandums
  // under Memorandums, ...) ride on their parent card as chips, exactly as on
  // the dashboard, so this page lists everything the rail lists.
  const items = mhdVisibleNavItems(section.items, roles);

  // A role with nothing in this category is refused exactly like any other
  // route it cannot open (MhdRoleGuardedRoute sends those to /404); the rail
  // already hides such a category, so this only catches a typed URL.
  if (items.length === 0) return <Navigate to="/404" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader title={section.label} description={section.description} />

      <MhdCard elevated>
        <MhdModuleCardGrid
          items={items}
          alertCounts={counts}
          order="given"
          searchLabel={`Search ${section.label}`}
          searchPlaceholder={`Search ${section.label}…`}
        />
      </MhdCard>
    </div>
  );
}

export default MhdCategoryLandingPage;
