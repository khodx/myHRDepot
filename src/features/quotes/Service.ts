import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Database } from '@/types/database.types';
import type { MhdCreateQuoteInput, MhdQuote, MhdUpdateQuoteInput } from './Types';

type MhdQuoteRow = Database['public']['Tables']['quotes']['Row'];

function mapQuoteRow(row: MhdQuoteRow): MhdQuote {
  return {
    id: row.id,
    quoteText: row.quote_text,
    author: row.author,
    sourceCitation: row.source_citation,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const mhdQuotesService = {
  async getRandomQuote(): Promise<MhdQuote | null> {
    const { data, error } = await supabaseClient
      .rpc('mhd_dashboard_random_quote')
      .returns<MhdQuoteRow | null>();

    if (error) {
      throw new Error('Unable to get random quote: ' + error.message);
    }

    return data ? mapQuoteRow(data) : null;
  },

  async listQuotes(): Promise<MhdQuote[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_quotes').returns<MhdQuoteRow[]>();

    if (error) {
      throw new Error('Unable to list quotes: ' + error.message);
    }

    return (data ?? []).map(mapQuoteRow);
  },

  async createQuote(input: MhdCreateQuoteInput): Promise<MhdQuote> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_quote', {
        p_quote_text: input.quoteText,
        // gen:types omits null from defaulted RPC arguments even though
        // mhd_create_quote accepts it at runtime (same gen:types limitation
        // documented in features/forms/Service.ts), hence `as never`.
        p_author: input.author ?? null,
        p_is_active: input.isActive ?? true,
      } as never)
      .returns<MhdQuoteRow>();

    if (error) {
      throw new Error('Unable to create quote: ' + error.message);
    }

    return mapQuoteRow(data);
  },

  async updateQuote(input: MhdUpdateQuoteInput): Promise<MhdQuote> {
    const { data, error } = await supabaseClient
      .rpc('mhd_update_quote', {
        p_quote_id: input.quoteId,
        p_quote_text: input.quoteText,
        // gen:types omits null from defaulted RPC arguments even though
        // mhd_update_quote accepts it at runtime; see createQuote above.
        p_author: input.author,
        p_is_active: input.isActive,
      } as never)
      .returns<MhdQuoteRow>();

    if (error) {
      throw new Error('Unable to update quote: ' + error.message);
    }

    return mapQuoteRow(data);
  },

  async deleteQuote(quoteId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_quote', {
      p_quote_id: quoteId,
    });

    if (error) {
      throw new Error('Unable to delete quote: ' + error.message);
    }
  },
};
