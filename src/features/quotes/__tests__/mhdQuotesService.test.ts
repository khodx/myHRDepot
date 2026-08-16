import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdQuotesService } from '../Service';

const { mockRpc, mockReturns } = vi.hoisted(() => {
  const mockReturns = vi.fn();
  const mockRpc = vi.fn((..._args: unknown[]): unknown => ({ returns: mockReturns }));
  return { mockRpc, mockReturns };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const rawQuoteRow = {
  id: 'quote-001',
  quote_text: 'Progress is built one careful step at a time.',
  author: 'Jane Doe',
  source_citation: 'Internal handbook',
  is_active: true,
  created_at: '2026-08-01T10:00:00.000Z',
  updated_at: '2026-08-02T10:00:00.000Z',
};

const mappedQuote = {
  id: 'quote-001',
  quoteText: 'Progress is built one careful step at a time.',
  author: 'Jane Doe',
  sourceCitation: 'Internal handbook',
  isActive: true,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-02T10:00:00.000Z',
};

describe('mhdQuotesService', () => {
  beforeEach(() => {
    mockRpc.mockClear();
    mockRpc.mockImplementation((..._args: unknown[]): unknown => ({ returns: mockReturns }));
    mockReturns.mockReset();
  });

  describe('getRandomQuote', () => {
    it('maps a returned row to a camelCase quote', async () => {
      mockReturns.mockResolvedValueOnce({ data: rawQuoteRow, error: null });

      const result = await mhdQuotesService.getRandomQuote();

      expect(mockRpc).toHaveBeenCalledWith('mhd_dashboard_random_quote');
      expect(result).toEqual(mappedQuote);
    });

    it('returns null when the RPC returns no active quote', async () => {
      mockReturns.mockResolvedValueOnce({ data: null, error: null });

      await expect(mhdQuotesService.getRandomQuote()).resolves.toBeNull();
    });

    it('throws with the RPC error message on error', async () => {
      mockReturns.mockResolvedValueOnce({
        data: null,
        error: { message: 'Permission denied' },
      });

      await expect(mhdQuotesService.getRandomQuote()).rejects.toThrow(
        'Unable to get random quote: Permission denied',
      );
    });
  });

  describe('listQuotes', () => {
    it('maps returned rows to camelCase quotes', async () => {
      mockReturns.mockResolvedValueOnce({
        data: [
          rawQuoteRow,
          {
            ...rawQuoteRow,
            id: 'quote-002',
            quote_text: 'Make the right thing easier to do.',
            author: null,
            source_citation: null,
            is_active: false,
          },
        ],
        error: null,
      });

      const result = await mhdQuotesService.listQuotes();

      expect(mockRpc).toHaveBeenCalledWith('mhd_list_quotes');
      expect(result).toEqual([
        mappedQuote,
        {
          ...mappedQuote,
          id: 'quote-002',
          quoteText: 'Make the right thing easier to do.',
          author: null,
          sourceCitation: null,
          isActive: false,
        },
      ]);
    });

    it('returns an empty array for empty or null data', async () => {
      mockReturns.mockResolvedValueOnce({ data: [], error: null });
      await expect(mhdQuotesService.listQuotes()).resolves.toEqual([]);

      mockReturns.mockResolvedValueOnce({ data: null, error: null });
      await expect(mhdQuotesService.listQuotes()).resolves.toEqual([]);
    });

    it('throws on error', async () => {
      mockReturns.mockResolvedValueOnce({
        data: null,
        error: { message: 'List failed' },
      });

      await expect(mhdQuotesService.listQuotes()).rejects.toThrow(
        'Unable to list quotes: List failed',
      );
    });
  });

  describe('createQuote', () => {
    it('passes quote fields to the create RPC and maps the returned row', async () => {
      mockReturns.mockResolvedValueOnce({ data: rawQuoteRow, error: null });

      const result = await mhdQuotesService.createQuote({
        quoteText: rawQuoteRow.quote_text,
        author: rawQuoteRow.author,
        isActive: rawQuoteRow.is_active,
      });

      expect(mockRpc).toHaveBeenCalledWith('mhd_create_quote', {
        p_quote_text: rawQuoteRow.quote_text,
        p_author: rawQuoteRow.author,
        p_is_active: rawQuoteRow.is_active,
      });
      expect(result).toEqual(mappedQuote);
    });

    it('throws on error', async () => {
      mockReturns.mockResolvedValueOnce({
        data: null,
        error: { message: 'Create failed' },
      });

      await expect(
        mhdQuotesService.createQuote({ quoteText: 'New quote', author: null, isActive: true }),
      ).rejects.toThrow('Unable to create quote: Create failed');
    });
  });

  describe('updateQuote', () => {
    it('passes all replacement fields to the update RPC and maps the returned row', async () => {
      mockReturns.mockResolvedValueOnce({ data: rawQuoteRow, error: null });

      const result = await mhdQuotesService.updateQuote({
        quoteId: rawQuoteRow.id,
        quoteText: rawQuoteRow.quote_text,
        author: rawQuoteRow.author,
        isActive: rawQuoteRow.is_active,
      });

      expect(mockRpc).toHaveBeenCalledWith('mhd_update_quote', {
        p_quote_id: rawQuoteRow.id,
        p_quote_text: rawQuoteRow.quote_text,
        p_author: rawQuoteRow.author,
        p_is_active: rawQuoteRow.is_active,
      });
      expect(result).toEqual(mappedQuote);
    });

    it('throws on error', async () => {
      mockReturns.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        mhdQuotesService.updateQuote({
          quoteId: 'quote-001',
          quoteText: 'Updated quote',
          author: null,
          isActive: false,
        }),
      ).rejects.toThrow('Unable to update quote: Update failed');
    });
  });

  describe('deleteQuote', () => {
    it('passes the quote id and resolves on success', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      await expect(mhdQuotesService.deleteQuote('quote-001')).resolves.toBeUndefined();

      expect(mockRpc).toHaveBeenCalledWith('mhd_delete_quote', {
        p_quote_id: 'quote-001',
      });
    });

    it('throws on error', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Delete failed' },
      });

      await expect(mhdQuotesService.deleteQuote('quote-001')).rejects.toThrow(
        'Unable to delete quote: Delete failed',
      );
    });
  });
});
