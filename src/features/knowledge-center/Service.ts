import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { parseMhdKbArticle, parseMhdKbArticles, parseMhdKbCategories } from './Schemas';
import type { MhdKbArticle, MhdKbArticleListItem, MhdKbCategory } from './Types';

export const mhdKnowledgeCenterService = {
  async listCategories(): Promise<MhdKbCategory[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_kb_categories', {} as never);
    if (error) throw error;
    return parseMhdKbCategories(data ?? []);
  },

  async listArticles(params: {
    categoryId?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: MhdKbArticleListItem[]; totalCount: number }> {
    const { data, error } = await supabaseClient.rpc('mhd_list_kb_articles', {
      p_category_id: params.categoryId ?? null,
      p_search_term: params.searchTerm ?? null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    } as never);
    if (error) throw error;
    return parseMhdKbArticles(data ?? []);
  },

  async getArticle(slug: string): Promise<MhdKbArticle | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_kb_article', {
      p_slug: slug,
    } as never);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.length ? parseMhdKbArticle(rows[0]) : null;
  },
};
