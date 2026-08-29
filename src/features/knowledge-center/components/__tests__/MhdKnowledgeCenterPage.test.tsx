import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdKbArticleListItem, MhdKbCategory } from '../../Types';

const { categoriesRef, articlesRef, rolesRef } = vi.hoisted(() => ({
  categoriesRef: {
    current: { data: [] as MhdKbCategory[], isLoading: false, isSuccess: true },
  },
  articlesRef: {
    current: { data: { items: [] as MhdKbArticleListItem[], totalCount: 0 }, isLoading: false },
  },
  rolesRef: { current: ['Employee'] as MhdAuthRoleName[] },
}));
vi.mock('../../Hook', () => ({
  useMhdKbCategories: () => categoriesRef.current,
  useMhdKbArticles: () => articlesRef.current,
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
  audience: 'both' as const,
  routeContext: [],
  publishedAt: '2026-08-01',
};
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
  rolesRef.current = ['Employee'];
});

describe('MhdKnowledgeCenterPage', () => {
  it('renders category cards without a category key', () => {
    renderPage('/knowledge-center');
    expect(screen.getByText('Policies')).toBeInTheDocument();
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
    ['HR Partner', true],
    ['Employee', false],
  ])('shows Manage Content for %s: %s', (role, visible) => {
    rolesRef.current = [role];
    renderPage('/knowledge-center');
    if (visible) expect(screen.getByText('Manage Content')).toBeInTheDocument();
    else expect(screen.queryByText('Manage Content')).not.toBeInTheDocument();
  });
});
