import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { from: fromMock, rpc: rpcMock },
}));

const { mhdLegalSearchService } = await import('../Service');

const RESULT = {
  id: 'result-1',
  source_lane: 'CURATED',
  jurisdiction_id: 'jurisdiction-us',
  title: 'Overtime requirements',
  summary: 'Federal wage and hour reference.',
  source_url: 'https://example.test/overtime',
  external_provider: 'COMPLIANCE_REGISTRY',
  external_ref: 'registry-1',
  fetched_at: null,
};

function queryResult(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve({ data, error }).then(resolve, reject),
  };
  fromMock.mockReturnValueOnce(query);
  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdLegalSearchService taxonomy reads', () => {
  it('lists active jurisdictions with the expected filters and ordering', async () => {
    const query = queryResult([
      { id: 'us', code: 'US', name: 'United States', level: 'FEDERAL' },
    ]);

    await expect(mhdLegalSearchService.listJurisdictions()).resolves.toEqual([
      { id: 'us', code: 'US', name: 'United States', level: 'FEDERAL' },
    ]);
    expect(fromMock).toHaveBeenCalledWith('legal_jurisdictions');
    expect(query.select).toHaveBeenCalledWith('id, code, name, level');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.order).toHaveBeenNthCalledWith(1, 'level');
    expect(query.order).toHaveBeenNthCalledWith(2, 'name');
  });

  it('maps snake_case topic rows to the frontend contract', async () => {
    queryResult([
      {
        id: 'topic-1',
        topic_key: 'WAGE_AND_HOUR',
        display_name: 'Wage and Hour',
        description: null,
      },
    ]);

    await expect(mhdLegalSearchService.listTopics()).resolves.toEqual([
      {
        id: 'topic-1',
        topicKey: 'WAGE_AND_HOUR',
        displayName: 'Wage and Hour',
        description: null,
      },
    ]);
  });

  it('propagates taxonomy query errors', async () => {
    const error = { code: '42501', message: 'Access denied' };
    queryResult(null, error);
    await expect(mhdLegalSearchService.listTopics()).rejects.toEqual(error);
  });
});

describe('mhdLegalSearchService legal search RPC', () => {
  it('trims the query, sends null for empty filters, and preserves three lanes', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        curated: [RESULT],
        federal_text: [],
        pending_legislation: [],
      },
      error: null,
    });

    await expect(
      mhdLegalSearchService.search({ query: '  overtime  ', jurisdictionIds: [], topicIds: [] }),
    ).resolves.toEqual({
      curated: [
        {
          id: 'result-1',
          sourceLane: 'CURATED',
          jurisdictionId: 'jurisdiction-us',
          title: 'Overtime requirements',
          summary: 'Federal wage and hour reference.',
          sourceUrl: 'https://example.test/overtime',
          externalProvider: 'COMPLIANCE_REGISTRY',
          externalRef: 'registry-1',
          fetchedAt: null,
        },
      ],
      federalText: [],
      pendingLegislation: [],
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_search_legal_content', {
      p_query: 'overtime',
      p_jurisdiction_ids: null,
      p_topic_ids: null,
    });
  });

  it('passes selected jurisdiction and topic filters without flattening lanes', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { curated: [], federal_text: [RESULT], pending_legislation: [] },
      error: null,
    });

    await mhdLegalSearchService.search({
      query: 'safety',
      jurisdictionIds: ['jurisdiction-ca'],
      topicIds: ['topic-safety'],
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_search_legal_content', {
      p_query: 'safety',
      p_jurisdiction_ids: ['jurisdiction-ca'],
      p_topic_ids: ['topic-safety'],
    });
  });

  it('surfaces RPC errors instead of returning an empty result', async () => {
    const error = { code: '42501', message: 'Access denied for legal content search.' };
    rpcMock.mockResolvedValueOnce({ data: null, error });
    await expect(
      mhdLegalSearchService.search({ query: 'leave', jurisdictionIds: [], topicIds: [] }),
    ).rejects.toEqual(error);
  });
});
