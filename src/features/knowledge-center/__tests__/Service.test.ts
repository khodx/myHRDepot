import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, rpcMock } = vi.hoisted(() => ({ fromMock: vi.fn(), rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { from: fromMock, rpc: rpcMock },
}));
const { mhdKnowledgeCenterService } = await import('../Service');

const category = {
  id: 'cat-1',
  key: 'policies',
  label: 'Policies',
  description: null,
  icon: null,
  sort_order: 1,
  parent_category_id: null,
};
const article = {
  id: 'a-1',
  category_id: 'cat-1',
  slug: 'pto',
  title: 'PTO',
  summary: null,
  audience: 'both',
  route_context: [],
  published_at: null,
  body: 'Details',
};
const func = {
  id: 'f-1',
  name: 'SUM',
  category: 'Math',
  syntax: 'SUM(a,b)',
  related_engine: 'calculator',
  is_deprecated: false,
  description: 'Adds',
  example_input: '1',
  example_output: '2',
};

beforeEach(() => vi.clearAllMocks());

describe('mhdKnowledgeCenterService RPC contracts', () => {
  it('listCategories calls mhd_list_kb_categories', async () => {
    rpcMock.mockResolvedValueOnce({ data: [category], error: null });
    await mhdKnowledgeCenterService.listCategories();
    expect(rpcMock).toHaveBeenCalledWith('mhd_list_kb_categories', {});
  });
  it('listArticles calls mhd_list_kb_articles', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ ...article, total_count: 1 }], error: null });
    await mhdKnowledgeCenterService.listArticles({
      categoryId: 'cat-1',
      searchTerm: 'pto',
      limit: 10,
      offset: 2,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_list_kb_articles', {
      p_category_id: 'cat-1',
      p_search_term: 'pto',
      p_limit: 10,
      p_offset: 2,
    });
  });
  it('getArticle calls mhd_get_kb_article', async () => {
    rpcMock.mockResolvedValueOnce({ data: [article], error: null });
    await mhdKnowledgeCenterService.getArticle('pto');
    expect(rpcMock).toHaveBeenCalledWith('mhd_get_kb_article', { p_slug: 'pto' });
  });
  it('listKbFunctions calls mhd_list_kb_functions', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ ...func, total_count: 1 }], error: null });
    await mhdKnowledgeCenterService.listKbFunctions({
      searchTerm: 'sum',
      relatedEngine: 'calculator',
      limit: 20,
      offset: 3,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_list_kb_functions', {
      p_search_term: 'sum',
      p_related_engine: 'calculator',
      p_limit: 20,
      p_offset: 3,
    });
  });
  it('getKbFunction calls mhd_get_kb_function', async () => {
    rpcMock.mockResolvedValueOnce({ data: [func], error: null });
    await mhdKnowledgeCenterService.getKbFunction('f-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_get_kb_function', { p_id: 'f-1' });
  });
  it('createArticle calls mhd_create_kb_article', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'a-1', error: null });
    await mhdKnowledgeCenterService.createArticle({
      categoryId: 'cat-1',
      slug: 'pto',
      title: 'PTO',
      summary: 's',
      body: 'b',
      audience: 'both',
      routeContext: ['/x'],
      searchKeywords: 'pto',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_create_kb_article', {
      p_category_id: 'cat-1',
      p_slug: 'pto',
      p_title: 'PTO',
      p_summary: 's',
      p_body: 'b',
      p_audience: 'both',
      p_route_context: ['/x'],
      p_search_keywords: 'pto',
    });
  });
  it('publishArticle calls mhd_publish_kb_article', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdKnowledgeCenterService.publishArticle('a-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_publish_kb_article', { p_article_id: 'a-1' });
  });
  it('archiveArticle calls mhd_archive_kb_article', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdKnowledgeCenterService.archiveArticle('a-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_archive_kb_article', { p_article_id: 'a-1' });
  });
  it('returns null for empty article and function results', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    await expect(mhdKnowledgeCenterService.getArticle('missing')).resolves.toBeNull();
    await expect(mhdKnowledgeCenterService.getKbFunction('missing')).resolves.toBeNull();
  });
});
