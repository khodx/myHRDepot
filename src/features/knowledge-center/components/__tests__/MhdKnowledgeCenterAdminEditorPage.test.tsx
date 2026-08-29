import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdKbArticleAdminListItem, MhdKbFunctionAdminListItem } from '../../Types';
const { rolesRef, articlesRef, funcsRef } = vi.hoisted(() => ({
  rolesRef: { current: ['Employee'] as MhdAuthRoleName[] },
  articlesRef: {
    current: {
      data: { items: [] as MhdKbArticleAdminListItem[], totalCount: 0 },
      isLoading: false,
    },
  },
  funcsRef: {
    current: {
      data: { items: [] as MhdKbFunctionAdminListItem[], totalCount: 0 },
      isLoading: false,
    },
  },
}));
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: rolesRef.current }),
}));
vi.mock('../../Hook', () => {
  const mutation = () => ({ mutateAsync: vi.fn(), isPending: false, error: null });
  return {
    useMhdKbArticlesAdmin: () => articlesRef.current,
    useMhdKbFunctionsAdmin: () => funcsRef.current,
    useMhdKbArticleAdmin: () => ({ data: null, isLoading: false }),
    useMhdKbFunctionAdmin: () => ({ data: null, isLoading: false }),
    useMhdArchiveKbArticle: mutation,
    useMhdArchiveKbFunction: mutation,
    useMhdCreateKbArticle: mutation,
    useMhdCreateKbFunction: mutation,
    useMhdPublishKbArticle: mutation,
    useMhdRestoreKbArticle: mutation,
    useMhdRestoreKbFunction: mutation,
    useMhdUpdateKbArticle: mutation,
    useMhdUpdateKbFunction: mutation,
  };
});
import { MhdKnowledgeCenterAdminEditorPage } from '../MhdKnowledgeCenterAdminEditorPage';
const row = {
  id: 'a-1',
  categoryId: 'cat-1',
  slug: 'pto',
  title: 'PTO article',
  summary: null,
  audience: 'both' as const,
  routeContext: [],
  publishedAt: null,
  status: 'published' as const,
  isDeleted: false,
  updatedAt: '2026-08-02',
};
beforeEach(() => {
  vi.clearAllMocks();
  rolesRef.current = ['Employee'];
  articlesRef.current = { data: { items: [], totalCount: 0 }, isLoading: false };
  funcsRef.current = { data: { items: [], totalCount: 0 }, isLoading: false };
});
describe('MhdKnowledgeCenterAdminEditorPage', () => {
  it('denies non-admin roles', () => {
    render(
      <MemoryRouter>
        <MhdKnowledgeCenterAdminEditorPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('You do not have access to content management.')).toBeInTheDocument();
    expect(screen.queryByText('Manage Knowledge Center')).not.toBeInTheDocument();
  });
  it('renders tabs and article rows for a Platform Admin', () => {
    rolesRef.current = ['Platform Admin'];
    articlesRef.current = { data: { items: [row], totalCount: 1 }, isLoading: false };
    render(
      <MemoryRouter>
        <MhdKnowledgeCenterAdminEditorPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getByText('Functions')).toBeInTheDocument();
    expect(screen.getByText('PTO article')).toBeInTheDocument();
  });
});
