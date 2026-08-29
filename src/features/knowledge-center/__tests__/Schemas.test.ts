import { describe, expect, it } from 'vitest';
import {
  mhdKbArticleFormSchema,
  mhdKbFunctionFormSchema,
  parseMhdKbArticle,
  parseMhdKbArticleAdmin,
  parseMhdKbArticles,
  parseMhdKbArticlesAdmin,
  parseMhdKbCategories,
  parseMhdKbFunction,
  parseMhdKbFunctionAdmin,
  parseMhdKbFunctions,
  parseMhdKbFunctionsAdmin,
} from '../Schemas';

const categoryRow = {
  id: 'cat-1',
  key: 'policies',
  label: 'Policies',
  description: 'HR policies',
  icon: 'book',
  sort_order: 1,
  parent_category_id: null,
};
const articleRow = {
  id: 'article-1',
  category_id: 'cat-1',
  slug: 'pto',
  title: 'Paid time off',
  summary: 'PTO guidance',
  audience: 'both',
  route_context: ['/policies'],
  published_at: '2026-08-01T00:00:00.000Z',
  body: 'PTO details',
};
const functionRow = {
  id: 'function-1',
  name: 'SUM',
  category: 'Math',
  syntax: 'SUM(a,b)',
  related_engine: 'calculator',
  is_deprecated: false,
  description: 'Adds values',
  example_input: 'SUM(1, 2)',
  example_output: '3',
};

describe('Knowledge Center schemas', () => {
  it('maps category rows to camelCase objects', () => {
    expect(parseMhdKbCategories([categoryRow])).toEqual([
      {
        id: 'cat-1',
        key: 'policies',
        label: 'Policies',
        description: 'HR policies',
        icon: 'book',
        sortOrder: 1,
        parentCategoryId: null,
      },
    ]);
  });

  it('maps article lists and total_count', () => {
    expect(parseMhdKbArticles([{ ...articleRow, total_count: 4 }])).toEqual({
      items: [
        {
          id: 'article-1',
          categoryId: 'cat-1',
          slug: 'pto',
          title: 'Paid time off',
          summary: 'PTO guidance',
          audience: 'both',
          routeContext: ['/policies'],
          publishedAt: '2026-08-01T00:00:00.000Z',
        },
      ],
      totalCount: 4,
    });
  });

  it('maps an article row', () => {
    expect(parseMhdKbArticle(articleRow)).toEqual({
      id: 'article-1',
      categoryId: 'cat-1',
      slug: 'pto',
      title: 'Paid time off',
      summary: 'PTO guidance',
      audience: 'both',
      routeContext: ['/policies'],
      publishedAt: '2026-08-01T00:00:00.000Z',
      body: 'PTO details',
    });
  });

  it('maps function lists and total_count', () => {
    expect(parseMhdKbFunctions([{ ...functionRow, total_count: 2 }])).toEqual({
      items: [
        {
          id: 'function-1',
          name: 'SUM',
          category: 'Math',
          syntax: 'SUM(a,b)',
          relatedEngine: 'calculator',
          isDeprecated: false,
        },
      ],
      totalCount: 2,
    });
  });

  it('maps a function row', () => {
    expect(parseMhdKbFunction(functionRow)).toEqual({
      id: 'function-1',
      name: 'SUM',
      category: 'Math',
      syntax: 'SUM(a,b)',
      relatedEngine: 'calculator',
      isDeprecated: false,
      description: 'Adds values',
      exampleInput: 'SUM(1, 2)',
      exampleOutput: '3',
    });
  });

  it('maps admin article lists and total_count', () => {
    expect(
      parseMhdKbArticlesAdmin([
        {
          ...articleRow,
          total_count: 1,
          status: 'published',
          is_deleted: false,
          updated_at: '2026-08-02',
        },
      ]),
    ).toEqual({
      items: [
        {
          id: 'article-1',
          categoryId: 'cat-1',
          slug: 'pto',
          title: 'Paid time off',
          summary: 'PTO guidance',
          audience: 'both',
          routeContext: ['/policies'],
          publishedAt: '2026-08-01T00:00:00.000Z',
          status: 'published',
          isDeleted: false,
          updatedAt: '2026-08-02',
        },
      ],
      totalCount: 1,
    });
  });

  it('maps an admin article row', () => {
    expect(
      parseMhdKbArticleAdmin({
        ...articleRow,
        search_keywords: 'pto',
        status: 'draft',
        is_deleted: false,
        updated_at: '2026-08-02',
      }),
    ).toMatchObject({
      categoryId: 'cat-1',
      searchKeywords: 'pto',
      status: 'draft',
      isDeleted: false,
      updatedAt: '2026-08-02',
      body: 'PTO details',
    });
  });

  it('maps admin function lists and total_count', () => {
    expect(
      parseMhdKbFunctionsAdmin([
        {
          ...functionRow,
          total_count: 1,
          audience: 'internal',
          is_deleted: false,
          updated_at: '2026-08-02',
        },
      ]),
    ).toEqual({
      items: [
        {
          id: 'function-1',
          name: 'SUM',
          category: 'Math',
          syntax: 'SUM(a,b)',
          relatedEngine: 'calculator',
          isDeprecated: false,
          audience: 'internal',
          isDeleted: false,
          updatedAt: '2026-08-02',
        },
      ],
      totalCount: 1,
    });
  });

  it('maps an admin function row', () => {
    expect(
      parseMhdKbFunctionAdmin({
        ...functionRow,
        audience: 'end_user',
        is_deleted: false,
        updated_at: '2026-08-02',
      }),
    ).toMatchObject({
      id: 'function-1',
      name: 'SUM',
      description: 'Adds values',
      audience: 'end_user',
      isDeleted: false,
      updatedAt: '2026-08-02',
    });
  });

  it('rejects forms with a missing required title or name', () => {
    expect(
      mhdKbArticleFormSchema.safeParse({
        categoryId: 'cat-1',
        slug: 'x',
        title: '',
        summary: '',
        body: '',
        audience: 'both',
        routeContext: '',
        searchKeywords: '',
      }).success,
    ).toBe(false);
    expect(
      mhdKbFunctionFormSchema.safeParse({
        name: '',
        category: 'Math',
        syntax: 'x',
        description: 'x',
        exampleInput: '',
        exampleOutput: '',
        relatedEngine: 'calculator',
        audience: 'both',
        isDeprecated: false,
      }).success,
    ).toBe(false);
  });
});
