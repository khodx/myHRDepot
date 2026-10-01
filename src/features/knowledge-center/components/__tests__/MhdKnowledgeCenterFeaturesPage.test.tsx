import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdKbArticleListItem } from '../../Types';

const { rolesRef, articlesRef } = vi.hoisted(() => ({
  rolesRef: { current: ['Employee'] as MhdAuthRoleName[] },
  articlesRef: {
    current: {
      data: [] as MhdKbArticleListItem[],
      isLoading: false,
      isError: false,
    },
  },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: rolesRef.current }),
}));
vi.mock('../../Hook', () => ({
  useMhdKbPublishedArticleRoutes: () => articlesRef.current,
}));

import { MhdKnowledgeCenterFeaturesPage } from '../MhdKnowledgeCenterFeaturesPage';

function renderPage(path = '/knowledge-center/features') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/knowledge-center/features" element={<MhdKnowledgeCenterFeaturesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  rolesRef.current = ['Employee'];
  articlesRef.current = { data: [], isLoading: false, isError: false };
});

describe('MhdKnowledgeCenterFeaturesPage', () => {
  it('renders sections and role-visible features', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Feature Catalog' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Work Tools' })).toBeInTheDocument();
    expect(screen.getByText('Knowledge Center')).toBeInTheDocument();
  });

  it('uses the URL query for filtering', () => {
    renderPage('/knowledge-center/features?q=training');

    expect(screen.getByDisplayValue('training')).toBeInTheDocument();
  });

  it('shows restricted features after enabling the toggle', () => {
    renderPage();
    fireEvent.click(screen.getByLabelText('Include Features Outside My Role'));

    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0);
  });

  it('renders help links from matching published articles', () => {
    articlesRef.current = {
      data: [
        {
          id: 'help-1',
          categoryId: 'category',
          slug: 'tasks-help',
          title: 'Tasks Help',
          summary: null,
          articleType: 'ARTICLE',
          accessLevel: 'PUBLIC',
          companyId: null,
          routeContext: ['/tasks'],
          publishedAt: '2026-10-01',
        },
      ],
      isLoading: false,
      isError: false,
    };
    renderPage();

    expect(screen.getByRole('link', { name: 'Tasks Help' })).toHaveAttribute(
      'href',
      '/knowledge-center/articles/tasks-help',
    );
  });

  it('shows the empty state when the search matches nothing', () => {
    renderPage('/knowledge-center/features?q=does-not-exist');

    expect(screen.getByText('No features found')).toBeInTheDocument();
  });
});
