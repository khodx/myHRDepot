import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdKbArticleListItem, MhdKbCategory, MhdKbSearchResult } from '../../Types';

const { categoriesRef, articlesRef, searchRef, searchArgsRef, rolesRef } = vi.hoisted(() => ({
  categoriesRef: {
    current: { data: [] as MhdKbCategory[], isLoading: false, isSuccess: true },
  },
  articlesRef: {
    current: { data: { items: [] as MhdKbArticleListItem[], totalCount: 0 }, isLoading: false },
  },
  searchRef: {
    current: {
      data: { items: [] as MhdKbSearchResult[], totalCount: 0 },
      isLoading: false,
      isError: false,
    },
  },
  searchArgsRef: {
    current: { query: '', articleType: undefined as 'ARTICLE' | 'FAQ' | undefined },
  },
  rolesRef: { current: ['Employee'] as MhdAuthRoleName[] },
}));
vi.mock('../../Hook', () => ({
  useMhdKbCategories: () => categoriesRef.current,
  useMhdKbArticles: () => articlesRef.current,
  // FAQ accordions call this lazily; no answer is loaded until a question is expanded.
  useMhdKbArticle: () => ({ data: null, isLoading: false, isError: false }),
  useMhdKbSearch: (args: typeof searchArgsRef.current) => {
    searchArgsRef.current = args;
    return searchRef.current;
  },
}));
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: rolesRef.current }),
}));
import { MhdKnowledgeCenterPage } from '../MhdKnowledgeCenterPage';

const category = {
  id: 'cat-1',
  key: 'policies',
  label: 'Policies',
  description: 'HR policies',
  icon: null,
  sortOrder: 1,
  parentCategoryId: null,
};
const article = {
  id: 'a-1',
  categoryId: 'cat-1',
  slug: 'pto',
  title: 'PTO guidance',
  summary: 'Summary',
  articleType: 'ARTICLE' as const,
  accessLevel: 'PUBLIC' as const,
  companyId: null,
  routeContext: [],
  publishedAt: '2026-08-01',
};
function searchResult(position: number): MhdKbSearchResult {
  return {
    id: `result-${position}`,
    categoryId: 'cat-1',
    slug: `pto-${position}`,
    title: `PTO guidance ${position}`,
    summary: 'Summary',
    snippet: `PTO <mark>guidance</mark> ${position}`,
    articleType: 'ARTICLE',
    accessLevel: 'PUBLIC',
    companyId: null,
    publishedAt: '2026-08-01',
    rank: 1,
  };
}
function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/knowledge-center" element={<MhdKnowledgeCenterPage />} />
        <Route path="/knowledge-center/:categoryKey" element={<MhdKnowledgeCenterPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  categoriesRef.current = { data: [category], isLoading: false, isSuccess: true };
  articlesRef.current = { data: { items: [article], totalCount: 1 }, isLoading: false };
  searchRef.current = { data: { items: [], totalCount: 0 }, isLoading: false, isError: false };
  searchArgsRef.current = { query: '', articleType: undefined };
  rolesRef.current = ['Employee'];
});

describe('MhdKnowledgeCenterPage', () => {
  it('renders category cards without a category key', () => {
    renderPage('/knowledge-center');
    expect(screen.getByText('Policies')).toBeInTheDocument();
  });
  it('uses the URL query and type filter and keeps short queries in browse mode', () => {
    renderPage('/knowledge-center?q=a&type=FAQ');
    expect(searchArgsRef.current).toEqual({ query: 'a', articleType: 'FAQ' });
    expect(screen.getByText('Browse Categories')).toBeInTheDocument();
  });
  it('shows search results at the two-character threshold', () => {
    searchRef.current = {
      data: { items: [searchResult(1)], totalCount: 1 },
      isLoading: false,
      isError: false,
    };
    renderPage('/knowledge-center?q=pt');
    expect(screen.getByText('PTO guidance 1')).toBeInTheDocument();
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });
  it('pages search results in memory, twenty at a time', () => {
    const items = Array.from({ length: 25 }, (_, index) => searchResult(index + 1));
    searchRef.current = { data: { items, totalCount: 25 }, isLoading: false, isError: false };
    renderPage('/knowledge-center?q=pto');
    expect(screen.getByText('PTO guidance 20')).toBeInTheDocument();
    expect(screen.queryByText('PTO guidance 21')).not.toBeInTheDocument();
    expect(screen.getByText('25 results')).toBeInTheDocument();
  });
  it('says so when the server has more matches than were fetched', () => {
    const items = Array.from({ length: 3 }, (_, index) => searchResult(index + 1));
    searchRef.current = { data: { items, totalCount: 140 }, isLoading: false, isError: false };
    renderPage('/knowledge-center?q=pto');
    expect(screen.getByText(/Showing the 3 best matches/)).toBeInTheDocument();
  });
  it('ignores an unknown type value in the URL', () => {
    renderPage('/knowledge-center?q=pto&type=bogus');
    expect(searchArgsRef.current.articleType).toBeUndefined();
  });
  it('renders articles for a matching category', () => {
    renderPage('/knowledge-center/policies');
    expect(screen.getByText('PTO guidance')).toBeInTheDocument();
  });
  it('renders not found for an unknown category after categories resolve', () => {
    renderPage('/knowledge-center/missing');
    expect(screen.getByText('This knowledge center category was not found.')).toBeInTheDocument();
  });
  it.each<[MhdAuthRoleName, boolean]>([
    ['Platform Admin', true],
    ['HR Partner', false],
    ['Employee', false],
  ])('shows Manage Content for %s: %s', (role, visible) => {
    rolesRef.current = [role];
    renderPage('/knowledge-center');
    if (visible) expect(screen.getByText('Manage Content')).toBeInTheDocument();
    else expect(screen.queryByText('Manage Content')).not.toBeInTheDocument();
  });
});
