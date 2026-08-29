import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdKbArticle } from '../../Types';
const { articleRef } = vi.hoisted(() => ({
  articleRef: { current: { data: null as MhdKbArticle | null, isLoading: false } },
}));
vi.mock('../../Hook', () => ({ useMhdKbArticle: () => articleRef.current }));
import { MhdKnowledgeCenterArticlePage } from '../MhdKnowledgeCenterArticlePage';
const found = {
  id: 'a-1',
  categoryId: 'cat-1',
  slug: 'pto',
  title: 'PTO guidance',
  summary: 'PTO summary',
  audience: 'both' as const,
  routeContext: [],
  publishedAt: null,
  body: 'PTO body',
};
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/knowledge-center/articles/pto']}>
      <Routes>
        <Route
          path="/knowledge-center/articles/:slug"
          element={<MhdKnowledgeCenterArticlePage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  articleRef.current = { data: null, isLoading: false };
});
describe('MhdKnowledgeCenterArticlePage', () => {
  it('renders loading state', () => {
    articleRef.current = { data: null, isLoading: true };
    renderPage();
    expect(screen.getByText('Loading article…')).toBeInTheDocument();
  });
  it('renders a found article', () => {
    articleRef.current = { data: found, isLoading: false };
    renderPage();
    expect(screen.getByText('PTO guidance')).toBeInTheDocument();
    expect(screen.getByText('PTO summary')).toBeInTheDocument();
    expect(screen.getByText('PTO body')).toBeInTheDocument();
  });
  it('renders not found with a back link', () => {
    renderPage();
    expect(screen.getByText('Article not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Knowledge Center' })).toBeInTheDocument();
  });
});
