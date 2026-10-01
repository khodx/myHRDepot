import { describe, expect, it } from 'vitest';
import type { NavSection } from '@/appshell/mhdNavSections';
import type { MhdKbArticleListItem } from '../Types';
import {
  attachRelatedArticles,
  buildFeatureCatalog,
  filterFeatureCatalog,
} from '../FeatureCatalog';

const icon = () => null;

const sections: NavSection[] = [
  {
    label: 'Work Tools',
    description: 'Tools',
    icon,
    items: [
      {
        label: 'Jobs',
        description: 'Manage jobs',
        route: '/jobs',
        icon,
        roles: ['Platform Admin'],
        children: [
          {
            label: 'My Job',
            description: 'Your job',
            route: '/my-job',
            icon,
            roles: ['Employee'],
          },
        ],
      },
      {
        label: 'Onboarding',
        description: 'New hire tools',
        route: '/onboarding',
        icon,
        roles: ['Platform Admin'],
        status: 'comingSoon',
      },
    ],
  },
];

function article(position: number, routeContext: string[]): MhdKbArticleListItem {
  return {
    id: `article-${position}`,
    categoryId: 'category',
    slug: `article-${position}`,
    title: `Article ${position}`,
    summary: null,
    articleType: 'ARTICLE',
    accessLevel: 'PUBLIC',
    companyId: null,
    routeContext,
    publishedAt: '2026-10-01',
  };
}

describe('Feature Catalog builder', () => {
  it('filters features by role and keeps an accessible child under a restricted parent', () => {
    const catalog = buildFeatureCatalog(sections, ['Employee']);

    expect(catalog[0].features).toHaveLength(1);
    expect(catalog[0].features[0].label).toBe('Jobs');
    expect(catalog[0].features[0].accessible).toBe(false);
    expect(catalog[0].features[0].children[0].label).toBe('My Job');
  });

  it('includes restricted features when requested and passes through coming-soon status', () => {
    const catalog = buildFeatureCatalog(sections, ['Employee'], { includeRestricted: true });

    expect(catalog[0].features.map((feature) => feature.label)).toEqual(['Jobs', 'Onboarding']);
    expect(catalog[0].features[1].status).toBe('comingSoon');
    expect(catalog[0].features[1].accessible).toBe(false);
  });

  it('searches child fields while retaining the parent context', () => {
    const catalog = buildFeatureCatalog(sections, ['Employee']);
    const filtered = filterFeatureCatalog(catalog, 'your job');

    expect(filtered[0].features[0].label).toBe('Jobs');
    expect(filtered[0].features[0].children[0].label).toBe('My Job');
  });

  it('attaches at most three stable, route-context-matching articles', () => {
    const catalog = buildFeatureCatalog(sections, ['Employee']);
    const articles = [
      article(1, ['/jobs/*']),
      article(2, ['/jobs']),
      article(3, ['/jobs']),
      article(4, ['/jobs']),
      article(5, ['/unrelated']),
    ];
    const attached = attachRelatedArticles(catalog, articles);

    expect(attached[0].features[0].relatedArticles?.map((item) => item.id)).toEqual([
      'article-1',
      'article-2',
      'article-3',
    ]);
    expect(attached[0].features[0].children[0].relatedArticles).toEqual([]);
  });

  it('does not mutate the navigation input', () => {
    const original = JSON.stringify(sections);

    buildFeatureCatalog(sections, ['Employee'], { includeRestricted: true });

    expect(JSON.stringify(sections)).toBe(original);
  });
});
