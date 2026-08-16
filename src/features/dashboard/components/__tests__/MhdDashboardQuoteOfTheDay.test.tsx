import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdQuote } from '@/features/quotes/Types';

const MHD_QUOTE_ROTATION_MS = 20000;

const mockUseMhdRandomQuote = vi.fn();
vi.mock('@/features/quotes/Hook', () => ({
  useMhdRandomQuote: () => mockUseMhdRandomQuote(),
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

async function flushQuoteFade() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe('MhdDashboardQuoteOfTheDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      return window.setTimeout(() => cb(0), 0);
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      window.clearTimeout(id);
    });
    mockUseMhdRandomQuote.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders nothing before the first quote resolves', async () => {
    const { container } = await renderQuote({ data: undefined, refetch: vi.fn() });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders quote text and author once data resolves', async () => {
    await renderQuote({ data: quote, refetch: vi.fn() });
    await flushQuoteFade();

    expect(screen.getByText(/Progress is built one careful step at a time\./)).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
  });

  it('renders quote text without a bare attribution line when author is null', async () => {
    await renderQuote({
      data: { ...quote, author: null },
      refetch: vi.fn(),
    });
    await flushQuoteFade();

    expect(screen.getByText(/Progress is built one careful step at a time\./)).toBeInTheDocument();
    expect(screen.queryByText(/^—\s*$/)).not.toBeInTheDocument();
  });

  it('does not render sourceCitation or other non-display fields', async () => {
    await renderQuote({ data: quote, refetch: vi.fn() });
    await flushQuoteFade();

    expect(screen.queryByText(quote.sourceCitation ?? '')).not.toBeInTheDocument();
    expect(screen.queryByText(quote.id)).not.toBeInTheDocument();
    expect(screen.queryByText(quote.createdAt)).not.toBeInTheDocument();
    expect(screen.queryByText(quote.updatedAt)).not.toBeInTheDocument();
  });

  it('refetches on the quote rotation interval', async () => {
    const refetch = vi.fn();
    await renderQuote({ data: quote, refetch });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MHD_QUOTE_ROTATION_MS);
    });

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

async function renderQuote(result: {
  data: MhdQuote | null | undefined;
  refetch: ReturnType<typeof vi.fn>;
}) {
  mockUseMhdRandomQuote.mockReturnValue(result);
  const { MhdDashboardQuoteOfTheDay } = await import('../MhdDashboardQuoteOfTheDay');
  return render(<MhdDashboardQuoteOfTheDay />);
}
