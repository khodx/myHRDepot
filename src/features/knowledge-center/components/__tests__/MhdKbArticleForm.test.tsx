import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdKbArticleForm } from '../MhdKbArticleForm';

vi.mock('../../Hook', () => ({
  useMhdKbCategories: () => ({ data: [{ id: 'c-1', label: 'Policies' }] }),
  useMhdKbComplianceEntries: () => ({
    data: [
      {
        id: 'r-1',
        contentKey: 'pto-policy',
        version: 2,
        reviewStatus: 'approved',
        productionEnabled: true,
      },
    ],
  }),
}));
vi.mock('@/components/ui/MhdRichText', () => ({
  MhdRichTextEditor: (props: { label: string; html: string }) => (
    <div data-testid="rich-editor" data-html={props.html}>
      {props.label}
    </div>
  ),
}));

const props = {
  onSubmit: vi.fn(async () => undefined),
  onCancel: vi.fn(),
  isSubmitting: false,
};

describe('MhdKbArticleForm', () => {
  it('relables FAQ fields, upgrades plain text, and shows platform-only fields', () => {
    render(
      <MhdKbArticleForm
        {...props}
        scope="PLATFORM"
        article={{
          id: 'a-1',
          categoryId: 'c-1',
          slug: 'faq',
          title: 'How?',
          summary: null,
          articleType: 'FAQ',
          accessLevel: 'PUBLIC',
          companyId: null,
          routeContext: [],
          publishedAt: null,
          body: 'Plain answer',
          bodyFormat: 'plain',
          complianceRegistryId: null,
          searchKeywords: '',
          status: 'draft',
          isDeleted: false,
          updatedAt: '2026-10-01',
        }}
      />,
    );
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('Answer')).toBeInTheDocument();
    expect(screen.getByLabelText(/Slug \(Optional\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Compliance Entry/)).toBeInTheDocument();
    expect(screen.getByText('pto-policy — version 2 (approved)')).toBeInTheDocument();
    expect(screen.getByTestId('rich-editor')).toHaveAttribute('data-html', '<p>Plain answer</p>');
  });

  it('hides slug and compliance fields for company scope', () => {
    render(<MhdKbArticleForm {...props} scope="COMPANY" />);
    expect(screen.queryByLabelText(/Slug \(Optional\)/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Compliance Entry/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Access Level')).toHaveValue('COMPANY');
  });
});
