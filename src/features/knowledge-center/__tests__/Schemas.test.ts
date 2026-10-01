import { describe, expect, it } from 'vitest';
import {
  mhdKbArticleFormSchema,
  mhdKbFunctionFormSchema,
  parseMhdKbArticle,
  parseMhdKbArticles,
  parseMhdKbComplianceEntries,
  parseMhdKbSearchResults,
} from '../Schemas';

const article = {
  id: 'a-1',
  category_id: 'c-1',
  slug: 'pto',
  title: 'PTO',
  summary: 'Summary',
  article_type: 'ARTICLE',
  access_level: 'PUBLIC',
  company_id: null,
  route_context: [],
  published_at: null,
  body: 'Details',
  body_format: 'plain',
};
describe('Knowledge Center schemas', () => {
  it('parses the new article shape', () =>
    expect(parseMhdKbArticle(article)).toMatchObject({
      articleType: 'ARTICLE',
      accessLevel: 'PUBLIC',
      companyId: null,
      bodyFormat: 'plain',
    }));
  it('parses article totals', () =>
    expect(parseMhdKbArticles([{ ...article, total_count: 2 }]).totalCount).toBe(2));
  it('parses search results and total_count', () => {
    expect(
      parseMhdKbSearchResults([
        { ...article, snippet: 'PTO <mark>details</mark>', rank: 0.4, total_count: 1 },
      ]),
    ).toEqual({
      items: [
        {
          id: 'a-1',
          categoryId: 'c-1',
          slug: 'pto',
          title: 'PTO',
          summary: 'Summary',
          snippet: 'PTO <mark>details</mark>',
          articleType: 'ARTICLE',
          accessLevel: 'PUBLIC',
          companyId: null,
          publishedAt: null,
          rank: 0.4,
        },
      ],
      totalCount: 1,
    });
  });
  it('parses compliance entries', () => {
    expect(
      parseMhdKbComplianceEntries([
        {
          id: 'r-1',
          content_key: 'pto',
          version: 1,
          review_status: 'approved',
          production_enabled: true,
          authority_name: 'DOL',
          source_url: null,
        },
      ]),
    ).toEqual([
      {
        id: 'r-1',
        contentKey: 'pto',
        version: 1,
        reviewStatus: 'approved',
        productionEnabled: true,
        authorityName: 'DOL',
        sourceUrl: null,
      },
    ]);
  });
  it('allows a blank slug and rejects the old audience vocabulary', () => {
    const base = {
      categoryId: 'c-1',
      slug: '',
      articleType: 'ARTICLE',
      title: 'Title',
      summary: '',
      body: '',
      accessLevel: 'PUBLIC',
      complianceRegistryId: null,
      routeContext: '',
      searchKeywords: '',
    };
    expect(mhdKbArticleFormSchema.safeParse(base).success).toBe(true);
    expect(mhdKbArticleFormSchema.safeParse({ ...base, accessLevel: 'end_user' }).success).toBe(
      false,
    );
    expect(
      mhdKbFunctionFormSchema.safeParse({
        name: 'SUM',
        category: 'Math',
        syntax: 'x',
        description: 'x',
        exampleInput: '',
        exampleOutput: '',
        relatedEngine: 'calculator',
        accessLevel: 'ADMIN',
        isDeprecated: false,
      }).success,
    ).toBe(true);
  });
});
