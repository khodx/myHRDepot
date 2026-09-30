import { NAV_SECTIONS } from './mhdNavSections';
import type { MhdBreadcrumbItem } from './components/MhdBreadcrumb';

/**
 * The location trail for a routed nav destination: category landing page,
 * then (for a companion sub-page) its parent module, then the page itself —
 * `Time & Leave › Leaves › Leave Policy Library`.
 *
 * The rail only lists categories, so this trail is what tells a person where
 * a module sits and gets them back to the category's landing page. It is
 * derived from NAV_SECTIONS, the same data the rail, the landing pages and
 * the dashboard read, so it cannot drift from them.
 *
 * Returns undefined for a route that is not itself a nav destination (a
 * record detail page, the landing page, the dashboard) and for a
 * single-module category, which has no landing page to link back to.
 */
export function mhdNavTrailForRoute(route: string): MhdBreadcrumbItem[] | undefined {
  for (const section of NAV_SECTIONS) {
    if (!section.route) continue;
    for (const item of section.items) {
      if (item.route === route) {
        return [{ label: section.label, to: section.route }, { label: item.label }];
      }
      const child = (item.children ?? []).find((candidate) => candidate.route === route);
      if (child) {
        return [
          { label: section.label, to: section.route },
          { label: item.label, to: item.route },
          { label: child.label },
        ];
      }
    }
  }
  return undefined;
}

/** The trail leading up to (not including) a nav destination, for prefixing a page's own crumbs. */
export function mhdNavTrailBefore(route: string): MhdBreadcrumbItem[] {
  return mhdNavTrailForRoute(route)?.slice(0, -1) ?? [];
}
