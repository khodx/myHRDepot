import { supabaseClient } from '@/lib/supabase/supabaseClient';
import {
  parseMhdKbArticle,
  parseMhdKbArticles,
  parseMhdKbCategories,
  parseMhdKbArticleAdmin,
  parseMhdKbArticlesAdmin,
  parseMhdKbFunction,
  parseMhdKbFunctionAdmin,
  parseMhdKbFunctions,
  parseMhdKbFunctionsAdmin,
} from './Schemas';
import type {
  MhdKbArticle,
  MhdKbArticleAdmin,
  MhdKbArticleAdminListItem,
  MhdKbArticleListItem,
  MhdKbCategory,
  MhdKbFunction,
  MhdKbFunctionAdmin,
  MhdKbFunctionAdminListItem,
  MhdKbFunctionListItem,
} from './Types';

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

  async listAllPublishedArticleRoutes(): Promise<MhdKbArticleListItem[]> {
    const { items } = await mhdKnowledgeCenterService.listArticles({ limit: 200 });
    return items;
  },

  async getArticle(slug: string): Promise<MhdKbArticle | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_kb_article', {
      p_slug: slug,
    } as never);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.length ? parseMhdKbArticle(rows[0]) : null;
  },

  async listKbFunctions(params: {
    searchTerm?: string;
    relatedEngine?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: MhdKbFunctionListItem[]; totalCount: number }> {
    const { data, error } = await supabaseClient.rpc('mhd_list_kb_functions', {
      p_search_term: params.searchTerm ?? null,
      p_related_engine: params.relatedEngine ?? null,
      p_limit: params.limit ?? 200,
      p_offset: params.offset ?? 0,
    } as never);
    if (error) throw error;
    return parseMhdKbFunctions(data ?? []);
  },
  async getKbFunction(id: string): Promise<MhdKbFunction | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_kb_function', { p_id: id } as never);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.length ? parseMhdKbFunction(rows[0]) : null;
  },
  async listArticlesAdmin(params: {
    categoryId?: string;
    status?: string;
    includeArchived?: boolean;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: MhdKbArticleAdminListItem[]; totalCount: number }> {
    // 'archived' is a client-side pseudo-status layered on top of is_deleted
    // (kb_articles.status only ever holds 'draft'/'published' in the
    // database — passing 'archived' through as p_status would filter to a
    // value no row can ever have, silently returning zero rows). Archived
    // visibility is controlled solely by p_include_archived; the caller
    // filters the result to is_deleted rows separately.
    const dbStatus =
      params.status && params.status !== 'all' && params.status !== 'archived'
        ? params.status
        : null;
    const { data, error } = await supabaseClient.rpc('mhd_list_kb_articles_admin', {
      p_category_id: params.categoryId ?? null,
      p_status: dbStatus,
      p_include_archived: params.includeArchived ?? false,
      p_search_term: params.searchTerm ?? null,
      p_limit: params.limit ?? 200,
      p_offset: params.offset ?? 0,
    } as never);
    if (error) throw error;
    return parseMhdKbArticlesAdmin(data ?? []);
  },
  async getArticleAdmin(id: string): Promise<MhdKbArticleAdmin | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_kb_article_admin', {
      p_article_id: id,
    } as never);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.length ? parseMhdKbArticleAdmin(rows[0]) : null;
  },
  async listFunctionsAdmin(params: {
    searchTerm?: string;
    relatedEngine?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: MhdKbFunctionAdminListItem[]; totalCount: number }> {
    const { data, error } = await supabaseClient.rpc('mhd_list_kb_functions_admin', {
      p_search_term: params.searchTerm ?? null,
      p_related_engine: params.relatedEngine ?? null,
      p_include_archived: params.includeArchived ?? false,
      p_limit: params.limit ?? 200,
      p_offset: params.offset ?? 0,
    } as never);
    if (error) throw error;
    return parseMhdKbFunctionsAdmin(data ?? []);
  },
  async getFunctionAdmin(id: string): Promise<MhdKbFunctionAdmin | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_kb_function_admin', {
      p_function_id: id,
    } as never);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.length ? parseMhdKbFunctionAdmin(rows[0]) : null;
  },
  async createArticle(input: {
    categoryId: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    audience: string;
    routeContext: string[];
    searchKeywords: string;
  }): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_create_kb_article', {
      p_category_id: input.categoryId,
      p_slug: input.slug,
      p_title: input.title,
      p_summary: input.summary,
      p_body: input.body,
      p_audience: input.audience,
      p_route_context: input.routeContext,
      p_search_keywords: input.searchKeywords,
    } as never);
    if (error) throw error;
    return data as string;
  },
  async updateArticle(input: {
    articleId: string;
    categoryId: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    audience: string;
    routeContext: string[];
    searchKeywords: string;
  }): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_kb_article', {
      p_article_id: input.articleId,
      p_category_id: input.categoryId,
      p_slug: input.slug,
      p_title: input.title,
      p_summary: input.summary,
      p_body: input.body,
      p_audience: input.audience,
      p_route_context: input.routeContext,
      p_search_keywords: input.searchKeywords,
    } as never);
    if (error) throw error;
  },
  async publishArticle(id: string) {
    const { error } = await supabaseClient.rpc('mhd_publish_kb_article', {
      p_article_id: id,
    } as never);
    if (error) throw error;
  },
  async archiveArticle(id: string) {
    const { error } = await supabaseClient.rpc('mhd_archive_kb_article', {
      p_article_id: id,
    } as never);
    if (error) throw error;
  },
  async restoreArticle(id: string) {
    const { error } = await supabaseClient.rpc('mhd_restore_kb_article', {
      p_article_id: id,
    } as never);
    if (error) throw error;
  },
  async createFunction(input: {
    name: string;
    category: string;
    syntax: string;
    description: string;
    exampleInput: string;
    exampleOutput: string;
    relatedEngine: string;
    audience: string;
  }): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_create_kb_function', {
      p_name: input.name,
      p_category: input.category,
      p_syntax: input.syntax,
      p_description: input.description,
      p_example_input: input.exampleInput,
      p_example_output: input.exampleOutput,
      p_related_engine: input.relatedEngine,
      p_audience: input.audience,
    } as never);
    if (error) throw error;
    return data as string;
  },
  async updateFunction(input: {
    functionId: string;
    name: string;
    category: string;
    syntax: string;
    description: string;
    exampleInput: string;
    exampleOutput: string;
    relatedEngine: string;
    audience: string;
    isDeprecated: boolean;
  }): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_kb_function', {
      p_function_id: input.functionId,
      p_name: input.name,
      p_category: input.category,
      p_syntax: input.syntax,
      p_description: input.description,
      p_example_input: input.exampleInput,
      p_example_output: input.exampleOutput,
      p_related_engine: input.relatedEngine,
      p_audience: input.audience,
      p_is_deprecated: input.isDeprecated,
    } as never);
    if (error) throw error;
  },
  async archiveFunction(id: string) {
    const { error } = await supabaseClient.rpc('mhd_archive_kb_function', {
      p_function_id: id,
    } as never);
    if (error) throw error;
  },
  async restoreFunction(id: string) {
    const { error } = await supabaseClient.rpc('mhd_restore_kb_function', {
      p_function_id: id,
    } as never);
    if (error) throw error;
  },
};
