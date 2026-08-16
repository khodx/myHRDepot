import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdQuote } from '@/features/quotes/Types';

const mockUseMhdQuotes = vi.fn();
const mockUseMhdCreateQuote = vi.fn();
const mockUseMhdUpdateQuote = vi.fn();
const mockUseMhdDeleteQuote = vi.fn();

vi.mock('@/features/quotes/Hook', () => ({
  useMhdQuotes: () => mockUseMhdQuotes(),
  useMhdCreateQuote: () => mockUseMhdCreateQuote(),
  useMhdUpdateQuote: () => mockUseMhdUpdateQuote(),
  useMhdDeleteQuote: () => mockUseMhdDeleteQuote(),
}));

const activeQuote: MhdQuote = {
  id: 'quote-001',
  quoteText: 'Progress is built one careful step at a time.',
  author: 'Jane Doe',
  sourceCitation: 'Internal handbook',
  isActive: true,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-02T10:00:00.000Z',
};

const inactiveQuote: MhdQuote = {
  id: 'quote-002',
  quoteText: 'Make the right thing easier to do.',
  author: null,
  sourceCitation: null,
  isActive: false,
  createdAt: '2026-08-03T10:00:00.000Z',
  updatedAt: '2026-08-04T10:00:00.000Z',
};

const createQuote = vi.fn();
const updateQuote = vi.fn();
const deleteQuote = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  createQuote.mockResolvedValue(activeQuote);
  updateQuote.mockResolvedValue(activeQuote);
  deleteQuote.mockResolvedValue(undefined);
  mockUseMhdQuotes.mockReturnValue({
    data: [activeQuote, inactiveQuote],
    isLoading: false,
    isError: false,
  });
  mockUseMhdCreateQuote.mockReturnValue({
    mutateAsync: createQuote,
    isPending: false,
    isError: false,
  });
  mockUseMhdUpdateQuote.mockReturnValue({
    mutateAsync: updateQuote,
    isPending: false,
    isError: false,
  });
  mockUseMhdDeleteQuote.mockReturnValue({
    mutateAsync: deleteQuote,
    isPending: false,
    isError: false,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MhdAdminQuotesSection', () => {
  it('renders the quote list from useMhdQuotes data', async () => {
    await renderAdminQuotesSection();

    expect(screen.getByText(activeQuote.quoteText)).toBeInTheDocument();
    expect(screen.getByText(activeQuote.author ?? '')).toBeInTheDocument();
    expect(screen.getByText(activeQuote.sourceCitation ?? '')).toBeInTheDocument();
    expect(screen.getByText(inactiveQuote.quoteText)).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('opens the create form and submits entered values to the create mutation', async () => {
    const user = userEvent.setup();
    await renderAdminQuotesSection();

    await user.click(screen.getByRole('button', { name: 'New quote' }));
    await user.type(screen.getByLabelText('Quote text'), 'A new dashboard quote');
    await user.type(screen.getByLabelText('Author'), 'New Author');
    await user.click(screen.getByRole('button', { name: 'Create quote' }));

    await waitFor(() => {
      expect(createQuote).toHaveBeenCalledWith({
        quoteText: 'A new dashboard quote',
        author: 'New Author',
        isActive: true,
      });
    });
  });

  it('opens the edit form with row values and submits the full update payload', async () => {
    const user = userEvent.setup();
    await renderAdminQuotesSection();

    const row = screen.getByText(activeQuote.quoteText).closest('tr');
    expect(row).not.toBeNull();

    await user.click(within(row as HTMLTableRowElement).getByRole('button', { name: 'Edit' }));

    expect(screen.getByLabelText('Quote text')).toHaveValue(activeQuote.quoteText);
    expect(screen.getByLabelText('Author')).toHaveValue(activeQuote.author);

    await user.clear(screen.getByLabelText('Quote text'));
    await user.type(screen.getByLabelText('Quote text'), 'Updated dashboard quote');
    await user.click(screen.getByRole('button', { name: 'Save quote' }));

    await waitFor(() => {
      expect(updateQuote).toHaveBeenCalledWith({
        quoteId: activeQuote.id,
        quoteText: 'Updated dashboard quote',
        author: activeQuote.author,
        isActive: activeQuote.isActive,
      });
    });
  });

  it('deactivates an active quote with a full-row replacement payload', async () => {
    const user = userEvent.setup();
    await renderAdminQuotesSection();

    const row = screen.getByText(activeQuote.quoteText).closest('tr');
    expect(row).not.toBeNull();

    await user.click(
      within(row as HTMLTableRowElement).getByRole('button', { name: 'Deactivate' }),
    );

    await waitFor(() => {
      expect(updateQuote).toHaveBeenCalledWith({
        quoteId: activeQuote.id,
        quoteText: activeQuote.quoteText,
        author: activeQuote.author,
        isActive: false,
      });
    });
  });

  it('reactivates an inactive quote with a full-row replacement payload', async () => {
    const user = userEvent.setup();
    await renderAdminQuotesSection();

    const row = screen.getByText(inactiveQuote.quoteText).closest('tr');
    expect(row).not.toBeNull();

    await user.click(
      within(row as HTMLTableRowElement).getByRole('button', { name: 'Reactivate' }),
    );

    await waitFor(() => {
      expect(updateQuote).toHaveBeenCalledWith({
        quoteId: inactiveQuote.id,
        quoteText: inactiveQuote.quoteText,
        author: inactiveQuote.author,
        isActive: true,
      });
    });
  });

  it('deletes a quote only when confirmation is accepted', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    await renderAdminQuotesSection();

    const activeRow = screen.getByText(activeQuote.quoteText).closest('tr');
    const inactiveRow = screen.getByText(inactiveQuote.quoteText).closest('tr');
    expect(activeRow).not.toBeNull();
    expect(inactiveRow).not.toBeNull();

    await user.click(
      within(activeRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' }),
    );
    await user.click(
      within(inactiveRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(2);
      expect(deleteQuote).toHaveBeenCalledTimes(1);
      expect(deleteQuote).toHaveBeenCalledWith(activeQuote.id);
    });
  });
});

async function renderAdminQuotesSection() {
  const { MhdAdminQuotesSection } = await import('../MhdAdminQuotesSection');
  return render(<MhdAdminQuotesSection />);
}
