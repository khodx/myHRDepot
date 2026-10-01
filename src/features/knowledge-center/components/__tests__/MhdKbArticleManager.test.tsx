import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdKbArticleManager } from '../MhdKbArticleManager';

const state = vi.hoisted(() => ({
  args: null as Record<string, unknown> | null,
  result: {
    data: {
      items: [
        {
          id: 'a-1',
          categoryId: 'c-1',
          slug: 'faq',
          title: 'How do I enroll?',
          summary: null,
          articleType: 'FAQ' as const,
          accessLevel: 'COMPANY' as const,
          companyId: 'company-1',
          routeContext: [],
          publishedAt: null,
          complianceRegistryId: 'registry-1',
          status: 'draft' as const,
          isDeleted: false,
          updatedAt: '2026-10-01',
        },
      ],
      totalCount: 1,
    },
    isLoading: false,
  },
  errorMutation: false,
}));

vi.mock('../../Hook', () => {
  const mutation = () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: state.errorMutation ? new Error('server message') : null,
  });
  return {
    useMhdKbArticlesAdmin: (args: Record<string, unknown>) => {
      state.args = args;
      return state.result;
    },
    useMhdKbArticleAdmin: () => ({ data: null, isLoading: false }),
    useMhdCreateKbArticle: mutation,
    useMhdUpdateKbArticle: mutation,
    useMhdPublishKbArticle: mutation,
    useMhdArchiveKbArticle: mutation,
    useMhdRestoreKbArticle: mutation,
  };
});

vi.mock('../MhdKbArticleForm', () => ({
  MhdKbArticleForm: () => <div>Article form</div>,
}));

describe('MhdKbArticleManager', () => {
  beforeEach(() => {
    state.args = null;
    state.errorMutation = false;
  });

  it('passes scope and company id, filters by type, and shows regulated status', () => {
    render(<MhdKbArticleManager scope="COMPANY" companyId="company-1" />);
    expect(state.args).toMatchObject({ scope: 'COMPANY', companyId: 'company-1' });
    expect(screen.getByText('Regulated')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'ARTICLE' } });
    expect(state.args).toMatchObject({ articleType: 'ARTICLE' });
  });

  it('shows the server mutation error in the alert', () => {
    state.errorMutation = true;
    render(<MhdKbArticleManager scope="PLATFORM" companyId={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('server message');
  });
});
