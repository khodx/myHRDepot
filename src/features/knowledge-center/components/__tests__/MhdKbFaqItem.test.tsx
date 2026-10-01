import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { MhdKbArticleListItem } from '../../Types';

const { articleRef, articleHook } = vi.hoisted(() => ({
  articleRef: { current: { data: null, isLoading: false, isError: false } },
  articleHook: vi.fn(() => articleRef.current),
}));
vi.mock('../../Hook', () => ({ useMhdKbArticle: articleHook }));
import { MhdKbFaqItem } from '../MhdKbFaqItem';

const faq = {
  id: 'faq-1',
  categoryId: 'cat-1',
  slug: 'faq-one',
  title: 'How do I request time off?',
  summary: null,
  articleType: 'FAQ',
  accessLevel: 'PUBLIC',
  companyId: null,
  routeContext: [],
  publishedAt: null,
} satisfies MhdKbArticleListItem;

describe('MhdKbFaqItem', () => {
  it('fetches the answer only after expansion', async () => {
    render(<MhdKbFaqItem faq={faq} />, { wrapper: MemoryRouter });
    expect(articleHook).toHaveBeenCalledWith('');
    await screen.getByRole('button', { name: faq.title }).click();
    expect(articleHook).toHaveBeenLastCalledWith('faq-one');
  });
});
