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
  parseMhdKbSearchResults,
  parseMhdKbComplianceEntries,
} from './Schemas';
import type {
  MhdKbArticle,
  MhdKbArticleAdmin,
  MhdKbArticleAdminListItem,
  MhdKbArticleListItem,
  MhdKbCategory,
  MhdKbComplianceEntry,
  MhdKbFunction,
  MhdKbFunctionAdmin,
  MhdKbFunctionAdminListItem,
  MhdKbFunctionListItem,
  MhdKbAccessLevel,
  MhdKbPlatformAccessLevel,
  MhdKbArticleType,
  MhdKbBodyFormat,
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
    articleType?: MhdKbArticleType;
  }) {
    const { data, error } = await supabaseClient.rpc('mhd_list_kb_articles', {
      p_category_id: params.categoryId ?? null,
      p_search_term: params.searchTerm ?? null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
      p_article_type: params.articleType ?? null,
    } as never);
    if (error) throw error;
    return parseMhdKbArticles(data ?? []);
  },
  async searchKnowledge(params: {
    query: string;
    articleType?: MhdKbArticleType;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }) {
    const { data, error } = await supabaseClient.rpc('mhd_search_knowledge', {
      p_query: params.query,
      p_article_type: params.articleType ?? null,
      p_category_id: params.categoryId ?? null,
      p_limit: params.limit ?? 20,
      p_offset: params.offset ?? 0,
    } as never);
    if (error) throw error;
    return parseMhdKbSearchResults(data ?? []);
  },
  async listComplianceEntries(): Promise<MhdKbComplianceEntry[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_kb_compliance_entries', {} as never);
    if (error) throw error;
    return parseMhdKbComplianceEntries(data ?? []);
  },
  async listAllPublishedArticleRoutes(): Promise<MhdKbArticleListItem[]> {
    return (await this.listArticles({ limit: 200 })).items;
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
    scope?: 'PLATFORM' | 'COMPANY';
    companyId?: string;
    articleType?: MhdKbArticleType;
  }): Promise<{ items: MhdKbArticleAdminListItem[]; totalCount: number }> {
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
      p_scope: params.scope ?? 'PLATFORM',
      p_company_id: params.companyId ?? null,
      p_article_type: params.articleType ?? null,
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
    slug?: string;
    title: string;
    summary: string;
    body: string;
    accessLevel: MhdKbAccessLevel;
    companyId: string | null;
    articleType: MhdKbArticleType;
    bodyFormat: MhdKbBodyFormat;
    routeContext: string[];
    searchKeywords: string;
    complianceRegistryId?: string | null;
  }): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_create_kb_article', {
      p_category_id: input.categoryId,
      p_title: input.title,
      p_body: input.body,
      p_access_level: input.accessLevel,
      p_company_id: input.companyId,
      p_article_type: input.articleType,
      p_summary: input.summary,
      p_body_format: input.bodyFormat,
      p_route_context: input.routeContext,
      p_search_keywords: input.searchKeywords,
      p_slug: input.slug || null,
      p_compliance_registry_id: input.complianceRegistryId ?? null,
    } as never);
    if (error) throw error;
    return data as string;
  },
  async updateArticle(input: {
    articleId: string;
    categoryId: string;
    slug?: string;
    title: string;
    summary: string;
    body: string;
    accessLevel: MhdKbAccessLevel;
    articleType: MhdKbArticleType;
    bodyFormat: MhdKbBodyFormat;
    routeContext: string[];
    searchKeywords: string;
    complianceRegistryId?: string | null;
  }): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_kb_article', {
      p_article_id: input.articleId,
      p_category_id: input.categoryId,
      p_title: input.title,
      p_summary: input.summary,
      p_body: input.body,
      p_body_format: input.bodyFormat,
      p_access_level: input.accessLevel,
      p_route_context: input.routeContext,
      p_search_keywords: input.searchKeywords,
      p_slug: input.slug || null,
      p_compliance_registry_id: input.complianceRegistryId ?? null,
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
    accessLevel: MhdKbPlatformAccessLevel;
  }): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_create_kb_function', {
      p_name: input.name,
      p_category: input.category,
      p_syntax: input.syntax,
      p_description: input.description,
      p_example_input: input.exampleInput,
      p_example_output: input.exampleOutput,
      p_related_engine: input.relatedEngine,
      p_access_level: input.accessLevel,
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
    accessLevel: MhdKbPlatformAccessLevel;
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
      p_access_level: input.accessLevel,
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
