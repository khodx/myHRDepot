import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdQuote } from '@/features/quotes/Types';
import { MhdDashboardQuoteOfTheDay } from '../MhdDashboardQuoteOfTheDay';

const mockUseMhdQuoteOfTheDay = vi.fn();
vi.mock('@/features/quotes/Hook', () => ({
  useMhdQuoteOfTheDay: () => mockUseMhdQuoteOfTheDay(),
}));

const quote: MhdQuote = {
  id: 'quote-001',
  quoteText: 'Progress is built one careful step at a time.',
  author: 'Jane Doe',
  sourceCitation: 'Internal handbook page 4',
  isActive: true,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-02T10:00:00.000Z',
};

describe('MhdDashboardQuoteOfTheDay', () => {
  beforeEach(() => {
    mockUseMhdQuoteOfTheDay.mockReset();
  });

  it('renders nothing before the quote resolves', () => {
    mockUseMhdQuoteOfTheDay.mockReturnValue({ data: undefined });
    const { container } = render(<MhdDashboardQuoteOfTheDay />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders quote text and author once data resolves', () => {
    mockUseMhdQuoteOfTheDay.mockReturnValue({ data: quote });
    render(<MhdDashboardQuoteOfTheDay />);

    expect(screen.getByText(/Progress is built one careful step at a time\./)).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
  });

  it('renders quote text without a bare attribution line when author is null', () => {
    mockUseMhdQuoteOfTheDay.mockReturnValue({ data: { ...quote, author: null } });
    render(<MhdDashboardQuoteOfTheDay />);

    expect(screen.getByText(/Progress is built one careful step at a time\./)).toBeInTheDocument();
    expect(screen.queryByText(/^—\s*$/)).not.toBeInTheDocument();
  });

  it('does not render sourceCitation or other non-display fields', () => {
    mockUseMhdQuoteOfTheDay.mockReturnValue({ data: quote });
    render(<MhdDashboardQuoteOfTheDay />);

    expect(screen.queryByText(quote.sourceCitation ?? '')).not.toBeInTheDocument();
    expect(screen.queryByText(quote.id)).not.toBeInTheDocument();
    expect(screen.queryByText(quote.createdAt)).not.toBeInTheDocument();
    expect(screen.queryByText(quote.updatedAt)).not.toBeInTheDocument();
  });

  it('renders the quote on a single non-wrapping line', () => {
    mockUseMhdQuoteOfTheDay.mockReturnValue({ data: quote });
    render(<MhdDashboardQuoteOfTheDay />);

    expect(screen.getByText(/Progress is built one careful step at a time\./)).toHaveClass(
      'whitespace-nowrap',
    );
  });
});
