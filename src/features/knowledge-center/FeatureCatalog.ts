import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute } from '@/appshell/mhdRouteAccess';
import type { NavItem, NavSection } from '@/appshell/mhdNavSections';
import type { MhdKbArticleListItem } from './Types';
import { mhdKbArticleMatchesPath } from './RouteContext';

export interface MhdFeatureCatalogFeature {
  label: string;
  description: string;
  route: string;
  keywords: string[];
  status: 'live' | 'comingSoon';
  accessible: boolean;
  children: MhdFeatureCatalogFeature[];
  relatedArticles?: MhdKbArticleListItem[];
}

export interface MhdFeatureCatalogSection {
  label: string;
  description?: string;
  features: MhdFeatureCatalogFeature[];
}

export interface MhdFeatureCatalogOptions {
  includeRestricted?: boolean;
}

function buildFeature(
  item: NavItem,
  userRoles: MhdAuthRoleName[],
  options: MhdFeatureCatalogOptions,
): MhdFeatureCatalogFeature | null {
  const accessible = mhdCanAccessRoute(item.route, userRoles);
  const children =
    item.children
      ?.map((child) => buildFeature(child, userRoles, options))
      .filter((child): child is MhdFeatureCatalogFeature => child !== null) ?? [];

  if (!accessible && !options.includeRestricted && children.length === 0) {
    return null;
  }

  return {
    label: item.label,
    description: item.description,
    route: item.route,
    keywords: [...(item.keywords ?? [])],
    status: item.status ?? 'live',
    accessible,
    children,
  };
}

export function buildFeatureCatalog(
  sections: NavSection[],
  userRoles: MhdAuthRoleName[],
  options: MhdFeatureCatalogOptions = {},
): MhdFeatureCatalogSection[] {
  return sections
    .map((section) => ({
      label: section.label,
      description: section.description,
      features: section.items
        .map((item) => buildFeature(item, userRoles, options))
        .filter((item): item is MhdFeatureCatalogFeature => item !== null),
    }))
    .filter((section) => section.features.length > 0);
}

function featureMatchesQuery(feature: MhdFeatureCatalogFeature, query: string): boolean {
  const haystack = [feature.label, feature.description, ...feature.keywords]
    .join(' ')
    .toLowerCase();
  return (
    haystack.includes(query) || feature.children.some((child) => featureMatchesQuery(child, query))
  );
}

function filterFeature(feature: MhdFeatureCatalogFeature, query: string) {
  if (featureMatchesQuery(feature, query)) {
    return feature;
  }

  return null;
}

export function filterFeatureCatalog(
  catalog: MhdFeatureCatalogSection[],
  query: string,
): MhdFeatureCatalogSection[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return catalog;

  return catalog
    .map((section) => ({
      ...section,
      features: section.features
        .map((feature) => filterFeature(feature, normalizedQuery))
        .filter((feature): feature is MhdFeatureCatalogFeature => feature !== null),
    }))
    .filter((section) => section.features.length > 0);
}

function attachToFeature(
  feature: MhdFeatureCatalogFeature,
  articles: MhdKbArticleListItem[],
): MhdFeatureCatalogFeature {
  return {
    ...feature,
    relatedArticles: articles
      .filter((article) => mhdKbArticleMatchesPath(article, feature.route))
      .slice(0, 3),
    children: feature.children.map((child) => attachToFeature(child, articles)),
  };
}

export function attachRelatedArticles(
  catalog: MhdFeatureCatalogSection[],
  articles: MhdKbArticleListItem[],
): MhdFeatureCatalogSection[] {
  return catalog.map((section) => ({
    ...section,
    features: section.features.map((feature) => attachToFeature(feature, articles)),
  }));
}
