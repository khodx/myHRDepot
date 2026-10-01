import type { MhdKbArticleListItem } from './Types';

/**
 * Does an article's `routeContext` cover this page?
 *
 * An entry matches its own path exactly. A `/*`-suffixed entry means "this page
 * and everything below it", so `/leaves/*` matches `/leaves` as well as
 * `/leaves/123/intake`. It does not match a sibling that merely shares a prefix
 * (`/leaves-archive`).
 */
export function mhdKbArticleMatchesPath(
  article: Pick<MhdKbArticleListItem, 'routeContext'>,
  pathname: string,
): boolean {
  return article.routeContext.some((route) => {
    if (route === pathname) return true;
    if (!route.endsWith('/*')) return false;
    const base = route.slice(0, -2);
    return pathname === base || pathname.startsWith(`${base}/`);
  });
}
