import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdKnowledgeCenterService } = await import('../Service');
const article = {
  id: 'a-1',
  category_id: 'c-1',
  slug: 'pto',
  title: 'PTO',
  summary: null,
  article_type: 'ARTICLE',
  access_level: 'PUBLIC',
  company_id: null,
  route_context: [],
  published_at: null,
  body: 'Details',
  body_format: 'plain',
};
beforeEach(() => vi.clearAllMocks());
describe('Knowledge Center service RPC contracts', () => {
  it('maps article type for listArticles', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ ...article, total_count: 1 }], error: null });
    await mhdKnowledgeCenterService.listArticles({ articleType: 'FAQ' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_list_kb_articles', {
      p_category_id: null,
      p_search_term: null,
      p_limit: 50,
      p_offset: 0,
      p_article_type: 'FAQ',
    });
  });
  it('maps searchKnowledge arguments', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await mhdKnowledgeCenterService.searchKnowledge({
      query: 'pto',
      articleType: 'FAQ',
      categoryId: 'c-1',
      limit: 10,
      offset: 2,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_search_knowledge', {
      p_query: 'pto',
      p_article_type: 'FAQ',
      p_category_id: 'c-1',
      p_limit: 10,
      p_offset: 2,
    });
  });
  it('maps the new article write arguments', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'a-1', error: null });
    await mhdKnowledgeCenterService.createArticle({
      categoryId: 'c-1',
      slug: 'pto',
      title: 'PTO',
      summary: 's',
      body: 'b',
      accessLevel: 'PUBLIC',
      companyId: null,
      articleType: 'ARTICLE',
      bodyFormat: 'plain',
      routeContext: [],
      searchKeywords: '',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_create_kb_article', {
      p_category_id: 'c-1',
      p_title: 'PTO',
      p_body: 'b',
      p_access_level: 'PUBLIC',
      p_company_id: null,
      p_article_type: 'ARTICLE',
      p_summary: 's',
      p_body_format: 'plain',
      p_route_context: [],
      p_search_keywords: '',
      p_slug: 'pto',
      p_compliance_registry_id: null,
    });
  });
  it('maps access level for function writes', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'f-1', error: null });
    await mhdKnowledgeCenterService.createFunction({
      name: 'SUM',
      category: 'Math',
      syntax: 'x',
      description: 'd',
      exampleInput: '',
      exampleOutput: '',
      relatedEngine: 'calculator',
      accessLevel: 'ADMIN',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_create_kb_function', {
      p_name: 'SUM',
      p_category: 'Math',
      p_syntax: 'x',
      p_description: 'd',
      p_example_input: '',
      p_example_output: '',
      p_related_engine: 'calculator',
      p_access_level: 'ADMIN',
    });
  });
  it('lists compliance entries', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await mhdKnowledgeCenterService.listComplianceEntries();
    expect(rpcMock).toHaveBeenCalledWith('mhd_list_kb_compliance_entries', {});
  });
});
